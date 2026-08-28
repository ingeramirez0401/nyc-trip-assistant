import { useState, useEffect, useCallback } from 'react';

const ERROR_MESSAGES = {
  PERMISSION_DENIED: 'Permisos de ubicación denegados. Por favor, habilita los permisos en la configuración de tu dispositivo.',
  POSITION_UNAVAILABLE: 'Ubicación no disponible',
  TIMEOUT: 'Tiempo de espera agotado',
  UNSUPPORTED: 'Geolocalización no soportada',
};

// GeolocationPositionError no siempre está expuesto como global constructor
// en todos los motores -- más seguro comparar contra las constantes de la
// instancia del error mismo (garantizadas por el spec), igual que hacía el
// código original.
function codeToName(err) {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'PERMISSION_DENIED';
    case err.POSITION_UNAVAILABLE:
      return 'POSITION_UNAVAILABLE';
    case err.TIMEOUT:
      return 'TIMEOUT';
    default:
      return 'UNKNOWN';
  }
}

export const useGeolocation = (enabled = false, options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [loading, setLoading] = useState(false);
  // Permissions API (best-effort): iOS Safari lo soporta parcialmente, así
  // que puede quedar en 'unknown' ahí -- nunca romper por eso, solo no
  // tenemos el aviso proactivo antes de intentar en esa plataforma.
  const [permissionState, setPermissionState] = useState('unknown');
  // Incrementarlo fuerza al effect a re-correr sin depender de apagar/
  // prender `enabled` -- lo usa retry() para reintentar después de que el
  // usuario arregla el permiso en Configuración, sin recargar la página.
  const [retryToken, setRetryToken] = useState(0);
  const retry = useCallback(() => setRetryToken((t) => t + 1), []);

  // Consulta el estado del permiso ANTES de pedirlo -- así se puede avisar
  // "está bloqueado, así lo arreglas" sin esperar a que el usuario toque
  // el botón y se lleve un error genérico.
  useEffect(() => {
    if (!navigator.permissions?.query) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        if (cancelled) return;
        setPermissionState(status.state);
        status.onchange = () => setPermissionState(status.state);
      })
      .catch(() => {
        // Safari en iOS puede no soportar 'geolocation' como nombre de
        // permiso consultable -- queda en 'unknown', no es un error real.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Solo activar geolocalización si enabled es true
    if (!enabled) {
      setLocation(null);
      setError(null);
      setErrorCode(null);
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError(ERROR_MESSAGES.UNSUPPORTED);
      setErrorCode('UNSUPPORTED');
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
      setErrorCode(null);
    };

    const handleError = (err) => {
      const name = codeToName(err);
      setErrorCode(name);
      setError(ERROR_MESSAGES[name] || err.message);
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
  }, [enabled, retryToken]);

  return { location, error, errorCode, permissionState, loading, retry };
};
