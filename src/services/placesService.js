import { supabase } from '../lib/supabase';
import { assertOnline } from '../lib/connectivity';
import i18n from '../i18n';

async function callAPI(path) {
  assertOnline('searchPlaces');
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error(i18n.t('placeSearch:errors.notAuthenticated'));
  }

  const response = await fetch(`/api${path}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || i18n.t('placeSearch:errors.placesServiceGeneric'));
  }

  return data;
}

export const placesService = {
  // Devuelve sugerencias { placeId, text } mientras el usuario escribe.
  // `city` (opcional) restringe los resultados a esa ciudad cuando
  // `restrictToCity` es true (default) -- clave para no ofrecer un café de
  // París en un viaje a Nueva York. `restrictToCity=false` es el toggle
  // apagado a propósito: búsqueda global, sin sesgo.
  async autocomplete(query, city, restrictToCity = true) {
    const params = new URLSearchParams({ query, restrict: String(restrictToCity), lang: i18n.language });
    if (city) params.set('city', city);
    const { predictions } = await callAPI(`/places/autocomplete?${params.toString()}`);
    return predictions;
  },

  // Detalle completo (coordenadas, dirección, ciudad, país, foto) de una
  // sugerencia una vez que el usuario la selecciona.
  async getDetails(placeId) {
    return await callAPI(`/places/details/${encodeURIComponent(placeId)}?lang=${i18n.language}`);
  },

  // URL de la foto real del lugar (proxy propio -- Google exige la API key
  // en cada pedido de foto, no puede ir directo desde el navegador). Ruta
  // pública, sin bearer token, porque un <img src> no puede mandar uno.
  getPhotoUrl(photoName) {
    return photoName ? `/api/places/photo/${photoName}` : null;
  },
};
