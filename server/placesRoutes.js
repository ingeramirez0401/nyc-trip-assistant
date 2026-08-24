import { Router } from 'express';
import { requireAuth } from './supabaseAuth.js';

const router = Router();

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!GOOGLE_PLACES_API_KEY) {
  console.error('⚠️  GOOGLE_PLACES_API_KEY no configurada. Las rutas /api/places/* fallarán.');
}

// Autocomplete de lugares (ciudades, hoteles, POIs). El biasing por ciudad
// es opcional: si se manda `city`, prioriza resultados cerca del centro
// aproximado de esa ciudad (mejor para "busca tu hotel en Roma" que un
// autocomplete sin contexto geográfico).
router.get('/places/autocomplete', requireAuth, async (req, res) => {
  try {
    const { query, city } = req.query;
    if (!query || query.trim().length < 2) {
      return res.json({ predictions: [] });
    }
    if (!GOOGLE_PLACES_API_KEY) {
      return res.status(503).json({ error: 'Buscador de lugares no configurado' });
    }

    const body = {
      input: query,
      languageCode: 'es',
      ...(city && { locationBias: await buildCityBias(city) }),
    };

    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Google Places autocomplete error:', data);
      return res.status(502).json({ error: 'Error consultando el buscador de lugares' });
    }

    const predictions = (data.suggestions || [])
      .filter((s) => s.placePrediction)
      .map((s) => ({
        placeId: s.placePrediction.placeId,
        text: s.placePrediction.text?.text || '',
      }));

    res.json({ predictions });
  } catch (error) {
    console.error('Error en autocomplete de lugares:', error);
    res.status(500).json({ error: 'Error consultando el buscador de lugares' });
  }
});

// Detalle de un lugar (coordenadas, dirección) a partir del placeId que
// devolvió /autocomplete.
router.get('/places/details/:placeId', requireAuth, async (req, res) => {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return res.status(503).json({ error: 'Buscador de lugares no configurado' });
    }

    const response = await fetch(`https://places.googleapis.com/v1/places/${req.params.placeId}`, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'displayName,formattedAddress,location,addressComponents',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Google Places details error:', data);
      return res.status(502).json({ error: 'Error obteniendo el detalle del lugar' });
    }

    const cityComponent = (data.addressComponents || []).find((c) =>
      c.types.includes('locality') || c.types.includes('administrative_area_level_1')
    );
    const countryComponent = (data.addressComponents || []).find((c) => c.types.includes('country'));

    res.json({
      name: data.displayName?.text || '',
      address: data.formattedAddress || '',
      lat: data.location?.latitude,
      lng: data.location?.longitude,
      city: cityComponent?.longText || '',
      country: countryComponent?.longText || '',
    });
  } catch (error) {
    console.error('Error obteniendo detalle de lugar:', error);
    res.status(500).json({ error: 'Error obteniendo el detalle del lugar' });
  }
});

// Geocodifica una ciudad para usarla como sesgo geográfico del autocomplete.
// Cache simple en memoria -- son siempre las mismas ciudades por trip.
const cityBiasCache = new Map();
async function buildCityBias(city) {
  if (cityBiasCache.has(city)) return cityBiasCache.get(city);

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.location',
      },
      body: JSON.stringify({ textQuery: city, pageSize: 1 }),
    });
    const data = await response.json();
    const location = data.places?.[0]?.location;
    if (!location) return undefined;

    const bias = {
      circle: {
        center: { latitude: location.latitude, longitude: location.longitude },
        radius: 30000, // 30km alrededor del centro de la ciudad
      },
    };
    cityBiasCache.set(city, bias);
    return bias;
  } catch (error) {
    console.error('Error geocodificando ciudad para bias:', error);
    return undefined;
  }
}

export default router;
