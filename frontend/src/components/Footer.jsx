import React from 'react';
import { MapPin, Phone, Mail, Shield, CheckCircle, Trophy } from 'lucide-react';

export default function Footer({ setPage, onSelectSport }) {
  const sports = [
    'Badminton', 'Cricket', 'Football', 'Tennis', 
    'Basketball', 'Swimming', 'Pickleball', 'Table Tennis'
  ];

  return (
    <footer className="platform-footer">
      <div className="footer-container">
        <div className="footer-col brand-col">
          <div className="footer-brand">
            <span className="brand-badge">⚡</span>
            <h3>SportSync</h3>
          </div>
          <p className="brand-desc">
            The Unified Sports Booking System empowering players to discover, schedule, 
            and reserve courts with real-time atomic availability and zero double-bookings.
          </p>
          <div className="brand-trust">
            <span><Shield size={14} /> Verified Venues</span>
            <span><CheckCircle size={14} /> Instant Slot Confirmations</span>
          </div>
        </div>

        <div className="footer-col">
          <h4>Popular Sports</h4>
          <ul className="footer-links">
            {sports.map(s => (
              <li key={s}>
                <a 
                  href="#sports" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (onSelectSport) onSelectSport(s);
                  }}
                >
                  {s} Courts & Turfs
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h4>Platform Navigation</h4>
          <ul className="footer-links">
            <li><a href="#discover" onClick={() => setPage('home')}>Find Sports Venues</a></li>
            <li><a href="#how-it-works">How SportSync Works</a></li>
            <li><a href="#benefits">For Venue Owners</a></li>
            <li><a href="#near-me">Nearby Map Search</a></li>
          </ul>
        </div>

        <div className="footer-col contact-col">
          <h4>Contact & Location</h4>
          <p><MapPin size={14} /> Balasamudram Road, Hanamkonda / Hyderabad, Telangana</p>
          <p><Phone size={14} /> +91 98765 43210 (Support Desk)</p>
          <p><Mail size={14} /> support@sportsync.com</p>
          <div className="cert-note">
            <Trophy size={14} /> SportSync MVP — Unified Sports Booking System
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 SportSync Technologies. All rights reserved.</p>
        <div className="footer-legal">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Security & Cancellations</span>
        </div>
      </div>
    </footer>
  );
}
