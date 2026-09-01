import { useState, useEffect } from 'react';
import { isOnline } from '../lib/connectivity';

// navigator.onLine + eventos online/offline -- refleja si el dispositivo
// tiene alguna interfaz de red activa. No garantiza que Supabase sea
// alcanzable (podría haber wifi sin internet real), pero es la señal
// estándar del navegador y coincide con lo que assertOnline() usa para
// cortar acciones antes de intentarlas.
export function useOnlineStatus() {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
