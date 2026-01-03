-- =====================================================
-- NYC Trip Assistant - Supabase Database Schema
-- =====================================================
-- Este script crea todas las tablas necesarias para la aplicación
-- Ejecuta este script en tu panel de Supabase SQL Editor

-- =====================================================
-- 1. TABLA: trips (Viajes/Ciudades)
-- =====================================================
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  country VARCHAR(255),
  base_location_lat DECIMAL(10, 8),
  base_location_lng DECIMAL(11, 8),
  base_location_title VARCHAR(255),
  base_location_desc TEXT,
  base_location_img TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsqueda rápida por ciudad
CREATE INDEX idx_trips_city ON trips(city);

-- =====================================================
-- 2. TABLA: days (Días del itinerario)
-- =====================================================
CREATE TABLE IF NOT EXISTS days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  color VARCHAR(7) DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, day_number)
);

-- Índice para ordenar días por viaje
CREATE INDEX idx_days_trip ON days(trip_id, day_number);

-- =====================================================
-- 3. TABLA: stops (Paradas/Sitios a visitar)
-- =====================================================
CREATE TABLE IF NOT EXISTS stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES days(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  category VARCHAR(100) DEFAULT 'Interés',
  img TEXT,
  tip TEXT,
  time VARCHAR(50),
  address TEXT,
  order_index INTEGER DEFAULT 0,
  is_visited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para ordenar paradas por día
CREATE INDEX idx_stops_day ON stops(day_id, order_index);
CREATE INDEX idx_stops_visited ON stops(is_visited);

-- =====================================================
-- 4. STORAGE BUCKET para imágenes
-- =====================================================
-- Ejecuta esto en el panel de Storage de Supabase o vía SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-images', 'trip-images', true)
ON CONFLICT (id) DO NOTHING;

-- Política de acceso público para lectura
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'trip-images');

-- Política para subir imágenes (autenticado o anónimo según tu config)
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'trip-images');

-- Política para eliminar imágenes
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
USING (bucket_id = 'trip-images');

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) - Opcional
-- =====================================================
-- Si quieres que cada usuario solo vea sus propios viajes,
-- habilita RLS y crea políticas. Por ahora, dejamos acceso público.

-- ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE days ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stops ENABLE ROW LEVEL SECURITY;

-- Ejemplo de política (descomenta si usas autenticación):
-- CREATE POLICY "Users can view their own trips"
-- ON trips FOR SELECT
-- USING (auth.uid() = user_id);

-- =====================================================
-- 6. FUNCIONES AUXILIARES
-- =====================================================

-- Función para actualizar el timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON trips
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_days_updated_at
BEFORE UPDATE ON days
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stops_updated_at
BEFORE UPDATE ON stops
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. DATOS DE EJEMPLO (Opcional - Comentado)
-- =====================================================
-- Descomenta si quieres insertar datos de prueba:

/*
-- Insertar viaje de ejemplo
INSERT INTO trips (id, name, city, country, base_location_lat, base_location_lng, base_location_title, base_location_desc)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'NYC 2026',
  'New York',
  'USA',
  40.7592,
  -73.9846,
  'Hotel RIU Plaza Times Square',
  'Nuestra Base de Operaciones'
);

-- Insertar días de ejemplo
INSERT INTO days (trip_id, day_number, title, color)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 'Iconos de Midtown', '#ef4444'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2, 'Downtown & Brooklyn', '#3b82f6');
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
