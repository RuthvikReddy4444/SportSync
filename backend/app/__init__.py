import os
from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient, ASCENDING
from .config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for frontend
    CORS(app, resources={r'/api/*': {
        'origins': [app.config['FRONTEND_ORIGIN'], 'http://localhost:5173', 'http://127.0.0.1:5173'],
        'methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        'allow_headers': ['Content-Type', 'Authorization']
    }})

    # Connect to MongoDB
    client = MongoClient(app.config['MONGO_URI'], serverSelectionTimeoutMS=5000)
    app.db = client[app.config['MONGO_DB']]

    # Ensure Database Indexes
    try:
        app.db.users.create_index([('email', ASCENDING)], unique=True)
        app.db.facilities.create_index([('location', '2dsphere')])
        app.db.facilities.create_index([('owner_id', ASCENDING)])
        try:
            app.db.slots.drop_index('facility_id_1_start_at_1')
        except Exception:
            pass
        app.db.slots.create_index([('facility_id', ASCENDING), ('playing_area', ASCENDING), ('start_at', ASCENDING)], unique=True)
        app.db.bookings.create_index([('user_id', ASCENDING)])
        app.db.bookings.create_index([('facility_id', ASCENDING)])
        app.db.payments.create_index([('booking_id', ASCENDING)])
        app.db.reviews.create_index([('booking_id', ASCENDING)], unique=True, sparse=True)
        app.db.reviews.create_index([('facility_id', ASCENDING)])
        app.db.complaints.create_index([('user_id', ASCENDING)])
    except Exception as e:
        print(f"[Warning] Index creation note: {e}")

    # Register Blueprints
    from .routes.auth_routes import auth_bp
    from .routes.facility_routes import facility_bp
    from .routes.slot_routes import slot_bp
    from .routes.booking_routes import booking_bp
    from .routes.payment_routes import payment_bp
    from .routes.review_routes import review_bp
    from .routes.complaint_routes import complaint_bp
    from .routes.admin_routes import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(facility_bp)
    app.register_blueprint(slot_bp)
    app.register_blueprint(booking_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(review_bp)
    app.register_blueprint(complaint_bp)
    app.register_blueprint(admin_bp)

    @app.get('/api/health')
    def health_check():
        try:
            client.admin.command('ping')
            return jsonify(ok=True, database='connected', service='PlayReserve API')
        except Exception as e:
            return jsonify(ok=False, error=str(e)), 503

    return app
