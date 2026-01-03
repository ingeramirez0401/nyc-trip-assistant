-- =====================================================
-- CONFIGURACIÓN DE SUPABASE STORAGE
-- =====================================================
-- Ejecuta este script en Supabase SQL Editor para configurar el bucket de imágenes

-- 1. Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trip-images',
  'trip-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- 2. Eliminar políticas existentes
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete images" ON storage.objects;

-- 3. Crear política para LECTURA pública (SELECT)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'trip-images');

-- 4. Crear política para INSERCIÓN (INSERT) - Acceso público
CREATE POLICY "Public insert access"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'trip-images');

-- 5. Crear política para ACTUALIZACIÓN (UPDATE) - Acceso público
CREATE POLICY "Public update access"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'trip-images')
WITH CHECK (bucket_id = 'trip-images');

-- 6. Crear política para ELIMINACIÓN (DELETE) - Acceso público
CREATE POLICY "Public delete access"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'trip-images');

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que el bucket existe
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'trip-images';

-- Verificar políticas
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%trip-images%' OR policyname LIKE '%Public%';

-- Listar archivos en el bucket (si hay)
SELECT 
  name,
  id,
  created_at,
  metadata->>'size' as size_bytes
FROM storage.objects
WHERE bucket_id = 'trip-images'
ORDER BY created_at DESC
LIMIT 10;

SELECT '✅ CONFIGURACIÓN DE STORAGE COMPLETADA' as resultado;
