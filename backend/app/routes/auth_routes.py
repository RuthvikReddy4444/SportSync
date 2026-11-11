from datetime import datetime, timezone
from flask import Blueprint, request, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from ..middleware.auth import auth, generate_token
from ..utils.helpers import serialize_doc, error_response, success_response

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/api/auth')

@auth_bp.post('/register')
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'customer')
    phone = data.get('phone', '').strip()

    if not name or len(name) < 2:
        return error_response('Please enter a valid full name.')
    if not email or '@' not in email or '.' not in email:
        return error_response('Please enter a valid email address.')
    if not password or len(password) < 8:
        return error_response('Password must be at least 8 characters long.')
    if role not in ('customer', 'owner'):
        return error_response('Invalid account role specified.')

    user_doc = {
        'name': name,
        'email': email,
        'password': generate_password_hash(password),
        'role': role,
        'phone': phone,
        'status': 'active',
        'preferred_sports': data.get('preferred_sports', []),
        'created_at': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc)
    }

    try:
        res = current_app.db.users.insert_one(user_doc)
        user_doc['_id'] = res.inserted_id
    except DuplicateKeyError:
        return error_response('An account with this email already exists.', 409)

    token = generate_token(user_doc['_id'], current_app.config['JWT_SECRET'])
    safe_user = {
        '_id': str(user_doc['_id']),
        'name': user_doc['name'],
        'email': user_doc['email'],
        'role': user_doc['role'],
        'phone': user_doc.get('phone', ''),
        'status': user_doc['status']
    }
    return success_response({'token': token, 'user': safe_user}, message='Registration successful!', status_code=201)

@auth_bp.post('/login')
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return error_response('Email and password are required.')

    user = current_app.db.users.find_one({'email': email})
    if not user or not check_password_hash(user.get('password', ''), password):
        return error_response('Invalid email or password.', 401)

    if user.get('status') != 'active':
        return error_response('This account is suspended or inactive. Please contact support.', 403)

    token = generate_token(user['_id'], current_app.config['JWT_SECRET'])
    safe_user = {
        '_id': str(user['_id']),
        'name': user.get('name', ''),
        'email': user.get('email', ''),
        'role': user.get('role', 'customer'),
        'phone': user.get('phone', ''),
        'preferred_sports': user.get('preferred_sports', []),
        'status': user.get('status', 'active')
    }
    return success_response({'token': token, 'user': safe_user}, message='Login successful!')

@auth_bp.get('/me')
@auth()
def get_me():
    u = request.user
    safe_user = {
        '_id': str(u['_id']),
        'name': u.get('name', ''),
        'email': u.get('email', ''),
        'role': u.get('role', 'customer'),
        'phone': u.get('phone', ''),
        'preferred_sports': u.get('preferred_sports', []),
        'status': u.get('status', 'active'),
        'created_at': u.get('created_at')
    }
    return success_response({'user': safe_user})

@auth_bp.put('/profile')
@auth()
def update_profile():
    data = request.get_json() or {}
    updates = {'updated_at': datetime.now(timezone.utc)}

    if 'name' in data and data['name'].strip():
        updates['name'] = data['name'].strip()
    if 'phone' in data:
        updates['phone'] = data['phone'].strip()
    if 'preferred_sports' in data and isinstance(data['preferred_sports'], list):
        updates['preferred_sports'] = [s.strip() for s in data['preferred_sports'] if s.strip()]

    current_app.db.users.update_one({'_id': request.user['_id']}, {'$set': updates})
    updated_user = current_app.db.users.find_one({'_id': request.user['_id']})
    
    safe_user = {
        '_id': str(updated_user['_id']),
        'name': updated_user.get('name', ''),
        'email': updated_user.get('email', ''),
        'role': updated_user.get('role', 'customer'),
        'phone': updated_user.get('phone', ''),
        'preferred_sports': updated_user.get('preferred_sports', []),
        'status': updated_user.get('status', 'active')
    }
    return success_response({'user': safe_user}, message='Profile updated successfully!')

@auth_bp.post('/change-password')
@auth()
def change_password():
    data = request.get_json() or {}
    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')

    if not check_password_hash(request.user.get('password', ''), old_password):
        return error_response('Current password does not match.', 400)
    if len(new_password) < 8:
        return error_response('New password must be at least 8 characters long.', 400)

    current_app.db.users.update_one(
        {'_id': request.user['_id']},
        {'$set': {'password': generate_password_hash(new_password), 'updated_at': datetime.now(timezone.utc)}}
    )
    return success_response(message='Password updated successfully!')
