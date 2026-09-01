import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToast } from '../contexts/ToastContext';

// registerType:'prompt' en vite.config.js deja el registro y el aviso de
// actualización en manos de este componente en vez de que Workbox recargue
// solo -- así el viajero nunca pierde una nota a medio escribir por un
// refresh silencioso en segundo plano.
const PwaUpdateBanner = () => {
  const toast = useToast();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('Error registrando el service worker:', error);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    toast.success('TripPulse ya puede abrir sin conexión.');
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady, toast]);

  if (!needRefresh) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-white/10 flex items-center gap-3 animate-fade-in-up"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      role="status"
    >
      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
        <i className="fas fa-arrows-rotate text-blue-400"></i>
      </div>
      <p className="flex-1 text-sm font-medium leading-snug">Hay una versión nueva de TripPulse</p>
      <button
        onClick={() => updateServiceWorker(true)}
        className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition active:scale-95"
      >
        Actualizar
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        aria-label="Cerrar aviso de actualización"
        className="shrink-0 text-slate-400 hover:text-white transition"
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default PwaUpdateBanner;
