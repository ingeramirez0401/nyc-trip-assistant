import express from 'express';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from './supabaseAuth.js';
import licenseRoutes from './licenseRoutes.js';
import placesRoutes, { verifyPlaceLocation } from './placesRoutes.js';
import agencyRequestRoutes from './agencyRequestRoutes.js';
import { resolveLang as resolveReqLang, tr } from './lib/serverI18n.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3001;
// Nombre namespaced a propósito: evita colisión con la variable genérica
// OPENAI_API_KEY que herramientas como Ollama suelen dejar seteada
// globalmente en la máquina del desarrollador.
const OPENAI_API_KEY = process.env.TRIPPULSE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('⚠️  TRIPPULSE_OPENAI_API_KEY no configurada. Las rutas /api/ai/* fallarán.');
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// El idioma que manda el cliente (i18n.language, ver src/i18n/index.js) se
// traduce a un nombre legible para metérselo al prompt -- whitelist
// explícita, 'es' de default para cualquier valor inesperado.
const LANG_NAME = { es: 'español', en: 'inglés (English)' };
const resolveLang = (lang) => (lang === 'en' ? 'en' : 'es');

const app = express();

// En producción esto corre detrás de Traefik (ver docker-compose.yml) --
// sin esto, Express no confía en el header X-Forwarded-For que pone
// Traefik, y express-rate-limit no puede resolver la IP real de cada
// usuario para contar sus límites (tira ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// en cada request). `1` = confiar exactamente un salto de proxy (Traefik),
// no toda la cadena -- evita que un cliente falsifique su propio
// X-Forwarded-For para saltarse el rate limit.
app.set('trust proxy', 1);

app.use(express.json());

app.use('/api', licenseRoutes);
app.use('/api', agencyRequestRoutes);

// Límite defensivo de costos: 20 generaciones de IA por hora por IP.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: (req) => ({ error: tr(resolveReqLang(req), 'Demasiadas solicitudes de IA. Intenta de nuevo más tarde.') }),
});

app.use('/api/ai', aiLimiter, requireAuth);

// Límite defensivo de costos: cada autocomplete cuesta dinero en Google
// Places, así que se limita más generoso que IA (es texto-mientras-escribes)
// pero sigue acotado.
const placesLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: (req) => ({ error: tr(resolveReqLang(req), 'Demasiadas búsquedas de lugares. Espera un momento.') }),
});

app.use('/api/places', placesLimiter);
app.use('/api', placesRoutes);

app.post('/api/ai/generate-itinerary', async (req, res) => {
  // Declarado fuera del try -- el catch también lo necesita (para traducir
  // su propio mensaje de error) y una const dentro de try no es visible
  // desde el catch, son bloques de scope distintos.
  const lang = resolveLang(req.body?.language);
  try {
    const { city, country, numDays, interests = [], budget = 'medium' } = req.body;

    if (!city || !country || !numDays) {
      return res.status(400).json({ error: tr(lang, 'city, country y numDays son requeridos') });
    }

    const interestsText = interests.length > 0
      ? interests.join(', ')
      : 'turismo general, cultura, gastronomía';

    const budgetText = {
      low: 'económico, buscando opciones gratuitas o de bajo costo',
      medium: 'moderado, equilibrando calidad y precio',
      high: 'premium, priorizando experiencias exclusivas',
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
          "category": "Icono|Cultura|Restaurante|Naturaleza|Arte|Museo|Compras|Entretenimiento|Vista|Paseo",
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
- El texto para el viajero (title, tip, time, address, título del día) debe estar en ${LANG_NAME[lang]}
- El campo "category" es un código interno fijo: escríbelo SIEMPRE en español exactamente como aparece en la lista de arriba (Icono, Cultura, Restaurante...), sin traducir, aunque el resto de la respuesta esté en inglés
- Responde SOLO con el JSON, sin texto adicional`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente experto en planificación de viajes que genera itinerarios detallados en formato JSON. Responde en ${LANG_NAME[lang]}.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const itinerary = JSON.parse(completion.choices[0].message.content);

    if (!itinerary.days || !Array.isArray(itinerary.days)) {
      throw new Error('Formato de itinerario inválido');
    }

    // GPT puede alucinar coordenadas que caen en la calle equivocada aunque
    // el nombre del lugar sea real -- se corrigen contra Google Places antes
    // de que lleguen al mapa del viajero. Corre en paralelo (no una por una)
    // para no sumarle una latencia grande a una respuesta que ya tarda por
    // el propio llamado a GPT-4o; mejor esfuerzo, un lugar que Places no
    // encuentre se queda con las coordenadas originales de la IA.
    await Promise.all(
      itinerary.days.flatMap((day) =>
        (Array.isArray(day.stops) ? day.stops : []).map(async (stop) => {
          const verified = await verifyPlaceLocation({
            title: stop.title,
            address: stop.address,
            city,
            country,
          });
          if (verified) {
            stop.lat = verified.lat;
            stop.lng = verified.lng;
          }
        })
      )
    );

    res.json(itinerary);
  } catch (error) {
    console.error('❌ Error generando itinerario:', error);
    const errorPrefix = tr(lang, 'Error al generar itinerario');
    res.status(500).json({ error: `${errorPrefix}: ${error.message}` });
  }
});

app.post('/api/ai/suggestions', async (req, res) => {
  try {
    const { query, city, language } = req.body;
    const lang = resolveLang(language);
    if (!query || !city) {
      return res.status(400).json({ error: tr(lang, 'query y city son requeridos') });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente de viajes experto en ${city}. Responde con lugares específicos en formato JSON. Responde en ${LANG_NAME[lang]}. El campo "category" es un código interno fijo en español, no lo traduzcas.`,
        },
        {
          role: 'user',
          content: `${query}\n\nResponde con JSON: { "places": [{ "title": "", "lat": 0, "lng": 0, "category": "", "tip": "" }] }`,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const response = JSON.parse(completion.choices[0].message.content);
    res.json({ places: response.places || [] });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/optimize-route', async (req, res) => {
  const { stops, language } = req.body;
  const lang = resolveLang(language);
  try {
    if (!Array.isArray(stops) || stops.length === 0) {
      return res.status(400).json({ error: tr(lang, 'stops es requerido') });
    }

    const stopsData = stops.map((s) => ({ title: s.title, lat: s.lat, lng: s.lng }));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Eres un experto en optimización de rutas turísticas.' },
        {
          role: 'user',
          content: `Optimiza esta ruta minimizando distancia total: ${JSON.stringify(stopsData)}\n\nResponde con JSON: { "optimizedOrder": [0, 2, 1, 3...] }`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const response = JSON.parse(completion.choices[0].message.content);
    const optimizedOrder = Array.isArray(response.optimizedOrder) ? response.optimizedOrder : null;
    res.json({ stops: optimizedOrder ? optimizedOrder.map((i) => stops[i]) : stops });
  } catch (error) {
    console.error('Error optimizing route:', error);
    res.json({ stops }); // Degradar con orden original si falla, igual que el comportamiento anterior
  }
});

// Plantilla de correo de confirmación con la marca de TripPulse, para que
// GoTrue (Supabase Auth) la use en vez de su template plano por defecto.
// GoTrue la pide por HTTP GET server-to-server -- ver
// GOTRUE_MAILER_TEMPLATES_CONFIRMATION en la config de Supabase (fuera de
// este repo). Debe ir ANTES del catch-all del SPA, si no éste la intercepta
// y devuelve index.html en vez del template.
app.get('/email-templates/confirmation.html', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(__dirname, 'email-templates', 'confirmation.html'));
});

app.get('/email-templates/recovery.html', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(__dirname, 'email-templates', 'recovery.html'));
});

// En producción, el mismo proceso sirve el build estático de Vite.
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server listo en http://localhost:${PORT}`);
});
