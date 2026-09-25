import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const Map = ({ title, icon, darkMode = false, height = 350, locations = [], center = [51.505, -0.09], zoom = 3 }) => {
  return (
    <div className={`relative p-4 rounded-xs shadow-md overflow-hidden ${
      darkMode ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-gray-200' : 'bg-white text-gray-900'
    } transition-transform duration-300 ease-in-out`}>
      <div className="flex items-center gap-2 mb-4">
        {icon && <FontAwesomeIcon icon={icon} className={`text-xl ${darkMode ? 'text-gray-200' : 'text-gray-700'}`} />}
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{title}</h2>
      </div>
      
      <div style={{ height: `${height}px`, width: '100%' }}>
        <MapContainer 
          center={center} 
          zoom={zoom} 
          style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={darkMode 
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            }
          />
          {locations.map((location) => (
            <Marker 
              key={location.id} 
              position={[location.lat, location.lng]}
            >
              <Popup>
                <div className="font-semibold">{location.name}</div>
                {location.description && <div>{location.description}</div>}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Map;