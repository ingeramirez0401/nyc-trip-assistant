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
      setError(err.message);
      setLoading(false);
    };

    // Obtener posición inicial
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
      ...options
    });

    // Seguir actualizando la posición
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
        ...options
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { location, error, loading };
};
