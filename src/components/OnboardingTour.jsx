import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Los íconos son puramente visuales (clase FontAwesome) -- se quedan
// fuera de las traducciones; el texto de cada slide viene de
// connectivity.json#onboarding.slides (mismo orden, mismo índice).
const SLIDE_ICONS = ['fa-route', 'fa-map-location-dot', 'fa-wand-magic-sparkles', 'fa-camera-retro'];

const OnboardingTour = ({ onComplete }) => {
  const { t } = useTranslation('connectivity');
  const slides = t('connectivity:onboarding.slides', { returnObjects: true });
  const [step, setStep] = useState(0);
  const isLast = step === slides.length - 1;
  const slide = { ...slides[step], icon: SLIDE_ICONS[step] };

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-sm font-semibold z-10"
        >
          {t('connectivity:onboarding.skip')}
        </button>

        <div className="p-8 pt-14 text-center">
          <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-500/30 overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600">
            {step === 0 ? (
              <img src="/icons/icon-192x192.png" alt="TripPulse" className="w-full h-full object-cover" />
            ) : (
              <i className={`fas ${slide.icon} text-4xl text-white`}></i>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">{slide.title}</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8 min-h-[60px]">{slide.text}</p>

          <div className="flex items-center justify-center gap-2 mb-8">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-blue-500' : 'w-1.5 bg-white/20'}`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 bg-white/5 border border-white/10 text-slate-300 py-3 rounded-xl font-bold hover:bg-white/10 transition"
              >
                {t('connectivity:onboarding.back')}
              </button>
            )}
            <button
              onClick={() => (isLast ? onComplete() : setStep((s) => s + 1))}
              className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-[0.98] transition-all"
            >
              {isLast ? t('connectivity:onboarding.finish') : t('connectivity:onboarding.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
