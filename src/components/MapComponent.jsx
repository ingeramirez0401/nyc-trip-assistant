/* global google -- inyectado por el script de Maps JavaScript API que carga <APIProvider> */
import React, { useEffect, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Polyline,
  ColorScheme,
  useMap,
} from '@vis.gl/react-google-maps';
import { getCategoryIcon } from '../data/categories';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

// Símbolo repetido a lo largo de la polyline para simular el dashArray que
// Leaflet tenía nativo -- la API de Google no tiene un prop de línea
// punteada, se logra dibujando un segmento corto (icons) repetido cada
// pocos píxeles con la línea principal en opacity 0.
const DASHED_LINE_ICON = {
  path: 'M 0,-1 0,1',
  strokeOpacity: 1,
  scale: 3,
};

// Controla la cámara del mapa de forma imperativa (equivalente al
// MapController que había con react-leaflet + useMap de esa librería,
// mismo nombre de hook, distinta API por debajo).
function MapController({ points, userLocation, centerOnUser }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (centerOnUser && userLocation) {
      map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      map.setZoom(17);
      return;
    }

    if (points.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(points), userLocation?.lat, userLocation?.lng, centerOnUser]);

  useEffect(() => {
    if (!map) return;
    const handleCenterOnBase = (event) => {
      const baseLocation = event.detail;
      if (baseLocation) {
        map.panTo({ lat: baseLocation.lat, lng: baseLocation.lng });
        map.setZoom(16);
      }
    };
    window.addEventListener('centerOnBase', handleCenterOnBase);
    return () => window.removeEventListener('centerOnBase', handleCenterOnBase);
  }, [map]);

  return null;
}

function StopMarker({ stop, isSelected, isVisited, onClick }) {
  const category = getCategoryIcon(stop.cat);
  const bgColor = isVisited ? 'bg-emerald-600' : 'bg-slate-900';
  const borderColor = isSelected ? 'border-blue-500' : 'border-white/20';
  const glow = isSelected ? 'shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'shadow-lg';
  const scale = isSelected ? 'scale-125' : 'scale-100';
  const iconColor = isVisited ? '#ffffff' : category.color || '#ffffff';

  return (
    <AdvancedMarker
      position={{ lat: stop.lat, lng: stop.lng }}
      onClick={onClick}
      zIndex={isSelected ? 1000 : 10}
    >
      <div className={`relative transition-all duration-300 ${scale}`}>
        <div
          className={`w-10 h-10 rounded-xl ${bgColor} border-2 ${borderColor} ${glow} flex items-center justify-center transform rotate-45 transition-colors`}
        >
          <div className="-rotate-45">
            <i
              className={`fas ${category.icon} text-sm`}
              style={{ color: isSelected ? 'white' : iconColor }}
            ></i>
          </div>
        </div>
        {isVisited && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-sm z-20">
            <i className="fas fa-check text-[10px] text-white"></i>
          </div>
        )}
        {isSelected && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
        )}
      </div>
    </AdvancedMarker>
  );
}

function MapInner({
  baseLocation,
  activeDay,
  selectedStop,
  onStopClick,
  onBaseClick,
  userLocation,
  visited,
  isDarkMode,
  centerOnUser,
  gpsEnabled,
}) {
  const stops = activeDay?.stops || [];

  const routePoints = useMemo(() => {
    const pts = [
      { lat: baseLocation.lat, lng: baseLocation.lng },
      ...stops.map((s) => ({ lat: s.lat, lng: s.lng })),
    ];
    // La ubicación del usuario solo entra al encuadre si el GPS está
    // activo -- si no, el mapa se aleja de más cuando el viajero está
    // lejos del destino (igual que antes con Leaflet).
    if (userLocation && gpsEnabled && !centerOnUser) {
      pts.push({ lat: userLocation.lat, lng: userLocation.lng });
    }
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseLocation.lat, baseLocation.lng, JSON.stringify(stops.map((s) => [s.lat, s.lng])), userLocation?.lat, userLocation?.lng, gpsEnabled, centerOnUser]);

  return (
    <Map
      mapId={GOOGLE_MAPS_MAP_ID}
      defaultCenter={{ lat: baseLocation.lat, lng: baseLocation.lng }}
      defaultZoom={13}
      colorScheme={isDarkMode ? ColorScheme.DARK : ColorScheme.LIGHT}
      disableDefaultUI
      gestureHandling="greedy"
      className={`h-full w-full ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}
    >
      <MapController points={routePoints} userLocation={userLocation} centerOnUser={centerOnUser} />

      {/* Route Line */}
      {stops.length > 0 && (
        <Polyline
          path={routePoints}
          strokeOpacity={0}
          strokeColor={isDarkMode ? '#3b82f6' : '#2563eb'}
          strokeWeight={4}
          icons={[{ icon: DASHED_LINE_ICON, offset: '0', repeat: '14px' }]}
        />
      )}

      {/* Base Marker -- clickeable: aunque el hotel/base ya se eligió al
          crear el viaje y no se puede marcar visitado/editar/borrar como
          una parada normal, el viajero sí quiere poder consultarlo de
          nuevo (dirección, teléfono, horario) sin tener que recordarlo de
          memoria -- ver App.jsx handleBaseClick. */}
      <AdvancedMarker position={{ lat: baseLocation.lat, lng: baseLocation.lng }} onClick={onBaseClick} zIndex={20}>
        <div className="w-12 h-12 bg-amber-500 rounded-full border-4 border-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center text-slate-900 text-xl animate-pulse cursor-pointer">
          <i className="fas fa-bed"></i>
        </div>
      </AdvancedMarker>

      {/* User Location */}
      {userLocation && (
        <AdvancedMarker position={{ lat: userLocation.lat, lng: userLocation.lng }}>
          <div className="relative w-5 h-5">
            <div className="absolute -inset-[22px] bg-blue-500/20 rounded-full animate-pulse"></div>
            <div className="w-5 h-5 bg-blue-500 rounded-full border-[3px] border-white shadow-[0_0_15px_rgba(59,130,246,0.8)] relative">
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
            </div>
          </div>
        </AdvancedMarker>
      )}

      {/* Stops */}
      {stops.map((stop) => (
        <StopMarker
          key={stop.id}
          stop={stop}
          isSelected={selectedStop?.id === stop.id}
          isVisited={!!visited[stop.id]}
          onClick={() => onStopClick(stop)}
        />
      ))}
    </Map>
  );
}

const MapComponent = (props) => {
  if (!GOOGLE_MAPS_API_KEY || !GOOGLE_MAPS_MAP_ID) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-900 text-center p-6">
        <div className="max-w-sm text-slate-300">
          <i className="fas fa-map-location-dot text-4xl mb-4 opacity-50"></i>
          <p className="font-bold mb-1">Mapa no configurado</p>
          <p className="text-sm text-slate-400">
            Faltan VITE_GOOGLE_MAPS_API_KEY y/o VITE_GOOGLE_MAPS_MAP_ID en el entorno.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker']}>
      <MapInner {...props} />
    </APIProvider>
  );
};

export default MapComponent;
