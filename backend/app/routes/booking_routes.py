from datetime import datetime, timezone
from bson import ObjectId
from flask import Blueprint, request, current_app
from ..middleware.auth import auth
from ..utils.helpers import serialize_doc, error_response, success_response, generate_transaction_id

booking_bp = Blueprint('booking_bp', __name__, url_prefix='/api')

@booking_bp.post('/bookings')
@auth('customer')
def create_customer_booking():
    db = current_app.db
    data = request.get_json() or {}

    try:
        slot_id = ObjectId(data['slot_id'])
    except (KeyError, Exception):
        return error_response('Valid slot_id is required.', 400)

    # Atomic lock: update only if status is currently 'available'
    lock_result = db.slots.update_one(
        {'_id': slot_id, 'status': 'available'},
        {'$set': {'status': 'booked'}}
    )

    if lock_result.modified_count != 1:
        return error_response('This time slot is no longer available. Please select another slot.', 409)

    slot = db.slots.find_one({'_id': slot_id})
    fac = db.facilities.find_one({'_id': slot['facility_id']})

    if not fac or not fac.get('active', True) or fac.get('status') != 'approved':
        # Rollback slot availability
        db.slots.update_one({'_id': slot_id}, {'$set': {'status': 'available'}})
        return error_response('Facility is currently not accepting bookings.', 400)

    amount = float(slot.get('price') or (fac.get('sports', [{}])[0].get('price_per_hour', 0.0)))
    sport = slot.get('sport') or (fac.get('sports', [{}])[0].get('name', 'Sport'))
    playing_area = slot.get('playing_area') or (fac.get('playing_areas', ['Main Court'])[0])

    booking_doc = {
        'slot_id': slot_id,
        'facility_id': fac['_id'],
        'user_id': request.user['_id'],
        'customer_name': request.user.get('name', 'Customer'),
        'customer_email': request.user.get('email', ''),
        'customer_phone': request.user.get('phone', ''),
        'sport': sport,
        'playing_area': playing_area,
        'amount': amount,
        'type': 'online',
        'status': 'pending_payment',
        'payment_status': 'pending',
        'created_at': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc)
    }

    res = db.bookings.insert_one(booking_doc)
    booking_doc['_id'] = res.inserted_id

    return success_response(
        {'booking': serialize_doc(booking_doc), 'booking_id': str(booking_doc['_id'])},
        message='Slot held successfully! Complete payment to confirm your reservation.',
        status_code=201
    )

@booking_bp.post('/owner/offline-bookings')
@auth('owner', 'admin')
def create_offline_booking():
    db = current_app.db
    data = request.get_json() or {}

    try:
        slot_id = ObjectId(data['slot_id'])
    except (KeyError, Exception):
        return error_response('Valid slot_id is required.', 400)

    slot = db.slots.find_one({'_id': slot_id})
    if not slot:
        return error_response('Slot not found.', 404)

    fac = db.facilities.find_one({'_id': slot['facility_id']})
    if not fac or (request.user['role'] != 'admin' and fac['owner_id'] != request.user['_id']):
        return error_response('Permission denied for this facility.', 403)

    # Atomic lock on availability
    lock_result = db.slots.update_one(
        {'_id': slot_id, 'status': 'available'},
        {'$set': {'status': 'booked'}}
    )

    if lock_result.modified_count != 1:
        return error_response('This time slot is already booked or blocked.', 409)

    customer_name = data.get('customer_name', '').strip() or 'Walk-in Customer'
    customer_phone = data.get('customer_phone', '').strip()
    amount = float(data.get('amount') or slot.get('price') or 0.0)

    booking_doc = {
        'slot_id': slot_id,
        'facility_id': fac['_id'],
        'user_id': None,
        'customer_name': customer_name,
        'customer_email': data.get('customer_email', ''),
        'customer_phone': customer_phone,
        'sport': slot.get('sport') or 'General',
        'playing_area': slot.get('playing_area') or 'Court',
        'amount': amount,
        'type': 'offline',
        'status': 'confirmed',
        'payment_status': 'paid',
        'notes': data.get('notes', ''),
        'created_at': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc)
    }

    res = db.bookings.insert_one(booking_doc)
    booking_doc['_id'] = res.inserted_id

    # Record offline payment
    db.payments.insert_one({
        'transaction_id': generate_transaction_id(),
        'booking_id': booking_doc['_id'],
        'amount': amount,
        'currency': 'INR',
        'method': data.get('payment_method', 'cash'),
        'gateway': 'offline',
        'status': 'success',
        'created_at': datetime.now(timezone.utc)
    })

    return success_response(
        {'booking': serialize_doc(booking_doc)},
        message='Offline walk-in booking successfully recorded!',
        status_code=201
    )

@booking_bp.get('/bookings/mine')
@auth('customer')
def get_my_bookings():
    db = current_app.db
    bookings = list(db.bookings.find({'user_id': request.user['_id']}).sort('created_at', -1))

    for b in bookings:
        fac = db.facilities.find_one({'_id': b['facility_id']}, {'name': 1, 'address': 1, 'phone': 1, 'images': 1})
        slot = db.slots.find_one({'_id': b['slot_id']}, {'start_at': 1, 'end_at': 1, 'sport': 1, 'playing_area': 1})
        payment = db.payments.find_one({'booking_id': b['_id']}, {'transaction_id': 1, 'method': 1, 'status': 1})
        review = db.reviews.find_one({'booking_id': b['_id']}, {'_id': 1, 'rating': 1})
        
        b['facility'] = serialize_doc(fac)
        b['slot'] = serialize_doc(slot)
        b['payment'] = serialize_doc(payment)
        b['has_reviewed'] = review is not None

    return success_response({'bookings': serialize_doc(bookings)})

@booking_bp.get('/owner/bookings')
@auth('owner', 'admin')
def get_owner_bookings():
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

    status_filter = request.args.get('status')
    query = {'facility_id': {'$in': fac_ids}}
    if status_filter:
        query['status'] = status_filter

    bookings = list(db.bookings.find(query).sort('created_at', -1).limit(500))

    facility_map = {f['_id']: f for f in db.facilities.find({'_id': {'$in': fac_ids}}, {'name': 1, 'address': 1})}
    for b in bookings:
        fac = facility_map.get(b['facility_id'])
        slot = db.slots.find_one({'_id': b['slot_id']}, {'start_at': 1, 'end_at': 1, 'sport': 1, 'playing_area': 1})
        payment = db.payments.find_one({'booking_id': b['_id']}, {'transaction_id': 1, 'method': 1})
        b['facility'] = serialize_doc(fac)
        b['slot'] = serialize_doc(slot)
        b['payment'] = serialize_doc(payment)

    return success_response({'bookings': serialize_doc(bookings)})

@booking_bp.patch('/owner/bookings/<bid>/complete')
@auth('owner', 'admin')
def complete_booking(bid):
    db = current_app.db
    try:
        obj_id = ObjectId(bid)
    except Exception:
        return error_response('Invalid booking ID.', 400)

    booking = db.bookings.find_one({'_id': obj_id})
    if not booking:
        return error_response('Booking not found.', 404)

    fac = db.facilities.find_one({'_id': booking['facility_id']})
    if not fac or (request.user['role'] != 'admin' and fac['owner_id'] != request.user['_id']):
        return error_response('Permission denied.', 403)

    db.bookings.update_one({'_id': obj_id}, {'$set': {'status': 'completed', 'updated_at': datetime.now(timezone.utc)}})
    return success_response(message='Booking marked as completed!')

@booking_bp.patch('/bookings/<bid>/cancel')
@auth('customer', 'owner', 'admin')
def cancel_booking(bid):
    db = current_app.db
    try:
        obj_id = ObjectId(bid)
    except Exception:
        return error_response('Invalid booking ID.', 400)

    booking = db.bookings.find_one({'_id': obj_id})
    if not booking:
        return error_response('Booking not found.', 404)

    # Permission check: customer can cancel own booking, owner can cancel booking for their facility, admin can cancel any
    is_customer = request.user['role'] == 'customer' and booking.get('user_id') == request.user['_id']
    is_admin = request.user['role'] == 'admin'
    is_owner = False
    if request.user['role'] == 'owner':
        fac = db.facilities.find_one({'_id': booking['facility_id']})
        is_owner = fac and fac['owner_id'] == request.user['_id']

    if not (is_customer or is_owner or is_admin):
        return error_response('Not authorized to cancel this booking.', 403)

    if booking['status'] in ('completed', 'cancelled'):
        return error_response(f"Booking is already {booking['status']}.", 400)

    # Update booking status and refund status
    db.bookings.update_one(
        {'_id': obj_id},
        {'$set': {
            'status': 'cancelled',
            'payment_status': 'refunded' if booking['payment_status'] == 'paid' else 'cancelled',
            'cancelled_by': request.user['role'],
            'updated_at': datetime.now(timezone.utc)
        }}
    )

    # Release the slot back to available
    db.slots.update_one({'_id': booking['slot_id']}, {'$set': {'status': 'available'}})

    # If paid, log refund record
    if booking['payment_status'] == 'paid':
        db.payments.update_one(
            {'booking_id': obj_id},
            {'$set': {'refund_status': 'processed', 'refunded_at': datetime.now(timezone.utc)}}
        )

    return success_response(message='Booking cancelled successfully. Slot is released.')

@booking_bp.get('/bookings/<bid>/receipt')
@auth()
def get_booking_receipt(bid):
    db = current_app.db
    try:
        obj_id = ObjectId(bid)
    except Exception:
        return error_response('Invalid booking ID.', 400)

    b = db.bookings.find_one({'_id': obj_id})
    if not b:
        return error_response('Booking not found.', 404)

    # Check permission
    is_owner = db.facilities.find_one({'_id': b['facility_id'], 'owner_id': request.user['_id']}) is not None
    if request.user['role'] != 'admin' and not is_owner and b.get('user_id') != request.user['_id']:
        return error_response('Permission denied for this receipt.', 403)

    fac = db.facilities.find_one({'_id': b['facility_id']})
    slot = db.slots.find_one({'_id': b['slot_id']})
    payment = db.payments.find_one({'booking_id': b['_id']})

    receipt = {
        'booking_id': str(b['_id']),
        'customer_name': b.get('customer_name', 'Customer'),
        'customer_email': b.get('customer_email', ''),
        'customer_phone': b.get('customer_phone', ''),
        'facility_name': fac.get('name', '') if fac else 'PlayReserve Venue',
        'facility_address': fac.get('address', {}) if fac else {},
        'facility_phone': fac.get('phone', '') if fac else '',
        'sport': b.get('sport', ''),
        'playing_area': b.get('playing_area', ''),
        'slot_start': slot['start_at'].isoformat() if slot else '',
        'slot_end': slot['end_at'].isoformat() if slot else '',
        'amount': b.get('amount', 0.0),
        'currency': 'INR',
        'status': b.get('status', ''),
        'payment_status': b.get('payment_status', ''),
        'transaction_id': payment.get('transaction_id', 'N/A') if payment else 'N/A',
        'payment_method': payment.get('method', 'Simulated UPI/Card') if payment else 'N/A',
        'booked_at': b.get('created_at', datetime.now(timezone.utc)).isoformat()
    }

    return success_response({'receipt': receipt})
