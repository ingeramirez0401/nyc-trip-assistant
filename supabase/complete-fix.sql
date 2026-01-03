-- =====================================================
-- SOLUCIÓN COMPLETA - Ejecutar TODO este script
-- =====================================================

-- 1. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

-- 2. DESHABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE IF EXISTS trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS days DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stops DISABLE ROW LEVEL SECURITY;

-- 3. CREAR POLÍTICAS DE STORAGE PÚBLICAS
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-images', 'trip-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. POLÍTICAS DE STORAGE (Acceso Total)
CREATE POLICY "Public Access to trip-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'trip-images');

CREATE POLICY "Public Upload to trip-images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'trip-images');

CREATE POLICY "Public Update to trip-images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'trip-images');

CREATE POLICY "Public Delete from trip-images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'trip-images');

-- 5. VERIFICAR CONFIGURACIÓN
SELECT 'RLS Status' as check_type, tablename, rowsecurity::text as enabled
FROM pg_tables
WHERE tablename IN ('trips', 'days', 'stops')
UNION ALL
SELECT 'Storage Bucket' as check_type, name as tablename, public::text as enabled
FROM storage.buckets
WHERE name = 'trip-images';

-- 6. TEST DE INSERCIÓN
DO $$
DECLARE
    test_id uuid;
BEGIN
    -- Intentar insertar
    INSERT INTO trips (name, city, country)
    VALUES ('SQL Test', 'Test City', 'Test')
    RETURNING id INTO test_id;
    
    RAISE NOTICE 'INSERT exitoso! ID: %', test_id;
    
    -- Limpiar
    DELETE FROM trips WHERE id = test_id;
    RAISE NOTICE 'Test completado y limpiado';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR en INSERT: %', SQLERRM;
END $$;
