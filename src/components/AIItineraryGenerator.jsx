import React, { useState } from 'react';
import LocationSearchInput from './LocationSearchInput';

const AIItineraryGenerator = ({ city, country, onGenerate, onCancel }) => {
  const [numDays, setNumDays] = useState(3);
  const [interests, setInterests] = useState([]);
  const [budget, setBudget] = useState('medium');
  const [baseLocation, setBaseLocation] = useState(null);
  const [generating, setGenerating] = useState(false);

  const interestOptions = [
    { id: 'art', label: '🎨 Arte', icon: 'fa-palette' },
    { id: 'food', label: '🍽️ Gastronomía', icon: 'fa-utensils' },
    { id: 'history', label: '🏛️ Historia', icon: 'fa-landmark' },
    { id: 'nature', label: '🌳 Naturaleza', icon: 'fa-tree' },
    { id: 'nightlife', label: '🌃 Vida Nocturna', icon: 'fa-moon' },
    { id: 'shopping', label: '🛍️ Compras', icon: 'fa-shopping-bag' },
    { id: 'adventure', label: '⛰️ Aventura', icon: 'fa-hiking' },
    { id: 'culture', label: '🎭 Cultura', icon: 'fa-masks-theater' }
  ];

  const toggleInterest = (id) => {
    setInterests(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleLocationSelect = (locationData) => {
    setBaseLocation({
      lat: locationData.lat,
      lng: locationData.lng,
      title: locationData.name,
      desc: locationData.address,
    });
  };

  const handleGenerate = async () => {
    if (interests.length === 0) {
      alert('Selecciona al menos un interés');
      return;
    }

    setGenerating(true);
    try {
      await onGenerate({ numDays, interests, budget, baseLocation });
    } catch (error) {
      console.error('Error generating:', error);
      alert('Error al generar itinerario. Por favor intenta de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/10">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <i className="fas fa-sparkles text-2xl text-white"></i>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">Generar con IA</h2>
              <p className="text-blue-300 text-sm">
                <i className="fas fa-map-marked-alt mr-2"></i>
                {city}, {country}
              </p>
            </div>
            <button 
              onClick={onCancel}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Number of Days */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
              ¿Cuántos días?
            </label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumDays(num)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${
                    numDays === num
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Base Location (Optional) */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
              <i className="fas fa-hotel mr-2"></i>
              Ubicación Base (Opcional)
            </label>
            <p className="text-xs text-slate-400 mb-3">Busca tu hotel, Airbnb o punto de partida principal</p>
            <LocationSearchInput
              onLocationSelect={handleLocationSelect}
              placeholder={`Busca tu alojamiento en ${city}...`}
            />
            {baseLocation && (
              <div className="mt-3 p-4 bg-green-900/20 border border-green-500/30 rounded-xl animate-fade-in">
                <div className="flex items-start gap-3">
                  <i className="fas fa-map-marker-alt text-green-400 mt-1"></i>
                  <div className="flex-1">
                    <p className="text-green-400 font-medium">{baseLocation.title}</p>
                    <p className="text-green-500/70 text-sm mt-1">{baseLocation.desc}</p>
                    <p className="text-green-500/50 text-xs mt-2">
                      📍 {baseLocation.lat.toFixed(4)}, {baseLocation.lng.toFixed(4)}
                    </p>
                  </div>
                  <button
                    onClick={() => setBaseLocation(null)}
                    className="text-green-500/50 hover:text-green-400 transition"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
              ¿Qué te interesa? (Selecciona varios)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {interestOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => toggleInterest(option.id)}
                  className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                    interests.includes(option.id)
                      ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                      : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'
                  }`}
                >
                  <i className={`fas ${option.icon} text-2xl ${interests.includes(option.id) ? 'text-blue-400' : 'text-slate-400'}`}></i>
                  <span className={`text-xs font-bold ${interests.includes(option.id) ? 'text-white' : 'text-slate-400'}`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
              Presupuesto
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setBudget('low')}
                className={`p-4 rounded-xl border transition-all ${
                  budget === 'low'
                    ? 'bg-green-600/20 border-green-500 shadow-lg'
                    : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'
                }`}
              >
                <div className="text-2xl mb-2">💰</div>
                <div className={`text-sm font-bold ${budget === 'low' ? 'text-white' : 'text-slate-400'}`}>
                  Económico
                </div>
              </button>
              <button
                onClick={() => setBudget('medium')}
                className={`p-4 rounded-xl border transition-all ${
                  budget === 'medium'
                    ? 'bg-blue-600/20 border-blue-500 shadow-lg'
                    : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'
                }`}
              >
                <div className="text-2xl mb-2">💵</div>
                <div className={`text-sm font-bold ${budget === 'medium' ? 'text-white' : 'text-slate-400'}`}>
                  Moderado
                </div>
              </button>
              <button
                onClick={() => setBudget('high')}
                className={`p-4 rounded-xl border transition-all ${
                  budget === 'high'
                    ? 'bg-purple-600/20 border-purple-500 shadow-lg'
                    : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'
                }`}
              >
                <div className="text-2xl mb-2">💎</div>
                <div className={`text-sm font-bold ${budget === 'high' ? 'text-white' : 'text-slate-400'}`}>
                  Premium
                </div>
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <i className="fas fa-info-circle text-blue-400 mt-1"></i>
              <div className="text-sm text-blue-200">
                <p className="font-bold mb-1">La IA creará un itinerario personalizado</p>
                <p className="text-blue-300/80">Incluirá lugares reales con coordenadas, tips locales y tiempos estimados optimizados por distancia.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={generating}
            className="flex-1 bg-slate-800 text-slate-300 py-4 rounded-xl font-bold hover:bg-slate-700 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || interests.length === 0}
            className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-900/50 hover:shadow-blue-900/80 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <i className="fas fa-circle-notch fa-spin"></i>
                <span>Generando con IA...</span>
              </>
            ) : (
              <>
                <i className="fas fa-sparkles"></i>
                <span>Generar Itinerario</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIItineraryGenerator;
