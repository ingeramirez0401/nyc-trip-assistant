import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from './supabaseAuth.js';

const router = Router();

// Pública (sin requireAuth): un <img src> normal no puede mandar el
// Bearer token, y el nombre de foto es un token opaco de Google -- bajo
// riesgo. Limitada por tasa igual que el resto de rutas públicas del app.
const photoLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!GOOGLE_PLACES_API_KEY) {
  console.error('⚠️  GOOGLE_PLACES_API_KEY no configurada. Las rutas /api/places/* fallarán.');
}

// Autocomplete de lugares (ciudades, hoteles, POIs). El filtro por ciudad
// es opcional: si se manda `city` y `restrict=true` (default), EXCLUYE
// resultados fuera de esa ciudad -- tiene sentido dentro de un viaje ya
// creado (no vas a querer un café de París en tu viaje a Nueva York). Con
// `restrict=false` el viajero apagó el filtro a propósito ("quiero buscar
// fuera de la ciudad"): ahí no se manda bias ni restricción, búsqueda
// global sin sesgo.
router.get('/places/autocomplete', requireAuth, async (req, res) => {
  try {
    const { query, city, restrict } = req.query;
    if (!query || query.trim().length < 2) {
      return res.json({ predictions: [] });
    }
    if (!GOOGLE_PLACES_API_KEY) {
      return res.status(503).json({ error: 'Buscador de lugares no configurado' });
    }

    const restrictToCity = restrict !== 'false';
    let locationField = {};
    if (city && restrictToCity) {
      const circle = await buildCityBias(city);
      if (circle) locationField = { locationRestriction: circle };
    }

    const body = {
      input: query,
      languageCode: 'es',
      ...locationField,
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
        // Google ya los manda sin FieldMask extra en este endpoint -- se
        // usan en el cliente solo para elegir un ícono representativo por
        // resultado (restaurante, museo, parque...) en vez del mismo pin
        // genérico para todo.
        types: s.placePrediction.types || [],
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

    const response = await fetch(`https://places.googleapis.com/v1/places/${req.params.placeId}?languageCode=es`, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask':
          'displayName,formattedAddress,location,addressComponents,photos,' +
          'rating,userRatingCount,nationalPhoneNumber,websiteUri,regularOpeningHours.weekdayDescriptions',
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
      photoName: data.photos?.[0]?.name || null,
      rating: data.rating ?? null,
      ratingCount: data.userRatingCount ?? null,
      phone: data.nationalPhoneNumber || null,
      website: data.websiteUri || null,
      hours: data.regularOpeningHours?.weekdayDescriptions || null,
    });
  } catch (error) {
    console.error('Error obteniendo detalle de lugar:', error);
    res.status(500).json({ error: 'Error obteniendo el detalle del lugar' });
  }
});

// Sirve la foto real de un lugar (proxy: la Photo Media API de Google exige
// la key en cada pedido, así que no puede ir directo desde el navegador).
// photoName llega como "places/{placeId}/photos/{photoRef}" -- se usa un
// wildcard porque trae slashes.
router.get('/places/photo/*', photoLimiter, async (req, res) => {
  try {
    const photoName = req.params[0];
    if (!photoName || !photoName.startsWith('places/')) {
      return res.status(400).json({ error: 'photoName inválido' });
    }
    if (!GOOGLE_PLACES_API_KEY) {
      return res.status(503).json({ error: 'Buscador de lugares no configurado' });
    }

    const response = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${GOOGLE_PLACES_API_KEY}`
    );

    if (!response.ok) {
      console.error('Google Places photo error:', response.status);
      return res.status(502).json({ error: 'Error obteniendo la foto del lugar' });
    }

    res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('Error obteniendo foto de lugar:', error);
    res.status(500).json({ error: 'Error obteniendo la foto del lugar' });
  }
});

// Geocodifica una ciudad a un círculo de 30km -- se usa como locationRestriction
// (filtro duro) cuando el viajero deja el toggle "solo en esta ciudad"
// activado. Cache simple en memoria -- son siempre las mismas ciudades por trip.
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

// Corrige las coordenadas de un lugar generado por IA contra el lugar real
// en Google Places -- GPT puede "alucinar" un lat/lng que cae en la calle
// equivocada aunque el nombre y la dirección que dio sean correctos. Solo
// se pide `location` (el SKU más barato de Places): lo único que hace
// falta corregir es el pin, no el resto de los datos que ya generó GPT.
// Mejor esfuerzo -- si Places no encuentra el lugar, el caller debe seguir
// usando las coordenadas originales de la IA en vez de fallar.
export async function verifyPlaceLocation({ title, address, city, country }) {
  if (!GOOGLE_PLACES_API_KEY) return null;
  try {
    const textQuery = [title, address, city, country].filter(Boolean).join(', ');
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.location',
      },
      body: JSON.stringify({ textQuery, pageSize: 1 }),
    });
    if (!response.ok) return null;

    const data = await response.json();
    const location = data.places?.[0]?.location;
    if (!location) return null;

    return { lat: location.latitude, lng: location.longitude };
  } catch (error) {
    console.error('Error verificando ubicación con Places:', error);
    return null;
  }
}

export default router;
