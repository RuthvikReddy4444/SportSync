import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  MapPin, 
  Star, 
  Clock, 
  Calendar, 
  Phone, 
  ExternalLink, 
  ShieldCheck, 
  ChevronRight,
  Layers,
  MessageSquare,
  Filter,
  Check,
  CheckCircle2,
  Lock,
  Flame,
  Award
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function FacilityModal({ 
  facility, 
  onClose, 
  onStartBooking 
}) {
  const { isAuthenticated, role, openAuth, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('slots'); // 'slots' | 'info' | 'reviews'
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Sports & Court filters for player
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedCourt, setSelectedCourt] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'available' | 'booked'

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Helper for sport emoji
  const getSportIcon = (sportName = '') => {
    const s = String(sportName).toLowerCase();
    if (s.includes('badminton')) return '🏸';
    if (s.includes('cricket')) return '🏏';
    if (s.includes('football') || s.includes('soccer')) return '⚽';
    if (s.includes('tennis')) return '🎾';
    if (s.includes('basket')) return '🏀';
    if (s.includes('volley')) return '🏐';
    if (s.includes('swim')) return '🏊';
    if (s.includes('table') || s.includes('tt') || s.includes('pickle')) return '🏓';
    if (s.includes('squash')) return '🎾';
    return '🏅';
  };

  // Sync selectedSport when facility loads
  useEffect(() => {
    if (facility?.sports && facility.sports.length > 0) {
      // Default to first sport of the facility
      setSelectedSport(facility.sports[0].name);
    } else {
      setSelectedSport('');
    }
    setSelectedCourt('all');
  }, [facility]);

  // Fetch slots whenever facility or date changes
  useEffect(() => {
    if (!facility?._id) return;

    setLoadingSlots(true);
    // Request all slots (available + booked) to show complete availability counts
    api(`/slots?facility_id=${facility._id}&date=${selectedDate}&include_all=true`)
      .then(res => {
        setSlots(res.slots || []);
      })
      .catch(err => {
        console.error(err);
        setSlots([]);
      })
      .finally(() => setLoadingSlots(false));

    // Load reviews
    setLoadingReviews(true);
    api(`/facilities/${facility._id}/reviews`)
      .then(res => setReviews(res.reviews || []))
      .catch(err => console.error(err))
      .finally(() => setLoadingReviews(false));
  }, [facility, selectedDate]);

  if (!facility) return null;

  const defaultImg = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80';
  const images = facility.images && facility.images.length > 0 ? facility.images : [defaultImg];
  const [lat, lng] = facility.location?.coordinates ? [facility.location.coordinates[1], facility.location.coordinates[0]] : [17.9689, 79.5941];

  const formatSlotTime = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSlotClick = (slot) => {
    if (slot.status !== 'available') {
      showToast('This slot is already booked or reserved.', 'info');
      return;
    }
    if (!isAuthenticated) {
      showToast('Please log in as a player to book a slot.', 'info');
      openAuth('login');
      return;
    }
    if (role !== 'customer') {
      showToast('Please switch to a Customer / Player account to book online.', 'error');
      return;
    }
    onStartBooking(slot, facility);
  };

  // Facility sports list
  const facilitySports = facility.sports && facility.sports.length > 0
    ? facility.sports
    : Array.from(new Set(slots.map(s => s.sport).filter(Boolean))).map(s => ({ name: s, price_per_hour: 400 }));

  // Filter slots by selected sport
  const currentSport = selectedSport || (facilitySports[0]?.name || '');
  const sportSlots = slots.filter(s => {
    if (!currentSport) return true;
    return String(s.sport || '').toLowerCase() === currentSport.toLowerCase();
  });

  // Extract courts available for this sport
  const courtsForSport = Array.from(
    new Set([
      ...sportSlots.map(s => s.playing_area).filter(Boolean),
      ...(facility.playing_areas || []).filter(area => {
        if (!currentSport) return true;
        return area.toLowerCase().includes(currentSport.toLowerCase()) || 
               (!area.toLowerCase().includes('court') && !area.toLowerCase().includes('pitch'));
      })
    ])
  );

  // Filter by selected court if not 'all'
  const courtFilteredSlots = selectedCourt === 'all'
    ? sportSlots
    : sportSlots.filter(s => s.playing_area === selectedCourt);

  // Compute available & unavailable counts for currently active sport and court selection
  const availableSlotsCount = courtFilteredSlots.filter(s => s.status === 'available').length;
  const unavailableSlotsCount = courtFilteredSlots.filter(s => s.status !== 'available').length;

  // Final slots list based on status view filter
  const displayedSlots = courtFilteredSlots.filter(s => {
    if (statusFilter === 'available') return s.status === 'available';
    if (statusFilter === 'booked') return s.status !== 'available';
    return true;
  });

  // Quick date chips
  const quickDateChips = [0, 1, 2, 3, 4, 5, 6].map(offset => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = offset === 0;
    const isTomorrow = offset === 1;
    const dayName = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { dateStr, dayName, monthDay };
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-facility" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} title="Close">
          <X size={20} />
        </button>

        {/* Media Banner */}
        <div className="facility-modal-banner">
          <img src={images[0]} alt={facility.name} />
          <div className="banner-overlay">
            <span className="banner-badge">
              <Star size={14} className="star-icon" /> {facility.avg_rating ? facility.avg_rating.toFixed(1) : 'New'} ({facility.review_count || 0} reviews)
            </span>
            <h2>{facility.name}</h2>
            <p className="banner-location">
              <MapPin size={15} /> {facility.address?.street ? `${facility.address.street}, ` : ''}{facility.address?.locality}, {facility.address?.city}, {facility.address?.state}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="facility-tabs-bar">
          <button 
            className={`tab-btn ${activeTab === 'slots' ? 'active' : ''}`}
            onClick={() => setActiveTab('slots')}
          >
            <Calendar size={15} /> Available Slots
          </button>
          <button 
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <Layers size={15} /> Facility & Amenities
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <MessageSquare size={15} /> Reviews ({reviews.length})
          </button>

          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
            target="_blank" 
            rel="noreferrer"
            className="directions-link-btn"
          >
            <ExternalLink size={14} /> Open Directions
          </a>
        </div>

        {/* Tab Contents */}
        <div className="modal-content-scroll">
          {activeTab === 'slots' && (
            <div className="tab-pane slots-pane">
              
              {/* 1. SELECT AVAILABLE SPORT (REQUIRED BY PLAYER) */}
              <div className="player-sport-selection-box">
                <div className="sport-section-header">
                  <div className="header-text-group">
                    <span className="step-badge">STEP 1</span>
                    <h4>Select Sport to Play</h4>
                  </div>
                  <span className="sport-selection-hint">
                    Choose a sport to view its courts & live slots
                  </span>
                </div>

                <div className="player-sports-grid">
                  {facilitySports.map((sp) => {
                    const isSelected = currentSport?.toLowerCase() === sp.name?.toLowerCase();
                    return (
                      <button
                        key={sp.name}
                        type="button"
                        className={`player-sport-card ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedSport(sp.name);
                          setSelectedCourt('all');
                        }}
                      >
                        <div className="sport-card-top-icon">
                          <span className="sport-emoji-large">{getSportIcon(sp.name)}</span>
                          {isSelected && (
                            <span className="sport-check-badge">
                              <Check size={12} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div className="sport-card-details">
                          <span className="sport-title-name">{sp.name}</span>
                          <span className="sport-rate-pill">
                            ₹{sp.price_per_hour || 400}<small>/hr</small>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. DATE & COURT SELECTION TOOLBAR */}
              <div className="player-date-court-toolbar">
                <div className="toolbar-top-row">
                  {/* Date Input */}
                  <div className="player-date-input-group">
                    <Calendar size={18} className="player-date-icon" />
                    <div className="date-field-inner">
                      <span className="date-field-label">Booking Date</span>
                      <input 
                        type="date"
                        value={selectedDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="player-date-control"
                      />
                    </div>
                  </div>

                  {/* Quick Dates Carousel */}
                  <div className="player-quick-dates-carousel">
                    {quickDateChips.map(q => {
                      const isSelected = selectedDate === q.dateStr;
                      return (
                        <button
                          key={q.dateStr}
                          type="button"
                          className={`player-quick-date-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedDate(q.dateStr)}
                        >
                          <span className="quick-chip-day">{q.dayName}</span>
                          <span className="quick-chip-date">{q.monthDay}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Court Filter Selection */}
                {courtsForSport.length > 0 && (
                  <div className="player-courts-bar">
                    <span className="courts-bar-title">
                      <Layers size={13} /> Select Court:
                    </span>
                    <div className="court-chips-list">
                      <button
                        type="button"
                        className={`court-chip-btn ${selectedCourt === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedCourt('all')}
                      >
                        🏟️ All Courts ({sportSlots.length})
                      </button>
                      {courtsForSport.map(courtName => {
                        const count = sportSlots.filter(s => s.playing_area === courtName).length;
                        return (
                          <button
                            key={courtName}
                            type="button"
                            className={`court-chip-btn ${selectedCourt === courtName ? 'active' : ''}`}
                            onClick={() => setSelectedCourt(courtName)}
                          >
                            {courtName} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. AVAILABILITY & UNAVAILABILITY COUNTER STATUS BAR */}
              <div className="slot-availability-status-bar">
                <div className="counter-chips-wrap">
                  <div className="avail-counter-chip available">
                    <span className="status-dot green-dot"></span>
                    <span className="counter-label">Available Slots:</span>
                    <b className="counter-num">{availableSlotsCount}</b>
                  </div>
                  <div className="avail-counter-chip unavailable">
                    <span className="status-dot red-dot"></span>
                    <span className="counter-label">Booked / Unavailable:</span>
                    <b className="counter-num">{unavailableSlotsCount}</b>
                  </div>
                  <span className="sport-context-badge">
                    Showing {currentSport} slots
                  </span>
                </div>

                {/* Filter toggle if both available and unavailable exist */}
                {sportSlots.length > 0 && (
                  <div className="status-view-toggle">
                    <button
                      type="button"
                      className={`view-pill ${statusFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('all')}
                    >
                      All ({courtFilteredSlots.length})
                    </button>
                    <button
                      type="button"
                      className={`view-pill ${statusFilter === 'available' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('available')}
                    >
                      🟢 Available ({availableSlotsCount})
                    </button>
                    {unavailableSlotsCount > 0 && (
                      <button
                        type="button"
                        className={`view-pill ${statusFilter === 'booked' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('booked')}
                      >
                        🔴 Booked ({unavailableSlotsCount})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 4. SLOTS GRID */}
              {loadingSlots ? (
                <div className="loader-box">Loading available time slots for {currentSport}...</div>
              ) : displayedSlots.length > 0 ? (
                <div className="slots-grid">
                  {displayedSlots.map(s => {
                    const isAvailable = s.status === 'available';
                    return (
                      <div 
                        key={s._id} 
                        className={`slot-card-interactive ${isAvailable ? 'available' : 'unavailable'}`}
                        onClick={() => isAvailable ? handleSlotClick(s) : null}
                        title={isAvailable ? `Click to book this ${s.sport} slot` : `This slot has already been booked by another player`}
                      >
                        <div className="slot-card-top">
                          <div className="slot-time-badge">
                            <Clock size={15} className="slot-clock-icon" />
                            <span className="slot-time-range">{formatSlotTime(s.start_at)} – {formatSlotTime(s.end_at)}</span>
                          </div>
                          {isAvailable ? (
                            <span className="slot-duration-pill">1 hr</span>
                          ) : (
                            <span className="slot-status-pill booked">
                              <Lock size={10} /> Booked
                            </span>
                          )}
                        </div>

                        <div className="slot-tags-row">
                          <span className="slot-sport-tag">
                            {getSportIcon(s.sport)} {s.sport || currentSport}
                          </span>
                          <span className="slot-area-tag">
                            🏟️ {s.playing_area || 'Court 1'}
                          </span>
                        </div>

                        <div className="slot-footer-row">
                          <div className="slot-price-wrap">
                            <span className="slot-price-val">₹{s.price}</span>
                            <span className="slot-price-period">/ session</span>
                          </div>
                          {isAvailable ? (
                            <button type="button" className="slot-book-btn">
                              <span>Book Now</span>
                              <ChevronRight size={14} />
                            </button>
                          ) : (
                            <span className="slot-reserved-pill">
                              Unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-slots-state">
                  <div className="empty-icon-circle">
                    <Calendar size={28} />
                  </div>
                  <h4>No {currentSport} Slots for this Selection</h4>
                  <p>
                    {availableSlotsCount === 0 && unavailableSlotsCount > 0
                      ? `All ${currentSport} slots are fully booked on this date. Check tomorrow or pick another sport!`
                      : `No slots currently scheduled for ${currentSport} on ${selectedDate}. Try selecting another day below.`}
                  </p>
                  <button 
                    type="button" 
                    className="btn-check-tomorrow"
                    onClick={() => {
                      const d = new Date(selectedDate);
                      d.setDate(d.getDate() + 1);
                      setSelectedDate(d.toISOString().split('T')[0]);
                    }}
                  >
                    Check Next Day's Slots →
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="tab-pane info-pane">
              <div className="info-block">
                <h4>About the Venue</h4>
                <p>{facility.description || 'Modern athletic facility offering top-tier courts and equipment.'}</p>
                {facility.phone && (
                  <p className="phone-line">
                    <Phone size={14} /> <b>Contact:</b> {facility.phone}
                  </p>
                )}
                <p className="hours-line">
                  <Clock size={14} /> <b>Hours:</b> {facility.opening_time || '06:00'} – {facility.closing_time || '23:00'}
                </p>
              </div>

              <div className="info-block">
                <h4>Available Sports & Hourly Pricing</h4>
                <div className="sports-pricing-table">
                  {facility.sports?.map((s, idx) => (
                    <div key={idx} className="sport-price-row">
                      <div className="sport-info-cell">
                        <span className="sport-cell-emoji">{getSportIcon(s.name)}</span>
                        <div>
                          <strong>{s.name}</strong>
                          {s.description && <small>{s.description}</small>}
                        </div>
                      </div>
                      <span className="price-val">₹{s.price_per_hour} / hr</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="info-block">
                <h4>Playing Areas & Courts</h4>
                <div className="areas-chip-list">
                  {facility.playing_areas?.map((a, idx) => (
                    <span key={idx} className="area-badge">
                      🏟️ {a}
                    </span>
                  ))}
                </div>
              </div>

              <div className="info-block">
                <h4>Amenities</h4>
                <div className="amenities-grid">
                  {facility.amenities?.map((amenity, idx) => (
                    <div key={idx} className="amenity-item">
                      <ShieldCheck size={15} /> {amenity}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="tab-pane reviews-pane">
              <div className="reviews-summary-card">
                <div className="summary-score">
                  <b>{facility.avg_rating ? facility.avg_rating.toFixed(1) : 'New'}</b>
                  <div className="stars-row">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        size={16} 
                        className={star <= Math.round(facility.avg_rating || 0) ? 'star-filled' : 'star-empty'} 
                      />
                    ))}
                  </div>
                  <span>{reviews.length} player reviews</span>
                </div>
                <div className="summary-note">
                  <p>Reviews are verified and submitted only by customers with completed bookings.</p>
                </div>
              </div>

              {loadingReviews ? (
                <div className="loader-box">Loading player reviews...</div>
              ) : reviews.length > 0 ? (
                <div className="reviews-list">
                  {reviews.map(r => (
                    <div key={r._id} className="review-card">
                      <div className="review-head">
                        <div className="reviewer-info">
                          <b>{r.user_name || 'Verified Player'}</b>
                          <small>{new Date(r.created_at).toLocaleDateString([], { dateStyle: 'medium' })}</small>
                        </div>
                        <div className="review-stars">
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </div>
                      </div>
                      <p className="review-comment">{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-card">
                  <p>No reviews yet for this venue.</p>
                  <small>Be the first player to book, play, and leave a review!</small>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
