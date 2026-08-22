import express from 'express';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
// Nombre namespaced a propósito: evita colisión con la variable genérica
// OPENAI_API_KEY que herramientas como Ollama suelen dejar seteada
// globalmente en la máquina del desarrollador.
const OPENAI_API_KEY = process.env.TRIPPULSE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('⚠️  TRIPPULSE_OPENAI_API_KEY no configurada. Las rutas /api/ai/* fallarán.');
}
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('⚠️  SUPABASE_URL/ANON_KEY no configuradas. No se podrá verificar la sesión del usuario.');
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const app = express();
app.use(express.json());

// Verifica que la petición trae una sesión de Supabase válida antes de
// gastar cuota de OpenAI. Esto es lo que evita que cualquier visitante
// anónimo pueda pegarle directo al endpoint y generar costos.
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Sesión inválida o expirada' });
    }

    req.user = await response.json();
    next();
  } catch (err) {
    console.error('Error verificando sesión:', err);
    res.status(500).json({ error: 'Error verificando sesión' });
  }
}

// Límite defensivo de costos: 20 generaciones de IA por hora por IP.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de IA. Intenta de nuevo más tarde.' },
});

app.use('/api/ai', aiLimiter, requireAuth);

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
  try {
    const { stops } = req.body;
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

// En producción, el mismo proceso sirve el build estático de Vite.
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server listo en http://localhost:${PORT}`);
});
