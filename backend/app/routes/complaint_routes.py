from datetime import datetime, timezone
from bson import ObjectId
from flask import Blueprint, request, current_app
from ..middleware.auth import auth
from ..utils.helpers import serialize_doc, error_response, success_response

complaint_bp = Blueprint('complaint_bp', __name__, url_prefix='/api')

@complaint_bp.post('/complaints')
@auth()
def submit_complaint():
    db = current_app.db
    data = request.get_json() or {}

    subject = data.get('subject', '').strip()
    description = data.get('description', '').strip()
    category = data.get('category', 'facility_issue') # facility_issue, booking_issue, payment, other

    if not subject or not description:
        return error_response('Subject and description are required.', 400)

    facility_id = None
    booking_id = None
    if data.get('facility_id'):
        try:
            facility_id = ObjectId(data['facility_id'])
        except Exception:
            pass
    if data.get('booking_id'):
        try:
            booking_id = ObjectId(data['booking_id'])
        except Exception:
            pass

    doc = {
        'user_id': request.user['_id'],
        'user_name': request.user.get('name', 'User'),
        'user_email': request.user.get('email', ''),
        'user_role': request.user.get('role', 'customer'),
        'subject': subject,
        'description': description,
        'category': category,
        'facility_id': facility_id,
        'booking_id': booking_id,
        'status': 'open', # open, in_progress, resolved, dismissed
        'admin_notes': '',
        'created_at': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc)
    }

    res = db.complaints.insert_one(doc)
    doc['_id'] = res.inserted_id

    return success_response({'complaint': serialize_doc(doc)}, message='Complaint submitted. Our support team will review it.', status_code=201)

@complaint_bp.get('/complaints/mine')
@auth()
def get_my_complaints():
    db = current_app.db
    complaints = list(db.complaints.find({'user_id': request.user['_id']}).sort('created_at', -1))
    return success_response({'complaints': serialize_doc(complaints)})

@complaint_bp.get('/admin/complaints')
@auth('admin')
def get_all_complaints():
    db = current_app.db
    status = request.args.get('status')
    query = {}
    if status:
        query['status'] = status
    complaints = list(db.complaints.find(query).sort('created_at', -1).limit(100))
    return success_response({'complaints': serialize_doc(complaints)})

@complaint_bp.patch('/admin/complaints/<cid>/resolve')
@auth('admin')
def update_complaint_status(cid):
    db = current_app.db
    try:
        obj_id = ObjectId(cid)
    except Exception:
        return error_response('Invalid complaint ID.', 400)

    data = request.get_json() or {}
    new_status = data.get('status', 'resolved')
    admin_notes = data.get('admin_notes', '').strip()

    if new_status not in ('open', 'in_progress', 'resolved', 'dismissed'):
        return error_response('Invalid complaint status.', 400)

    db.complaints.update_one(
        {'_id': obj_id},
        {'$set': {
            'status': new_status,
            'admin_notes': admin_notes,
            'resolved_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc)
        }}
    )
    return success_response(message=f'Complaint marked as {new_status}.')
