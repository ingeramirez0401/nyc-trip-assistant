import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCategoryIcon } from '../data/categories';

// Fix Leaflet Default Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map movements
function MapController({ center, bounds }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
    } else if (center) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, bounds, map]);

  return null;
}

const createCustomIcon = (color, isSelected, isVisited) => {
    const size = isSelected ? 40 : 28;
    const border = isSelected ? 3 : 2;
    const opacity = isVisited ? 0.6 : 1;
    const checkmark = isVisited ? '<i class="fas fa-check absolute -top-1 -right-1 bg-green-500 text-white text-[10px] rounded-full p-1 border border-white"></i>' : '';
    
    return L.divIcon({
        className: 'custom-pin',
        html: `
            <div style="position: relative; opacity: ${opacity};">
                <div style="
                    width: ${size}px; height: ${size}px;
                    background: ${color};
                    border: ${border}px solid white;
                    border-radius: 50%;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                ">
                    <div style="width: ${size * 0.4}px; height: ${size * 0.4}px; background: white; border-radius: 50%;"></div>
                </div>
                ${checkmark}
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
    });
};

const MapComponent = ({ 
  baseLocation, 
  activeDay, 
  selectedStop, 
  onStopClick, 
  userLocation,
  visited 
}) => {
  const stops = activeDay?.stops || [];
  
  // Calculate bounds
  const points = [
    [baseLocation.lat, baseLocation.lng],
    ...stops.map(s => [s.lat, s.lng])
  ];
  const bounds = L.latLngBounds(points);

  return (
    <MapContainer 
      center={[baseLocation.lat, baseLocation.lng]} 
      zoom={13} 
      zoomControl={false} 
      className="h-full w-full z-0"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      
      <MapController bounds={bounds} />

      {/* Route Line */}
      {stops.length > 0 && (
        <Polyline 
          positions={points} 
          pathOptions={{ color: activeDay.color, weight: 3, opacity: 0.5, dashArray: '5, 10' }} 
        />
      )}

      {/* Base Marker */}
      <Marker 
        position={[baseLocation.lat, baseLocation.lng]}
        icon={L.divIcon({
            html: `<div class="w-10 h-10 bg-slate-900 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-amber-300 text-lg"><i class="fas fa-bed"></i></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        })}
      />

      {/* User Location */}
      {userLocation && (
        <Marker 
          position={userLocation}
          icon={L.divIcon({ className: 'user-pulse', iconSize: [20, 20] })}
        />
      )}

      {/* Stops */}
      {activeDay?.stops.map((stop) => (
        <Marker 
          key={stop.id} 
          position={[stop.lat, stop.lng]}
          icon={createCustomIcon(stop, !!visited[stop.id])}
          eventHandlers={{
            click: () => onStopClick(stop)
          }}
        >
          <Popup>{stop.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
