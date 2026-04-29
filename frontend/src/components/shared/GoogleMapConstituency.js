/**
 * GoogleMapConstituency.js
 * Renders an interactive Google Map centred on the selected constituency.
 * Uses @react-google-maps/api — a thin React wrapper around the Maps JS API.
 */

import React, { useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

// Constituency geo-coordinates (lat/lng for the constituency centre)
const CONSTITUENCY_COORDS = {
  'new-delhi': { lat: 28.6139, lng: 77.209, city: 'New Delhi' },
  'north-delhi': { lat: 28.7041, lng: 77.1025, city: 'North Delhi' },
  'mumbai-south': { lat: 18.9388, lng: 72.8354, city: 'Mumbai South' },
  pune: { lat: 18.5204, lng: 73.8567, city: 'Pune' },
  'bangalore-south': { lat: 12.9142, lng: 77.5855, city: 'Bangalore South' },
  mysore: { lat: 12.2958, lng: 76.6394, city: 'Mysore' },
  varanasi: { lat: 25.3176, lng: 82.9739, city: 'Varanasi' },
  lucknow: { lat: 26.8467, lng: 80.9462, city: 'Lucknow' },
  'chennai-central': { lat: 13.0827, lng: 80.2707, city: 'Chennai Central' },
  coimbatore: { lat: 11.0168, lng: 76.9558, city: 'Coimbatore' },
  'kolkata-north': { lat: 22.5726, lng: 88.3639, city: 'Kolkata North' },
  jadavpur: { lat: 22.4978, lng: 88.3714, city: 'Jadavpur' },
  jaipur: { lat: 26.9124, lng: 75.7873, city: 'Jaipur' },
  jodhpur: { lat: 26.2389, lng: 73.0243, city: 'Jodhpur' },
  'ahmedabad-east': { lat: 23.0225, lng: 72.5714, city: 'Ahmedabad East' },
  surat: { lat: 21.1702, lng: 72.8311, city: 'Surat' },
};

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '220px',
  borderRadius: '8px',
};

const MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
};

export default function GoogleMapConstituency({ constituencyId, constituencyName }) {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: 'votesmart-google-maps',
  });

  const coords = useMemo(() => {
    if (!constituencyId) return null;
    return CONSTITUENCY_COORDS[constituencyId] || null;
  }, [constituencyId]);

  const [infoOpen, setInfoOpen] = React.useState(true);

  if (!apiKey || loadError) {
    return (
      <div
        style={{
          background: '#f1f5f9',
          borderRadius: 8,
          height: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 8,
          color: '#64748b',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M14 3C9.582 3 6 6.582 6 11c0 8.167 8 16 8 16s8-7.833 8-16c0-4.418-3.582-8-8-8z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="14" cy="11" r="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span style={{ fontSize: 13 }}>Map powered by Google Maps</span>
        <span style={{ fontSize: 11, opacity: 0.7 }}>{constituencyName}</span>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        style={{
          background: '#f1f5f9',
          borderRadius: 8,
          height: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="spinner" style={{ width: 20, height: 20 }} />
      </div>
    );
  }

  if (!coords) return null;

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={{ lat: coords.lat, lng: coords.lng }}
      zoom={11}
      options={MAP_OPTIONS}
    >
      <Marker
        position={{ lat: coords.lat, lng: coords.lng }}
        onClick={() => setInfoOpen(true)}
        title={constituencyName}
      />
      {infoOpen && (
        <InfoWindow
          position={{ lat: coords.lat, lng: coords.lng }}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e3a5f', padding: '2px 4px' }}>
            📍 {constituencyName}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
