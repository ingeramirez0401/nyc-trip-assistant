-- ==============================================================================
-- 1. CREACIÓN DE TABLA PROFILES
-- Esta tabla extiende la tabla auth.users de Supabase con datos adicionales
-- ==============================================================================
create table public.profiles (
  id uuid not null references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  tier text default 'free' check (tier in ('free', 'vip', 'pro')),
  
  -- Gamificación y Límites
  trips_created_count integer default 0,
  ai_generations_used integer default 0,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ==============================================================================
-- 2. SEGURIDAD (RLS - Row Level Security)
-- ==============================================================================
alter table public.profiles enable row level security;

-- Política: Cualquiera puede ver perfiles (necesario para compartir viajes públicamente luego)
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

-- Política: El usuario solo puede insertar su propio perfil
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

-- Política: El usuario solo puede actualizar su propio perfil
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- ==============================================================================
-- 3. AUTOMATIZACIÓN (Triggers)
-- Crea automáticamente un perfil público cuando un usuario se registra
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Trigger que se dispara después de cada registro en auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- 4. ACTUALIZACIÓN DE TABLA TRIPS
-- Vincula los viajes a los usuarios
-- ==============================================================================

-- Agregar columna user_id si no existe
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'trips' and column_name = 'user_id') then
        alter table public.trips add column user_id uuid references public.profiles(id) on delete cascade;
    end if;
end $$;

-- Habilitar seguridad en viajes
alter table public.trips enable row level security;

-- POLÍTICAS DE VIAJES (Modelo Híbrido para Migración)

-- 1. Usuarios autenticados ven SUS propios viajes
create policy "Users can view own trips"
  on trips for select
  using ( auth.uid() = user_id );

-- 2. Usuarios autenticados pueden crear viajes
create policy "Users can insert own trips"
  on trips for insert
  with check ( auth.uid() = user_id );

-- 3. Usuarios autenticados pueden actualizar sus viajes
create policy "Users can update own trips"
  on trips for update
  using ( auth.uid() = user_id );

-- 4. Usuarios autenticados pueden borrar sus viajes
create policy "Users can delete own trips"
  on trips for delete
  using ( auth.uid() = user_id );

-- 5. COMPATIBILIDAD (Importante para que la app actual siga funcionando)
-- Permitir acceso a viajes "huérfanos" (creados sin usuario) para usuarios anónimos
create policy "Anon access to legacy trips"
  on trips for select
  using ( user_id is null );

create policy "Anon create legacy trips"
  on trips for insert
  with check ( user_id is null );
