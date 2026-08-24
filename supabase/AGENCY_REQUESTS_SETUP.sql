-- =====================================================
-- TripPulse - Solicitudes de agencia (interés + aprobación)
-- Ejecutar UNA VEZ en el SQL Editor de Supabase Studio,
-- DESPUÉS de haber corrido COMPLETE_SETUP.sql y LICENSING_SETUP.sql
-- =====================================================

-- =====================================================
-- 1. TABLA: trippulse_agency_requests
-- =====================================================
create table if not exists public.trippulse_agency_requests (
  id uuid primary key default gen_random_uuid(),
  agency_name text not null,
  contact_name text not null,
  contact_email text not null,
  phone text,
  city text,
  estimated_travelers text,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  approval_token text not null unique,
  token_expires_at timestamptz not null,
  approved_at timestamptz,
  approved_agency_id uuid references public.trippulse_agencies(id),
  created_at timestamptz default now()
);

create index if not exists idx_agency_requests_token on public.trippulse_agency_requests(approval_token);

-- RLS habilitado SIN políticas: nadie con anon/authenticated puede leer ni
-- escribir esta tabla directamente. Solo el cliente service_role del
-- backend (server/agencyRequestRoutes.js) la toca -- mismo patrón que se
-- usó para no otorgar GRANTs a anon/authenticated cuando no hacen falta.
alter table public.trippulse_agency_requests enable row level security;

-- =====================================================
-- 2. TABLA: trippulse_agencies -- columna para activaciones donde el
-- contacto todavía no se ha registrado en el momento de la aprobación
-- =====================================================
alter table public.trippulse_agencies
  add column if not exists pending_admin_email text;

-- =====================================================
-- 3. Trigger trippulse_handle_new_user(): además de crear el perfil,
-- resuelve una activación de agencia pendiente si el email coincide
-- =====================================================
create or replace function public.trippulse_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_pending_agency_id uuid;
begin
  select id into v_pending_agency_id
  from public.trippulse_agencies
  where pending_admin_email = new.email
  limit 1;

  insert into public.trippulse_profiles (id, email, full_name, avatar_url, role, agency_id)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    case when v_pending_agency_id is not null then 'agency_admin' else 'traveler' end,
    v_pending_agency_id
  );

  if v_pending_agency_id is not null then
    update public.trippulse_agencies
    set pending_admin_email = null
    where id = v_pending_agency_id;
  end if;

  return new;
end;
$$;

-- El trigger ya existe (creado en COMPLETE_SETUP.sql) apuntando a esta
-- misma función -- no hace falta recrearlo, solo se reemplazó el body.

-- =====================================================
-- 4. Verificación
-- =====================================================
select 'RLS Status' as check_type, tablename, rowsecurity::text as enabled
from pg_tables
where schemaname = 'public' and tablename = 'trippulse_agency_requests';
