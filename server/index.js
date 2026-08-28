import express from 'express';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from './supabaseAuth.js';
import licenseRoutes from './licenseRoutes.js';
import placesRoutes from './placesRoutes.js';
import agencyRequestRoutes from './agencyRequestRoutes.js';

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

const app = express();
app.use(express.json());

app.use('/api', licenseRoutes);
app.use('/api', agencyRequestRoutes);

// Límite defensivo de costos: 20 generaciones de IA por hora por IP.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de IA. Intenta de nuevo más tarde.' },
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
  message: { error: 'Demasiadas búsquedas de lugares. Espera un momento.' },
});

app.use('/api/places', placesLimiter);
app.use('/api', placesRoutes);

app.post('/api/ai/generate-itinerary', async (req, res) => {
  try {
    const { city, country, numDays, interests = [], budget = 'medium' } = req.body;

    if (!city || !country || !numDays) {
      return res.status(400).json({ error: 'city, country y numDays son requeridos' });
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
- Responde SOLO con el JSON, sin texto adicional`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente experto en planificación de viajes que genera itinerarios detallados en formato JSON.',
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

    res.json(itinerary);
  } catch (error) {
    console.error('❌ Error generando itinerario:', error);
    res.status(500).json({ error: `Error al generar itinerario: ${error.message}` });
  }
});

app.post('/api/ai/suggestions', async (req, res) => {
  try {
    const { query, city } = req.body;
    if (!query || !city) {
      return res.status(400).json({ error: 'query y city son requeridos' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente de viajes experto en ${city}. Responde con lugares específicos en formato JSON.`,
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
  const { stops } = req.body;
  try {
    if (!Array.isArray(stops) || stops.length === 0) {
      return res.status(400).json({ error: 'stops es requerido' });
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
