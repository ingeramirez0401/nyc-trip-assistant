-- =====================================================
-- RECREAR TABLA TRIPS DESDE CERO
-- =====================================================
-- Este script elimina y recrea la tabla trips completamente

-- 1. Eliminar tabla existente (CASCADE elimina dependencias)
DROP TABLE IF EXISTS trips CASCADE;

-- 2. Recrear tabla trips
CREATE TABLE trips (
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

-- 3. Recrear índice
CREATE INDEX idx_trips_city ON trips(city);

-- 4. Deshabilitar RLS
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;

-- 5. Recrear trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON trips
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Test de inserción
INSERT INTO trips (name, city, country)
VALUES ('Test Trip', 'New York', 'USA')
RETURNING *;

-- 7. Verificar
SELECT * FROM trips;

-- 8. Limpiar test
DELETE FROM trips WHERE name = 'Test Trip';

-- 9. Ahora recrear las tablas dependientes
DROP TABLE IF EXISTS days CASCADE;
DROP TABLE IF EXISTS stops CASCADE;

-- Eliminar índices si existen
DROP INDEX IF EXISTS idx_days_trip;
DROP INDEX IF EXISTS idx_stops_day;
DROP INDEX IF EXISTS idx_stops_visited;

CREATE TABLE days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  color VARCHAR(7) DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, day_number)
);

CREATE INDEX idx_days_trip ON days(trip_id, day_number);
ALTER TABLE days DISABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_days_updated_at ON days;
CREATE TRIGGER update_days_updated_at
BEFORE UPDATE ON days
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE stops (
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

CREATE INDEX idx_stops_day ON stops(day_id, order_index);
CREATE INDEX idx_stops_visited ON stops(is_visited);
ALTER TABLE stops DISABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_stops_updated_at ON stops;
CREATE TRIGGER update_stops_updated_at
BEFORE UPDATE ON stops
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
