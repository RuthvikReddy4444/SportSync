from datetime import datetime, timezone
from bson import ObjectId
from flask import Blueprint, request, current_app
from ..middleware.auth import auth
from ..utils.helpers import serialize_doc, error_response, success_response, haversine_distance

facility_bp = Blueprint('facility_bp', __name__, url_prefix='/api')

def enrich_facility(f, db, user_lat=None, user_lng=None):
    """Enriches facility document with calculated review metrics and distance."""
    fid = f['_id']
    reviews = list(db.reviews.find({'facility_id': fid}, {'rating': 1}))
    f['review_count'] = len(reviews)
    f['avg_rating'] = round(sum(r['rating'] for r in reviews) / len(reviews), 1) if reviews else None
    
    # Calculate distance if user coords provided
    coords = f.get('location', {}).get('coordinates', [])
    if len(coords) == 2 and user_lat is not None and user_lng is not None:
        f['distance_km'] = haversine_distance(user_lat, user_lng, coords[1], coords[0])
    return f

@facility_bp.get('/facilities')
def list_facilities():
    db = current_app.db
    query = {'status': 'approved', 'active': True}
    
    sport = request.args.get('sport', '').strip()
    city = request.args.get('city', '').strip()
    text = request.args.get('q', '').strip()
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    radius = float(request.args.get('radius', 15)) # radius in km

    if sport:
        query['sports.name'] = {'$regex': f"^{sport}$" if len(sport) < 15 else sport, '$options': 'i'}
    if city:
        query['address.city'] = {'$regex': city, '$options': 'i'}
    if text:
        query['$or'] = [
            {'name': {'$regex': text, '$options': 'i'}},
            {'address.locality': {'$regex': text, '$options': 'i'}},
            {'address.city': {'$regex': text, '$options': 'i'}},
            {'sports.name': {'$regex': text, '$options': 'i'}}
        ]

    u_lat, u_lng = None, None
    if lat and lng:
        try:
            u_lat = float(lat)
            u_lng = float(lng)
            # MongoDB 2dsphere near query in meters
            query['location'] = {
                '$near': {
                    '$geometry': {'type': 'Point', 'coordinates': [u_lng, u_lat]},
                    '$maxDistance': min(radius, 200) * 1000
                }
            }
        except (ValueError, TypeError):
            pass

    try:
        facilities = list(db.facilities.find(query).limit(100))
    except Exception as e:
        # Fallback if 2dsphere index issue occurs
        if 'location' in query:
            del query['location']
        facilities = list(db.facilities.find(query).limit(100))

    enriched = [serialize_doc(enrich_facility(f, db, u_lat, u_lng)) for f in facilities]
    return success_response({'facilities': enriched})

@facility_bp.get('/facilities/<fid>')
def get_facility_details(fid):
    db = current_app.db
    try:
        obj_id = ObjectId(fid)
    except Exception:
        return error_response('Invalid facility ID.', 400)

    f = db.facilities.find_one({'_id': obj_id})
    if not f or not f.get('active', True):
        return error_response('Facility not found or no longer active.', 404)

    enrich_facility(f, db)
    reviews = list(db.reviews.find({'facility_id': obj_id}).sort('created_at', -1).limit(20))
    f['reviews'] = serialize_doc(reviews)

    return success_response({'facility': serialize_doc(f)})

@facility_bp.get('/owner/facilities')
@auth('owner', 'admin')
def get_owner_facilities():
    db = current_app.db
    query = {'active': True}
    if request.user['role'] != 'admin':
        query['owner_id'] = request.user['_id']
    
    facilities = list(db.facilities.find(query).sort('created_at', -1))
    enriched = [serialize_doc(enrich_facility(f, db)) for f in facilities]
    return success_response({'facilities': enriched})

@facility_bp.post('/facilities')
@auth('owner', 'admin')
def create_facility():
    db = current_app.db
    data = request.get_json() or {}
    
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    phone = data.get('phone', '').strip()
    address = data.get('address') or {}
    sports_input = data.get('sports') or []
    playing_areas = data.get('playing_areas') or []
    amenities = data.get('amenities') or []
    opening_time = data.get('opening_time', '06:00')
    closing_time = data.get('closing_time', '23:00')
    operating_days = data.get('operating_days') or ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    images = data.get('images') or []

    try:
        lat = float(data['latitude'])
        lng = float(data['longitude'])
    except (KeyError, ValueError, TypeError):
        return error_response('Valid map coordinates (latitude and longitude) are required.', 400)

    if not name or not address.get('locality') or not address.get('city'):
        return error_response('Facility name, locality, and city are required.', 400)

    clean_sports = []
    for s in sports_input:
        s_name = s.get('name', '').strip()
        if s_name:
            clean_sports.append({
                'name': s_name,
                'price_per_hour': max(0.0, float(s.get('price_per_hour', 0.0))),
                'description': s.get('description', '').strip()
            })

    if not clean_sports:
        return error_response('At least one sport with hourly pricing must be added.', 400)

    clean_areas = []
    for a in playing_areas:
        a_name = a if isinstance(a, str) else a.get('name', '')
        if a_name.strip():
            clean_areas.append(a_name.strip())

    if not clean_areas:
        clean_areas = [f"{clean_sports[0]['name']} Court 1", f"{clean_sports[0]['name']} Court 2"]

    facility_doc = {
        'owner_id': request.user['_id'],
        'name': name,
        'description': description,
        'phone': phone,
        'address': {
            'street': address.get('street', '').strip(),
            'locality': address.get('locality', '').strip(),
            'city': address.get('city', '').strip(),
            'state': address.get('state', 'Telangana').strip(),
            'pincode': address.get('pincode', '').strip()
        },
        'location': {
            'type': 'Point',
            'coordinates': [lng, lat]
        },
        'sports': clean_sports,
        'playing_areas': clean_areas,
        'amenities': [a.strip() for a in amenities if isinstance(a, str) and a.strip()],
        'images': [img.strip() for img in images if isinstance(img, str) and img.strip()],
        'opening_time': opening_time,
        'closing_time': closing_time,
        'operating_days': operating_days,
        'status': 'approved' if request.user['role'] == 'admin' else 'pending',
        'active': True,
        'created_at': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc)
    }

    res = db.facilities.insert_one(facility_doc)
    facility_doc['_id'] = res.inserted_id

    msg = 'Facility submitted for admin approval.' if facility_doc['status'] == 'pending' else 'Facility published successfully!'
    return success_response(
        {'facility': serialize_doc(facility_doc)},
        message=msg,
        status_code=201
    )

@facility_bp.put('/facilities/<fid>')
@auth('owner', 'admin')
def update_facility(fid):
    db = current_app.db
    try:
        obj_id = ObjectId(fid)
    except Exception:
        return error_response('Invalid facility ID.', 400)

    f = db.facilities.find_one({'_id': obj_id})
    if not f or not f.get('active', True):
        return error_response('Facility not found.', 404)

    if request.user['role'] != 'admin' and f['owner_id'] != request.user['_id']:
        return error_response('You do not have permission to modify this facility.', 403)

    data = request.get_json() or {}
    updates = {'updated_at': datetime.now(timezone.utc)}

    for field in ['name', 'description', 'phone', 'opening_time', 'closing_time']:
        if field in data:
            updates[field] = str(data[field]).strip()

    if 'address' in data and isinstance(data['address'], dict):
        updates['address'] = {
            'street': data['address'].get('street', f['address'].get('street', '')).strip(),
            'locality': data['address'].get('locality', f['address'].get('locality', '')).strip(),
            'city': data['address'].get('city', f['address'].get('city', '')).strip(),
            'state': data['address'].get('state', f['address'].get('state', '')).strip(),
            'pincode': data['address'].get('pincode', f['address'].get('pincode', '')).strip()
        }

    if 'latitude' in data and 'longitude' in data:
        try:
            updates['location'] = {
                'type': 'Point',
                'coordinates': [float(data['longitude']), float(data['latitude'])]
            }
        except (ValueError, TypeError):
            pass

    if 'sports' in data and isinstance(data['sports'], list):
        clean_sports = []
        for s in data['sports']:
            s_name = s.get('name', '').strip()
            if s_name:
                clean_sports.append({
                    'name': s_name,
                    'price_per_hour': max(0.0, float(s.get('price_per_hour', 0.0))),
                    'description': s.get('description', '').strip()
                })
        if clean_sports:
            updates['sports'] = clean_sports

    if 'playing_areas' in data and isinstance(data['playing_areas'], list):
        updates['playing_areas'] = [a.strip() for a in data['playing_areas'] if isinstance(a, str) and a.strip()]

    if 'amenities' in data and isinstance(data['amenities'], list):
        updates['amenities'] = [a.strip() for a in data['amenities'] if isinstance(a, str) and a.strip()]

    if 'images' in data and isinstance(data['images'], list):
        updates['images'] = [img.strip() for img in data['images'] if isinstance(img, str) and img.strip()]

    if 'operating_days' in data and isinstance(data['operating_days'], list):
        updates['operating_days'] = data['operating_days']

    db.facilities.update_one({'_id': obj_id}, {'$set': updates})
    updated = db.facilities.find_one({'_id': obj_id})
    return success_response({'facility': serialize_doc(enrich_facility(updated, db))}, message='Facility updated successfully!')

@facility_bp.delete('/facilities/<fid>')
@auth('owner', 'admin')
def delete_facility(fid):
    db = current_app.db
    try:
        obj_id = ObjectId(fid)
    except Exception:
        return error_response('Invalid facility ID.', 400)

    f = db.facilities.find_one({'_id': obj_id})
    if not f or not f.get('active', True):
        return error_response('Facility not found.', 404)

    if request.user['role'] != 'admin' and f['owner_id'] != request.user['_id']:
        return error_response('You do not have permission to delete this facility.', 403)

    # Soft delete
    db.facilities.update_one({'_id': obj_id}, {'$set': {'active': False, 'updated_at': datetime.now(timezone.utc)}})
    return success_response(message='Facility removed successfully.')
