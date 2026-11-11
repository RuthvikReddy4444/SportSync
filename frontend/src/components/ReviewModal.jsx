import React, { useState } from 'react';
import { X, Star, Send } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ReviewModal({ booking, onClose, onReviewSubmitted }) {
  const { showToast } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast('Please provide a brief feedback note.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          booking_id: booking._id,
          rating,
          comment: comment.trim()
        })
      });

      showToast(res.message || 'Review submitted successfully!', 'success');
      if (onReviewSubmitted) onReviewSubmitted(res.review);
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-review" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} title="Close">
          <X size={20} />
        </button>

        <div className="modal-head">
          <label className="section-kicker">POST-GAME REVIEW</label>
          <h3>Rate Your Experience</h3>
          <p>
            How was your session at <b>{booking.facility?.name || 'the venue'}</b>?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="review-form">
          {/* Star Rating Picker */}
          <div className="star-picker-row">
            {[1, 2, 3, 4, 5].map((starVal) => {
              const active = (hoverRating || rating) >= starVal;
              return (
                <button
                  type="button"
                  key={starVal}
                  className={`star-pick-btn ${active ? 'active' : ''}`}
                  onMouseEnter={() => setHoverRating(starVal)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(starVal)}
                >
                  <Star size={32} />
                </button>
              );
            })}
          </div>
          <div className="rating-label-display">
            {rating === 5 && '🌟 Outstanding venue & courts!'}
            {rating === 4 && '👍 Great experience'}
            {rating === 3 && '👌 Average session'}
            {rating === 2 && '👎 Below expectations'}
            {rating === 1 && '⚠️ Poor facility condition'}
          </div>

          <div className="form-group">
            <label>Your Feedback / Comments:</label>
            <textarea
              required
              rows={4}
              placeholder="Tell other players about court quality, lighting, parking, staff helpfulness..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="btn-solid-full"
            disabled={submitting}
          >
            <Send size={15} /> {submitting ? 'Submitting Review...' : 'Publish Verified Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
