import OpenAI from 'openai';

// Inicializar OpenAI con la API key desde variables de entorno
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Solo para desarrollo, en producción usar backend
});

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
  try {
    console.log('🤖 Generando itinerario con IA...', { city, country, numDays, interests, budget });

    const interestsText = interests.length > 0 
      ? interests.join(', ') 
      : 'turismo general, cultura, gastronomía';

    const budgetText = {
      low: 'económico, buscando opciones gratuitas o de bajo costo',
      medium: 'moderado, equilibrando calidad y precio',
      high: 'premium, priorizando experiencias exclusivas'
    }[budget];

    const prompt = `Eres un experto en planificación de viajes. Crea un itinerario detallado para un viaje a ${city}, ${country}.

REQUISITOS:
- Duración: ${numDays} días
- Intereses: ${interestsText}
- Presupuesto: ${budgetText}
- Incluir coordenadas GPS reales y precisas para cada lugar
- Lugares deben ser reales y verificables
- Orden optimizado por proximidad geográfica
- Tips locales únicos y prácticos

FORMATO DE RESPUESTA (JSON estricto):
{
  "days": [
    {
      "dayNumber": 1,
      "title": "Título temático del día",
      "color": "#hexcolor",
      "stops": [
        {
          "title": "Nombre del lugar",
          "lat": 40.7580,
          "lng": -73.9855,
          "category": "Icono|Cultura|Gastronomía|Naturaleza|Arte|Museo|Compras|Vida Nocturna",
          "tip": "Consejo práctico y específico",
          "time": "Tiempo sugerido (ej: 2 horas)",
          "address": "Dirección completa"
        }
      ]
    }
  ]
}

IMPORTANTE:
- Cada día debe tener 4-6 lugares
- Coordenadas deben ser precisas (verificadas)
- Tips deben ser únicos, no genéricos
- Categorías deben ser una de las listadas
- Colores en formato hexadecimal
- Responde SOLO con el JSON, sin texto adicional`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente experto en planificación de viajes que genera itinerarios detallados en formato JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    console.log('✅ Respuesta de OpenAI recibida');

    const itinerary = JSON.parse(responseText);
    
    // Validar estructura
    if (!itinerary.days || !Array.isArray(itinerary.days)) {
      throw new Error('Formato de itinerario inválido');
    }

    console.log('✅ Itinerario generado:', itinerary);
    return itinerary;

  } catch (error) {
    console.error('❌ Error generando itinerario:', error);
    throw new Error(`Error al generar itinerario: ${error.message}`);
  }
}

/**
 * Genera sugerencias de lugares basadas en una consulta
 * @param {string} query - Consulta del usuario
 * @param {string} city - Ciudad actual
 * @returns {Promise<Array>} Lista de lugares sugeridos
 */
export async function getSuggestions(query, city) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente de viajes experto en ${city}. Responde con lugares específicos en formato JSON.`
        },
        {
          role: 'user',
          content: `${query}\n\nResponde con JSON: { "places": [{ "title": "", "lat": 0, "lng": 0, "category": "", "tip": "" }] }`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content);
    return response.places || [];

  } catch (error) {
    console.error('Error getting suggestions:', error);
    throw error;
  }
}

/**
 * Optimiza el orden de lugares por distancia usando IA
 * @param {Array} stops - Lista de lugares
 * @returns {Promise<Array>} Lugares reordenados
 */
export async function optimizeRoute(stops) {
  try {
    const stopsData = stops.map(s => ({
      title: s.title,
      lat: s.lat,
      lng: s.lng
    }));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en optimización de rutas turísticas.'
        },
        {
          role: 'user',
          content: `Optimiza esta ruta minimizando distancia total: ${JSON.stringify(stopsData)}\n\nResponde con JSON: { "optimizedOrder": [0, 2, 1, 3...] }`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content);
    return response.optimizedOrder.map(index => stops[index]);

  } catch (error) {
    console.error('Error optimizing route:', error);
    return stops; // Retornar orden original si falla
  }
}
