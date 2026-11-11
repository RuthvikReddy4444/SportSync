import React from 'react';
import { MapPin, Star, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function FacilityCard({ facility, onSelect }) {
  const minPrice = facility.sports && facility.sports.length > 0
    ? Math.min(...facility.sports.map(s => Number(s.price_per_hour || 0)))
    : 0;

  const defaultImage = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80';
  const displayImage = (facility.images && facility.images[0]) || defaultImage;

  return (
    <article className="facility-card" onClick={() => onSelect(facility)}>
      <div className="card-media">
        <img 
          src={displayImage} 
          alt={facility.name} 
          loading="lazy"
          onError={(e) => {
            e.target.src = defaultImage;
          }}
        />
        <div className="card-badges-top">
          <span className="rating-badge">
            <Star size={13} className="star-icon" />
            {facility.avg_rating ? facility.avg_rating.toFixed(1) : 'New'}
            {facility.review_count ? ` (${facility.review_count})` : ''}
          </span>
          {facility.distance_km !== undefined && (
            <span className="distance-badge">
              {facility.distance_km} km away
            </span>
          )}
        </div>
      </div>

      <div className="card-body">
        <div className="card-header-row">
          <h3 className="facility-title">{facility.name}</h3>
        </div>

        <p className="facility-location">
          <MapPin size={14} className="pin-icon" />
          <span>{facility.address?.locality}, {facility.address?.city}</span>
        </p>

        <div className="sports-tags-row">
          {facility.sports?.slice(0, 3).map((s, idx) => (
            <span key={idx} className="sport-tag">
              {s.name}
            </span>
          ))}
          {facility.sports && facility.sports.length > 3 && (
            <span className="sport-tag-more">+{facility.sports.length - 3}</span>
          )}
        </div>

        {facility.amenities && facility.amenities.length > 0 && (
          <div className="amenities-preview">
            <small>{facility.amenities.slice(0, 3).join(' • ')}</small>
          </div>
        )}

        <div className="card-footer-row">
          <div className="price-tag">
            <strong>₹{minPrice.toLocaleString('en-IN')}</strong>
            <small>/ hour onwards</small>
          </div>

          <button 
            className="btn-card-action"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(facility);
            }}
          >
            Book Slots <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
