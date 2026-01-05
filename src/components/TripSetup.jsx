import React, { useState } from 'react';
import { dayService } from '../services/dayService';
import LocationSearchInput from './LocationSearchInput';
import { useToast } from '../contexts/ToastContext';

const TripSetup = ({ trip, onComplete }) => {
  const toast = useToast();
  const [numDays, setNumDays] = useState(3);
  const [customDays, setCustomDays] = useState('');
  const [showCustomDays, setShowCustomDays] = useState(false);
  const [days, setDays] = useState([
    { title: 'Día 1', color: '#ef4444' },
    { title: 'Día 2', color: '#3b82f6' },
    { title: 'Día 3', color: '#10b981' },
  ]);
  const [baseLocation, setBaseLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

  const handleNumDaysChange = (num) => {
    setNumDays(num);
    setShowCustomDays(false);
    updateDaysList(num);
  };

  const handleCustomDaysChange = (e) => {
    const val = parseInt(e.target.value);
    setCustomDays(e.target.value);
    if (val > 0) {
      setNumDays(val);
      updateDaysList(val);
    }
  };

  const updateDaysList = (num) => {
    const newDays = [];
    for (let i = 0; i < num; i++) {
      if (days[i]) {
        newDays.push(days[i]);
      } else {
        newDays.push({
          title: `Día ${i + 1}`,
          color: colors[i % colors.length],
        });
      }
    }
    setDays(newDays);
  };

  const handleDayChange = (index, field, value) => {
    const newDays = [...days];
    newDays[index][field] = value;
    setDays(newDays);
  };

  const handleLocationSelect = (locationData) => {
    setBaseLocation({
      lat: locationData.lat,
      lng: locationData.lng,
      title: locationData.name,
      desc: locationData.address,
    });
  };

  const handleComplete = async () => {
    if (loading) return;

    try {
      setLoading(true);

      // Verificar si ya existen días para este viaje
      const existingDays = await dayService.getByTripId(trip.id);

      if (existingDays && existingDays.length > 0) {
        // Si ya existen días, no intentar crear duplicados
        console.log('⚠️ Days already exist for this trip, skipping creation');
      } else {
        // Crear los días en Supabase solo si no existen
        const daysData = days.map((day, index) => ({
          dayNumber: index + 1,
          title: day.title,
          color: day.color,
        }));

        await dayService.createMultiple(trip.id, daysData);
      }

      // Si hay base location, actualizar el viaje
      if (baseLocation) {
        const { tripService } = await import('../services/tripService');
        await tripService.update(trip.id, {
          name: trip.name,
          city: trip.city,
          country: trip.country,
          baseLocation: baseLocation,
        });
      }

      onComplete();
    } catch (error) {
      console.error('Error setting up trip:', error);
      toast.error('Error al configurar el viaje. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 md:bg-gradient-to-br md:from-slate-900 md:via-blue-900 md:to-slate-900 overflow-y-auto transition-colors duration-300">
      <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 py-12">
        
        {/* Header */}
        <div className="text-center mb-6 md:mb-8 animate-fade-in-down">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">Configurar Itinerario</h1>
          <p className="text-blue-500 dark:text-blue-300 text-sm md:text-base">
            <i className="fas fa-map-marked-alt mr-2"></i>
            {trip.name}
          </p>
        </div>

        <div className="max-w-2xl w-full bg-white dark:bg-slate-900/80 md:dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 space-y-8 shadow-xl md:shadow-2xl">
          
          {/* Number of Days */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
              ¿Cuántos días durará tu viaje?
            </label>
            <div className="flex gap-2 flex-wrap justify-center md:justify-start">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumDaysChange(num)}
                  className={`w-12 h-12 md:w-auto md:h-auto md:px-6 md:py-3 rounded-xl font-bold transition-all flex items-center justify-center ${
                    numDays === num && !showCustomDays
                      ? 'bg-blue-600 text-white shadow-lg scale-110'
                      : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {num} <span className="hidden md:inline ml-1">{num === 1 ? 'día' : 'días'}</span>
                </button>
              ))}
              <button
                onClick={() => setShowCustomDays(true)}
                className={`w-12 h-12 md:w-auto md:h-auto md:px-6 md:py-3 rounded-xl font-bold transition-all flex items-center justify-center ${
                  showCustomDays
                    ? 'bg-blue-600 text-white shadow-lg scale-110'
                    : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                +
              </button>
            </div>

            {showCustomDays && (
                <div className="animate-fade-in mt-4">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Ingresa el número de días:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={customDays}
                    onChange={handleCustomDaysChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
                    placeholder="Ej: 10"
                    autoFocus
                  />
                </div>
            )}
          </div>

          {/* Days Configuration */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
              Personaliza tus días
            </label>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {days.map((day, index) => (
                <div key={index} className="flex gap-3 items-center bg-slate-50 dark:bg-slate-800/30 p-2 rounded-xl border border-slate-200 dark:border-white/5">
                  <input
                    type="color"
                    value={day.color}
                    onChange={(e) => handleDayChange(index, 'color', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                  <div className="flex-1">
                     <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-wider block mb-0.5">Día {index + 1}</span>
                     <input
                      type="text"
                      value={day.title}
                      onChange={(e) => handleDayChange(index, 'title', e.target.value)}
                      placeholder={`Título del Día ${index + 1}`}
                      className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Base Location (Optional) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
              <i className="fas fa-hotel mr-2"></i>
              Ubicación Base (Opcional)
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Busca tu hotel, Airbnb o punto de partida principal</p>
            <LocationSearchInput
              onLocationSelect={handleLocationSelect}
              placeholder="Busca tu hotel o alojamiento..."
            />
            {baseLocation && (
              <div className="mt-3 p-4 bg-green-500/10 dark:bg-green-900/20 border border-green-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <i className="fas fa-map-marker-alt text-green-600 dark:text-green-400 mt-1"></i>
                  <div className="flex-1">
                    <p className="text-green-700 dark:text-green-400 font-medium">{baseLocation.title}</p>
                    <p className="text-green-600/70 dark:text-green-500/70 text-sm mt-1">{baseLocation.desc}</p>
                  </div>
                  <button
                    onClick={() => setBaseLocation(null)}
                    className="text-green-600/50 dark:text-green-500/50 hover:text-green-700 dark:hover:text-green-400 transition"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4">
            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-900/50 hover:shadow-blue-900/80 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin mr-2"></i>
                  Creando itinerario...
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle mr-2"></i>
                  Comenzar a Planear
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripSetup;
