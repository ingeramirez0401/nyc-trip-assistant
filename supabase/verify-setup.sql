-- =====================================================
-- VERIFICACIÓN COMPLETA DE CONFIGURACIÓN
-- =====================================================
-- Ejecuta este script para diagnosticar el problema

-- 1. Verificar estado de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('trips', 'days', 'stops');

-- 2. Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('trips', 'days', 'stops')
ORDER BY tablename, policyname;

-- 3. Verificar estructura de la tabla trips
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'trips'
ORDER BY ordinal_position;

-- 4. Test de inserción manual
-- Intenta insertar un registro de prueba
INSERT INTO trips (name, city, country)
VALUES ('Test Trip', 'Test City', 'Test Country')
RETURNING *;

-- Si el INSERT funciona, elimínalo
DELETE FROM trips WHERE name = 'Test Trip';
