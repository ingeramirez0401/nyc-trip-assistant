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
function MapController({ center, bounds, userLocation, centerOnUser }) {
  const map = useMap();
  
  useEffect(() => {
    if (centerOnUser && userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 17, { duration: 1.5 });
    } else if (bounds) {
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
    } else if (center) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, bounds, map, userLocation, centerOnUser]);

  // Listen for centerOnBase event
  useEffect(() => {
    const handleCenterOnBase = (event) => {
      const baseLocation = event.detail;
      if (baseLocation) {
        map.flyTo([baseLocation.lat, baseLocation.lng], 16, { duration: 1.5 });
      }
    };

    window.addEventListener('centerOnBase', handleCenterOnBase);
    return () => window.removeEventListener('centerOnBase', handleCenterOnBase);
  }, [map]);

  return null;
}

const createCustomIcon = (stop, isSelected, isVisited) => {
    const category = getCategoryIcon(stop.cat);
    // Dark Brutal Theme Markers
    const bgColor = isVisited ? 'bg-emerald-600' : 'bg-slate-900';
    const borderColor = isSelected ? 'border-blue-500' : 'border-white/20';
    const glow = isSelected ? 'shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'shadow-lg';
    const scale = isSelected ? 'scale-125' : 'scale-100';
    const zIndex = isSelected ? 'z-[1000]' : 'z-10';
    const iconColor = isVisited ? '#ffffff' : category.color || '#ffffff';
    
    return L.divIcon({
        className: 'custom-pin',
        html: `
            <div class="relative transition-all duration-300 ${scale} ${zIndex}">
                <div class="w-10 h-10 rounded-xl ${bgColor} border-2 ${borderColor} ${glow} flex items-center justify-center transform rotate-45 transition-colors">
                    <div class="-rotate-45">
                        <i class="fas ${category.icon} text-sm" style="color: ${isSelected ? 'white' : iconColor}"></i>
                    </div>
                </div>
                ${isVisited ? '<div class="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-sm z-20"><i class="fas fa-check text-[10px] text-white"></i></div>' : ''}
                ${isSelected ? '<div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>' : ''}
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -24]
    });
};

const MapComponent = ({ 
  baseLocation, 
  activeDay, 
  selectedStop, 
  onStopClick, 
  userLocation,
  visited,
  isDarkMode = true,
  centerOnUser = false,
  gpsEnabled = false
}) => {
  const stops = activeDay?.stops || [];
  
  // Calculate bounds - solo incluir ubicación del usuario si GPS está habilitado
  const points = [
    [baseLocation.lat, baseLocation.lng],
    ...stops.map(s => [s.lat, s.lng])
  ];
  
  // Solo incluir ubicación del usuario en bounds si GPS está habilitado
  // Esto evita que el mapa se aleje demasiado cuando el usuario está lejos del destino
  if (userLocation && gpsEnabled && !centerOnUser) {
    points.push([userLocation.lat, userLocation.lng]);
  }
  
  const bounds = L.latLngBounds(points);

  return (
    <MapContainer 
      center={[baseLocation.lat, baseLocation.lng]} 
      zoom={13} 
      zoomControl={false} 
      className={`h-full w-full z-0 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}
    >
      <TileLayer
        url={isDarkMode 
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        }
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      
      <MapController bounds={bounds} userLocation={userLocation} centerOnUser={centerOnUser} />

      {/* Route Line */}
      {stops.length > 0 && (
        <Polyline 
          positions={points} 
          pathOptions={{ 
            color: isDarkMode ? '#3b82f6' : '#2563eb', 
            weight: 4, 
            opacity: 0.6, 
            dashArray: '1, 8', 
            lineCap: 'round' 
          }} 
        />
      )}

      {/* Base Marker */}
      <Marker 
        position={[baseLocation.lat, baseLocation.lng]}
        icon={L.divIcon({
            html: `<div class="w-12 h-12 bg-amber-500 rounded-full border-4 border-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center text-slate-900 text-xl animate-pulse"><i class="fas fa-bed"></i></div>`,
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        })}
      />

      {/* User Location */}
      {userLocation && (
        <Marker 
          position={[userLocation.lat, userLocation.lng]}
          icon={L.divIcon({ 
              html: `
                <div class="relative">
                  <div class="absolute inset-0 w-16 h-16 bg-blue-500/20 rounded-full animate-pulse" style="margin-left: -32px; margin-top: -32px;"></div>
                  <div class="w-5 h-5 bg-blue-500 rounded-full border-3 border-white shadow-[0_0_15px_rgba(59,130,246,0.8)] relative" style="margin-left: -10px; margin-top: -10px;">
                    <div class="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                </div>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
          })}
        >
          <Popup className="custom-popup">
            <div class="text-slate-900 font-bold">📍 Tu ubicación</div>
          </Popup>
        </Marker>
      )}

      {/* Stops */}
      {activeDay?.stops.map((stop) => (
        <Marker 
          key={stop.id} 
          position={[stop.lat, stop.lng]}
          icon={createCustomIcon(
            stop,
            selectedStop?.id === stop.id,
            !!visited[stop.id]
          )}
          eventHandlers={{
            click: () => onStopClick(stop)
          }}
        >
          <Popup className="custom-popup">
             <div class="text-slate-900 font-bold">{stop.title}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
