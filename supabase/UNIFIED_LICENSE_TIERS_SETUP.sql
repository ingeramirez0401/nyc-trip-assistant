-- =====================================================
-- TripPulse - Tiers unificados (Explorer/Voyager) + pool de
-- crédito de licencias por agencia
-- Ejecutar UNA VEZ en el SQL Editor de Supabase Studio,
-- DESPUÉS de LICENSING_SETUP.sql
-- =====================================================
-- No migra ni toca licencias ya emitidas (quota_type = 'ai_generations'
-- incluido) -- siguen su ciclo de vida normal hasta agotarse/vencer.
-- Solo agrega columnas nuevas y una función; nada existente se borra.

-- =====================================================
-- 1. Columna `tier` en trippulse_licenses (informativa/reporting --
--    el consumo real sigue filtrando por quota_type = 'trips', sin
--    cambios en trippulse_consume_license_quota)
-- =====================================================
alter table public.trippulse_licenses
  add column if not exists tier text check (tier in ('explorer', 'voyager'));

-- =====================================================
-- 2. Pool de crédito de licencias por agencia -- un solo contador
--    agregado por agencia (no por tier), igual al modelo "2/100"
-- =====================================================
alter table public.trippulse_agencies
  add column if not exists license_credits_allocated integer not null default 0,
  add column if not exists license_credits_used integer not null default 0;

-- =====================================================
-- 3. Función atómica de reserva de cupo (SECURITY DEFINER) --
--    mismo patrón que trippulse_consume_license_quota. Se llama desde
--    el servidor (supabaseAdmin, service_role) ANTES de insertar las
--    licencias en POST /agency/licenses.
-- =====================================================
create or replace function public.trippulse_reserve_agency_license_credits(p_agency_id uuid, p_quantity integer)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_updated integer;
begin
  update public.trippulse_agencies
  set license_credits_used = license_credits_used + p_quantity
  where id = p_agency_id
    and license_credits_used + p_quantity <= license_credits_allocated;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

-- =====================================================
-- 4. GRANTs explícitos
-- =====================================================
grant execute on function public.trippulse_reserve_agency_license_credits(uuid, integer) to authenticated;

-- IMPORTANTE -- cierra el mismo hueco que PROFILE_COLUMN_SECURITY_FIX.sql
-- cerró en trippulse_profiles: LICENSING_SETUP.sql le dio a `authenticated`
-- UPDATE de tabla completa sobre trippulse_agencies (para que el
-- agency_admin edite name/logo_url/primary_color desde AgencyAdminPanel).
-- Las columnas de pool nuevas viven en esa misma fila -- sin acotar el
-- grant, un agency_admin podría hacer
--   supabase.from('trippulse_agencies').update({ license_credits_allocated: 999999 })
-- desde la consola del navegador y regalarse cupo infinito. El pool solo
-- lo debe escribir el servidor con supabaseAdmin (service_role, que no se
-- ve afectado por este REVOKE porque apunta específicamente a `authenticated`).
revoke update on public.trippulse_agencies from authenticated;
grant update (name, logo_url, primary_color) on public.trippulse_agencies to authenticated;

-- Verificación de este punto: no debería aparecer 'license_credits_allocated'
-- ni 'license_credits_used' en esta lista.
select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'trippulse_agencies'
  and grantee = 'authenticated'
  and privilege_type = 'UPDATE'
order by column_name;

-- =====================================================
-- 5. Verificación
-- =====================================================
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'trippulse_licenses' and column_name = 'tier')
    or (table_name = 'trippulse_agencies' and column_name in ('license_credits_allocated', 'license_credits_used'))
  )
order by table_name, column_name;

-- NOTIFY pgrst, 'reload schema';
