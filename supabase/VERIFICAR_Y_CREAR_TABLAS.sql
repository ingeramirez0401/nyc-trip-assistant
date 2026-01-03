-- =====================================================
-- VERIFICACIÓN Y CREACIÓN COMPLETA DE TABLAS
-- =====================================================
-- Ejecuta este script COMPLETO en Supabase SQL Editor

-- 1. VERIFICAR SI LA TABLA TRIPS EXISTE
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'trips'
) AS trips_exists;

-- 2. VERIFICAR SCHEMAS DISPONIBLES
SELECT schema_name 
FROM information_schema.schemata 
ORDER BY schema_name;

-- 3. VERIFICAR TABLAS EN SCHEMA PUBLIC
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- SI LA TABLA NO EXISTE, CREARLA:
-- =====================================================

-- Asegurarse de estar en el schema public
SET search_path TO public;

-- Eliminar tablas si existen (para recrear limpio)
DROP TABLE IF EXISTS public.stops CASCADE;
DROP TABLE IF EXISTS public.days CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;

-- Crear tabla TRIPS en schema PUBLIC explícitamente
CREATE TABLE public.trips (
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

-- Crear índice
CREATE INDEX idx_trips_city ON public.trips(city);

-- Crear tabla DAYS
CREATE TABLE public.days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  color VARCHAR(7) DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, day_number)
);

CREATE INDEX idx_days_trip ON public.days(trip_id, day_number);

-- Crear tabla STOPS
CREATE TABLE public.stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
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

CREATE INDEX idx_stops_day ON public.stops(day_id, order_index);
CREATE INDEX idx_stops_visited ON public.stops(is_visited);

-- =====================================================
-- DESHABILITAR RLS (Row Level Security)
-- =====================================================
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.days DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- GRANT PERMISOS A LOS ROLES DE SUPABASE
-- =====================================================
-- Estos permisos son CRÍTICOS para que PostgREST funcione

-- Permisos para el rol 'anon' (usuarios no autenticados)
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.trips TO anon;
GRANT ALL ON public.days TO anon;
GRANT ALL ON public.stops TO anon;

-- Permisos para el rol 'authenticated' (usuarios autenticados)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.trips TO authenticated;
GRANT ALL ON public.days TO authenticated;
GRANT ALL ON public.stops TO authenticated;

-- Permisos para el rol 'service_role'
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.trips TO service_role;
GRANT ALL ON public.days TO service_role;
GRANT ALL ON public.stops TO service_role;

-- =====================================================
-- CREAR FUNCIÓN Y TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_trips_updated_at ON public.trips;
CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_days_updated_at ON public.days;
CREATE TRIGGER update_days_updated_at
BEFORE UPDATE ON public.days
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_stops_updated_at ON public.stops;
CREATE TRIGGER update_stops_updated_at
BEFORE UPDATE ON public.stops
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que las tablas existen
SELECT 'TABLAS CREADAS:' as status;
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('trips', 'days', 'stops')
ORDER BY table_name;

-- Verificar permisos
SELECT 'PERMISOS:' as status;
SELECT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name IN ('trips', 'days', 'stops')
AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee;

-- Test de inserción
SELECT 'TEST DE INSERCIÓN:' as status;
INSERT INTO public.trips (name, city, country)
VALUES ('Test desde SQL', 'Test City', 'Test Country')
RETURNING id, name, city;

-- Limpiar test
DELETE FROM public.trips WHERE name = 'Test desde SQL';

SELECT 'CONFIGURACIÓN COMPLETADA EXITOSAMENTE' as resultado;
