import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, ArrowUpRight, Star, ExternalLink, Navigation } from 'lucide-react';

// Configure standard Leaflet icon URLs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, map.getZoom() || 13);
    }
  }, [center, map]);
  return null;
}

export default function MapExplorer({
  facilities = [],
  center = [17.9689, 79.5941],
  selectedFacility,
  onSelectFacility,
  onLocate
}) {
  return (
    <div className="map-explorer-container">
      <div className="leaflet-map-wrapper">
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom={false}
          className="leaflet-interactive-map"
        >
          <MapRecenter center={center} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {facilities.map(fac => {
            const coords = fac.location?.coordinates;
            if (!coords || coords.length !== 2) return null;
            const [lng, lat] = coords;

            return (
              <Marker
                key={fac._id}
                position={[lat, lng]}
                eventHandlers={{
                  click: () => onSelectFacility(fac)
                }}
              >
                <Popup className="facility-map-popup">
                  <div className="popup-inner">
                    <h4>{fac.name}</h4>
                    <p className="popup-location">
                      <MapPin size={12} /> {fac.address?.locality}, {fac.address?.city}
                    </p>
                    <div className="popup-sports">
                      {fac.sports?.map(s => s.name).join(' • ')}
                    </div>
                    <div className="popup-actions">
                      <button 
                        className="btn-popup-select"
                        onClick={() => onSelectFacility(fac)}
                      >
                        View & Book Slots
                      </button>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-popup-directions"
                        title="Get Directions"
                      >
                        <Navigation size={13} />
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        <button 
          className="btn-floating-near" 
          onClick={onLocate}
          title="Center on my current location"
        >
          <Navigation size={14} /> My Location
        </button>
      </div>

      {/* Side Place List */}
      <aside className="map-places-sidebar">
        <div className="sidebar-head">
          <h4>Venues on Map ({facilities.length})</h4>
          <small>Click to view slots & reserve</small>
        </div>

        <div className="sidebar-scrollable-list">
          {facilities.map(fac => (
            <div
              key={fac._id}
              className={`sidebar-place-item ${selectedFacility?._id === fac._id ? 'active' : ''}`}
              onClick={() => onSelectFacility(fac)}
            >
              <div className="place-icon-box">
                <MapPin size={16} />
              </div>
              <div className="place-info">
                <b>{fac.name}</b>
                <span className="place-locality">
                  {fac.address?.locality}, {fac.address?.city}
                </span>
                <span className="place-sports">
                  {fac.sports?.map(s => s.name).slice(0, 3).join(', ')}
                </span>
              </div>
              <ArrowUpRight size={15} className="place-arrow" />
            </div>
          ))}

          {facilities.length === 0 && (
            <div className="sidebar-empty">
              <p>No venues found in this area.</p>
              <small>Try widening your search radius or clearing filters.</small>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
