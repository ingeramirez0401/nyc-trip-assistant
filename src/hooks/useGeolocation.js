import { useState, useEffect } from 'react';

export const useGeolocation = (enabled = false, options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Solo activar geolocalización si enabled es true
    if (!enabled) {
      setLocation(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocalización no soportada');
      setLoading(false);
      return;
    }

    setLoading(true);

    const handleSuccess = (position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
      setLoading(false);
      setError(null);
    };

    const handleError = (err) => {
      let errorMessage = 'Error al obtener ubicación';
      
      switch(err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Permisos de ubicación denegados. Por favor, habilita los permisos en la configuración de tu dispositivo.';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Ubicación no disponible';
          break;
        case err.TIMEOUT:
          errorMessage = 'Tiempo de espera agotado';
          break;
        default:
          errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    };

    // Configuración optimizada para iOS
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // Aumentado para iOS
      maximumAge: 5000, // Permitir caché reciente en iOS
      ...options
    };

    // Un solo watchPosition -- ya entrega la primera lectura apenas hay
    // permiso, igual que getCurrentPosition. Tener las dos llamadas activas
    // a la vez (como estaba antes) le pide a iOS Safari dos sesiones de
    // localización simultáneas con enableHighAccuracy, y ahí es donde
    // CoreLocation se pone errático -- no es solo redundante, es la causa
    // más probable de "en iOS no anda bien".
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      geoOptions
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { location, error, loading };
};
