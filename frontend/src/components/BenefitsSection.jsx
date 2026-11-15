import React from 'react';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Receipt, 
  TrendingUp, 
  CalendarRange, 
  UserCheck, 
  Headphones 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BenefitsSection({ onOpenOwnerAuth, onOpenOwnerWorkspace }) {
  const { isAuthenticated, role } = useAuth();
  const playerBenefits = [
    {
      icon: <Clock size={20} />,
      title: 'Real-Time Live Availability',
      desc: 'No more calling venues to ask if courts are free. Live slot availability at your fingertips.'
    },
    {
      icon: <ShieldCheck size={20} />,
      title: 'Atomic Lock Guarantee',
      desc: 'High-concurrency locking ensures two players can never book the same slot at the same time.'
    },
    {
      icon: <MapPin size={20} />,
      title: 'Geospatial Discovery',
      desc: 'Pinpoint venues on interactive Leaflet maps with distance calculations and turn-by-turn directions.'
    },
    {
      icon: <Receipt size={20} />,
      title: 'Printable Verified Invoices',
      desc: 'Instant booking receipts with transaction IDs for corporate reimbursement and tournament registrations.'
    }
  ];

  const ownerBenefits = [
    {
      icon: <CalendarRange size={20} />,
      title: 'Unified Online & Offline Bookings',
      desc: 'Manage telephone walk-ins and app bookings in one synchronized calendar.'
    },
    {
      icon: <TrendingUp size={20} />,
      title: 'Maximize Court Occupancy',
      desc: 'Turn off-peak hours into revenue with dynamic sports creation and custom hourly pricing.'
    },
    {
      icon: <UserCheck size={20} />,
      title: 'Automated Slot Generators',
      desc: 'Generate months of operational slots in one click with built-in maintenance block controls.'
    },
    {
      icon: <Headphones size={20} />,
      title: 'Dedicated Admin Moderation',
      desc: 'Verified customer reviews and transparent complaint handling to protect venue reputations.'
    }
  ];

  return (
    <section className="benefits-section" id="benefits">
      <div className="section-head text-center">
        <span className="section-kicker">WHY SPORTSYNC</span>
        <h2 className="section-heading">Built for athletes. Engineered for venue owners.</h2>
      </div>

      <div className="benefits-duo-grid">
        {/* For Players */}
        <div className="benefit-category-card">
          <div className="cat-badge">FOR ATHLETES & PLAYERS</div>
          <h3>Find your match without friction</h3>
          <p>Skip phone calls and cash-only bookings. Reserve court time anytime, anywhere.</p>

          <div className="benefit-items-list">
            {playerBenefits.map((b, i) => (
              <div key={i} className="benefit-item">
                <div className="benefit-icon-box">{b.icon}</div>
                <div>
                  <h4>{b.title}</h4>
                  <p>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* For Venue Owners */}
        <div className="benefit-category-card highlight">
          <div className="cat-badge owner-badge">FOR SPORTS FACILITY OWNERS</div>
          <h3>Grow your sports business</h3>
          <p>Put your facility on the map and streamline court reservations effortlessly.</p>

          <div className="benefit-items-list">
            {ownerBenefits.map((b, i) => (
              <div key={i} className="benefit-item">
                <div className="benefit-icon-box owner-icon">{b.icon}</div>
                <div>
                  <h4>{b.title}</h4>
                  <p>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="owner-cta-banner">
            <button 
              className="btn-white-solid" 
              onClick={() => {
                if (isAuthenticated && (role === 'owner' || role === 'admin')) {
                  if (onOpenOwnerWorkspace) onOpenOwnerWorkspace();
                } else {
                  if (onOpenOwnerAuth) onOpenOwnerAuth();
                }
              }}
            >
              {isAuthenticated && (role === 'owner' || role === 'admin') 
                ? 'Open Owner Workspace →' 
                : 'List Your Sports Venue Now →'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
