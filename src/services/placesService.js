import { supabase } from '../lib/supabase';

async function callAPI(path) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Debes iniciar sesión.');
  }

  const response = await fetch(`/api${path}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en el buscador de lugares');
  }

  return data;
}

export const placesService = {
  // Devuelve sugerencias { placeId, text } mientras el usuario escribe.
  // `city` (opcional) sesga los resultados hacia esa ciudad -- clave para
  // encontrar un hotel/POI específico en vez de resultados genéricos.
  async autocomplete(query, city) {
    const params = new URLSearchParams({ query });
    if (city) params.set('city', city);
    const { predictions } = await callAPI(`/places/autocomplete?${params.toString()}`);
    return predictions;
  },

  // Detalle completo (coordenadas, dirección, ciudad, país, foto) de una
  // sugerencia una vez que el usuario la selecciona.
  async getDetails(placeId) {
    return await callAPI(`/places/details/${encodeURIComponent(placeId)}`);
  },

  // URL de la foto real del lugar (proxy propio -- Google exige la API key
  // en cada pedido de foto, no puede ir directo desde el navegador). Ruta
  // pública, sin bearer token, porque un <img src> no puede mandar uno.
  getPhotoUrl(photoName) {
    return photoName ? `/api/places/photo/${photoName}` : null;
  },
};
