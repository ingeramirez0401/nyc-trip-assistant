import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Detección de plataforma solo para elegir qué instrucciones mostrar --
// nunca para gatear funcionalidad, así que el riesgo de un user-agent raro
// es cosmético (instrucciones genéricas de más), no funcional.
function detectPlatform() {
  const ua = navigator.userAgent || '';
  // iPadOS 13+ reporta como "Macintosh" en el UA pero tiene soporte táctil
  // multi-touch real, a diferencia de un Mac de escritorio.
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

// El ícono por plataforma es puramente visual (nombre de clase FontAwesome,
// no texto) -- se queda fuera de las traducciones, solo los pasos vienen
// de connectivity.json#locationHelp.steps.<platform>.
const PLATFORM_ICON = {
  ios: 'fa-mobile-screen',
  android: 'fa-mobile-screen-button',
  desktop: 'fa-desktop',
};

const LocationPermissionHelp = ({ onRetry, onClose }) => {
  const { t } = useTranslation('connectivity');
  const [platform] = useState(detectPlatform);
  const [retrying, setRetrying] = useState(false);
  const icon = PLATFORM_ICON[platform];
  const steps = t(`connectivity:locationHelp.steps.${platform}`, { returnObjects: true });

  const handleRetry = async () => {
    setRetrying(true);
    onRetry();
    // El navegador no avisa cuando termina de reintentar -- esto es solo
    // para que el botón no se sienta muerto mientras el usuario vuelve.
    setTimeout(() => setRetrying(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-[2500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in-down">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/15 mx-auto flex items-center justify-center mb-3">
            <i className={`fas ${icon} text-2xl text-white`}></i>
          </div>
          <h2 className="text-white font-bold text-lg">{t('connectivity:locationHelp.title')}</h2>
          <p className="text-blue-100 text-sm mt-1">{t('connectivity:locationHelp.subtitle')}</p>
        </div>

        <div className="p-6">
          <ol className="space-y-3 mb-6">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{step}</span>
              </li>
            ))}
          </ol>

          <button
            onClick={handleRetry}
            disabled={retrying}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {retrying ? (
              <>
                <i className="fas fa-circle-notch fa-spin"></i>
                {t('connectivity:locationHelp.retrying')}
              </>
            ) : (
              <>
                <i className="fas fa-rotate-right"></i>
                {t('connectivity:locationHelp.retry')}
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full text-slate-500 dark:text-slate-400 py-3 text-sm font-medium mt-1 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            {t('connectivity:locationHelp.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionHelp;
