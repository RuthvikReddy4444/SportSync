from datetime import datetime, timezone, timedelta
from bson import ObjectId
from flask import Blueprint, request, current_app
from pymongo.errors import DuplicateKeyError
from ..middleware.auth import auth
from ..utils.helpers import serialize_doc, error_response, success_response

slot_bp = Blueprint('slot_bp', __name__, url_prefix='/api')

@slot_bp.get('/slots')
def get_available_slots():
    db = current_app.db
    fid_str = request.args.get('facility_id')
    if not fid_str:
        return error_response('facility_id is required.', 400)

    try:
        fid = ObjectId(fid_str)
    except Exception:
        return error_response('Invalid facility ID.', 400)

    date_str = request.args.get('date') # YYYY-MM-DD
    sport = request.args.get('sport')
    area = request.args.get('playing_area')
    include_all = request.args.get('include_all', 'false').lower() == 'true'

    now = datetime.now(timezone.utc)
    query = {
        'facility_id': fid
    }

    if not include_all:
        query['status'] = 'available'

    if date_str:
        try:
            day_start = datetime.fromisoformat(f"{date_str}T00:00:00+00:00")
            day_end = day_start + timedelta(days=1)
            query['start_at'] = {'$gte': day_start, '$lt': day_end}
        except ValueError:
            if not include_all:
                query['start_at'] = {'$gte': now}
    else:
        if not include_all:
            query['start_at'] = {'$gte': now}

    if sport and sport.lower() != 'all':
        query['sport'] = {'$regex': f"^{sport}$", '$options': 'i'}
    if area and area.lower() != 'all':
        query['playing_area'] = area

    slots = list(db.slots.find(query).sort('start_at', 1).limit(300))
    avail_count = len([s for s in slots if s.get('status') == 'available'])
    unavail_count = len([s for s in slots if s.get('status') in ('booked', 'blocked')])

    return success_response({
        'slots': serialize_doc(slots),
        'available_count': avail_count,
        'unavailable_count': unavail_count
    })

@slot_bp.get('/owner/slots')
@auth('owner', 'admin')
def get_owner_slots():
    db = current_app.db
    if request.user['role'] == 'admin':
        fac_ids = [f['_id'] for f in db.facilities.find({}, {'_id': 1})]
    else:
        fac_ids = [f['_id'] for f in db.facilities.find({'owner_id': request.user['_id']}, {'_id': 1})]

    target_fid = request.args.get('facility_id')
    if target_fid:
        try:
            target_obj = ObjectId(target_fid)
            fac_ids = [f for f in fac_ids if f == target_obj]
        except Exception:
            pass

    slots = list(db.slots.find({'facility_id': {'$in': fac_ids}}).sort('start_at', 1).limit(500))
    # Enrich with facility name
    facility_map = {f['_id']: f['name'] for f in db.facilities.find({'_id': {'$in': fac_ids}}, {'name': 1})}
    for s in slots:
        s['facility_name'] = facility_map.get(s['facility_id'], 'Unknown Facility')

    return success_response({'slots': serialize_doc(slots)})

@slot_bp.post('/owner/slots')
@auth('owner', 'admin')
def create_single_slot():
    db = current_app.db
    data = request.get_json() or {}

    try:
        fid = ObjectId(data['facility_id'])
        start_at = datetime.fromisoformat(data['start_at'].replace('Z', '+00:00'))
        end_at = datetime.fromisoformat(data['end_at'].replace('Z', '+00:00'))
    except (KeyError, ValueError, TypeError):
        return error_response('Valid facility_id, start_at, and end_at timestamps are required.', 400)

    if end_at <= start_at:
        return error_response('End time must be after start time.', 400)

    # Check facility ownership
    fac = db.facilities.find_one({'_id': fid})
    if not fac or (request.user['role'] != 'admin' and fac['owner_id'] != request.user['_id']):
        return error_response('Facility not found or not owned by you.', 403)

    slot_doc = {
        'facility_id': fid,
        'start_at': start_at,
        'end_at': end_at,
        'sport': data.get('sport') or (fac.get('sports', [{}])[0].get('name', 'General')),
        'playing_area': data.get('playing_area') or (fac.get('playing_areas', ['Court 1'])[0]),
        'price': float(data.get('price', fac.get('sports', [{}])[0].get('price_per_hour', 0.0))),
        'status': 'available',
        'created_at': datetime.now(timezone.utc)
    }

    try:
        res = db.slots.insert_one(slot_doc)
        slot_doc['_id'] = res.inserted_id
    except DuplicateKeyError:
        return error_response('A slot with the exact start time already exists for this facility.', 409)

    return success_response({'slot': serialize_doc(slot_doc)}, message='Slot created successfully!', status_code=201)

@slot_bp.post('/owner/slots/bulk')
@auth('owner', 'admin')
def bulk_create_slots():
    """Generates 1-hour slots across dates, operating hours, sports, and court numbers."""
    db = current_app.db
    data = request.get_json() or {}

    try:
        fid = ObjectId(data['facility_id'])
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        days_count = int(data.get('days', 1))
        start_hour = int(data.get('start_hour', 6))
        end_hour = int(data.get('end_hour', 22))
    except (KeyError, ValueError, TypeError):
        return error_response('Invalid bulk parameters. start_date (YYYY-MM-DD), days, and hours required.', 400)

    fac = db.facilities.find_one({'_id': fid})
    if not fac or (request.user['role'] != 'admin' and fac['owner_id'] != request.user['_id']):
        return error_response('Facility not found or permission denied.', 403)

    # Determine sport
    sport = data.get('sport')
    if not sport:
        sport = fac.get('sports', [{}])[0].get('name', 'General')

    # Determine court / playing area(s)
    req_area = data.get('playing_area')
    if req_area:
        playing_areas = [req_area]
    elif data.get('playing_areas'):
        playing_areas = data.get('playing_areas')
    else:
        # Default to first playing area of facility
        playing_areas = [fac.get('playing_areas', ['Court 1'])[0]]

    # Determine hourly rate
    matched_sport = next((s for s in fac.get('sports', []) if s.get('name') == sport), None)
    default_price = matched_sport.get('price_per_hour', 400.0) if matched_sport else fac.get('sports', [{}])[0].get('price_per_hour', 400.0)
    price = float(data.get('price', default_price))

    created = 0
    now = datetime.now(timezone.utc)

    for day_i in range(min(days_count, 30)):
        current_date = start_date + timedelta(days=day_i)
        for h in range(start_hour, end_hour):
            s_dt = datetime(current_date.year, current_date.month, current_date.day, h, 0, tzinfo=timezone.utc)
            e_dt = s_dt + timedelta(hours=1)
            
            for area in playing_areas:
                try:
                    db.slots.insert_one({
                        'facility_id': fid,
                        'start_at': s_dt,
                        'end_at': e_dt,
                        'sport': sport,
                        'playing_area': area,
                        'price': price,
                        'status': 'available',
                        'created_at': now
                    })
                    created += 1
                except DuplicateKeyError:
                    pass  # Skip slot that already exists for this court and time

    return success_response(message=f'Generated {created} slots successfully!')

@slot_bp.delete('/owner/slots/<sid>')
@auth('owner', 'admin')
def delete_single_slot(sid):
    db = current_app.db
    try:
        obj_id = ObjectId(sid)
    except Exception:
        return error_response('Invalid slot ID.', 400)

    slot = db.slots.find_one({'_id': obj_id})
    if not slot:
        return error_response('Slot not found.', 404)

    fac = db.facilities.find_one({'_id': slot['facility_id']})
    if not fac or (request.user['role'] != 'admin' and fac['owner_id'] != request.user['_id']):
        return error_response('Permission denied for this facility slot.', 403)

    if slot['status'] == 'booked':
        return error_response('Cannot delete a slot with an active booking. Please cancel or refund the booking first.', 400)

    db.slots.delete_one({'_id': obj_id})
    return success_response(message='Slot deleted successfully.')

@slot_bp.patch('/owner/slots/<sid>/block')
@auth('owner', 'admin')
def toggle_block_slot(sid):
    db = current_app.db
    try:
        obj_id = ObjectId(sid)
    except Exception:
        return error_response('Invalid slot ID.', 400)

    slot = db.slots.find_one({'_id': obj_id})
    if not slot:
        return error_response('Slot not found.', 404)

    fac = db.facilities.find_one({'_id': slot['facility_id']})
    if not fac or (request.user['role'] != 'admin' and fac['owner_id'] != request.user['_id']):
        return error_response('Permission denied for this facility slot.', 403)

    if slot['status'] == 'booked':
        return error_response('Booked slots cannot be blocked. Cancel the booking first.', 400)

    new_status = 'blocked' if slot['status'] == 'available' else 'available'
    db.slots.update_one({'_id': obj_id}, {'$set': {'status': new_status}})
    return success_response(message=f'Slot status updated to {new_status}.')

@slot_bp.post('/owner/courts')
@auth('owner', 'admin')
def add_court_to_facility():
    db = current_app.db
    data = request.get_json() or {}
    fid_str = data.get('facility_id')
    court_name = data.get('court_name', '').strip()
    sport = data.get('sport')
    auto_generate = data.get('auto_generate', False)
    date_str = data.get('date')
    start_hour = int(data.get('start_hour', 6))
    end_hour = int(data.get('end_hour', 22))
    price = data.get('price')

    if not fid_str or not court_name:
        return error_response('facility_id and court_name are required.', 400)

    try:
        fid = ObjectId(fid_str)
    except Exception:
        return error_response('Invalid facility ID.', 400)

    fac = db.facilities.find_one({'_id': fid})
    if not fac or (request.user['role'] != 'admin' and fac['owner_id'] != request.user['_id']):
        return error_response('Permission denied for this facility.', 403)

    areas = fac.get('playing_areas') or []
    if court_name in areas:
        return error_response(f'Court "{court_name}" already exists in this facility.', 400)

    areas.append(court_name)
    db.facilities.update_one({'_id': fid}, {'$set': {'playing_areas': areas, 'updated_at': datetime.now(timezone.utc)}})

    created_slots = 0
    if auto_generate and date_str:
        try:
            target_date = datetime.fromisoformat(f"{date_str}T00:00:00+00:00").date()
            if price is None:
                sport_obj = next((s for s in fac.get('sports', []) if s['name'].lower() == (sport or '').lower()), None)
                price = sport_obj['price_per_hour'] if sport_obj else 400

            for h in range(start_hour, end_hour):
                s_dt = datetime(target_date.year, target_date.month, target_date.day, h, 0, tzinfo=timezone.utc)
                e_dt = s_dt + timedelta(hours=1)
                slot_doc = {
                    'facility_id': fid,
                    'sport': sport or (fac.get('sports', [{}])[0].get('name', 'Sports')),
                    'playing_area': court_name,
                    'start_at': s_dt,
                    'end_at': e_dt,
                    'price': float(price),
                    'status': 'available',
                    'created_at': datetime.now(timezone.utc),
                    'updated_at': datetime.now(timezone.utc)
                }
                try:
                    db.slots.insert_one(slot_doc)
                    created_slots += 1
                except DuplicateKeyError:
                    pass
        except Exception as e:
            current_app.logger.error(f"Error auto-generating slots for new court: {e}")

    return success_response({
        'playing_areas': areas,
        'created_slots': created_slots
    }, message=f'Court "{court_name}" added successfully!' + (f' Generated {created_slots} slots for {date_str}.' if created_slots > 0 else ''))

@slot_bp.delete('/owner/courts')
@auth('owner', 'admin')
def delete_court_from_facility():
    db = current_app.db
    fid_str = request.args.get('facility_id')
    court_name = request.args.get('court_name')

    if not fid_str or not court_name:
        return error_response('facility_id and court_name are required.', 400)

    try:
        fid = ObjectId(fid_str)
    except Exception:
        return error_response('Invalid facility ID.', 400)

    fac = db.facilities.find_one({'_id': fid})
    if not fac or (request.user['role'] != 'admin' and fac['owner_id'] != request.user['_id']):
        return error_response('Permission denied for this facility.', 403)

    # Check if there are booked slots on this court
    booked_count = db.slots.count_documents({
        'facility_id': fid,
        'playing_area': court_name,
        'status': 'booked'
    })
    if booked_count > 0:
        return error_response(f'Cannot delete court "{court_name}" because it has {booked_count} active booking(s). Please cancel or complete the bookings first.', 400)

    # Update facility playing_areas
    current_areas = fac.get('playing_areas') or []
    updated_areas = [a for a in current_areas if a != court_name]
    db.facilities.update_one({'_id': fid}, {'$set': {'playing_areas': updated_areas, 'updated_at': datetime.now(timezone.utc)}})

    # Delete all unbooked/blocked slots for this court
    del_res = db.slots.delete_many({
        'facility_id': fid,
        'playing_area': court_name,
        'status': {'$ne': 'booked'}
    })

    return success_response({
        'playing_areas': updated_areas,
        'deleted_slots': del_res.deleted_count
    }, message=f'Court "{court_name}" deleted successfully. Removed {del_res.deleted_count} unbooked slots.')
