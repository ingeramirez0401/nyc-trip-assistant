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

    // Obtener posición inicial con manejo de permisos explícito
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions);

    // Seguir actualizando la posición
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      geoOptions
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { location, error, loading };
};
