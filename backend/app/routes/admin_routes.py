from datetime import datetime, timezone
from bson import ObjectId
from flask import Blueprint, request, current_app
from ..middleware.auth import auth
from ..utils.helpers import serialize_doc, error_response, success_response

admin_bp = Blueprint('admin_bp', __name__, url_prefix='/api/admin')

@admin_bp.get('/summary')
@auth('admin')
def platform_summary():
    db = current_app.db

    total_users = db.users.count_documents({})
    total_customers = db.users.count_documents({'role': 'customer'})
    total_owners = db.users.count_documents({'role': 'owner'})

    total_facilities = db.facilities.count_documents({'active': True})
    pending_facilities = db.facilities.count_documents({'status': 'pending', 'active': True})
    approved_facilities = db.facilities.count_documents({'status': 'approved', 'active': True})

    total_bookings = db.bookings.count_documents({})
    confirmed_bookings = db.bookings.count_documents({'status': 'confirmed'})
    completed_bookings = db.bookings.count_documents({'status': 'completed'})
    cancelled_bookings = db.bookings.count_documents({'status': 'cancelled'})

    # Calculate total revenue from paid bookings
    paid_bookings = list(db.bookings.find({'payment_status': 'paid'}, {'amount': 1}))
    total_revenue = round(sum(float(b.get('amount', 0)) for b in paid_bookings), 2)

    total_complaints = db.complaints.count_documents({})
    open_complaints = db.complaints.count_documents({'status': 'open'})

    return success_response({
        'summary': {
            'users': total_users,
            'customers': total_customers,
            'owners': total_owners,
            'facilities': total_facilities,
            'pending': pending_facilities,
            'approved': approved_facilities,
            'bookings': total_bookings,
            'confirmed_bookings': confirmed_bookings,
            'completed_bookings': completed_bookings,
            'cancelled_bookings': cancelled_bookings,
            'revenue': total_revenue,
            'complaints': total_complaints,
            'open_complaints': open_complaints
        }
    })

@admin_bp.get('/users')
@auth('admin')
def list_users():
    db = current_app.db
    role = request.args.get('role')
    query_text = request.args.get('q', '').strip()

    filter_q = {}
    if role:
        filter_q['role'] = role
    if query_text:
        filter_q['$or'] = [
            {'name': {'$regex': query_text, '$options': 'i'}},
            {'email': {'$regex': query_text, '$options': 'i'}},
            {'phone': {'$regex': query_text, '$options': 'i'}}
        ]

    users = list(db.users.find(filter_q, {'password': 0}).sort('created_at', -1).limit(100))
    
    # Enrich with booking counts / facility counts
    for u in users:
        if u['role'] == 'customer':
            u['bookings_count'] = db.bookings.count_documents({'user_id': u['_id']})
        elif u['role'] == 'owner':
            u['facilities_count'] = db.facilities.count_documents({'owner_id': u['_id'], 'active': True})

    return success_response({'users': serialize_doc(users)})

@admin_bp.patch('/users/<uid>/status')
@auth('admin')
def toggle_user_status(uid):
    db = current_app.db
    try:
        obj_id = ObjectId(uid)
    except Exception:
        return error_response('Invalid user ID.', 400)

    user = db.users.find_one({'_id': obj_id})
    if not user:
        return error_response('User not found.', 404)

    if user.get('role') == 'admin':
        return error_response('Cannot suspend an administrator account.', 400)

    new_status = 'suspended' if user.get('status') == 'active' else 'active'
    db.users.update_one({'_id': obj_id}, {'$set': {'status': new_status, 'updated_at': datetime.now(timezone.utc)}})

    return success_response(message=f"User account status changed to '{new_status}'.")

@admin_bp.get('/facilities')
@auth('admin')
def list_all_facilities():
    db = current_app.db
    status = request.args.get('status')
    query = {'active': True}
    if status:
        query['status'] = status

    facilities = list(db.facilities.find(query).sort('created_at', -1).limit(100))
    owner_ids = [f['owner_id'] for f in facilities if 'owner_id' in f]
    owner_map = {u['_id']: u for u in db.users.find({'_id': {'$in': owner_ids}}, {'name': 1, 'email': 1, 'phone': 1})}

    for f in facilities:
        owner = owner_map.get(f.get('owner_id'))
        if owner:
            f['owner_name'] = owner.get('name')
            f['owner_email'] = owner.get('email')

    return success_response({'facilities': serialize_doc(facilities)})

@admin_bp.patch('/facilities/<fid>/approve')
@auth('admin')
def approve_or_reject_facility(fid):
    db = current_app.db
    try:
        obj_id = ObjectId(fid)
    except Exception:
        return error_response('Invalid facility ID.', 400)

    data = request.get_json() or {}
    decision = data.get('status', '').strip().lower()

    if decision not in ('approved', 'rejected'):
        return error_response("Decision must be either 'approved' or 'rejected'.", 400)

    res = db.facilities.update_one(
        {'_id': obj_id},
        {'$set': {'status': decision, 'approved_at': datetime.now(timezone.utc), 'updated_at': datetime.now(timezone.utc)}}
    )

    if res.matched_count == 0:
        return error_response('Facility not found.', 404)

    return success_response(message=f'Facility has been successfully {decision}!')

@admin_bp.get('/bookings')
@auth('admin')
def list_all_bookings():
    db = current_app.db
    status = request.args.get('status')
    query = {}
    if status:
        query['status'] = status

    bookings = list(db.bookings.find(query).sort('created_at', -1).limit(150))
    
    fac_ids = [b['facility_id'] for b in bookings]
    slot_ids = [b['slot_id'] for b in bookings]

    fac_map = {f['_id']: f['name'] for f in db.facilities.find({'_id': {'$in': fac_ids}}, {'name': 1})}
    slot_map = {s['_id']: s for s in db.slots.find({'_id': {'$in': slot_ids}}, {'start_at': 1, 'end_at': 1})}

    for b in bookings:
        b['facility_name'] = fac_map.get(b['facility_id'], 'Venue')
        slot = slot_map.get(b['slot_id'])
        if slot:
            b['slot_start'] = slot['start_at'].isoformat()
            b['slot_end'] = slot['end_at'].isoformat()

    return success_response({'bookings': serialize_doc(bookings)})
