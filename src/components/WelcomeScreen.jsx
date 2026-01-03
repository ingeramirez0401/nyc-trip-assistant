import React, { useState, useEffect } from 'react';
import { tripService } from '../services/tripService';
import LocationSearchInput from './LocationSearchInput';

const WelcomeScreen = ({ onSelectTrip, onCreateTrip }) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTripData, setNewTripData] = useState({
    name: '',
    city: '',
    country: '',
    baseLocation: null,
  });

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const data = await tripService.getAll();
      setTrips(data);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId, tripName) => {
    if (!confirm(`¿Eliminar el viaje "${tripName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await tripService.delete(tripId);
      await loadTrips();
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Error al eliminar el viaje. Por favor intenta de nuevo.');
    }
  };

  const handleLocationSelect = (locationData) => {
    setNewTripData({
      ...newTripData,
      city: locationData.city,
      country: locationData.country,
      baseLocation: {
        lat: locationData.lat,
        lng: locationData.lng,
        title: locationData.city,
        desc: locationData.address,
      }
    });
  };

  const handleCreateTrip = async () => {
    if (!newTripData.city.trim()) {
      alert('Por favor busca y selecciona una ubicación');
      return;
    }

    try {
      const tripName = newTripData.name.trim() || `Viaje a ${newTripData.city}`;
      
      console.log('🚀 Creating trip with data:', {
        name: tripName,
        city: newTripData.city,
        country: newTripData.country || null,
        baseLocation: newTripData.baseLocation,
      });
      
      const trip = await tripService.create({
        name: tripName,
        city: newTripData.city,
        country: newTripData.country || null,
        baseLocation: newTripData.baseLocation,
      });
      
      console.log('✅ Trip created successfully:', trip);
      onCreateTrip(trip);
    } catch (error) {
      console.error('❌ Error creating trip:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      alert(`Error al crear el viaje: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-medium">Cargando viajes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-y-auto">
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-blue-900/50 transform rotate-3 hover:rotate-6 transition-transform duration-500 border border-white/10">
            <i className="fas fa-heart-pulse text-4xl text-white"></i>
          </div>
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-blue-200 mb-4 tracking-tight drop-shadow-lg">TripPulse</h1>
          <p className="text-blue-300 text-lg font-medium tracking-wide">Descubre. Planifica. Vive.</p>
        </div>

        {/* Trips List or Empty State */}
        {trips.length === 0 && !showCreateForm ? (
          <div className="max-w-md w-full text-center mb-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 mb-6">
              <i className="fas fa-map-marked-alt text-6xl text-blue-400 mb-6 opacity-50"></i>
              <h2 className="text-2xl font-bold text-white mb-3">¡Bienvenido!</h2>
              <p className="text-slate-300 leading-relaxed">
                Aún no tienes viajes planeados. Comienza creando tu primer itinerario.
              </p>
            </div>
          </div>
        ) : !showCreateForm ? (
          <div className="max-w-2xl w-full mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Tus Viajes</h2>
            <div className="grid gap-4">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group relative"
                >
                  <button
                    onClick={() => onSelectTrip(trip)}
                    className="flex items-center gap-4 w-full text-left"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <i className="fas fa-map-pin text-2xl text-white"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white truncate mb-1">{trip.name}</h3>
                      <p className="text-blue-300 text-sm">
                        <i className="fas fa-location-dot mr-2"></i>
                        {trip.city}{trip.country ? `, ${trip.country}` : ''}
                      </p>
                    </div>
                    <i className="fas fa-chevron-right text-slate-500 group-hover:text-blue-400 transition-colors"></i>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTrip(trip.id, trip.name);
                    }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                    title="Eliminar viaje"
                  >
                    <i className="fas fa-trash text-sm"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Create Form */}
        {showCreateForm ? (
          <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Nuevo Viaje</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">
                  <i className="fas fa-map-marker-alt mr-2"></i>
                  Buscar Destino *
                </label>
                <LocationSearchInput
                  onLocationSelect={handleLocationSelect}
                  placeholder="Busca tu ciudad o destino..."
                />
                {newTripData.baseLocation && (
                  <div className="mt-2 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-sm flex items-center gap-2">
                      <i className="fas fa-check-circle"></i>
                      <span className="font-medium">{newTripData.city}</span>
                      {newTripData.country && <span className="text-green-500/70">• {newTripData.country}</span>}
                    </p>
                    <p className="text-green-500/50 text-xs mt-1">
                      📍 {newTripData.baseLocation.lat.toFixed(4)}, {newTripData.baseLocation.lng.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">
                  Nombre del Viaje (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Vacaciones de Verano 2026"
                  value={newTripData.name}
                  onChange={(e) => setNewTripData({ ...newTripData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTripData({ name: '', city: '', country: '', baseLocation: null });
                }}
                className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTrip}
                className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/50 hover:shadow-blue-900/80 active:scale-[0.98] transition-all"
              >
                <i className="fas fa-plus-circle mr-2"></i>
                Crear Viaje
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl shadow-blue-900/50 hover:shadow-blue-900/80 active:scale-95 transition-all"
          >
            <i className="fas fa-plus-circle mr-3"></i>
            Crear Nuevo Viaje
          </button>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>Planifica, explora y disfruta cada momento</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
