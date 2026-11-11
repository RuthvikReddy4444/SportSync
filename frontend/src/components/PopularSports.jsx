import React from 'react';

export const SPORTS_LIST = [
  { id: '', name: 'All Sports', icon: '🏆' },
  { id: 'Badminton', name: 'Badminton', icon: '🏸' },
  { id: 'Cricket', name: 'Cricket', icon: '🏏' },
  { id: 'Football', name: 'Football', icon: '⚽' },
  { id: 'Tennis', name: 'Tennis', icon: '🎾' },
  { id: 'Basketball', name: 'Basketball', icon: '🏀' },
  { id: 'Swimming', name: 'Swimming', icon: '🏊' },
  { id: 'Volleyball', name: 'Volleyball', icon: '🏐' },
  { id: 'Table Tennis', name: 'Table Tennis', icon: '🏓' },
  { id: 'Pickleball', name: 'Pickleball', icon: '🎯' },
  { id: 'Squash', name: 'Squash', icon: '🥇' }
];

export default function PopularSports({ selectedSport, onSelectSport }) {
  return (
    <section className="popular-sports-section" id="sports">
      <div className="section-head">
        <div>
          <span className="section-kicker">POPULAR SPORTS</span>
          <h2 className="section-heading">Browse by your favorite sport</h2>
        </div>
      </div>

      <div className="sports-scroll-row">
        {SPORTS_LIST.map(sport => {
          const isSelected = selectedSport.toLowerCase() === sport.id.toLowerCase();
          return (
            <button
              key={sport.id}
              className={`sport-pill-btn ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectSport(sport.id)}
            >
              <span className="sport-emoji">{sport.icon}</span>
              <span className="sport-name">{sport.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
