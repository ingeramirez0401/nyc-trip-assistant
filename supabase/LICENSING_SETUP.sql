-- =====================================================
-- TripPulse - Licencias B2B2C para agencias de viaje
-- Ejecutar UNA VEZ en el SQL Editor de Supabase Studio,
-- DESPUÉS de haber corrido supabase/COMPLETE_SETUP.sql
-- =====================================================
-- Igual que el resto del schema: instancia compartida, todo con
-- prefijo trippulse_, RLS + GRANTs explícitos (esta instancia no
-- otorga privilegios de escritura por defecto a tablas nuevas).

-- =====================================================
-- 1. TABLA: trippulse_agencies
-- =====================================================
create table if not exists public.trippulse_agencies (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  slug varchar(100) not null unique,
  contact_email text,
  logo_url text,
  primary_color varchar(7),
  created_at timestamptz default now()
);

alter table public.trippulse_agencies enable row level security;

-- =====================================================
-- 2. TABLA: trippulse_profiles — agregar rol y agencia
-- =====================================================
alter table public.trippulse_profiles
  add column if not exists role text not null default 'traveler'
    check (role in ('traveler', 'agency_admin'));

alter table public.trippulse_profiles
  add column if not exists agency_id uuid references public.trippulse_agencies(id);

-- =====================================================
-- 3. TABLA: trippulse_licenses
-- =====================================================
create table if not exists public.trippulse_licenses (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.trippulse_agencies(id) on delete cascade,
  code varchar(12) not null unique,
  quota_type text not null check (quota_type in ('trips', 'ai_generations')),
  quota_amount integer not null check (quota_amount > 0),
  quota_remaining integer not null,
  valid_days integer not null default 365,
  traveler_email text,
  status text not null default 'unused'
    check (status in ('unused', 'sent', 'redeemed', 'expired', 'revoked')),
  redeemed_by uuid references public.trippulse_profiles(id),
  redeemed_at timestamptz,
  expires_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_trippulse_licenses_agency on public.trippulse_licenses(agency_id);
create index if not exists idx_trippulse_licenses_code on public.trippulse_licenses(code);
create index if not exists idx_trippulse_licenses_redeemed_by on public.trippulse_licenses(redeemed_by);

alter table public.trippulse_licenses enable row level security;

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Agencias: solo su propio agency_admin puede ver/editar su agencia
drop policy if exists "Agency admin can view own agency" on public.trippulse_agencies;
create policy "Agency admin can view own agency"
  on public.trippulse_agencies for select
  using (
    exists (
      select 1 from public.trippulse_profiles
      where trippulse_profiles.id = auth.uid()
        and trippulse_profiles.role = 'agency_admin'
        and trippulse_profiles.agency_id = trippulse_agencies.id
    )
  );

drop policy if exists "Agency admin can update own agency" on public.trippulse_agencies;
create policy "Agency admin can update own agency"
  on public.trippulse_agencies for update
  using (
    exists (
      select 1 from public.trippulse_profiles
      where trippulse_profiles.id = auth.uid()
        and trippulse_profiles.role = 'agency_admin'
        and trippulse_profiles.agency_id = trippulse_agencies.id
    )
  );

-- Licencias: agency_admin gestiona solo las de su propia agencia
drop policy if exists "Agency admin manages own licenses" on public.trippulse_licenses;
create policy "Agency admin manages own licenses"
  on public.trippulse_licenses for all
  using (
    exists (
      select 1 from public.trippulse_profiles
      where trippulse_profiles.id = auth.uid()
        and trippulse_profiles.role = 'agency_admin'
        and trippulse_profiles.agency_id = trippulse_licenses.agency_id
    )
  )
  with check (
    exists (
      select 1 from public.trippulse_profiles
      where trippulse_profiles.id = auth.uid()
        and trippulse_profiles.role = 'agency_admin'
        and trippulse_profiles.agency_id = trippulse_licenses.agency_id
    )
  );

-- El viajero puede ver únicamente la licencia que él mismo canjeó
drop policy if exists "Traveler can view own redeemed license" on public.trippulse_licenses;
create policy "Traveler can view own redeemed license"
  on public.trippulse_licenses for select
  using (redeemed_by = auth.uid());

-- =====================================================
-- 5. Función atómica de consumo de cupo (SECURITY DEFINER)
-- =====================================================
-- Evita condiciones de carrera del decremento client-side. Se llama
-- vía supabase.rpc() con el usuario autenticado; opera solo sobre la
-- licencia que ese usuario canjeó.
create or replace function public.trippulse_consume_license_quota(p_quota_type text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_updated integer;
begin
  update public.trippulse_licenses
  set quota_remaining = quota_remaining - 1
  where redeemed_by = auth.uid()
    and quota_type = p_quota_type
    and quota_remaining > 0
    and status = 'redeemed'
    and (expires_at is null or expires_at > now());

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

-- =====================================================
-- 6. GRANTs explícitos
-- =====================================================
grant select, update on public.trippulse_agencies to authenticated;
grant select, insert, update, delete on public.trippulse_licenses to authenticated;
grant execute on function public.trippulse_consume_license_quota(text) to authenticated;

-- =====================================================
-- 7. Verificación
-- =====================================================
select 'RLS Status' as check_type, tablename, rowsecurity::text as enabled
from pg_tables
where schemaname = 'public' and tablename in ('trippulse_agencies', 'trippulse_licenses');

-- IMPORTANTE: después de correr este script, ejecutar también:
--   NOTIFY pgrst, 'reload schema';
-- Si las escrituras siguen dando 404 desde la app, reiniciar el stack
-- completo en Portainer (un solo contenedor no bastó la vez pasada).
