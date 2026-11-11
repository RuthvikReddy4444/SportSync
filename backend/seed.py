import os
from datetime import datetime, timezone, timedelta
from werkzeug.security import generate_password_hash
from bson import ObjectId
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://127.0.0.1:27017/')
DB_NAME = os.getenv('MONGO_DB', 'playreserve')

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

def seed():
    print(f"Connecting to MongoDB database: {DB_NAME}...")

    # Ensure indexes
    db.users.create_index([('email', ASCENDING)], unique=True)
    db.facilities.create_index([('location', '2dsphere')])
    db.facilities.create_index([('owner_id', ASCENDING)])
    try:
        db.slots.drop_index('facility_id_1_start_at_1')
    except Exception:
        pass
    db.slots.create_index([('facility_id', ASCENDING), ('playing_area', ASCENDING), ('start_at', ASCENDING)], unique=True)
    db.bookings.create_index([('user_id', ASCENDING)])
    db.bookings.create_index([('facility_id', ASCENDING)])
    db.reviews.create_index([('booking_id', ASCENDING)], unique=True, sparse=True)

    # 1. Reset collections
    db.users.delete_many({})
    db.facilities.delete_many({})
    db.slots.delete_many({})
    db.bookings.delete_many({})
    db.payments.delete_many({})
    db.reviews.delete_many({})
    db.complaints.delete_many({})
    print("Cleared existing collections.")

    now = datetime.now(timezone.utc)
    password_hash = generate_password_hash('Demo@123')

    # 2. Demo Users
    admin_id = ObjectId()
    owner_id = ObjectId()
    owner2_id = ObjectId()
    player_id = ObjectId()
    player2_id = ObjectId()

    users = [
        {
            '_id': admin_id,
            'name': 'Demo Admin',
            'email': 'admin@playreserve.com',
            'password': password_hash,
            'role': 'admin',
            'phone': '+91 90000 00001',
            'status': 'active',
            'created_at': now - timedelta(days=60)
        },
        {
            '_id': owner_id,
            'name': 'Rajesh Sharma (Owner)',
            'email': 'owner@playreserve.com',
            'password': password_hash,
            'role': 'owner',
            'phone': '+91 98765 43210',
            'status': 'active',
            'created_at': now - timedelta(days=45)
        },
        {
            '_id': owner2_id,
            'name': 'Vikram Reddy',
            'email': 'vikram@playreserve.com',
            'password': password_hash,
            'role': 'owner',
            'phone': '+91 98480 77665',
            'status': 'active',
            'created_at': now - timedelta(days=30)
        },
        {
            '_id': player_id,
            'name': 'Alex Player',
            'email': 'player@playreserve.com',
            'password': password_hash,
            'role': 'customer',
            'phone': '+91 91234 56789',
            'preferred_sports': ['Badminton', 'Cricket', 'Tennis'],
            'status': 'active',
            'created_at': now - timedelta(days=20)
        },
        {
            '_id': player2_id,
            'name': 'Sneha Rao',
            'email': 'sneha@playreserve.com',
            'password': password_hash,
            'role': 'customer',
            'phone': '+91 92345 67890',
            'preferred_sports': ['Swimming', 'Badminton'],
            'status': 'active',
            'created_at': now - timedelta(days=15)
        }
    ]
    db.users.insert_many(users)
    print(f"Inserted {len(users)} demo users.")

    # 3. Facilities
    f1_id = ObjectId()
    f2_id = ObjectId()
    f3_id = ObjectId()
    f4_id = ObjectId()
    f5_pending_id = ObjectId()

    facilities = [
        {
            '_id': f1_id,
            'owner_id': owner_id,
            'name': 'Smash Point Badminton & Turf',
            'description': 'Premier multi-sport destination with 4 BWF-standard synthetic badminton courts and a floodlit 7-a-side box cricket & football turf. Complete with changing rooms, clean shower facilities, and an energy drink cafeteria.',
            'phone': '+91 98765 43210',
            'address': {
                'street': 'Near Balasamudram Park',
                'locality': 'Hanamkonda',
                'city': 'Warangal',
                'state': 'Telangana',
                'pincode': '506001'
            },
            'location': {'type': 'Point', 'coordinates': [79.5891, 17.9784]},
            'sports': [
                {'name': 'Badminton', 'price_per_hour': 400.0, 'description': 'BWF-standard synthetic mat courts with LED glare-free lighting.'},
                {'name': 'Cricket', 'price_per_hour': 1200.0, 'description': 'Full turf with high perimeter nets and floodlights.'},
                {'name': 'Table Tennis', 'price_per_hour': 250.0, 'description': 'Stag Olympic championship tables with anti-skid flooring.'}
            ],
            'playing_areas': ['Badminton Court 1', 'Badminton Court 2', 'Cricket Turf Pitch', 'Table Tennis Arena'],
            'amenities': ['Parking', 'Locker Room', 'Showers', 'Floodlights', 'Drinking Water', 'Cafeteria', 'First Aid'],
            'opening_time': '06:00',
            'closing_time': '23:00',
            'operating_days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            'images': [
                'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80'
            ],
            'status': 'approved',
            'active': True,
            'created_at': now - timedelta(days=25)
        },
        {
            '_id': f2_id,
            'owner_id': owner_id,
            'name': 'Warangal Olympic Sports Complex',
            'description': 'All-in-one elite sports center featuring an Olympic-sized 50-meter temperature-controlled swimming pool, 3 hard-court tennis courts, and wooden indoor basketball courts.',
            'phone': '+91 98765 12345',
            'address': {
                'street': 'University Road, Subedari',
                'locality': 'Subedari',
                'city': 'Warangal',
                'state': 'Telangana',
                'pincode': '506004'
            },
            'location': {'type': 'Point', 'coordinates': [79.5621, 17.9942]},
            'sports': [
                {'name': 'Swimming', 'price_per_hour': 300.0, 'description': '8-lane Olympic standard pool with certified lifeguards.'},
                {'name': 'Tennis', 'price_per_hour': 500.0, 'description': 'DecoTurf cushioned tennis courts.'},
                {'name': 'Basketball', 'price_per_hour': 600.0, 'description': 'FIBA approved wooden indoor court.'}
            ],
            'playing_areas': ['Olympic Pool Lane 1-4', 'Olympic Pool Lane 5-8', 'Tennis Court A', 'Tennis Court B', 'Main Basketball Arena'],
            'amenities': ['Parking', 'Olympic Pool', 'Locker Room', 'Showers', 'Equipment Rental', 'Coaching Available', 'Spectator Seating'],
            'opening_time': '06:00',
            'closing_time': '22:00',
            'operating_days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            'images': [
                'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop&q=80'
            ],
            'status': 'approved',
            'active': True,
            'created_at': now - timedelta(days=20)
        },
        {
            '_id': f3_id,
            'owner_id': owner2_id,
            'name': 'Kazipet Arena & Football Turf',
            'description': 'FIFA 2-star certified artificial grass turf suitable for 5v5 & 7v7 football matches and box cricket leagues. Equipped with full dugout, spectator bench, and high lumen LED floodlights.',
            'phone': '+91 98480 22334',
            'address': {
                'street': 'Railway Colony Main Road',
                'locality': 'Kazipet',
                'city': 'Warangal',
                'state': 'Telangana',
                'pincode': '506003'
            },
            'location': {'type': 'Point', 'coordinates': [79.5250, 17.9810]},
            'sports': [
                {'name': 'Football', 'price_per_hour': 1000.0, 'description': 'Shock-pad cushioned turf ideal for cleats or flats.'},
                {'name': 'Cricket', 'price_per_hour': 1100.0, 'description': 'Full boundary safety nets with bowling machine option.'}
            ],
            'playing_areas': ['Football Turf 1', 'Box Cricket Arena'],
            'amenities': ['Parking', 'Floodlights', 'Drinking Water', 'Bibs & Balls Provided', 'Sound System'],
            'opening_time': '05:00',
            'closing_time': '23:30',
            'operating_days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            'images': [
                'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80'
            ],
            'status': 'approved',
            'active': True,
            'created_at': now - timedelta(days=15)
        },
        {
            '_id': f4_id,
            'owner_id': owner_id,
            'name': 'Veloce Volleyball & Badminton Club',
            'description': 'Dedicated outdoor beach volleyball sand pit and two indoor wooden badminton courts with certified coaching staff.',
            'phone': '+91 98490 99887',
            'address': {
                'street': 'Hunter Road, Near Arts College',
                'locality': 'Hunter Road',
                'city': 'Warangal',
                'state': 'Telangana',
                'pincode': '506001'
            },
            'location': {'type': 'Point', 'coordinates': [79.6010, 17.9550]},
            'sports': [
                {'name': 'Volleyball', 'price_per_hour': 350.0, 'description': 'Fine river sand volleyball court.'},
                {'name': 'Badminton', 'price_per_hour': 450.0, 'description': 'Air-cushioned wooden courts.'}
            ],
            'playing_areas': ['Sand Volleyball Court', 'Badminton Court 1', 'Badminton Court 2'],
            'amenities': ['Parking', 'Drinking Water', 'Showers', 'Equipment Rental'],
            'opening_time': '06:00',
            'closing_time': '21:00',
            'operating_days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            'images': [
                'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&auto=format&fit=crop&q=80'
            ],
            'status': 'approved',
            'active': True,
            'created_at': now - timedelta(days=10)
        },
        {
            '_id': f5_pending_id,
            'owner_id': owner_id,
            'name': 'Gachibowli Pro Sports Arena',
            'description': 'Brand new ultra-modern facility featuring 6 Yonex badminton courts, automated indoor cricket nets with bowling machines, and glass-back squash courts.',
            'phone': '+91 99000 11223',
            'address': {
                'street': 'Financial District Road',
                'locality': 'Gachibowli',
                'city': 'Hyderabad',
                'state': 'Telangana',
                'pincode': '500032'
            },
            'location': {'type': 'Point', 'coordinates': [78.3489, 17.4401]},
            'sports': [
                {'name': 'Badminton', 'price_per_hour': 550.0, 'description': '6 competition standard courts.'},
                {'name': 'Cricket', 'price_per_hour': 1400.0, 'description': 'Professional turf with bowling simulator.'},
                {'name': 'Squash', 'price_per_hour': 650.0, 'description': 'WSF certified court.'}
            ],
            'playing_areas': ['Court 1', 'Court 2', 'Court 3', 'Cricket Net 1', 'Squash Court A'],
            'amenities': ['Valet Parking', 'Locker Room', 'Showers', 'Cafe & Juice Bar', 'Pro Shop', 'Wi-Fi'],
            'opening_time': '05:30',
            'closing_time': '23:00',
            'operating_days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            'images': [
                'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80'
            ],
            'status': 'pending',  # Awaiting Admin Decision
            'active': True,
            'created_at': now - timedelta(hours=4)
        }
    ]
    db.facilities.insert_many(facilities)
    print(f"Inserted {len(facilities)} demo facilities (4 approved, 1 pending).")

    # 4. Slots Generation (Upcoming 4 days for approved facilities)
    slots = []
    base_date = now.replace(minute=0, second=0, microsecond=0)
    slot_hours = [6, 7, 8, 9, 16, 17, 18, 19, 20, 21]

    past_slot_for_review_id = ObjectId()
    # Slot yesterday that was completed
    slots.append({
        '_id': past_slot_for_review_id,
        'facility_id': f1_id,
        'start_at': (base_date - timedelta(days=1)).replace(hour=17),
        'end_at': (base_date - timedelta(days=1)).replace(hour=18),
        'sport': 'Badminton',
        'playing_area': 'Badminton Court 1',
        'price': 400.0,
        'status': 'booked',
        'created_at': now - timedelta(days=2)
    })

    demo_upcoming_booked_slot_id = None
    demo_offline_slot_id = None

    for fac in [f1_id, f2_id, f3_id, f4_id, f5_pending_id]:
        fac_obj = next(f for f in facilities if f['_id'] == fac)
        fac_sports = fac_obj.get('sports', [])
        fac_areas = fac_obj.get('playing_areas', ['Court 1'])

        for day_offset in range(0, 4):
            day_dt = (base_date + timedelta(days=day_offset)).replace(hour=0, minute=0, second=0, microsecond=0)
            for h in slot_hours:
                start_dt = day_dt + timedelta(hours=h)
                end_dt = start_dt + timedelta(hours=1)

                for idx, area in enumerate(fac_areas[:4]):
                    matched_sport = None
                    for sp in fac_sports:
                        if sp['name'].lower() in area.lower():
                            matched_sport = sp
                            break
                    if not matched_sport:
                        matched_sport = fac_sports[idx % len(fac_sports)] if fac_sports else {'name': 'General', 'price_per_hour': 400.0}

                    status = 'available'
                    s_id = ObjectId()

                    if fac == f1_id and day_offset == 1 and h == 18 and idx == 0 and not demo_upcoming_booked_slot_id:
                        status = 'booked'
                        demo_upcoming_booked_slot_id = s_id
                    elif fac == f1_id and day_offset == 1 and h == 19 and idx == 0 and not demo_offline_slot_id:
                        status = 'booked'
                        demo_offline_slot_id = s_id
                    elif fac == f2_id and day_offset == 0 and h == 20 and idx == 0:
                        status = 'blocked'

                    slots.append({
                        '_id': s_id,
                        'facility_id': fac,
                        'start_at': start_dt,
                        'end_at': end_dt,
                        'sport': matched_sport['name'],
                        'playing_area': area,
                        'price': float(matched_sport['price_per_hour']),
                        'status': status,
                        'created_at': now
                    })

    db.slots.insert_many(slots)
    print(f"Inserted {len(slots)} slots across venues.")

    # 5. Bookings
    completed_booking_id = ObjectId()
    upcoming_booking_id = ObjectId()
    offline_booking_id = ObjectId()

    # Completed booking for Alex Player (Allows them to submit a review!)
    b_completed = {
        '_id': completed_booking_id,
        'slot_id': past_slot_for_review_id,
        'facility_id': f1_id,
        'user_id': player_id,
        'customer_name': 'Alex Player',
        'customer_email': 'player@playreserve.com',
        'customer_phone': '+91 91234 56789',
        'sport': 'Badminton',
        'playing_area': 'Badminton Court 1',
        'amount': 400.0,
        'type': 'online',
        'status': 'completed',
        'payment_status': 'paid',
        'created_at': now - timedelta(days=1, hours=3)
    }

    # Upcoming confirmed booking for Alex Player
    b_upcoming = {
        '_id': upcoming_booking_id,
        'slot_id': demo_upcoming_booked_slot_id or ObjectId(),
        'facility_id': f1_id,
        'user_id': player_id,
        'customer_name': 'Alex Player',
        'customer_email': 'player@playreserve.com',
        'customer_phone': '+91 91234 56789',
        'sport': 'Badminton',
        'playing_area': 'Badminton Court 1',
        'amount': 400.0,
        'type': 'online',
        'status': 'confirmed',
        'payment_status': 'paid',
        'created_at': now - timedelta(hours=3)
    }

    # Offline walk-in booking for Owner
    b_offline = {
        '_id': offline_booking_id,
        'slot_id': demo_offline_slot_id or ObjectId(),
        'facility_id': f1_id,
        'user_id': None,
        'customer_name': 'Ramesh Kumar (Walk-in)',
        'customer_email': '',
        'customer_phone': '+91 98111 22334',
        'sport': 'Cricket',
        'playing_area': 'Cricket Turf Pitch',
        'amount': 1200.0,
        'type': 'offline',
        'status': 'confirmed',
        'payment_status': 'paid',
        'created_at': now - timedelta(hours=2)
    }

    db.bookings.insert_many([b_completed, b_upcoming, b_offline])

    # 6. Payments
    payments = [
        {
            'transaction_id': 'pay_pr_COMPLETED101',
            'booking_id': completed_booking_id,
            'user_id': player_id,
            'facility_id': f1_id,
            'amount': 400.0,
            'currency': 'INR',
            'method': 'UPI (Google Pay)',
            'gateway': 'simulated_razorpay',
            'status': 'success',
            'created_at': now - timedelta(days=1, hours=3)
        },
        {
            'transaction_id': 'pay_pr_UPCOMING202',
            'booking_id': upcoming_booking_id,
            'user_id': player_id,
            'facility_id': f1_id,
            'amount': 400.0,
            'currency': 'INR',
            'method': 'Credit Card',
            'gateway': 'simulated_razorpay',
            'status': 'success',
            'created_at': now - timedelta(hours=3)
        },
        {
            'transaction_id': 'pay_pr_WALKIN303',
            'booking_id': offline_booking_id,
            'amount': 1200.0,
            'currency': 'INR',
            'method': 'Cash',
            'gateway': 'offline',
            'status': 'success',
            'created_at': now - timedelta(hours=2)
        }
    ]
    db.payments.insert_many(payments)

    # 7. Reviews
    reviews = [
        {
            'facility_id': f1_id,
            'booking_id': ObjectId(), # older booking
            'user_id': player2_id,
            'user_name': 'Sneha Rao',
            'rating': 5,
            'comment': 'Exceptional wooden badminton courts with glare-free lighting! Clean locker rooms and polite staff.',
            'created_at': now - timedelta(days=4)
        },
        {
            'facility_id': f1_id,
            'booking_id': ObjectId(),
            'user_id': ObjectId(),
            'user_name': 'Karthik S.',
            'rating': 4,
            'comment': 'Good turf for 7-a-side football. Plenty of parking space.',
            'created_at': now - timedelta(days=2)
        },
        {
            'facility_id': f2_id,
            'booking_id': ObjectId(),
            'user_id': player_id,
            'user_name': 'Alex Player',
            'rating': 5,
            'comment': 'The Olympic-sized pool is pristine! Certified lifeguards on duty made it feel very secure.',
            'created_at': now - timedelta(days=3)
        },
        {
            'facility_id': f3_id,
            'booking_id': ObjectId(),
            'user_id': player2_id,
            'user_name': 'Sneha Rao',
            'rating': 5,
            'comment': 'Best turf in Kazipet. Played an evening box cricket tournament here under full floodlights.',
            'created_at': now - timedelta(days=5)
        }
    ]
    db.reviews.insert_many(reviews)

    # 8. Complaints / Support Tickets
    complaints = [
        {
            '_id': ObjectId(),
            'user_id': player_id,
            'user_name': 'Alex Player',
            'user_email': 'player@playreserve.com',
            'user_role': 'customer',
            'subject': 'Locker key issue at Smash Point',
            'description': 'Locker #14 latch was sticky and jammed yesterday. Facility staff helped immediately, but reporting for maintenance check.',
            'category': 'facility_issue',
            'facility_id': f1_id,
            'booking_id': completed_booking_id,
            'status': 'open',
            'admin_notes': '',
            'created_at': now - timedelta(hours=8),
            'updated_at': now - timedelta(hours=8)
        }
    ]
    db.complaints.insert_many(complaints)
    print("Inserted demo complaints and reviews.")

    print("\n================== SEEDING COMPLETE ==================")
    print("Demo Accounts Created (Password: Demo@123):")
    print("  1. Admin:    admin@playreserve.com   (Password: Demo@123)")
    print("  2. Owner:    owner@playreserve.com   (Password: Demo@123)")
    print("  3. Player:   player@playreserve.com  (Password: Demo@123)")
    print("  4. Player 2: sneha@playreserve.com   (Password: Demo@123)")
    print("======================================================")

if __name__ == '__main__':
    seed()
