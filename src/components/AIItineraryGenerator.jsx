import React, { useState } from 'react';
import LocationSearchInput from './LocationSearchInput';
import { useToast } from '../contexts/ToastContext';

const AIItineraryGenerator = ({ city, country, onGenerate, onCancel }) => {
  const toast = useToast();
  const [step, setStep] = useState(1);
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

  const totalSteps = 4;

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

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleGenerate = async () => {
    if (interests.length === 0) {
      toast.warning('Selecciona al menos un interés');
      return;
    }

    setGenerating(true);
    try {
      await onGenerate({ numDays, interests, budget, baseLocation });
    } catch (error) {
      console.error('Error generating:', error);
      toast.error('Error al generar itinerario. Por favor intenta de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  const getStepTitle = () => {
    switch(step) {
      case 1: return 'Duración del Viaje';
      case 2: return 'Intereses';
      case 3: return 'Presupuesto';
      case 4: return 'Alojamiento';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-white dark:bg-slate-900 md:bg-black/80 md:backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full md:w-full md:max-w-xl md:rounded-3xl shadow-2xl overflow-hidden border-none md:border md:border-slate-200 dark:md:border-white/10 flex flex-col h-full md:h-auto md:max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/10 bg-white dark:bg-white/5 shrink-0 safe-top">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={step > 1 ? handleBack : onCancel}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-700 dark:text-white transition"
            >
              <i className={`fas ${step > 1 ? 'fa-arrow-left' : 'fa-times'}`}></i>
            </button>
            <div className="text-center">
              <span className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest">Paso {step} de {totalSteps}</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{getStepTitle()}</h2>
            </div>
            <div className="w-10"></div> {/* Spacer for alignment */}
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900">
          
          {/* Step 1: Duration */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📅</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¿Cuántos días?</h3>
                <p className="text-slate-500 dark:text-slate-400">Define la duración de tu aventura en {city}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumDays(num)}
                    className={`p-4 rounded-xl font-bold transition-all border-2 ${
                      numDays === num
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg scale-105'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xl block mb-1">{num}</span>
                    <span className="text-xs uppercase opacity-70">{num === 1 ? 'Día' : 'Días'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Interests */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                 <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">✨</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¿Qué te apasiona?</h3>
                <p className="text-slate-500 dark:text-slate-400">Selecciona al menos uno para personalizar tu viaje</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {interestOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => toggleInterest(option.id)}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center ${
                      interests.includes(option.id)
                        ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 shadow-lg'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <i className={`fas ${option.icon} text-2xl ${interests.includes(option.id) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}></i>
                    <span className={`text-sm font-bold ${interests.includes(option.id) ? 'text-blue-700 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Budget */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">💸</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Tu Presupuesto</h3>
                <p className="text-slate-500 dark:text-slate-400">Para recomendarte los mejores lugares</p>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'low', icon: '💰', label: 'Económico', desc: 'Ahorro máximo, lugares gratuitos' },
                  { id: 'medium', icon: '💵', label: 'Moderado', desc: 'Equilibrio entre calidad y precio' },
                  { id: 'high', icon: '💎', label: 'Premium', desc: 'Experiencias exclusivas' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setBudget(opt.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${
                      budget === opt.id
                        ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 shadow-lg'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-3xl">{opt.icon}</span>
                    <div>
                      <div className={`font-bold ${budget === opt.id ? 'text-blue-700 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{opt.label}</div>
                      <div className="text-xs text-slate-500">{opt.desc}</div>
                    </div>
                    {budget === opt.id && <i className="fas fa-check-circle text-blue-500 ml-auto text-xl"></i>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Base Location */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🏨</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¿Dónde te hospedas?</h3>
                <p className="text-slate-500 dark:text-slate-400">Opcional: Para optimizar tus rutas diarias</p>
              </div>

              <LocationSearchInput
                onLocationSelect={handleLocationSelect}
                placeholder={`Busca tu hotel en ${city}...`}
              />

              {baseLocation && (
                <div className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-xl animate-fade-in">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-map-marker-alt text-green-600 dark:text-green-400 mt-1"></i>
                    <div className="flex-1">
                      <p className="text-green-800 dark:text-green-400 font-medium">{baseLocation.title}</p>
                      <p className="text-green-600 dark:text-green-500/70 text-sm mt-1">{baseLocation.desc}</p>
                    </div>
                    <button
                      onClick={() => setBaseLocation(null)}
                      className="text-green-600/50 hover:text-green-600 dark:text-green-500/50 dark:hover:text-green-400 transition"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4 mt-6">
                <div className="flex items-start gap-3">
                  <i className="fas fa-info-circle text-blue-500 dark:text-blue-400 mt-1"></i>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    La IA usará esta ubicación para planear el inicio y fin de tus días.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 shrink-0">
          {step < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={step === 2 && interests.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-900/50 hover:shadow-blue-900/80 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Continuar</span>
              <i className="fas fa-arrow-right"></i>
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-900/50 hover:shadow-emerald-900/80 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i>
                  <span>Creando tu viaje...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sparkles"></i>
                  <span>Generar Itinerario</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIItineraryGenerator;
