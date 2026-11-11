import React from 'react';
import { Search, MapPin, LocateFixed, SlidersHorizontal } from 'lucide-react';
import { SPORTS_LIST } from './PopularSports';

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  selectedSport,
  setSelectedSport,
  selectedCity,
  setSelectedCity,
  searchRadius,
  setSearchRadius,
  onSearch,
  onLocate,
  totalResults
}) {
  const cities = ['All Cities', 'Warangal', 'Hanamkonda', 'Kazipet', 'Hyderabad'];

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="searchbar-wrapper" id="discover">
      <div className="searchbar-box">
        {/* Text Input */}
        <div className="search-field flex-grow">
          <Search size={18} className="field-icon" />
          <input
            type="text"
            placeholder="Search venue name, area, or locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="search-divider"></div>

        {/* City Filter */}
        <div className="search-field select-field">
          <MapPin size={17} className="field-icon" />
          <select 
            value={selectedCity} 
            onChange={(e) => setSelectedCity(e.target.value === 'All Cities' ? '' : e.target.value)}
          >
            {cities.map(c => (
              <option key={c} value={c === 'All Cities' ? '' : c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="search-divider"></div>

        {/* Sport Filter */}
        <div className="search-field select-field">
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
          >
            {SPORTS_LIST.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button className="btn-search-submit" onClick={onSearch}>
          <Search size={16} /> Search
        </button>
      </div>

      {/* Meta Filter Row */}
      <div className="search-meta-bar">
        <div className="meta-left">
          <span className="results-count">
            <strong>{totalResults}</strong> facilities available
          </span>
          {selectedSport && (
            <span className="filter-tag">
              Sport: {selectedSport}
              <button onClick={() => setSelectedSport('')}>×</button>
            </span>
          )}
          {selectedCity && (
            <span className="filter-tag">
              City: {selectedCity}
              <button onClick={() => setSelectedCity('')}>×</button>
            </span>
          )}
        </div>

        <div className="meta-right">
          <button className="btn-near-chip" onClick={onLocate}>
            <LocateFixed size={14} /> Near Me
          </button>
          
          <div className="radius-picker">
            <SlidersHorizontal size={13} />
            <label>Radius:</label>
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
            >
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="15">15 km</option>
              <option value="25">25 km</option>
              <option value="50">50 km</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
