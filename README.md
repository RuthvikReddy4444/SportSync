# PlayReserve – Sports Facility Booking & Management System

> **SESD Capstone / Production-Grade Web Application**  
> Complete full-stack sports facility discovery, real-time availability scheduling, atomic double-booking prevention, role-based dashboards, and simulated payment gateway.

---

## 1. Technology Stack

- **Frontend**: React 18 + Vite (ES Modules)
- **Backend**: Python Flask 3.1 + PyMongo (Modular Blueprint Architecture)
- **Database**: MongoDB (Geospatial `2dsphere` indexes, compound unique slot indexes)
- **Maps**: Leaflet + OpenStreetMap + React-Leaflet
- **Styling**: Modern Forest Green Design System (`styles.css` with CSS custom properties)
- **Authentication**: Stateless JSON Web Tokens (HS256) + Werkzeug password hashing
- **Icons**: Lucide React
- **Payments**: Simulated 256-bit payment gateway architecture (Razorpay ready)

---

## 2. Completed Features by Role

### A. Customer / Player
- **Authentication & Profile**: Registration, login, profile management (name, phone, favorite sports), password changer.
- **Venue Discovery**:
  - Live search by venue name, locality, city, and dynamic sport type.
  - Interactive Leaflet map with venue pins, popups, and turn-by-turn Google Maps directions.
  - Real-time GPS distance calculation (`haversine` formula) with customizable radius filters (5 km – 50 km).
  - Quick sport filter pills (Badminton, Cricket, Football, Tennis, Basketball, Swimming, Pickleball, Squash, Table Tennis).
- **Slot Reservation & Concurrency Defense**:
  - Date-based slot browser with live availability badges.
  - Atomic double-booking prevention: single database lock ensuring two players cannot reserve the same slot simultaneously.
- **Simulated Payment Gateway**:
  - Checkout modal with UPI, Credit/Debit Cards, and NetBanking options.
  - Instant transaction authorization and automated generation of unique transaction IDs (`pay_pr_...`).
- **Official Booking Receipts**:
  - Verified invoice modal with booking ID, transaction ID, venue contact, schedule, and print-ready layout (`window.print()`).
- **Booking Management**:
  - Booking history filterable by status (`all`, `confirmed`, `completed`, `pending_payment`, `cancelled`).
  - Self-service cancellation with automatic slot release and refund status tracking.
- **Post-Game Reviews & Ratings**:
  - 1 to 5 star rating picker with written feedback.
  - Strict business rule: reviews only permissible for completed sessions; duplicate reviews for the same booking are prevented.
- **Customer Support**:
  - File complaint tickets on facilities or bookings with status tracking (`open`, `resolved`).

### B. Facility Owner
- **Multi-Venue Management**:
  - Add, edit, and soft-delete multiple facilities under a single owner account.
  - Dynamic sports creation: define any sport (Pickleball, Futsal, Squash, Badminton, etc.) with custom hourly rates and rules.
  - Playing areas / courts configuration (Court 1, Court 2, Turf Pitch A, Pool Lanes).
  - Amenities selection (Parking, Showers, Locker Rooms, Floodlights, Cafeteria).
  - Operating hours and operating days configuration.
- **Interactive Map Location Picker**:
  - Interactive Leaflet map canvas inside the venue editor allowing owners to click to drop a precise marker, or use browser geolocation.
- **Availability & Slot Scheduler**:
  - **Bulk Slot Generator**: automatically generate recurring 1-hour slots across date ranges (3 to 30 days) and operating hours.
  - **Single Slot Creator**: publish individual custom slots.
  - **Court Maintenance Block**: 1-click toggle to block available slots for maintenance or private tournaments.
- **Unified Offline Walk-in Bookings**:
  - Record desk / phone walk-in reservations that lock the exact same availability slot engine, preventing online/offline scheduling conflicts.
- **Owner Analytics & Feedback**:
  - Real-time revenue counter from online and counter bookings.
  - Court occupancy rate (%) and total booking counters.
  - Customer review stream with ratings and comments.
  - Mark confirmed sessions as completed to enable customer review submission.

### C. Administrator
- **Platform Overview**:
  - System-wide KPIs: gross revenue, total players, total owners, active venues, pending submissions, and open dispute tickets.
- **Facility Approvals**:
  - Dedicated approval queue to inspect owner submissions and approve or reject venues.
- **User Governance**:
  - Search and filter all registered customers and owners.
  - 1-click account suspension / reactivation.
- **Review Moderation**:
  - Moderate community reviews with permanent removal for inappropriate content.
- **Dispute Resolution Desk**:
  - Review player complaints, write administrative resolution notes, and mark tickets resolved.
- **Transaction & Booking Audit Log**:
  - Platform-wide monitoring of all reservations and payments.

---

## 3. Project Directory Structure

```
PlayReserve/
├── backend/
│   ├── app/
│   │   ├── middleware/
│   │   │   └── auth.py            # JWT authentication & role-based decorator
│   │   ├── routes/
│   │   │   ├── __init__.py        # Blueprint package
│   │   │   ├── auth_routes.py     # Register, login, profile, password
│   │   │   ├── facility_routes.py # Discovery, CRUD, geospatial queries
│   │   │   ├── slot_routes.py     # Single & bulk slot generator, maintenance block
│   │   │   ├── booking_routes.py  # Atomic lock reservations, walk-ins, cancellations, receipts
│   │   │   ├── payment_routes.py  # Simulated payment processor & history
│   │   │   ├── review_routes.py   # Verified post-game reviews & moderation
│   │   │   ├── complaint_routes.py# Dispute & support ticket handling
│   │   │   └── admin_routes.py    # Platform KPIs, user suspension, approvals
│   │   ├── utils/
│   │   │   └── helpers.py         # JSON serialization, Haversine formula, responses
│   │   ├── config.py              # Environment configuration
│   │   └── __init__.py            # Flask app factory, CORS, MongoDB indexes
│   ├── .env                       # Environment variables
│   ├── requirements.txt           # Python dependencies
│   ├── run.py                     # Entry point for backend
│   ├── seed.py                    # Database seeder (Demo accounts & facilities)
│   └── test_suite.py              # Automated 30-step end-to-end integration test suite
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Header with quick role switcher & user dropdown
│   │   │   ├── Footer.jsx         # Rich platform footer
│   │   │   ├── Hero.jsx           # Landing hero with animated visual elements
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
│   │   ├── styles.css             # Forest Green design system & print styles
│   │   ├── App.jsx                # Root router & view coordinator
│   │   └── main.jsx               # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 4. Setup & Installation Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Community Server (running locally on port 27017 or MongoDB Atlas connection string)

### Backend Setup
1. Open terminal:
   ```bash
   cd backend
   ```
2. Activate your virtual environment (optional if Python packages are installed globally):
   - Windows PowerShell: `.\venv\Scripts\Activate.ps1`
   - Linux/macOS: `source venv/bin/activate`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify `.env` configuration:
   ```ini
   MONGO_URI=mongodb://127.0.0.1:27017/
   MONGO_DB=playreserve
   JWT_SECRET=playreserve_secret_key_2026_change_this
   FRONTEND_ORIGIN=http://localhost:5173
   ```
5. Seed demo accounts & facilities:
   ```bash
   python seed.py
   ```
6. Start backend server:
   ```bash
   python run.py
   ```
   *Health endpoint:* [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health)

### Frontend Setup
1. Open a second terminal:
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
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Pre-Configured Demo Accounts

**Password for all demo accounts:** `Demo@123`

| Role | Email | Capabilities to Test |
| :--- | :--- | :--- |
| **Player / Customer** | `player@playreserve.com` | Search venues, book slots, simulate payment, view/print receipts, cancel bookings, leave reviews. |
| **Facility Owner** | `owner@playreserve.com` | Add venues with map pin, run bulk slot generators, block maintenance slots, record walk-ins, mark bookings complete. |
| **Administrator** | `admin@playreserve.com` | View platform gross revenue, approve/reject pending facilities, suspend/activate accounts, resolve complaints. |
| **Customer 2** | `sneha@playreserve.com` | Secondary athlete account for testing concurrent bookings and reviews. |

*Quick Tip: Click the **⚡ Demo Logins** button in the top navigation bar or inside the login modal to sign in instantly with one click.*

---

## 6. Verification & Automated Test Suite

To run the automated 30-step end-to-end integration test suite:
```bash
cd backend
python test_suite.py
```

### Verified Test Cases:
1. Health Check status verification
2. Customer registration and JWT login
3. Facility Owner registration and login
4. Admin authentication and authorization
5. Customer profile and preferred sports updating
6. Dynamic sports creation (custom sports and rates)
7. Venue creation with Leaflet coordinates
8. Venue editing and soft-deletion
9. Admin approval queue and status toggle
10. Geospatial nearby search using MongoDB `2dsphere` index
11. Bulk slot generator engine (days and operating hours)
12. Single slot creation
13. Slot maintenance blocking and unblocking
14. Online booking with race-condition prevention
15. **Atomic double-booking rejection (HTTP 409 verified)**
16. Payment simulation with unique transaction ID generation
17. Official invoice and verified receipt retrieval
18. Offline walk-in booking using the same availability engine
19. Owner booking completion workflow
20. Post-game review submission after session completion
21. **Duplicate review prevention (HTTP 409 verified)**
22. Customer support dispute ticket filing
23. Administrative dispute resolution with notes
24. Community review moderation and deletion
25. User suspension and reactivation toggle
26. Self-service booking cancellation and slot release

---

## 7. Production Gateway Readiness & Limitations

- **Simulated Payment Gateway**: All payments are simulated for demo and assessment purposes without charging real credit cards. The architecture stores `transaction_id`, `gateway`, `payment_method`, and `status`. To connect real Razorpay:
  1. Add `razorpay` to `requirements.txt`.
  2. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`.
  3. Replace `simulated_razorpay` in `payment_routes.py` with `client.order.create()` and verify `razorpay_signature` in the webhook.
- **SMS / Email Alerts**: Currently displayed in-app via Toast notifications and printable receipts; can be connected to Twilio or SendGrid in production.
