import React from 'react';
import { LocateFixed, ArrowRight, ShieldCheck, Zap, Users, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Hero({ onLocate, facilityCount = 5, onOpenOwnerWorkspace }) {
  const { openAuth, isAuthenticated, role, showToast } = useAuth();

  const handleOwnerWorkspaceClick = () => {
    if (!isAuthenticated) {
      openAuth('login', 'owner');
      showToast('Please sign in to access Owner Workspace. Use the 1-click Demo Owner button!', 'info');
      return;
    }
    if (role === 'owner' || role === 'admin') {
      if (onOpenOwnerWorkspace) {
        onOpenOwnerWorkspace();
      }
    } else {
      openAuth('login', 'owner');
      showToast('You are currently signed in as a Player. Sign in as Facility Owner to access this workspace.', 'info');
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-badge">
          <Zap size={14} /> SPORTSYNC · UNIFIED SPORTS BOOKING SYSTEM
        </div>
        <h1 className="hero-title">
          Book sports venues.<br />
          <span>Play without limits.</span>
        </h1>
        <p className="hero-subtitle">
          Discover vetted badminton courts, cricket turfs, football pitches, swimming pools, 
          and tennis academies across your city. Real-time availability, zero double-booking, 
          and instant confirmation.
        </p>

        <div className="hero-cta-group">
          <button className="btn-primary-big" onClick={onLocate}>
            <LocateFixed size={18} /> Find Facilities Near Me
          </button>
          
          <button 
            type="button"
            className="btn-secondary-big" 
            onClick={handleOwnerWorkspaceClick}
          >
            {isAuthenticated && (role === 'owner' || role === 'admin') 
              ? 'Owner Workspace' 
              : 'List Your Facility'} <ArrowRight size={16} />
          </button>
        </div>

        <div className="hero-trust-metrics">
          <div className="metric-item">
            <strong>{facilityCount}+</strong>
            <span>Verified Facilities</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <strong>100%</strong>
            <span>Simulated Payments</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <strong>Zero</strong>
            <span>Double Bookings</span>
          </div>
        </div>
      </div>

      <div className="hero-visual-container">
        <div className="visual-circle-decor"></div>
        <div className="sports-court-card">
          <div className="court-inner-lines">
            <div className="court-circle"></div>
          </div>
        </div>

        <div className="floating-card card-top-right">
          <div className="floating-icon">🎾</div>
          <div>
            <b>Synthetic Courts</b>
            <small>Yonex mats & LED lighting</small>
          </div>
        </div>

        <div className="floating-card card-bottom-left">
          <div className="floating-icon">⚡</div>
          <div>
            <b>Instant Slot Lock</b>
            <small>Atomic reservation engine</small>
          </div>
        </div>

        <div className="hero-ball"></div>
      </div>
    </section>
  );
}
