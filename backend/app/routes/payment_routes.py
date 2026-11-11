from datetime import datetime, timezone
from bson import ObjectId
from flask import Blueprint, request, current_app
from ..middleware.auth import auth
from ..utils.helpers import serialize_doc, error_response, success_response, generate_transaction_id

payment_bp = Blueprint('payment_bp', __name__, url_prefix='/api')

@payment_bp.post('/bookings/<bid>/pay')
@auth('customer')
def process_payment(bid):
    db = current_app.db
    try:
        obj_id = ObjectId(bid)
    except Exception:
        return error_response('Invalid booking ID.', 400)

    booking = db.bookings.find_one({'_id': obj_id, 'user_id': request.user['_id']})
    if not booking:
        return error_response('Booking not found.', 404)

    if booking['status'] != 'pending_payment':
        return error_response(f"Booking is already in '{booking['status']}' state.", 400)

    data = request.get_json() or {}
    method = data.get('payment_method', 'UPI / Card (Simulated)')
    
    # Generate unique transaction ID (simulating Razorpay / payment gateway response)
    transaction_id = generate_transaction_id()
    amount = float(booking.get('amount', 0.0))
    now = datetime.now(timezone.utc)

    payment_record = {
        'transaction_id': transaction_id,
        'booking_id': obj_id,
        'user_id': request.user['_id'],
        'facility_id': booking.get('facility_id'),
        'amount': amount,
        'currency': 'INR',
        'method': method,
        'gateway': 'simulated_razorpay',
        'status': 'success',
        'created_at': now
    }
    db.payments.insert_one(payment_record)

    # Confirm booking
    db.bookings.update_one(
        {'_id': obj_id},
        {'$set': {
            'status': 'confirmed',
            'payment_status': 'paid',
            'updated_at': now
        }}
    )

    return success_response(
        {
            'transaction_id': transaction_id,
            'amount': amount,
            'status': 'confirmed',
            'payment_status': 'paid'
        },
        message='Payment simulated successfully! Your booking is confirmed.'
    )

@payment_bp.get('/payments/history')
@auth()
def payment_history():
    db = current_app.db
    if request.user['role'] == 'admin':
        payments = list(db.payments.find().sort('created_at', -1).limit(100))
    else:
        payments = list(db.payments.find({'user_id': request.user['_id']}).sort('created_at', -1).limit(50))

    return success_response({'payments': serialize_doc(payments)})
