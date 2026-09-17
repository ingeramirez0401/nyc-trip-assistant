-- =====================================================
-- TripPulse - RESET TOTAL de datos de prueba
-- Deja SOLO la cuenta super-admin (ingeramirez0401@gmail.com), borra
-- todo lo demás: viajeros, agencias, licencias, viajes.
-- IRREVERSIBLE -- confirmá que ya tenés un backup/export antes de
-- correr la Sección 2.
-- =====================================================

-- =====================================================
-- SECCIÓN 1 -- DIAGNÓSTICO (solo lectura, no borra nada)
-- Corré esto primero y revisá que los números tengan sentido antes de
-- seguir a la Sección 2.
-- =====================================================
select
  (select count(*) from auth.users where email <> 'ingeramirez0401@gmail.com') as usuarios_a_borrar,
  (select count(*) from public.trippulse_profiles where email <> 'ingeramirez0401@gmail.com') as perfiles_a_borrar,
  (select count(*) from public.trippulse_agencies) as agencias_a_borrar,
  (select count(*) from public.trippulse_agency_requests) as solicitudes_a_borrar,
  (select count(*) from public.trippulse_licenses) as licencias_a_borrar,
  (select count(*) from public.trippulse_trips) as viajes_a_borrar,
  (select count(*) from public.trippulse_days) as dias_a_borrar,
  (select count(*) from public.trippulse_stops) as paradas_a_borrar;

-- =====================================================
-- SECCIÓN 2 -- BORRADO
-- Solo correr después de revisar la Sección 1. Todo en una sola
-- transacción (begin/commit): si algo falla a mitad de camino
-- (ej. no encuentra la cuenta super-admin), se aborta completo, no
-- deja un borrado a medias.
-- =====================================================
begin;

do $$
declare
  v_admin_id uuid;
begin
  select id into v_admin_id from auth.users where email = 'ingeramirez0401@gmail.com';

  if v_admin_id is null then
    raise exception 'No se encontró la cuenta super-admin -- se aborta el borrado por seguridad.';
  end if;

  -- De hijo a padre, para no chocar con las foreign keys.
  delete from public.trippulse_stops;
  delete from public.trippulse_days;
  delete from public.trippulse_trips;
  delete from public.trippulse_licenses;
  delete from public.trippulse_agency_requests;

  -- Los perfiles (viajeros y agency_admins) van ANTES que las agencias --
  -- casi todos referencian una agencia por agency_id, así que borrar
  -- agencias primero rompe esa FK (como pasó en el intento anterior).
  delete from public.trippulse_profiles where id <> v_admin_id;

  -- Por si el admin fuera también agency_admin de algo (edge case) --
  -- se desvincula antes de borrar agencias, para no chocar con la FK.
  update public.trippulse_profiles set agency_id = null where id = v_admin_id;
  delete from public.trippulse_agencies;

  -- GoTrue: identities/sessions/refresh_tokens/mfa_factors, etc. tienen
  -- ON DELETE CASCADE sobre auth.users en el schema estándar de
  -- Supabase, así que esto las limpia solas. Verificar en Auth ->
  -- Users de Supabase Studio después de correr esto.
  delete from auth.users where id <> v_admin_id;
end $$;

commit;

-- =====================================================
-- SECCIÓN 3 -- VERIFICACIÓN
-- Todo debería dar 0 salvo tu propia cuenta (1 usuario, 1 perfil).
-- =====================================================
select
  (select count(*) from auth.users) as usuarios_restantes,
  (select count(*) from public.trippulse_profiles) as perfiles_restantes,
  (select count(*) from public.trippulse_agencies) as agencias_restantes,
  (select count(*) from public.trippulse_agency_requests) as solicitudes_restantes,
  (select count(*) from public.trippulse_licenses) as licencias_restantes,
  (select count(*) from public.trippulse_trips) as viajes_restantes,
  (select count(*) from public.trippulse_days) as dias_restantes,
  (select count(*) from public.trippulse_stops) as paradas_restantes;
