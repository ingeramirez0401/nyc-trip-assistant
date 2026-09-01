-- =====================================================
-- TripPulse - placeId de Google Places para la base/hotel del viaje
-- Ejecutar UNA VEZ en el SQL Editor de Supabase Studio,
-- DESPUÉS de haber corrido supabase/COMPLETE_SETUP.sql
-- =====================================================
-- Sin este placeId no hay forma de volver a pedirle a Google los datos en
-- vivo (rating, teléfono, horario) del hotel/base cuando el viajero toca su
-- marcador en el mapa -- ver LocationSearchInput.jsx / AIItineraryGenerator.jsx
-- (captura), tripService.js (guardado) y App.jsx handleBaseClick (consumo).
-- Viajes creados antes de esta columna simplemente quedan con NULL: el
-- marcador sigue siendo clickeable, solo que sin esa sección de datos en
-- vivo (BottomSheet.jsx ya la oculta si no hay rating/teléfono/horario).

alter table public.trippulse_trips
  add column if not exists base_location_place_id text;

-- IMPORTANTE: después de correr este script, ejecutar también:
--   NOTIFY pgrst, 'reload schema';
-- Si las escrituras siguen dando 404 desde la app, reiniciar el stack
-- completo en Portainer.

select 'trippulse_trips columns' as check_type, column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'trippulse_trips'
order by ordinal_position;
