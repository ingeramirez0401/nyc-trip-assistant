# 🤖 Configuración de IA en TripPulse

## 📦 Instalación de Dependencias

Ejecuta en la terminal:

```bash
npm install openai
```

## 🔑 Configuración de API Key

### 1. Obtener tu API Key de OpenAI

1. Ve a [platform.openai.com](https://platform.openai.com)
2. Inicia sesión con tu cuenta
3. Ve a **API Keys** en el menú
4. Crea una nueva API key
5. **Copia la key** (solo se muestra una vez)

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Supabase (ya existentes)
VITE_SUPABASE_URL=https://devsupabase.cambiosapp.com
VITE_SUPABASE_ANON_KEY=tu_supabase_key_aqui

# OpenAI (NUEVO)
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANTE:** 
- Nunca subas el archivo `.env` a Git
- El archivo `.env.example` ya está creado como referencia
- Asegúrate de que `.env` esté en tu `.gitignore`

### 3. Verificar Configuración

Reinicia el servidor de desarrollo:

```bash
npm run dev
```

## 🎯 Cómo Usar

### Generar Itinerario con IA

1. **Crear Nuevo Viaje**
   - Busca y selecciona una ciudad
   - Haz clic en **"Generar con IA"** (botón azul con ✨)

2. **Configurar Preferencias**
   - Selecciona número de días (1-7)
   - Elige tus intereses (Arte, Gastronomía, Historia, etc.)
   - Define tu presupuesto (Económico, Moderado, Premium)

3. **Generar**
   - Haz clic en **"Generar Itinerario"**
   - La IA creará un itinerario completo en ~10-15 segundos
   - Se crearán automáticamente:
     - Días con títulos temáticos
     - 4-6 lugares por día con coordenadas reales
     - Tips locales únicos
     - Tiempos estimados
     - Orden optimizado por distancia

## 💰 Costos Estimados

- **GPT-4 Turbo:** ~$0.01-0.03 por itinerario generado
- **Tokens promedio:** 2000-3000 tokens por generación
- **Recomendación:** Configura límites de uso en OpenAI Dashboard

## 🔧 Troubleshooting

### Error: "API key not found"
- Verifica que el archivo `.env` existe
- Confirma que la variable se llama `VITE_OPENAI_API_KEY`
- Reinicia el servidor (`npm run dev`)

### Error: "Rate limit exceeded"
- Has excedido el límite de tu plan de OpenAI
- Espera unos minutos o actualiza tu plan

### Error: "Invalid JSON response"
- La IA ocasionalmente puede generar JSON inválido
- Intenta de nuevo (el prompt está optimizado para minimizar esto)

## 🚀 Próximas Mejoras

- [ ] Chat IA flotante para preguntas en tiempo real
- [ ] Recomendaciones contextuales basadas en ubicación
- [ ] Análisis de fotos con GPT-4 Vision
- [ ] Resúmenes automáticos de viaje
- [ ] Optimización de rutas con IA

## 📊 Modelo Freemium Sugerido

### Gratis
- 1 itinerario generado con IA
- Features básicos actuales

### Premium ($4.99/mes)
- Itinerarios ilimitados con IA
- Chat IA integrado
- Recomendaciones en tiempo real
- Sin anuncios

---

**¿Problemas?** Revisa la consola del navegador para logs detallados.
