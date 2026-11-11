import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import SearchBar from '../components/SearchBar';
import PopularSports from '../components/PopularSports';
import FacilityCard from '../components/FacilityCard';
import MapExplorer from '../components/MapExplorer';
import FacilityModal from '../components/FacilityModal';
import PaymentModal from '../components/PaymentModal';
import ReceiptModal from '../components/ReceiptModal';
import HowItWorks from '../components/HowItWorks';
import BenefitsSection from '../components/BenefitsSection';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Map, Grid, LocateFixed } from 'lucide-react';

export default function HomePage({ onOpenOwnerWorkspace }) {
  const { showToast, openAuth } = useAuth();

  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [searchRadius, setSearchRadius] = useState(15);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([17.9689, 79.5941]); // default Warangal

  // Modals
  const [activeFacility, setActiveFacility] = useState(null);
  const [activeBookingData, setActiveBookingData] = useState(null);
  const [confirmedBookingId, setConfirmedBookingId] = useState(null);

  const fetchFacilities = async (extraParams = {}) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (searchQuery) p.set('q', searchQuery);
      if (selectedSport) p.set('sport', selectedSport);
      if (selectedCity) p.set('city', selectedCity);

      const lat = extraParams.lat || userLocation?.lat;
      const lng = extraParams.lng || userLocation?.lng;

      if (lat && lng) {
        p.set('lat', lat);
        p.set('lng', lng);
        p.set('radius', searchRadius);
      }

      const res = await api(`/facilities?${p.toString()}`);
      setFacilities(res.facilities || []);
    } catch (err) {
      showToast(err.message || 'Failed to load facilities.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [selectedSport, selectedCity, searchRadius]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    showToast('Detecting your location...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setMapCenter([coords.lat, coords.lng]);
        fetchFacilities(coords);
        showToast('Found facilities near your coordinates!', 'success');
      },
      (err) => {
        showToast('Location permission denied or unavailable. Searching by area.', 'error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleStartBooking = async (slot, facility) => {
    try {
      showToast('Holding your time slot...', 'info');
      const res = await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({ slot_id: slot._id })
      });

      // Open payment modal
      setActiveBookingData({
        booking: res.booking,
        facility,
        slot
      });
      setActiveFacility(null); // Close details modal
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handlePaymentSuccess = (res) => {
    setConfirmedBookingId(activeBookingData?.booking?._id);
    setActiveBookingData(null);
    fetchFacilities();
  };

  return (
    <div className="home-page-container">
      {/* 1. Hero Section */}
      <Hero 
        onLocate={handleLocateMe} 
        facilityCount={facilities.length} 
      />

      {/* 2. Search & Meta Bar */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedSport={selectedSport}
        setSelectedSport={setSelectedSport}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        searchRadius={searchRadius}
        setSearchRadius={setSearchRadius}
        onSearch={() => fetchFacilities()}
        onLocate={handleLocateMe}
        totalResults={facilities.length}
      />

      {/* 3. Popular Sports Categories */}
      <PopularSports
        selectedSport={selectedSport}
        onSelectSport={(sportId) => setSelectedSport(sportId)}
      />

      {/* 4. Facilities Results Section */}
      <section className="facilities-results-section">
        <div className="section-head-with-toggle">
          <div>
            <span className="section-kicker">EXPLORE SPACES</span>
            <h2 className="section-heading">Verified Sports Facilities</h2>
            <p className="section-sub">
              Book hourly courts with instant confirmation and transparent amenities.
            </p>
          </div>

          <div className="view-mode-toggle">
            <button
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={15} /> List / Cards
            </button>
            <button
              className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              <Map size={15} /> Interactive Map
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loader-box large">Loading vetted facilities...</div>
        ) : viewMode === 'map' ? (
          <MapExplorer
            facilities={facilities}
            center={mapCenter}
            selectedFacility={activeFacility}
            onSelectFacility={(fac) => setActiveFacility(fac)}
            onLocate={handleLocateMe}
          />
        ) : (
          <div className="facilities-cards-grid">
            {facilities.map(fac => (
              <FacilityCard
                key={fac._id}
                facility={fac}
                onSelect={(f) => setActiveFacility(f)}
              />
            ))}

            {facilities.length === 0 && (
              <div className="empty-results-box">
                <h3>No venues match your current filters</h3>
                <p>Try clearing your sport or city filters, or widening the search radius.</p>
                <button 
                  className="btn-outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSport('');
                    setSelectedCity('');
                    fetchFacilities();
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. How It Works */}
      <HowItWorks />

      {/* 6. Benefits for Players & Venue Owners */}
      <BenefitsSection onOpenOwnerAuth={() => openAuth('register', 'owner')} />

      {/* Facility Details & Slot Booking Modal */}
      {activeFacility && (
        <FacilityModal
          facility={activeFacility}
          onClose={() => setActiveFacility(null)}
          onStartBooking={handleStartBooking}
        />
      )}

      {/* Simulated Payment Gateway Modal */}
      {activeBookingData && (
        <PaymentModal
          bookingData={activeBookingData}
          onClose={() => setActiveBookingData(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Booking Receipt Modal */}
      {confirmedBookingId && (
        <ReceiptModal
          bookingId={confirmedBookingId}
          onClose={() => setConfirmedBookingId(null)}
        />
      )}
    </div>
  );
}
