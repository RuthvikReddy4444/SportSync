import urllib.request
import json
import sys
from datetime import datetime, timezone, timedelta

BASE = 'http://127.0.0.1:5000/api'

def req(path, method='GET', data=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    encoded_data = json.dumps(data).encode() if data is not None else None
    request = urllib.request.Request(f"{BASE}{path}", data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as res:
            raw = res.read().decode()
            return json.loads(raw) if raw else {}, res.status
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return json.loads(raw), e.code
        except:
            return {'error': raw}, e.code

def run_tests():
    print("="*65)
    print("PLAYRESERVE FULL-STACK INTEGRATION & FUNCTIONAL TEST SUITE")
    print("="*65)
    
    passed = 0
    total = 0

    def test(name, condition, extra=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f" [PASS] #{total:02d}: {name} {extra}")
        else:
            print(f" [FAIL] #{total:02d}: {name} {extra}")
            sys.exit(1)

    # 1. Health check
    data, code = req('/health')
    test("Health Check", code == 200 and data.get('ok') is True, f"Status: {code}")

    # 2. Customer login
    data, code = req('/auth/login', 'POST', {'email': 'player@playreserve.com', 'password': 'Demo@123'})
    test("Customer Authentication", code == 200 and 'token' in data, f"User: {data.get('user', {}).get('name')}")
    player_token = data.get('token')
    player_id = data.get('user', {}).get('_id')

    # 3. Owner login
    data, code = req('/auth/login', 'POST', {'email': 'owner@playreserve.com', 'password': 'Demo@123'})
    test("Owner Authentication", code == 200 and data.get('user', {}).get('role') == 'owner')
    owner_token = data.get('token')

    # 4. Admin login
    data, code = req('/auth/login', 'POST', {'email': 'admin@playreserve.com', 'password': 'Demo@123'})
    test("Admin Authentication", code == 200 and data.get('user', {}).get('role') == 'admin')
    admin_token = data.get('token')

    # 5. Customer Profile Update
    data, code = req('/auth/profile', 'PUT', {'phone': '+91 99999 88888', 'preferred_sports': ['Badminton', 'Tennis', 'Squash']}, player_token)
    test("Customer Profile Management", code == 200 and data.get('user', {}).get('phone') == '+91 99999 88888')

    # 6. Customer Registration
    test_email = f"test_{int(datetime.now().timestamp())}@playreserve.com"
    data, code = req('/auth/register', 'POST', {
        'name': 'New Player',
        'email': test_email,
        'password': 'Password123!',
        'role': 'customer',
        'phone': '+91 91111 22222'
    })
    test("Customer Registration", code == 201 and 'token' in data)

    # 7. Dynamic Sports & Facility Creation (Owner)
    data, code = req('/facilities', 'POST', {
        'name': 'Test Apex Turf & Pickleball Arena',
        'description': 'Dynamic multi-sport courts with tournament equipment.',
        'phone': '+91 98765 00000',
        'address': {
            'street': 'Hunter Road Extension',
            'locality': 'Subedari',
            'city': 'Warangal',
            'state': 'Telangana'
        },
        'latitude': 17.9850,
        'longitude': 79.5700,
        'sports': [
            {'name': 'Pickleball', 'price_per_hour': 350.0, 'description': 'Pro outdoor court'},
            {'name': 'Futsal', 'price_per_hour': 900.0, 'description': '5v5 enclosed court'}
        ],
        'playing_areas': ['Pickleball Court 1', 'Futsal Pitch A'],
        'amenities': ['Parking', 'Drinking Water', 'Showers']
    }, owner_token)
    test("Dynamic Sports & Facility Creation", code == 201 and data.get('facility', {}).get('name') == 'Test Apex Turf & Pickleball Arena')
    new_facility_id = data.get('facility', {}).get('_id')

    # 8. Facility Editing
    data, code = req(f"/facilities/{new_facility_id}", 'PUT', {
        'description': 'Updated description with premium court mats.',
        'phone': '+91 98765 99999'
    }, owner_token)
    test("Facility Editing", code == 200 and data.get('facility', {}).get('phone') == '+91 98765 99999')

    # 9. Admin Approving Facility
    data, code = req(f"/admin/facilities/{new_facility_id}/approve", 'PATCH', {'status': 'approved'}, admin_token)
    test("Admin Facility Approval", code == 200)

    # 10. Nearby / Geospatial Search
    data, code = req(f"/facilities?lat=17.9784&lng=79.5891&radius=10")
    test("Geospatial Discovery & Nearby Query", code == 200 and len(data.get('facilities', [])) > 0, f"Found: {len(data.get('facilities', []))} venues")

    # 11. Bulk Slot Generation
    tomorrow_str = (datetime.now(timezone.utc) + timedelta(days=1)).strftime('%Y-%m-%d')
    data, code = req('/owner/slots/bulk', 'POST', {
        'facility_id': new_facility_id,
        'start_date': tomorrow_str,
        'days': 2,
        'start_hour': 8,
        'end_hour': 12,
        'sport': 'Pickleball',
        'playing_area': 'Pickleball Court 1',
        'price': 350.0
    }, owner_token)
    test("Bulk Slot Generation Engine", code == 200)

    # 12. Single Slot Creation
    slot_start = (datetime.now(timezone.utc) + timedelta(days=2)).replace(hour=10, minute=0, second=0).isoformat()
    slot_end = (datetime.now(timezone.utc) + timedelta(days=2)).replace(hour=11, minute=0, second=0).isoformat()
    data, code = req('/owner/slots', 'POST', {
        'facility_id': new_facility_id,
        'start_at': slot_start,
        'end_at': slot_end,
        'sport': 'Pickleball',
        'playing_area': 'Pickleball Court 1',
        'price': 350.0
    }, owner_token)
    test("Single Slot Creation", code == 201)
    test_slot_id = data.get('slot', {}).get('_id')

    # 13. Slot Maintenance Block / Unblock Toggle
    data, code = req(f"/owner/slots/{test_slot_id}/block", 'PATCH', None, owner_token)
    test("Slot Maintenance Block", code == 200 and 'blocked' in data.get('message', ''))
    data, code = req(f"/owner/slots/{test_slot_id}/block", 'PATCH', None, owner_token)
    test("Slot Maintenance Unblock", code == 200 and 'available' in data.get('message', ''))

    # 14. Online Customer Booking & Atomic Slot Lock
    data, code = req('/bookings', 'POST', {'slot_id': test_slot_id}, player_token)
    test("Online Customer Booking", code == 201 and 'booking_id' in data)
    test_booking_id = data.get('booking_id')

    # 15. Double-Booking Prevention Check (Race Condition Defense)
    double_data, double_code = req('/bookings', 'POST', {'slot_id': test_slot_id}, player_token)
    test("Atomic Double-Booking Prevention", double_code == 409, f"Status: {double_code} (Properly Rejected)")

    # 16. Simulated Payment Flow
    data, code = req(f"/bookings/{test_booking_id}/pay", 'POST', {'payment_method': 'UPI (Google Pay)'}, player_token)
    test("Payment Gateway Simulation", code == 200 and data.get('payment_status') == 'paid', f"Txn: {data.get('transaction_id')}")

    # 17. Booking Receipt Retrieval
    data, code = req(f"/bookings/{test_booking_id}/receipt", 'GET', None, player_token)
    test("Verified Booking Receipt Generation", code == 200 and data.get('receipt', {}).get('booking_id') == test_booking_id)

    # 18. Offline Walk-In Booking
    # Fetch another available slot from bulk generator
    data, code = req(f"/slots?facility_id={new_facility_id}")
    avail_slots = data.get('slots', [])
    test("Find Available Slots", len(avail_slots) > 0)
    walkin_slot_id = avail_slots[0]['_id']

    data, code = req('/owner/offline-bookings', 'POST', {
        'slot_id': walkin_slot_id,
        'customer_name': 'Walkin Player',
        'customer_phone': '+91 98888 77777',
        'amount': 350.0,
        'payment_method': 'Cash'
    }, owner_token)
    test("Offline Walk-in Booking Integration", code == 201)

    # 19. Booking Completion (Owner marks complete)
    data, code = req(f"/owner/bookings/{test_booking_id}/complete", 'PATCH', None, owner_token)
    test("Booking Completion Workflow", code == 200)

    # 20. Ratings & Reviews Submission (After completion)
    data, code = req('/reviews', 'POST', {
        'booking_id': test_booking_id,
        'rating': 5,
        'comment': 'Flawless pickleball court! Highly recommended.'
    }, player_token)
    test("Verified Rating & Review Submission", code == 201)
    test_review_id = data.get('review', {}).get('_id')

    # 21. Duplicate Review Prevention
    dup_rev, dup_code = req('/reviews', 'POST', {
        'booking_id': test_booking_id,
        'rating': 4,
        'comment': 'Attempting second review'
    }, player_token)
    test("Duplicate Review Prevention", dup_code == 409, f"Status: {dup_code}")

    # 22. Support Ticket / Complaint Submission
    data, code = req('/complaints', 'POST', {
        'subject': 'Net tension calibration issue',
        'description': 'Pickleball net #1 sagged slightly at center.',
        'category': 'facility_issue',
        'booking_id': test_booking_id,
        'facility_id': new_facility_id
    }, player_token)
    test("Complaint & Support Ticket Submission", code == 201)
    test_complaint_id = data.get('complaint', {}).get('_id')

    # 23. Admin Resolving Complaint
    data, code = req(f"/admin/complaints/{test_complaint_id}/resolve", 'PATCH', {
        'status': 'resolved',
        'admin_notes': 'Venue adjusted court net straps. Resolved.'
    }, admin_token)
    test("Admin Complaint Resolution", code == 200)

    # 24. Admin Review Moderation (Removal)
    data, code = req(f"/admin/reviews/{test_review_id}", 'DELETE', None, admin_token)
    test("Admin Review Moderation & Removal", code == 200)

    # 25. User Suspension / Activation Toggle
    data, code = req(f"/admin/users/{player_id}/status", 'PATCH', None, admin_token)
    test("Admin User Suspension Toggle", code == 200 and 'suspended' in data.get('message', ''))
    data, code = req(f"/admin/users/{player_id}/status", 'PATCH', None, admin_token)
    test("Admin User Reactivation Toggle", code == 200 and 'active' in data.get('message', ''))

    # 26. Booking Cancellation & Slot Release
    # Create one more booking to test cancellation
    avail_slots = req(f"/slots?facility_id={new_facility_id}")[0].get('slots', [])
    if avail_slots:
        cancel_slot_id = avail_slots[0]['_id']
        b_res, _ = req('/bookings', 'POST', {'slot_id': cancel_slot_id}, player_token)
        b_id = b_res.get('booking_id')
        # Cancel it
        c_res, c_code = req(f"/bookings/{b_id}/cancel", 'PATCH', None, player_token)
        test("Booking Cancellation & Atomic Slot Release", c_code == 200)

    # 27. Facility Deletion (Cleanup test facility)
    data, code = req(f"/facilities/{new_facility_id}", 'DELETE', None, owner_token)
    test("Facility Soft Deletion", code == 200)

    print("="*65)
    print(f"TEST SUITE COMPLETE: {passed}/{total} TESTS PASSED (100% SUCCESS)")
    print("="*65)

if __name__ == '__main__':
    run_tests()
