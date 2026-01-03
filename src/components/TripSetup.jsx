import React, { useState } from 'react';
import { dayService } from '../services/dayService';

const TripSetup = ({ trip, onComplete }) => {
  const [numDays, setNumDays] = useState(3);
  const [days, setDays] = useState([
    { title: 'Día 1', color: '#ef4444' },
    { title: 'Día 2', color: '#3b82f6' },
    { title: 'Día 3', color: '#10b981' },
  ]);
  const [baseLocation, setBaseLocation] = useState({
    title: '',
    lat: '',
    lng: '',
  });
  const [loading, setLoading] = useState(false);

  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

  const handleNumDaysChange = (num) => {
    setNumDays(num);
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

  const handleComplete = async () => {
    if (loading) return;

    try {
      setLoading(true);

      // Crear los días en Supabase
      const daysData = days.map((day, index) => ({
        dayNumber: index + 1,
        title: day.title,
        color: day.color,
      }));

      await dayService.createMultiple(trip.id, daysData);

      // Si hay base location, actualizar el viaje
      if (baseLocation.title && baseLocation.lat && baseLocation.lng) {
        const { tripService } = await import('../services/tripService');
        await tripService.update(trip.id, {
          ...trip,
          baseLocation: {
            lat: parseFloat(baseLocation.lat),
            lng: parseFloat(baseLocation.lng),
            title: baseLocation.title,
            desc: 'Base de Operaciones',
          },
        });
      }

      onComplete();
    } catch (error) {
      console.error('Error setting up trip:', error);
      alert('Error al configurar el viaje. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-y-auto">
      <div className="min-h-screen flex flex-col items-center justify-center p-6 py-12">
        
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-down">
          <h1 className="text-3xl font-bold text-white mb-2">Configurar Itinerario</h1>
          <p className="text-blue-300">
            <i className="fas fa-map-marked-alt mr-2"></i>
            {trip.name}
          </p>
        </div>

        <div className="max-w-2xl w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-8">
          
          {/* Number of Days */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
              ¿Cuántos días durará tu viaje?
            </label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumDaysChange(num)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${
                    numDays === num
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {num} {num === 1 ? 'día' : 'días'}
                </button>
              ))}
            </div>
          </div>

          {/* Days Configuration */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
              Personaliza tus días
            </label>
            <div className="space-y-3">
              {days.map((day, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={day.color}
                    onChange={(e) => handleDayChange(index, 'color', e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={day.title}
                    onChange={(e) => handleDayChange(index, 'title', e.target.value)}
                    placeholder={`Día ${index + 1}`}
                    className="flex-1 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Base Location (Optional) */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
              Ubicación Base (Opcional)
            </label>
            <p className="text-xs text-slate-400 mb-3">Hotel, Airbnb o punto de partida principal</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre del lugar"
                value={baseLocation.title}
                onChange={(e) => setBaseLocation({ ...baseLocation, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitud"
                  value={baseLocation.lat}
                  onChange={(e) => setBaseLocation({ ...baseLocation, lat: e.target.value })}
                  className="px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitud"
                  value={baseLocation.lng}
                  onChange={(e) => setBaseLocation({ ...baseLocation, lng: e.target.value })}
                  className="px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
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
