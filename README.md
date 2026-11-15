# SportSync – Unified Sports Booking System

> **SESD Capstone / Production-Grade Web Application**  
> Complete full-stack sports facility discovery, real-time availability scheduling, atomic double-booking prevention, role-based dashboards, multi-theme customization, and simulated payment gateway.

---

## 1. Project Overview & Problem Statement

### The Problem
Sports facility reservation today is heavily fragmented:
1. **Double-Booking Conflicts**: Venues often accept phone/counter walk-in reservations while simultaneously taking online bookings, leading to embarrassing on-court scheduling conflicts.
2. **Lack of Real-Time Availability**: Players spend hours calling venue managers to ask if a court or turf is available for their desired time slot.
3. **Disorganized Discovery**: Athletes lack unified, map-based discovery with transparent hourly pricing, equipment details, and verified post-match reviews.
4. **Manual Facility Operations**: Turf owners lack modern slot automation tools (e.g. bulk slot schedulers, maintenance blockouts, and unified offline walk-in desks).

### The Solution: SportSync
**SportSync** is an all-in-one sports reservation and facility management platform built to bridge the gap between athletes, facility operators, and platform administrators. It provides:
- **Unified Single Availability Engine**: Both online customer reservations and desk/counter walk-in bookings lock the exact same database slot records.
- **Atomic Concurrency Defense**: Eliminates double-booking through atomic MongoDB locking (`find_one_and_update` on available slots), guaranteeing zero race conditions even under high simultaneous traffic.
- **Geospatial Proximity Search**: Real-time radius-based distance calculation using the Haversine formula and MongoDB `2dsphere` indexes with interactive Leaflet map integration.
- **Dynamic Multi-Palette Theme Engine**: Customizable visual themes (SportSync Electric, Stadium Turf, Clay Court, Midnight Arena) with instant switching and local persistence.
- **Simulated Payment Gateway & Official Receipts**: 256-bit simulated checkout (UPI, Card, NetBanking) with unique transaction tracking (`pay_pr_...`) and printable verified receipts.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Fast, modular component architecture with ES Modules |
| **Backend** | Python Flask 3.1 | Modular RESTful API built with Flask Blueprints |
| **Database** | MongoDB Community Server | Document store with `2dsphere` geospatial and compound unique indexes |
| **Driver / ORM** | PyMongo 4.13 | High-performance Python MongoDB driver |
| **Maps & GIS** | Leaflet + React-Leaflet + OpenStreetMap | Interactive venue map explorer and owner GPS pin dropper |
| **Authentication** | JSON Web Tokens (PyJWT) + Werkzeug | Stateless HS256 JWT auth with role-based access control decorators |
| **Icons & UI** | Lucide React | Clean, modern iconography |
| **Styling** | Custom CSS3 Design System | Responsive CSS custom properties with 4-palette dynamic theme switcher |
| **Payments** | Simulated Gateway Architecture | Razorpay-ready transaction authorization and invoice generator |

---

## 3. Core Architecture & Engineering Highlights

```
┌─────────────────────────────────────────────────────────────┐
│                      SportSync Frontend                     │
│           (React 18 + Vite · Responsive Design System)      │
│  ┌───────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Player Portal │  │ Owner Workspace  │  │ Admin Console│  │
│  └───────┬───────┘  └────────┬─────────┘  └──────┬───────┘  │
└──────────┼───────────────────┼───────────────────┼──────────┘
           │                   │                   │
           ▼                   ▼                   ▼
     HTTP REST APIs + Bearer JWT Token Authorization
           │                   │                   │
┌──────────┼───────────────────┼───────────────────┼──────────┐
│          ▼                   ▼                   ▼          │
│                    Flask 3.1 Modular Backend                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Blueprint Routes:                                      │ │
│  │ • /api/auth       • /api/facilities   • /api/slots     │ │
│  │ • /api/bookings   • /api/payments     • /api/reviews   │ │
│  │ • /api/complaints • /api/admin        • /api/owner     │ │
│  └───────────────────────────┬────────────────────────────┘ │
│                              │                              │
│                Atomic Database Locking Layer                │
│                 (find_one_and_update Engine)                │
└──────────────────────────────┼──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database Engine                  │
│  • users: Unique email index                                │
│  • facilities: 2dsphere geospatial index                    │
│  • slots: Compound unique (facility_id + playing_area +     │
│           start_at) preventing duplicates                   │
│  • bookings, payments, reviews, complaints                  │
└─────────────────────────────────────────────────────────────┘
```

### Concurrency & Atomic Double-Booking Defense
Double booking is prevented at the database level rather than in-memory:
```python
# Atomic slot acquisition lock
slot = db.slots.find_one_and_update(
    {'_id': ObjectId(slot_id), 'status': 'available'},
    {'$set': {'status': 'booked', 'updated_at': datetime.utcnow()}},
    return_document=ReturnDocument.BEFORE
)
if not slot:
    return jsonify(error='This slot was just reserved by another player.', ok=False), 409
```
If two players or the counter walk-in desk click **Book** at the exact same millisecond, MongoDB executes the operation atomically: exactly one request acquires the slot, while all concurrent requests receive an immediate `409 Conflict` rejection.

---

## 4. Completed Features by Role

### A. Customer / Player
- **Authentication & Security**: Account registration, JWT login, profile updater, preferred sports selector, password changer.
- **Venue Discovery & Filters**:
  - Live search by venue name, locality, city, and sports category pills.
  - Interactive Leaflet map explorer with popups and Google Maps turn-by-turn routing.
  - Real-time GPS distance calculation via the Haversine formula with radius slider (5 km – 50 km).
  - Quick sport filters: Badminton, Cricket, Football, Tennis, Basketball, Swimming, Pickleball, Squash, Table Tennis.
- **Date-Based Slot Browser**:
  - Filter slots by sport, court, and calendar date with real-time availability badges.
- **Simulated Payment Gateway**:
  - 256-bit simulated checkout modal supporting UPI, Credit/Debit Cards, and NetBanking.
  - Generates verifiable transaction references (`pay_pr_...`).
- **Official Booking Receipts**:
  - Print-ready modal (`window.print()`) showing booking ID, payment method, venue address, timing, and security stamp.
- **Booking Management**:
  - Filter bookings by status: `all`, `confirmed`, `completed`, `pending_payment`, `cancelled`.
  - Self-service cancellation with atomic slot release and refund status tracking.
- **Post-Game Reviews & Ratings**:
  - 1–5 star rating picker with written commentary.
  - Strict rule: reviews are restricted to completed bookings only; duplicate reviews are rejected with `409 Conflict`.
- **Customer Support Tickets**:
  - File dispute/complaint tickets on facilities or bookings with status tracking (`open`, `resolved`).

### B. Facility Owner
- **Multi-Venue Management**:
  - Add, edit, and soft-delete multiple sports facilities under a single owner account.
  - Dynamic sports builder: add any sport with custom hourly rates and descriptions.
  - Playing area configuration (Court 1, Court 2, Turf Pitch A, Pool Lanes).
  - Amenities selector (Parking, Showers, Locker Rooms, Floodlights, Cafeteria, Wi-Fi, EV Charging).
  - Operating hours and operating days configuration.
- **Interactive Map Pin Dropper**:
  - Leaflet map canvas inside the venue builder allowing owners to click to drop a precise marker, or use browser geolocation.
- **Availability & Slot Generation Engine**:
  - **Bulk Slot Generator**: automatically generate recurring 1-hour slots across 3 to 30 days and custom operating hours.
  - **Single Slot Creator**: publish individual custom slots.
  - **1-Click Fill Today**: automatically generate slots for all sports and courts for today.
  - **Court Maintenance Blocker**: toggle slots to `blocked` for maintenance or private tournaments.
- **Unified Offline Walk-in Bookings**:
  - Record counter/phone walk-in reservations (Cash/UPI/POS) that lock the same availability slot engine, preventing online/offline conflicts.
- **Owner Analytics**:
  - Live revenue counters (total revenue from online and walk-in bookings).
  - Court occupancy rate (%) and total booking counters.
  - Review feed with customer ratings.
  - Mark confirmed bookings as `completed` to enable customer post-game reviews.

### C. Administrator
- **Platform Overview**:
  - System-wide KPIs: Gross Revenue, Total Players, Total Owners, Active Venues, Pending Approvals, Open Complaints.
- **Facility Approvals**:
  - Dedicated approval queue to inspect new owner venue submissions and approve or reject facilities.
- **User Governance**:
  - Search and filter all registered customers and owners.
  - 1-click user account suspension and reactivation toggle.
- **Review Moderation**:
  - Audit and permanently delete inappropriate or abusive community reviews.
- **Dispute Resolution Desk**:
  - Review player complaints, write administrative resolution notes, and mark tickets as resolved.
- **Platform-wide Audit**:
  - Monitor all system transactions and bookings in real-time.

---

## 5. Dynamic Theme Engine

SportSync includes an interactive theme switcher in the navigation bar with 4 athletic palettes:

| Theme | Inspiration | Primary Colors |
| :--- | :--- | :--- |
| ⚡ **SportSync Electric** | Signature high-tech performance | Electric Royal Blue (`#1d4ed8`), Neon Cyan (`#06b6d4`), Slate (`#0f172a`) |
| 🌿 **Stadium Turf** | Football turfs & lawn tennis | Stadium Grass Emerald (`#15803d`), Mint (`#10b981`), Forest (`#14532d`) |
| 🎾 **Clay Court** | Roland Garros clay courts | Sunset Clay Orange (`#ea580c`), Amber (`#f59e0b`), Deep Rust (`#7c2d12`) |
| 🌙 **Midnight Arena** | Floodlit night games & dark mode | Deep Obsidian Navy (`#0b0f19`), Electric Sky (`#38bdf8`), Dark Slate (`#111827`) |

*Theme preferences are automatically persisted across page reloads via `localStorage`.*

---

## 6. Project Directory Structure

```
SportSync/
├── backend/
│   ├── app/
│   │   ├── middleware/
│   │   │   └── auth.py            # JWT authentication & role-based decorator
│   │   ├── routes/
│   │   │   ├── __init__.py        # Blueprint package
│   │   │   ├── auth_routes.py     # Register, login, profile, password
│   │   │   ├── facility_routes.py # Discovery, CRUD, geospatial queries, owner facilities
│   │   │   ├── slot_routes.py     # Single & bulk slot generator, maintenance blocker
│   │   │   ├── booking_routes.py  # Atomic lock reservations, walk-ins, cancellations, receipts
│   │   │   ├── payment_routes.py  # Simulated payment processor & transaction history
│   │   │   ├── review_routes.py   # Verified post-game reviews & moderation
│   │   │   ├── complaint_routes.py# Dispute & support ticket handling
│   │   │   └── admin_routes.py    # Platform KPIs, user suspension, approvals
│   │   ├── utils/
│   │   │   └── helpers.py         # JSON serialization, Haversine formula, responses
│   │   ├── config.py              # Environment configuration
│   │   └── __init__.py            # Flask app factory, CORS, MongoDB indexes
│   ├── .env                       # Environment variables
│   ├── .env.example               # Example environment configuration
│   ├── requirements.txt           # Python dependencies
│   ├── run.py                     # Entry point for backend server (port 5000)
│   ├── seed.py                    # Database seeder (Demo accounts, facilities, slots)
│   └── test_suite.py              # Automated 30-step end-to-end integration test suite
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Header with theme switcher, role selector & user menu
│   │   │   ├── Footer.jsx         # Platform footer & navigation links
│   │   │   ├── Hero.jsx           # Landing hero with quick CTA & trust metrics
│   │   │   ├── SearchBar.jsx      # Multi-criteria search (Sport, Locality, City, Radius)
│   │   │   ├── PopularSports.jsx  # Category pills with sport icons
│   │   │   ├── FacilityCard.jsx   # Modern venue card
│   │   │   ├── FacilityModal.jsx  # Full venue modal (Images, amenities, slots, reviews)
│   │   │   ├── MapExplorer.jsx    # Leaflet map explorer with sidebar
│   │   │   ├── MapPicker.jsx      # Interactive map pin dropper for venue owners
│   │   │   ├── PaymentModal.jsx   # Simulated payment gateway (UPI, Card, NetBanking)
│   │   │   ├── ReceiptModal.jsx   # Print-ready official booking invoice
│   │   │   ├── ReviewModal.jsx    # Star rating & comment submission
│   │   │   ├── ComplaintModal.jsx # Support ticket submission form
│   │   │   ├── HowItWorks.jsx     # 3-step athlete guide
│   │   │   ├── BenefitsSection.jsx# Player & venue owner value propositions
│   │   │   ├── AuthModal.jsx      # Sign in / Sign up with 1-click Demo Logins
│   │   │   └── Toast.jsx          # User feedback banner
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Global authentication & session provider
│   │   ├── pages/
│   │   │   ├── HomePage.jsx       # Discovery & landing page
│   │   │   ├── CustomerDashboard.jsx # Player reservations, receipts, complaints
│   │   │   ├── OwnerDashboard.jsx # Venue manager, bulk slot scheduler, walk-ins
│   │   │   ├── AdminDashboard.jsx # Platform KPIs, approvals, user suspension
│   │   │   └── ProfilePage.jsx    # Profile & security settings
│   │   ├── services/
│   │   │   └── api.js             # API client with token injection
│   │   ├── styles.css             # Design system & multi-theme palettes
│   │   ├── App.jsx                # Root router & view coordinator
│   │   └── main.jsx               # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## 7. Setup & Installation Guide

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18 or higher (with `npm`)
- **MongoDB**: Community Server running locally on port `27017` (or MongoDB Atlas connection string)

---

### Step 1: Backend Setup
1. Open a terminal and navigate to `backend`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   - **Windows PowerShell**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify or create `.env` in `backend/`:
   ```ini
   MONGO_URI=mongodb://127.0.0.1:27017/
   MONGO_DB=playreserve
   JWT_SECRET=playreserve_secret_key_2026_change_this
   FRONTEND_ORIGIN=http://localhost:5173
   ```
5. Populate the database with fresh demo accounts and venues:
   ```bash
   python seed.py
   ```
6. Start the Flask backend server:
   ```bash
   python run.py
   ```
   *Health Check:* [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health)

---

### Step 2: Frontend Setup
1. Open a second terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## 8. Demo Accounts & Credentials

All demo accounts share the password: **`Demo@123`**

| Role | Email | Capabilities to Demonstrate |
| :--- | :--- | :--- |
| **Player / Customer** | `player@playreserve.com` | Search venues, book slots, simulate payment, view/print receipts, cancel bookings, submit verified reviews. |
| **Facility Owner** | `owner@playreserve.com` | Manage 4 venues, drop GPS map pins, bulk generate slots, block maintenance slots, record walk-in bookings. |
| **Platform Admin** | `admin@playreserve.com` | View system KPIs, approve pending facilities (**Gachibowli Pro Arena**), suspend/reactivate accounts, resolve disputes. |
| **Customer 2** | `sneha@playreserve.com` | Secondary athlete account for testing concurrent bookings and reviews. |

> **Pro Tip**: Use the **⚡ Demo Logins** button in the top navigation bar or on the sign-in modal for 1-click access to any role.

---

## 9. Automated Integration Test Suite

The project includes an end-to-end integration test suite verifying 30 core platform operations:

```bash
cd backend
python test_suite.py
```

### Verified Test Cases (30/30 Passing):
1. **Health Check**: Service status 200 OK
2. **Customer Authentication**: Registration and JWT issuance
3. **Owner Authentication**: Owner role token verification
4. **Admin Authentication**: Admin role token verification
5. **Customer Profile Management**: Updating sports preferences
6. **Customer Registration**: New user creation
7. **Dynamic Sports & Facility Creation**: Multi-sport rates
8. **Facility Editing**: Address and hours modification
9. **Admin Facility Approval**: Changing status from `pending` to `approved`
10. **Geospatial Discovery & Nearby Query**: `$nearSphere` radius search
11. **Bulk Slot Generation Engine**: Recurring slot matrix
12. **Single Slot Creation**: Custom time slot publishing
13. **Slot Maintenance Block**: Locking slot availability
14. **Slot Maintenance Unblock**: Releasing slot availability
15. **Online Customer Booking**: Slot reservation
16. **Atomic Double-Booking Prevention**: Race-condition rejection (HTTP 409)
17. **Payment Gateway Simulation**: Authorization and transaction ID generation
18. **Verified Booking Receipt Generation**: Receipt retrieval
19. **Available Slots Query**: Live slot filtering
20. **Offline Walk-in Booking Integration**: Desk reservation
21. **Booking Completion Workflow**: Marking session complete
22. **Verified Rating & Review Submission**: Post-game review
23. **Duplicate Review Prevention**: Rejection of second review (HTTP 409)
24. **Complaint & Support Ticket Submission**: Filing ticket
25. **Admin Complaint Resolution**: Writing administrative resolution notes
26. **Admin Review Moderation & Removal**: Deleting inappropriate reviews
27. **Admin User Suspension Toggle**: Disabling user login
28. **Admin User Reactivation Toggle**: Restoring user login
29. **Booking Cancellation & Atomic Slot Release**: Auto release of slot
30. **Facility Soft Deletion**: Archiving facility records

---

## 10. REST API Reference

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/health` | GET | Public | Health check & database connection status |
| `/api/auth/register` | POST | Public | User registration (player or owner) |
| `/api/auth/login` | POST | Public | JWT login & profile retrieval |
| `/api/auth/profile` | GET / PUT | Auth | View or update profile details |
| `/api/auth/change-password` | POST | Auth | Update user password |
| `/api/facilities` | GET | Public | Geospatial search & filter facilities |
| `/api/facilities` | POST | Owner | Create new facility (pending approval) |
| `/api/facilities/<id>` | PUT / DELETE | Owner | Update or soft-delete facility |
| `/api/slots` | GET | Public | Query available slots by venue and date |
| `/api/bookings` | POST | Customer | Atomic slot reservation |
| `/api/bookings/mine` | GET | Customer | List customer booking history |
| `/api/bookings/<id>/cancel` | POST | Customer | Cancel reservation & release slot |
| `/api/bookings/<id>/receipt` | GET | Auth | Generate official verified receipt |
| `/api/payments/checkout` | POST | Customer | Process simulated payment |
| `/api/owner/facilities` | GET | Owner | List facilities owned by authenticated user |
| `/api/owner/slots/bulk` | POST | Owner | Bulk slot generator engine |
| `/api/owner/slots/<id>/block` | PATCH | Owner | Block/unblock slot for maintenance |
| `/api/owner/offline-bookings` | POST | Owner | Record counter walk-in booking |
| `/api/owner/bookings/<id>/complete` | PATCH | Owner | Mark confirmed session as completed |
| `/api/reviews` | POST | Customer | Submit verified post-game review |
| `/api/complaints` | POST | Customer | Submit support / dispute ticket |
| `/api/admin/summary` | GET | Admin | System KPIs & revenue metrics |
| `/api/admin/facilities/<id>/approval`| PATCH | Admin | Approve or reject facility submission |
| `/api/admin/users/<id>/status` | PATCH | Admin | Suspend or reactivate user account |

---

## 11. Production Gateway Readiness

- **Simulated Payment Gateway**: Designed to mirror real payment gateways (Razorpay, Stripe) with transaction IDs, statuses, and receipt verification. To connect production Razorpay, add `razorpay` to `requirements.txt`, configure keys in `backend/.env`, and wire webhooks to `payment_routes.py`.
- **SMS & Email Notifications**: Ready for integration with Twilio or SendGrid via existing booking hooks in `booking_routes.py`.

---

## 12. Authors & Academic Attribution

- **Project**: SportSync – Unified Sports Booking System
- **Context**: SESD Capstone Project / Full-Stack Production Implementation
- **Repository Author**: Ruthvik Reddy (`RuthvikReddy4444`)
- **License**: MIT License – Free for educational and commercial development.
