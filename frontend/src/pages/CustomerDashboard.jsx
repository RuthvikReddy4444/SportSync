import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Receipt, 
  Star, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  CheckCircle,
  HelpCircle,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';
import ReviewModal from '../components/ReviewModal';
import ComplaintModal from '../components/ComplaintModal';

export default function CustomerDashboard({ setPage }) {
  const { user, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'complaints'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [receiptBookingId, setReceiptBookingId] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [complaintTarget, setComplaintTarget] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api('/bookings/mine');
      setBookings(res.bookings || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const res = await api('/complaints/mine');
      setComplaints(res.complaints || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    if (activeTab === 'complaints') {
      fetchComplaints();
    }
  }, [activeTab]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? The slot will be released.')) {
      return;
    }

    try {
      const res = await api(`/bookings/${bookingId}/cancel`, { method: 'PATCH' });
      showToast(res.message || 'Booking cancelled.', 'success');
      fetchBookings();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  return (
    <div className="dashboard-page customer-dashboard">
      <div className="dashboard-hero-banner">
        <div className="dash-hero-content">
          <span className="section-kicker">ATHLETE PORTAL</span>
          <h1>My Bookings & Activity</h1>
          <p>View confirmed reservations, print official receipts, and review venues you've played at.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="dash-nav-bar">
        <button 
          className={`dash-tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <CalendarDays size={16} /> My Reservations ({bookings.length})
        </button>
        <button 
          className={`dash-tab ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          <HelpCircle size={16} /> Support Tickets & Issues
        </button>
      </div>

      <div className="dash-body-content">
        {activeTab === 'bookings' && (
          <div className="bookings-section">
            {/* Filter pills */}
            <div className="status-filter-pills">
              <label>Filter Status:</label>
              {['all', 'confirmed', 'completed', 'pending_payment', 'cancelled'].map(st => (
                <button
                  key={st}
                  className={`status-pill ${statusFilter === st ? 'active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="loader-box large">Loading your reservations...</div>
            ) : filteredBookings.length > 0 ? (
              <div className="bookings-grid">
                {filteredBookings.map(b => {
                  const isUpcoming = b.status === 'confirmed';
                  const isCompleted = b.status === 'completed';
                  const isPending = b.status === 'pending_payment';
                  const isCancelled = b.status === 'cancelled';

                  return (
                    <div key={b._id} className={`booking-record-card ${b.status}`}>
                      <div className="record-head">
                        <div className="venue-meta">
                          <h3>{b.facility?.name || 'Sports Venue'}</h3>
                          <p className="locality">
                            <MapPin size={13} /> {b.facility?.address?.locality}, {b.facility?.address?.city}
                          </p>
                        </div>
                        <span className={`badge-status ${b.status}`}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="record-mid-schedule">
                        <div className="sched-item">
                          <label>SPORT & COURT</label>
                          <b>{b.sport || 'Sports'} · {b.playing_area || 'Court'}</b>
                        </div>
                        <div className="sched-item">
                          <label>TIMING</label>
                          <b>
                            {b.slot?.start_at ? new Date(b.slot.start_at).toLocaleDateString([], { dateStyle: 'medium' }) : ''}
                            {' · '}
                            {b.slot?.start_at ? new Date(b.slot.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </b>
                        </div>
                        <div className="sched-item">
                          <label>AMOUNT</label>
                          <b className="price-green">₹{b.amount}</b>
                        </div>
                      </div>

                      <div className="record-actions-footer">
                        {/* Receipt Button */}
                        <button 
                          className="btn-action-outline"
                          onClick={() => setReceiptBookingId(b._id)}
                          title="Print or view receipt"
                        >
                          <Receipt size={14} /> View Receipt
                        </button>

                        {/* Review Button for completed bookings */}
                        {isCompleted && (
                          <button
                            className={`btn-action-outline ${b.has_reviewed ? 'disabled' : 'highlight-review'}`}
                            onClick={() => !b.has_reviewed && setReviewBooking(b)}
                            disabled={b.has_reviewed}
                          >
                            <Star size={14} /> {b.has_reviewed ? 'Reviewed ✓' : 'Leave a Review'}
                          </button>
                        )}

                        {/* Cancel Button */}
                        {(isUpcoming || isPending) && (
                          <button 
                            className="btn-action-danger"
                            onClick={() => handleCancelBooking(b._id)}
                          >
                            <XCircle size={14} /> Cancel
                          </button>
                        )}

                        {/* Complaint button */}
                        <button
                          className="btn-action-link"
                          onClick={() => setComplaintTarget({ bookingId: b._id, facilityId: b.facility_id })}
                          title="Report problem with this booking"
                        >
                          <AlertTriangle size={13} /> Help
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-dashboard-state">
                <CalendarDays size={42} />
                <h3>No bookings found in this status</h3>
                <p>Ready to hit the courts? Explore vetted sports facilities and book a live slot now.</p>
                <button className="btn-solid" onClick={() => setPage('home')}>
                  Discover Venues →
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="complaints-section">
            <div className="section-head-with-action">
              <div>
                <h3>Support Tickets & Inquiries</h3>
                <p>Track the resolution status of reported facility or booking issues.</p>
              </div>
              <button 
                className="btn-solid"
                onClick={() => setComplaintTarget({})}
              >
                + New Support Ticket
              </button>
            </div>

            {loadingComplaints ? (
              <div className="loader-box">Loading support tickets...</div>
            ) : complaints.length > 0 ? (
              <div className="complaints-list">
                {complaints.map(c => (
                  <div key={c._id} className="complaint-card">
                    <div className="complaint-head">
                      <div>
                        <b>{c.subject}</b>
                        <small className="cat-tag">{c.category?.replace('_', ' ')}</small>
                      </div>
                      <span className={`complaint-status ${c.status}`}>
                        {c.status?.toUpperCase()}
                      </span>
                    </div>
                    <p className="complaint-desc">{c.description}</p>
                    {c.admin_notes && (
                      <div className="admin-resolution-note">
                        <strong>Support Team Response:</strong> {c.admin_notes}
                      </div>
                    )}
                    <small className="timestamp">
                      Submitted on {new Date(c.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-card">
                <p>You have not filed any support tickets or complaints.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {receiptBookingId && (
        <ReceiptModal
          bookingId={receiptBookingId}
          onClose={() => setReceiptBookingId(null)}
        />
      )}

      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onReviewSubmitted={() => {
            fetchBookings();
          }}
        />
      )}

      {complaintTarget && (
        <ComplaintModal
          bookingId={complaintTarget.bookingId}
          facilityId={complaintTarget.facilityId}
          onClose={() => setComplaintTarget(null)}
          onSubmitted={() => {
            fetchComplaints();
          }}
        />
      )}
    </div>
  );
}
