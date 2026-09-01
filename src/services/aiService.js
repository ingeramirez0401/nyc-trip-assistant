import { supabase } from '../lib/supabase';
import { assertOnline } from '../lib/connectivity';

// Las llamadas a OpenAI viven en el backend (server/index.js). La API key
// nunca se expone al navegador; aquí solo se llama al endpoint propio,
// adjuntando el token de sesión de Supabase para que el servidor pueda
// verificar que quien pide la generación es un usuario autenticado.
async function callAI(path, body) {
  assertOnline('generar un itinerario con IA');
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Debes iniciar sesión para usar la generación con IA.');
  }

  const response = await fetch(`/api/ai/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en el servicio de IA');
  }

  return data;
}

/**
 * Genera un itinerario completo usando IA
 * @param {Object} params - Parámetros del viaje
 * @param {string} params.city - Ciudad de destino
 * @param {string} params.country - País de destino
 * @param {number} params.numDays - Número de días del viaje
 * @param {Array<string>} params.interests - Intereses del usuario
 * @param {string} params.budget - Presupuesto (low, medium, high)
 * @returns {Promise<Object>} Itinerario generado
 */
export async function generateItinerary({ city, country, numDays, interests = [], budget = 'medium' }) {
  console.log('🤖 Generando itinerario con IA...', { city, country, numDays, interests, budget });
  const itinerary = await callAI('generate-itinerary', { city, country, numDays, interests, budget });
  console.log('✅ Itinerario generado:', itinerary);
  return itinerary;
}

/**
 * Genera sugerencias de lugares basadas en una consulta
 * @param {string} query - Consulta del usuario
 * @param {string} city - Ciudad actual
 * @returns {Promise<Array>} Lista de lugares sugeridos
 */
export async function getSuggestions(query, city) {
  const { places } = await callAI('suggestions', { query, city });
  return places || [];
}

/**
 * Optimiza el orden de lugares por distancia usando IA
 * @param {Array} stops - Lista de lugares
 * @returns {Promise<Array>} Lugares reordenados
 */
export async function optimizeRoute(stops) {
  try {
    const { stops: optimized } = await callAI('optimize-route', { stops });
    return optimized;
  } catch (error) {
    console.error('Error optimizing route:', error);
    return stops; // Retornar orden original si falla
  }
}
