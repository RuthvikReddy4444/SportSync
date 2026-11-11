from datetime import datetime, timezone
from bson import ObjectId
from flask import Blueprint, request, current_app
from pymongo.errors import DuplicateKeyError
from ..middleware.auth import auth
from ..utils.helpers import serialize_doc, error_response, success_response

review_bp = Blueprint('review_bp', __name__, url_prefix='/api')

@review_bp.post('/reviews')
@auth('customer')
def submit_review():
    db = current_app.db
    data = request.get_json() or {}

    try:
        booking_id = ObjectId(data['booking_id'])
    except (KeyError, Exception):
        return error_response('Valid booking_id is required.', 400)

    try:
        rating = int(data['rating'])
        if rating < 1 or rating > 5:
            return error_response('Rating must be between 1 and 5 stars.', 400)
    except (KeyError, ValueError, TypeError):
        return error_response('Rating must be an integer from 1 to 5.', 400)

    comment = data.get('comment', '').strip()

    # Rule: Can only review completed bookings
    booking = db.bookings.find_one({'_id': booking_id, 'user_id': request.user['_id']})
    if not booking:
        return error_response('Booking not found or does not belong to you.', 404)

    if booking.get('status') != 'completed':
        return error_response('Reviews can only be submitted after your booking has been marked completed.', 400)

    # Check for duplicate review
    existing = db.reviews.find_one({'booking_id': booking_id})
    if existing:
        return error_response('You have already submitted a review for this booking.', 409)

    review_doc = {
        'facility_id': booking['facility_id'],
        'booking_id': booking_id,
        'user_id': request.user['_id'],
        'user_name': request.user.get('name', 'Anonymous Player'),
        'rating': rating,
        'comment': comment,
        'created_at': datetime.now(timezone.utc)
    }

    try:
        res = db.reviews.insert_one(review_doc)
        review_doc['_id'] = res.inserted_id
    except DuplicateKeyError:
        return error_response('A review for this booking already exists.', 409)

    return success_response(
        {'review': serialize_doc(review_doc)},
        message='Thank you! Your review has been published.',
        status_code=201
    )

@review_bp.get('/facilities/<fid>/reviews')
def get_facility_reviews(fid):
    db = current_app.db
    try:
        obj_id = ObjectId(fid)
    except Exception:
        return error_response('Invalid facility ID.', 400)

    reviews = list(db.reviews.find({'facility_id': obj_id}).sort('created_at', -1).limit(50))
    avg_rating = round(sum(r['rating'] for r in reviews) / len(reviews), 1) if reviews else None

    return success_response({
        'reviews': serialize_doc(reviews),
        'count': len(reviews),
        'avg_rating': avg_rating
    })

@review_bp.get('/owner/reviews')
@auth('owner', 'admin')
def get_owner_reviews():
    db = current_app.db
    if request.user['role'] == 'admin':
        fac_ids = [f['_id'] for f in db.facilities.find({}, {'_id': 1})]
    else:
        fac_ids = [f['_id'] for f in db.facilities.find({'owner_id': request.user['_id']}, {'_id': 1})]

    reviews = list(db.reviews.find({'facility_id': {'$in': fac_ids}}).sort('created_at', -1).limit(100))
    facility_map = {f['_id']: f['name'] for f in db.facilities.find({'_id': {'$in': fac_ids}}, {'name': 1})}
    for r in reviews:
        r['facility_name'] = facility_map.get(r['facility_id'], 'Unknown Facility')

    return success_response({'reviews': serialize_doc(reviews)})

@review_bp.delete('/admin/reviews/<rid>')
@auth('admin')
def delete_review_moderation(rid):
    db = current_app.db
    try:
        obj_id = ObjectId(rid)
    except Exception:
        return error_response('Invalid review ID.', 400)

    res = db.reviews.delete_one({'_id': obj_id})
    if res.deleted_count == 0:
        return error_response('Review not found.', 404)

    return success_response(message='Review removed by administrator.')
