from functools import wraps
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import jwt
from flask import request, current_app
from ..utils.helpers import error_response

def auth(*roles):
    """
    Decorator for role-based authentication using JWT tokens.
    Usage: @auth() or @auth('customer') or @auth('owner', 'admin')
    """
    def decorator(fn):
        @wraps(fn)
        def inner(*args, **kwargs):
            auth_header = request.headers.get('Authorization', '')
            if not auth_header.startswith('Bearer '):
                return error_response('Authentication required. Please log in.', 401)
            
            token = auth_header[7:].strip()
            try:
                payload = jwt.decode(token, current_app.config['JWT_SECRET'], algorithms=['HS256'])
                user_id = payload.get('sub')
                if not user_id:
                    return error_response('Invalid token format.', 401)
                
                user = current_app.db.users.find_one({'_id': ObjectId(user_id)})
                if not user:
                    return error_response('User account not found.', 401)
                
                if user.get('status') != 'active':
                    return error_response('Your account has been deactivated or suspended. Please contact support.', 403)
                
                if roles and user.get('role') not in roles:
                    return error_response('Access forbidden: insufficient role permissions.', 403)
                
                request.user = user
            except jwt.ExpiredSignatureError:
                return error_response('Session expired. Please log in again.', 401)
            except Exception:
                return error_response('Invalid or corrupted session token. Please log in again.', 401)
            
            return fn(*args, **kwargs)
        return inner
    return decorator

def generate_token(user_id, secret, expiration_hours=72):
    now = datetime.now(timezone.utc)
    payload = {
        'sub': str(user_id),
        'iat': now,
        'exp': now + timedelta(hours=expiration_hours)
    }
    return jwt.encode(payload, secret, algorithm='HS256')
