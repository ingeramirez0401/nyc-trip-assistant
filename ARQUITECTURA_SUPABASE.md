# 🏗️ Arquitectura de la Aplicación con Supabase

## 📊 Esquema de Base de Datos

```
┌─────────────────┐
│     TRIPS       │
│  (Viajes)       │
├─────────────────┤
│ id (UUID) PK    │
│ name            │
│ city            │
│ country         │
│ base_location_* │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│      DAYS       │
│  (Días)         │
├─────────────────┤
│ id (UUID) PK    │
│ trip_id FK      │
│ day_number      │
│ title           │
│ color           │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│     STOPS       │
│  (Paradas)      │
├─────────────────┤
│ id (UUID) PK    │
│ day_id FK       │
│ title           │
│ lat, lng        │
│ category        │
│ img             │
│ tip             │
│ time            │
│ address         │
│ order_index     │
│ is_visited      │
│ created_at      │
│ updated_at      │
└─────────────────┘
```

---

## 📁 Estructura de Archivos

```
src/
├── lib/
│   └── supabase.js              # Cliente de Supabase
├── services/
│   ├── tripService.js           # CRUD de Viajes
│   ├── dayService.js            # CRUD de Días
│   ├── stopService.js           # CRUD de Paradas
│   └── storageService.js        # Gestión de Imágenes
├── hooks/
│   ├── useItinerary.js          # Hook antiguo (localStorage)
│   └── useSupabaseItinerary.js  # Hook nuevo (Supabase)
├── components/
│   ├── WelcomeScreen.jsx        # Pantalla de bienvenida
│   ├── TripSetup.jsx            # Configuración de viaje
│   ├── MapComponent.jsx         # Mapa interactivo
│   ├── BottomSheet.jsx          # Detalles de lugar
│   ├── DaySelector.jsx          # Selector de días
│   ├── PlaceSearch.jsx          # Búsqueda de lugares
│   ├── EditPlaceModal.jsx       # Edición de lugares
│   ├── SideMenu.jsx             # Menú lateral
│   └── ItineraryList.jsx        # Lista de itinerario
└── App.jsx                      # Componente principal
```

---

## 🔄 Flujo de Datos

### 1. Inicio de la Aplicación

```
Usuario abre la app
    ↓
App.jsx verifica si hay viaje seleccionado
    ↓
No hay viaje → WelcomeScreen
    ↓
Usuario crea o selecciona viaje
    ↓
TripSetup (si es nuevo)
    ↓
Carga datos con useSupabaseItinerary
    ↓
Renderiza UI principal
```

### 2. Gestión de Viajes

```javascript
// Crear viaje
tripService.create({ name, city, country })
    ↓
Supabase INSERT en tabla 'trips'
    ↓
Retorna trip con UUID
    ↓
App actualiza estado
```

### 3. Gestión de Días

```javascript
// Crear múltiples días
dayService.createMultiple(tripId, daysData)
    ↓
Supabase INSERT múltiple en tabla 'days'
    ↓
Retorna array de días
    ↓
Hook actualiza estado
```

### 4. Gestión de Paradas

```javascript
// Agregar parada con imagen
stopService.create(stopData)
    ↓
Si hay imagen base64:
    storageService.uploadBase64Image()
        ↓
    Supabase Storage guarda imagen
        ↓
    Retorna URL pública
    ↓
Supabase INSERT en tabla 'stops' con URL
    ↓
Hook refresca datos
```

---

## 🎯 Servicios y Responsabilidades

### `tripService.js`
- ✅ Crear, leer, actualizar, eliminar viajes
- ✅ Buscar viajes por ciudad
- ✅ Gestionar ubicación base

### `dayService.js`
- ✅ Crear días individuales o múltiples
- ✅ Obtener días de un viaje
- ✅ Actualizar y eliminar días
- ✅ Contar días de un viaje

### `stopService.js`
- ✅ CRUD completo de paradas
- ✅ Toggle de estado visitado
- ✅ Reordenamiento por distancia
- ✅ Actualización de imágenes

### `storageService.js`
- ✅ Subir imágenes (File o Base64)
- ✅ Eliminar imágenes
- ✅ Obtener URLs públicas
- ✅ Listar archivos

---

## 🔐 Seguridad

### Row Level Security (RLS)

Actualmente **deshabilitado** para simplicidad. Para habilitar:

```sql
-- Habilitar RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;

-- Política de ejemplo (requiere autenticación)
CREATE POLICY "Users can view their own trips"
ON trips FOR SELECT
USING (auth.uid() = user_id);
```

### Storage Policies

- **Lectura**: Pública para todos
- **Escritura**: Pública (cambiar si se implementa auth)
- **Eliminación**: Pública (cambiar si se implementa auth)

---

## 🚀 Optimizaciones

### Índices Creados

```sql
-- Búsqueda rápida por ciudad
CREATE INDEX idx_trips_city ON trips(city);

-- Ordenar días por viaje
CREATE INDEX idx_days_trip ON days(trip_id, day_number);

-- Ordenar paradas por día
CREATE INDEX idx_stops_day ON stops(day_id, order_index);

-- Filtrar paradas visitadas
CREATE INDEX idx_stops_visited ON stops(is_visited);
```

### Triggers Automáticos

```sql
-- Actualizar updated_at automáticamente
CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON trips
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 📈 Escalabilidad

### Límites Actuales (Plan Gratuito)

- **Base de Datos**: 500 MB
- **Storage**: 1 GB
- **Bandwidth**: 2 GB/mes
- **Requests**: Ilimitadas

### Mejoras Futuras

1. **Autenticación**: Implementar Supabase Auth
2. **RLS**: Habilitar políticas por usuario
3. **Realtime**: Sincronización en tiempo real
4. **Edge Functions**: Procesamiento de imágenes
5. **Backup**: Respaldos automáticos

---

## 🧪 Testing

### Verificar Conexión

```javascript
import { testConnection } from './lib/supabase';
await testConnection();
```

### Probar CRUD

```javascript
// Crear viaje
const trip = await tripService.create({
  name: 'Test Trip',
  city: 'New York',
  country: 'USA'
});

// Crear día
const day = await dayService.create({
  tripId: trip.id,
  dayNumber: 1,
  title: 'Día 1',
  color: '#3b82f6'
});

// Crear parada
const stop = await stopService.create({
  dayId: day.id,
  title: 'Times Square',
  lat: 40.7580,
  lng: -73.9855,
  category: 'Icono'
});
```

---

## 🔄 Migración desde localStorage

El hook antiguo `useItinerary` usaba `localStorage`. El nuevo `useSupabaseItinerary` usa Supabase pero mantiene la misma API:

```javascript
// Antes (localStorage)
const { days, visited, addStop, removeStop } = useItinerary();

// Ahora (Supabase)
const { days, visited, addStop, removeStop } = useSupabaseItinerary(tripId);
```

**Diferencias**:
- ✅ Requiere `tripId` como parámetro
- ✅ Operaciones son asíncronas
- ✅ Datos persisten en la nube
- ✅ Accesibles desde cualquier dispositivo

---

## 📝 Notas de Desarrollo

- Todos los IDs son UUIDs generados por Supabase
- Las imágenes se almacenan en el bucket `trip-images`
- Los timestamps se actualizan automáticamente
- Las eliminaciones son en cascada (eliminar viaje → elimina días → elimina paradas)
