-- =====================================================
-- VERIFICACIÓN SIMPLE DEL BUCKET
-- =====================================================

-- 1. Ver si el bucket existe
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'trip-images';

-- 2. Ver políticas actuales
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
WHERE schemaname = 'storage'
AND tablename = 'objects';

-- 3. Si el bucket NO existe, créalo de forma simple
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'trip-images') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('trip-images', 'trip-images', true);
  END IF;
END $$;

-- 4. Actualizar bucket para que sea público
UPDATE storage.buckets
SET public = true
WHERE id = 'trip-images';

-- 5. Eliminar TODAS las políticas de storage.objects
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- 6. Crear UNA SOLA política permisiva para TODO
CREATE POLICY "Allow all operations"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'trip-images')
WITH CHECK (bucket_id = 'trip-images');

-- 7. Verificación final
SELECT '✅ Bucket configurado' as status;

SELECT 
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets
WHERE id = 'trip-images';

SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname = 'Allow all operations';
