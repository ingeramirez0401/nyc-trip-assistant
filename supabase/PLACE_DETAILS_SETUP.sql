-- =====================================================
-- TripPulse - Datos de Google Places en cada parada
-- Ejecutar UNA VEZ en el SQL Editor de Supabase Studio,
-- DESPUÉS de haber corrido supabase/COMPLETE_SETUP.sql
-- =====================================================
-- Google ya devuelve rating, teléfono, sitio web y horario en la misma
-- llamada a Place Details que ya usa server/placesRoutes.js para nombre/
-- dirección/foto -- esto solo agrega dónde guardarlos. No aplica a paradas
-- generadas por IA o agregadas a mano (quedan NULL, la UI ya lo maneja).

alter table public.trippulse_stops
  add column if not exists place_rating numeric(2, 1),
  add column if not exists place_rating_count integer,
  add column if not exists place_phone text,
  add column if not exists place_website text,
  -- weekdayDescriptions de Google: array de 7 strings ya formateados y
  -- traducidos por Google ("lunes: 9:00–18:00"), domingo a sábado. Se
  -- guarda tal cual -- no se recalcula "abierto ahora" en el servidor para
  -- no meter lógica de zona horaria; el cliente resalta el día de hoy.
  add column if not exists place_hours jsonb;

-- IMPORTANTE: después de correr este script, ejecutar también:
--   NOTIFY pgrst, 'reload schema';
-- Si las escrituras siguen dando 404 desde la app, reiniciar el stack
-- completo en Portainer.

select 'trippulse_stops columns' as check_type, column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'trippulse_stops'
order by ordinal_position;
