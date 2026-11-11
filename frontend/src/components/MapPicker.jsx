import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, LocateFixed } from 'lucide-react';

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    }
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

function MapFlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

export default function MapPicker({ latitude, longitude, onChange }) {
  const defaultPos = [
    latitude ? Number(latitude) : 17.9689,
    longitude ? Number(longitude) : 79.5941
  ];

  const [position, setPosition] = useState(defaultPos);

  const handlePositionChange = (newPos) => {
    setPosition(newPos);
    if (onChange) {
      onChange(newPos[0].toFixed(6), newPos[1].toFixed(6));
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        handlePositionChange(coords);
      },
      (err) => {
        alert('Could not retrieve your location. Please place the marker manually.');
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="map-picker-component">
      <div className="picker-header">
        <label>
          <MapPin size={15} /> Click on map to place exact facility marker:
        </label>
        <button 
          type="button" 
          className="btn-use-location" 
          onClick={handleUseCurrentLocation}
        >
          <LocateFixed size={14} /> Use My Current Location
        </button>
      </div>

      <div className="picker-map-container">
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={false}
          className="map-picker-canvas"
        >
          <MapFlyTo center={position} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handlePositionChange} />
        </MapContainer>
      </div>

      <div className="picker-coords-display">
        <span>Latitude: <b>{position[0].toFixed(5)}</b></span>
        <span>Longitude: <b>{position[1].toFixed(5)}</b></span>
      </div>
    </div>
  );
}
