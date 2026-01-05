-- ==============================================================================
-- LIMPIEZA DE VIAJES HUÉRFANOS (sin user_id)
-- ==============================================================================
-- Este script elimina viajes que fueron creados sin user_id asignado
-- Ejecutar este script si tienes problemas con viajes que no se pueden actualizar

-- Ver cuántos viajes huérfanos existen
SELECT COUNT(*) as orphan_trips_count 
FROM public.trips 
WHERE user_id IS NULL;

-- Ver los viajes huérfanos (opcional - para revisar antes de eliminar)
SELECT id, name, city, created_at 
FROM public.trips 
WHERE user_id IS NULL
ORDER BY created_at DESC;

-- ELIMINAR viajes huérfanos y sus datos relacionados
-- ADVERTENCIA: Esto eliminará permanentemente los viajes sin usuario asignado
-- Descomenta las siguientes líneas solo si estás seguro de querer eliminar estos datos

-- DELETE FROM public.trips WHERE user_id IS NULL;

-- Verificar que se eliminaron
-- SELECT COUNT(*) as remaining_orphan_trips 
-- FROM public.trips 
-- WHERE user_id IS NULL;
