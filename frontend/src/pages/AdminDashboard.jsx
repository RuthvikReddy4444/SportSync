import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Building, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  Check, 
  X, 
  UserX, 
  UserCheck, 
  Trash2, 
  Search, 
  Eye, 
  Filter,
  BarChart2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';

export default function AdminDashboard() {
  const { user, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'approvals', 'users', 'bookings', 'complaints', 'reviews'

  // Summary KPIs
  const [summary, setSummary] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [complaintsList, setComplaintsList] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [facilityStatusFilter, setFacilityStatusFilter] = useState('');

  // Complaint resolution modal
  const [resolvingComplaint, setResolvingComplaint] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Receipt Modal
  const [viewReceiptId, setViewReceiptId] = useState(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [sumRes, facRes, uRes, bRes, cRes, rRes] = await Promise.all([
        api('/admin/summary'),
        api('/admin/facilities'),
        api('/admin/users'),
        api('/admin/bookings'),
        api('/admin/complaints'),
        api('/owner/reviews') // admin gets all reviews
      ]);

      setSummary(sumRes.summary || {});
      setFacilities(facRes.facilities || []);
      setUsersList(uRes.users || []);
      setBookingsList(bRes.bookings || []);
      setComplaintsList(cRes.complaints || []);
      setReviewsList(rRes.reviews || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // 1. Facility Approval / Rejection
  const handleApproveFacility = async (fid, decision) => {
    try {
      const res = await api(`/admin/facilities/${fid}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ status: decision })
      });
      showToast(res.message, 'success');
      loadAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 2. User Suspension / Activation Toggle
  const handleToggleUserStatus = async (uid) => {
    try {
      const res = await api(`/admin/users/${uid}/status`, { method: 'PATCH' });
      showToast(res.message, 'success');
      loadAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 3. Review Moderation / Removal
  const handleDeleteReview = async (rid) => {
    if (!window.confirm('Delete this review permanently from the platform?')) return;
    try {
      const res = await api(`/admin/reviews/${rid}`, { method: 'DELETE' });
      showToast(res.message, 'success');
      loadAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 4. Complaint Resolution
  const handleResolveComplaint = async (e) => {
    e.preventDefault();
    if (!resolvingComplaint) return;
    try {
      const res = await api(`/admin/complaints/${resolvingComplaint._id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'resolved',
          admin_notes: resolutionNotes
        })
      });
      showToast(res.message, 'success');
      setResolvingComplaint(null);
      setResolutionNotes('');
      loadAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Filter users
  const filteredUsers = usersList.filter(u => {
    if (userRoleFilter && u.role !== userRoleFilter) return false;
    if (userSearch) {
      const s = userSearch.toLowerCase();
      return (
        u.name?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.phone?.includes(s)
      );
    }
    return true;
  });

  const pendingFacilities = facilities.filter(f => f.status === 'pending');

  return (
    <div className="dashboard-page admin-dashboard">
      <div className="dashboard-hero-banner admin-banner">
        <div className="dash-hero-content">
          <span className="section-kicker">SYSTEM CONTROL & GOVERNANCE</span>
          <h1>Platform Administration</h1>
          <p>
            Monitor live platform metrics, review and approve sports facilities, manage user accounts, and resolve dispute tickets.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="dash-nav-bar">
        <button 
          className={`dash-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart2 size={16} /> Platform Metrics
        </button>
        <button 
          className={`dash-tab ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          <Building size={16} /> Facility Queue {pendingFacilities.length > 0 && <span className="tab-counter-badge">{pendingFacilities.length}</span>}
        </button>
        <button 
          className={`dash-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} /> User Management ({usersList.length})
        </button>
        <button 
          className={`dash-tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <Calendar size={16} /> Bookings & Audit
        </button>
        <button 
          className={`dash-tab ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          <AlertTriangle size={16} /> Support & Disputes ({complaintsList.filter(c => c.status === 'open').length})
        </button>
        <button 
          className={`dash-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <ShieldCheck size={16} /> Review Moderation
        </button>
      </div>

      <div className="dash-body-content">
        {/* 1. Overview KPIs */}
        {activeTab === 'overview' && summary && (
          <div className="admin-overview-section">
            <div className="kpi-cards-grid">
              <div className="kpi-card green-kpi">
                <div className="kpi-icon"><DollarSign size={24} /></div>
                <div>
                  <label>Gross Platform Revenue</label>
                  <b>₹{summary.revenue?.toLocaleString('en-IN') || 0}</b>
                  <small>Processed across all venues</small>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon"><Users size={24} /></div>
                <div>
                  <label>Registered Users</label>
                  <b>{summary.users}</b>
                  <small>{summary.customers} players · {summary.owners} venue owners</small>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon"><Building size={24} /></div>
                <div>
                  <label>Total Facilities</label>
                  <b>{summary.facilities}</b>
                  <small>{summary.approved} active · {summary.pending} pending approval</small>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon"><Calendar size={24} /></div>
                <div>
                  <label>Total Bookings</label>
                  <b>{summary.bookings}</b>
                  <small>{summary.confirmed_bookings} confirmed · {summary.completed_bookings} completed</small>
                </div>
              </div>
            </div>

            {/* Pending Approvals Warning Banner */}
            {pendingFacilities.length > 0 && (
              <div className="alert-action-banner" onClick={() => setActiveTab('approvals')}>
                <AlertTriangle size={20} />
                <div>
                  <b>{pendingFacilities.length} facility submission(s) awaiting your decision!</b>
                  <p>Click here to review details and approve or reject.</p>
                </div>
                <button className="btn-solid-sm">Review Submissions →</button>
              </div>
            )}
          </div>
        )}

        {/* 2. Facility Approvals Queue */}
        {activeTab === 'approvals' && (
          <div className="admin-approvals-section">
            <div className="section-head">
              <h3>Facility Approval & Moderation Queue</h3>
              <p>Review owner submissions, inspect sport configurations, and approve or reject.</p>
            </div>

            <div className="approvals-cards-list">
              {facilities.map(fac => (
                <div key={fac._id} className={`approval-card-item ${fac.status}`}>
                  <div className="app-card-top">
                    <div>
                      <h4>{fac.name}</h4>
                      <p className="app-loc">
                        {fac.address?.locality}, {fac.address?.city}, {fac.address?.state}
                      </p>
                      {fac.owner_name && (
                        <small className="app-owner">Owner: {fac.owner_name} ({fac.owner_email})</small>
                      )}
                    </div>
                    <span className={`status-badge-capsule ${fac.status}`}>
                      {fac.status?.toUpperCase()}
                    </span>
                  </div>

                  <p className="app-desc">{fac.description}</p>

                  <div className="app-details-grid">
                    <div>
                      <label>SPORTS CONFIGURED</label>
                      <div className="tags-row">
                        {fac.sports?.map((s, idx) => (
                          <span key={idx} className="spec-tag">{s.name} (₹{s.price_per_hour}/hr)</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label>PLAYING AREAS</label>
                      <div className="tags-row">
                        {fac.playing_areas?.map((a, idx) => (
                          <span key={idx} className="spec-tag area">{a}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="app-actions-footer">
                    {fac.status === 'pending' ? (
                      <>
                        <button 
                          className="btn-solid-sm"
                          onClick={() => handleApproveFacility(fac._id, 'approved')}
                        >
                          <Check size={14} /> Approve Facility
                        </button>
                        <button 
                          className="btn-danger-sm"
                          onClick={() => handleApproveFacility(fac._id, 'rejected')}
                        >
                          <X size={14} /> Reject
                        </button>
                      </>
                    ) : (
                      <div className="already-decided">
                        <span>Status: <b>{fac.status}</b></span>
                        <button 
                          className="btn-sm-action"
                          onClick={() => handleApproveFacility(fac._id, fac.status === 'approved' ? 'rejected' : 'approved')}
                        >
                          Change to {fac.status === 'approved' ? 'Rejected' : 'Approved'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. User Management */}
        {activeTab === 'users' && (
          <div className="admin-users-section">
            <div className="filter-and-search-bar">
              <div className="search-input-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search user by name, email, or mobile..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>

              <div className="role-filter-box">
                <Filter size={16} />
                <select 
                  value={userRoleFilter} 
                  onChange={e => setUserRoleFilter(e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="customer">Players / Customers</option>
                  <option value="owner">Venue Owners</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>User Details</th>
                    <th>Role</th>
                    <th>Mobile</th>
                    <th>Activity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id}>
                      <td>
                        <b>{u.name}</b><br />
                        <small>{u.email}</small>
                      </td>
                      <td>
                        <span className={`role-badge-tag ${u.role}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>{u.phone || 'N/A'}</td>
                      <td>
                        {u.role === 'customer' && `${u.bookings_count || 0} bookings`}
                        {u.role === 'owner' && `${u.facilities_count || 0} venues`}
                        {u.role === 'admin' && 'Platform Control'}
                      </td>
                      <td>
                        <span className={`status-pill-badge ${u.status}`}>
                          {u.status || 'active'}
                        </span>
                      </td>
                      <td>
                        {u.role !== 'admin' && (
                          <button 
                            className={`btn-sm-action ${u.status === 'suspended' ? 'activate-btn' : 'suspend-btn'}`}
                            onClick={() => handleToggleUserStatus(u._id)}
                          >
                            {u.status === 'suspended' ? (
                              <><UserCheck size={13} /> Activate</>
                            ) : (
                              <><UserX size={13} /> Suspend</>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Bookings & Audit */}
        {activeTab === 'bookings' && (
          <div className="admin-bookings-section">
            <div className="section-head">
              <h3>Live Bookings & Payment Transactions</h3>
              <p>Platform audit log across online and offline walk-in bookings.</p>
            </div>

            <div className="table-responsive">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Venue</th>
                    <th>Schedule</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsList.map(b => (
                    <tr key={b._id}>
                      <td><code>#{b._id?.slice(-6)}</code></td>
                      <td>
                        <b>{b.customer_name}</b><br />
                        <small>{b.type === 'offline' ? 'Walk-in' : 'Online Player'}</small>
                      </td>
                      <td>{b.facility_name}</td>
                      <td>
                        {b.slot_start ? new Date(b.slot_start).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                      </td>
                      <td><b>₹{b.amount}</b></td>
                      <td>
                        <span className={`badge-payment ${b.payment_status}`}>
                          {b.payment_status?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-status ${b.status}`}>{b.status}</span>
                      </td>
                      <td>
                        <button 
                          className="btn-sm-action"
                          onClick={() => setViewReceiptId(b._id)}
                        >
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Complaints & Support */}
        {activeTab === 'complaints' && (
          <div className="admin-complaints-section">
            <div className="section-head">
              <h3>Dispute Resolution Desk</h3>
              <p>Manage complaints filed by players and venue owners.</p>
            </div>

            <div className="complaints-admin-list">
              {complaintsList.map(c => (
                <div key={c._id} className="complaint-card admin-item">
                  <div className="complaint-head">
                    <div>
                      <b>{c.subject}</b>
                      <small className="cat-tag">{c.category?.replace('_', ' ')} · From: {c.user_name} ({c.user_role})</small>
                    </div>
                    <span className={`complaint-status ${c.status}`}>
                      {c.status?.toUpperCase()}
                    </span>
                  </div>
                  <p className="complaint-desc">{c.description}</p>
                  
                  {c.admin_notes && (
                    <div className="admin-resolution-note">
                      <strong>Admin Resolution:</strong> {c.admin_notes}
                    </div>
                  )}

                  <div className="complaint-actions-row">
                    <small>Submitted on {new Date(c.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</small>
                    {c.status !== 'resolved' && (
                      <button 
                        className="btn-solid-sm"
                        onClick={() => {
                          setResolvingComplaint(c);
                          setResolutionNotes(c.admin_notes || '');
                        }}
                      >
                        Respond & Resolve Ticket
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {complaintsList.length === 0 && (
                <div className="empty-state-card">
                  <p>No complaints or support tickets in the queue.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. Review Moderation */}
        {activeTab === 'reviews' && (
          <div className="admin-reviews-section">
            <div className="section-head">
              <h3>Community Review Moderation</h3>
              <p>Review and delete abusive, inappropriate, or spam player reviews.</p>
            </div>

            <div className="reviews-cards-list">
              {reviewsList.map(r => (
                <div key={r._id} className="owner-review-box admin-review">
                  <div className="rev-head">
                    <div>
                      <b>{r.facility_name}</b> · <small>By: {r.user_name}</small>
                    </div>
                    <div className="rev-rating">
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </div>
                  </div>
                  <p className="rev-text">"{r.comment}"</p>
                  <div className="rev-footer-admin">
                    <small>{new Date(r.created_at).toLocaleDateString([], { dateStyle: 'medium' })}</small>
                    <button 
                      className="btn-action-danger"
                      onClick={() => handleDeleteReview(r._id)}
                    >
                      <Trash2 size={13} /> Remove Inappropriate Review
                    </button>
                  </div>
                </div>
              ))}
              {reviewsList.length === 0 && (
                <div className="empty-state-card">
                  <p>No reviews to display.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Complaint Resolution Modal */}
      {resolvingComplaint && (
        <div className="modal-backdrop" onClick={() => setResolvingComplaint(null)}>
          <div className="modal-card modal-resolution" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Resolve Dispute Ticket</h3>
              <p>Subject: <b>{resolvingComplaint.subject}</b></p>
            </div>

            <form onSubmit={handleResolveComplaint}>
              <div className="form-group">
                <label>Admin Resolution Notes / Reply to Customer:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain actions taken (e.g. Venue contacted, maintenance verified, refund issued)..."
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions-bar">
                <button 
                  type="button" 
                  className="btn-outline" 
                  onClick={() => setResolvingComplaint(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-solid">
                  Mark as Resolved ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {viewReceiptId && (
        <ReceiptModal
          bookingId={viewReceiptId}
          onClose={() => setViewReceiptId(null)}
        />
      )}
    </div>
  );
}
