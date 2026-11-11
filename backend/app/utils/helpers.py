import math
import uuid
from datetime import datetime, timezone
from bson import ObjectId
from flask import jsonify

def serialize_doc(x):
    """Recursively serializes MongoDB documents, ObjectIds, and datetimes to JSON-safe structures."""
    if isinstance(x, ObjectId):
        return str(x)
    if isinstance(x, datetime):
        return x.isoformat()
    if isinstance(x, dict):
        return {str(k): serialize_doc(v) for k, v in x.items()}
    if isinstance(x, list):
        return [serialize_doc(v) for v in x]
    return x

def error_response(message, status_code=400):
    return jsonify(error=message, ok=False), status_code

def success_response(data=None, message=None, status_code=200, **kwargs):
    payload = {'ok': True}
    if message:
        payload['message'] = message
    if data is not None:
        if isinstance(data, dict):
            payload.update(serialize_doc(data))
        else:
            payload['data'] = serialize_doc(data)
    for k, v in kwargs.items():
        payload[k] = serialize_doc(v)
    return jsonify(payload), status_code

def generate_transaction_id():
    return f"pay_pr_{uuid.uuid4().hex[:12].upper()}"

def haversine_distance(lat1, lon1, lat2, lon2):
    """Returns distance between two coordinates in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)
