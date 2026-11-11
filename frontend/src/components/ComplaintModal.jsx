import React, { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ComplaintModal({ 
  bookingId, 
  facilityId, 
  onClose, 
  onSubmitted 
}) {
  const { showToast } = useAuth();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('facility_issue');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api('/complaints', {
        method: 'POST',
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          category,
          booking_id: bookingId || null,
          facility_id: facilityId || null
        })
      });

      showToast(res.message || 'Support ticket submitted.', 'success');
      if (onSubmitted) onSubmitted(res.complaint);
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-complaint" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} title="Close">
          <X size={20} />
        </button>

        <div className="modal-head">
          <label className="section-kicker">CUSTOMER SUPPORT</label>
          <h3>Report an Issue / Complaint</h3>
          <p>Our administrator desk will investigate and respond promptly.</p>
        </div>

        <form onSubmit={handleSubmit} className="complaint-form">
          <div className="form-group">
            <label>Category:</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="facility_issue">Facility & Court Maintenance Issue</option>
              <option value="booking_issue">Booking or Slot Dispute</option>
              <option value="payment">Payment & Refund Inquiry</option>
              <option value="staff_behavior">Staff / Customer Conduct</option>
              <option value="other">General Platform Issue</option>
            </select>
          </div>

          <div className="form-group">
            <label>Subject:</label>
            <input
              type="text"
              required
              placeholder="Brief summary of the problem"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Detailed Description:</label>
            <textarea
              required
              rows={4}
              placeholder="Describe what occurred, dates, and what resolution you expect..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="btn-solid-full"
            disabled={submitting}
          >
            <Send size={15} /> {submitting ? 'Submitting...' : 'Submit Support Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
}
