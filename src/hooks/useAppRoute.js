import { useState, useEffect, useCallback } from 'react';

// Router minimalista para las secciones de nivel superior de la app (home,
// panel de agencia, viaje). No es una librería de routing completa a
// propósito -- sigue el mismo patrón manual que ya usa main.jsx para
// /debug y /admin/approve-agency, solo que reactivo (escucha popstate) para
// que el botón atrás/adelante y el refresh funcionen como en cualquier app
// web real, en vez de perder la vista actual y volver siempre a home.
function parsePath(pathname) {
  if (pathname === '/agencia') return { screen: 'agency' };

  const setupMatch = pathname.match(/^\/viaje\/([^/]+)\/configurar\/?$/);
  if (setupMatch) return { screen: 'trip-setup', tripId: setupMatch[1] };

  const tripMatch = pathname.match(/^\/viaje\/([^/]+)\/?$/);
  if (tripMatch) return { screen: 'trip', tripId: tripMatch[1] };

  return { screen: 'home' };
}

function pathFor(route) {
  switch (route.screen) {
    case 'agency':
      return '/agencia';
    case 'trip':
      return `/viaje/${route.tripId}`;
    case 'trip-setup':
      return `/viaje/${route.tripId}/configurar`;
    default:
      return '/';
  }
}

export function useAppRoute() {
  const [route, setRoute] = useState(() => parsePath(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setRoute(parsePath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((nextRoute, { replace = false } = {}) => {
    const path = pathFor(nextRoute);
    if (path !== window.location.pathname) {
      if (replace) {
        window.history.replaceState(null, '', path);
      } else {
        window.history.pushState(null, '', path);
      }
    }
    setRoute(nextRoute);
  }, []);

  return [route, navigate];
}
