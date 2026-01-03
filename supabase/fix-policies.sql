-- =====================================================
-- FIX: Políticas de Acceso Público para Supabase
-- =====================================================
-- Este script corrige las políticas RLS para permitir acceso público
-- Ejecuta este script en tu SQL Editor de Supabase

-- =====================================================
-- 1. DESHABILITAR RLS (Acceso Público Total)
-- =====================================================
-- Esta es la solución más simple para desarrollo/uso personal

ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE days DISABLE ROW LEVEL SECURITY;
ALTER TABLE stops DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. ALTERNATIVA: Habilitar RLS con Políticas Públicas
-- =====================================================
-- Si prefieres mantener RLS activo pero con acceso público:

/*
-- Habilitar RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;

-- TRIPS: Políticas públicas
DROP POLICY IF EXISTS "Public can view trips" ON trips;
DROP POLICY IF EXISTS "Public can insert trips" ON trips;
DROP POLICY IF EXISTS "Public can update trips" ON trips;
DROP POLICY IF EXISTS "Public can delete trips" ON trips;

CREATE POLICY "Public can view trips"
ON trips FOR SELECT
USING (true);

CREATE POLICY "Public can insert trips"
ON trips FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update trips"
ON trips FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete trips"
ON trips FOR DELETE
USING (true);

-- DAYS: Políticas públicas
DROP POLICY IF EXISTS "Public can view days" ON days;
DROP POLICY IF EXISTS "Public can insert days" ON days;
DROP POLICY IF EXISTS "Public can update days" ON days;
DROP POLICY IF EXISTS "Public can delete days" ON days;

CREATE POLICY "Public can view days"
ON days FOR SELECT
USING (true);

CREATE POLICY "Public can insert days"
ON days FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update days"
ON days FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete days"
ON days FOR DELETE
USING (true);

-- STOPS: Políticas públicas
DROP POLICY IF EXISTS "Public can view stops" ON stops;
DROP POLICY IF EXISTS "Public can insert stops" ON stops;
DROP POLICY IF EXISTS "Public can update stops" ON stops;
DROP POLICY IF EXISTS "Public can delete stops" ON stops;

CREATE POLICY "Public can view stops"
ON stops FOR SELECT
USING (true);

CREATE POLICY "Public can insert stops"
ON stops FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update stops"
ON stops FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete stops"
ON stops FOR DELETE
USING (true);
*/

-- =====================================================
-- 3. VERIFICAR POLÍTICAS ACTUALES
-- =====================================================
-- Ejecuta esto para ver qué políticas existen:

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('trips', 'days', 'stops');

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
