-- =====================================================
-- NYC Trip Assistant (TripPulse) - Setup completo
-- Ejecutar UNA VEZ en el SQL Editor de Supabase Studio
-- (instancia compartida devsupabase.cambios-app.com)
-- =====================================================
-- Nota: este schema es COMPARTIDO con otras apps (ai_ticket_*, vtx_*,
-- gov_*, sos_*, appdesk_*). Todas las tablas de esta app llevan el
-- prefijo trippulse_ para evitar cualquier confusión o colisión.
-- No se tocan permisos a nivel de schema ni de otras tablas.

-- =====================================================
-- 1. TABLA: trippulse_profiles (extiende auth.users)
-- =====================================================
create table if not exists public.trippulse_profiles (
  id uuid not null references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  tier text default 'free' check (tier in ('free', 'vip', 'pro')),
  trips_created_count integer default 0,
  ai_generations_used integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.trippulse_profiles enable row level security;

drop policy if exists "Users can view own profile" on public.trippulse_profiles;
drop policy if exists "Users can insert their own profile." on public.trippulse_profiles;
drop policy if exists "Users can update own profile." on public.trippulse_profiles;

-- Solo el propio usuario puede ver su perfil (evita filtrar emails de todos)
create policy "Users can view own profile"
  on public.trippulse_profiles for select
  using ( auth.uid() = id );

create policy "Users can insert their own profile."
  on public.trippulse_profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.trippulse_profiles for update
  using ( auth.uid() = id );

-- Trigger: crear perfil automáticamente al registrarse
create or replace function public.trippulse_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.trippulse_profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists trippulse_on_auth_user_created on auth.users;
create trigger trippulse_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.trippulse_handle_new_user();

-- =====================================================
-- 2. TABLA: trippulse_trips
-- =====================================================
create table if not exists public.trippulse_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.trippulse_profiles(id) on delete cascade,
  name varchar(255) not null,
  city varchar(255) not null,
  country varchar(255),
  base_location_lat decimal(10, 8),
  base_location_lng decimal(11, 8),
  base_location_title varchar(255),
  base_location_desc text,
  base_location_img text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_trippulse_trips_city on public.trippulse_trips(city);
create index if not exists idx_trippulse_trips_user on public.trippulse_trips(user_id);

alter table public.trippulse_trips enable row level security;

drop policy if exists "Users can view own trips" on public.trippulse_trips;
drop policy if exists "Users can insert own trips" on public.trippulse_trips;
drop policy if exists "Users can update own trips" on public.trippulse_trips;
drop policy if exists "Users can delete own trips" on public.trippulse_trips;

create policy "Users can view own trips"
  on public.trippulse_trips for select using ( auth.uid() = user_id );

create policy "Users can insert own trips"
  on public.trippulse_trips for insert with check ( auth.uid() = user_id );

create policy "Users can update own trips"
  on public.trippulse_trips for update using ( auth.uid() = user_id );

create policy "Users can delete own trips"
  on public.trippulse_trips for delete using ( auth.uid() = user_id );

-- =====================================================
-- 3. TABLA: trippulse_days
-- =====================================================
create table if not exists public.trippulse_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trippulse_trips(id) on delete cascade,
  day_number integer not null,
  title varchar(255) not null,
  color varchar(7) default '#3b82f6',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(trip_id, day_number)
);

create index if not exists idx_trippulse_days_trip on public.trippulse_days(trip_id, day_number);

alter table public.trippulse_days enable row level security;

drop policy if exists "Users can manage days of own trips" on public.trippulse_days;

create policy "Users can manage days of own trips"
  on public.trippulse_days for all
  using (
    exists (
      select 1 from public.trippulse_trips
      where trippulse_trips.id = trippulse_days.trip_id and trippulse_trips.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trippulse_trips
      where trippulse_trips.id = trippulse_days.trip_id and trippulse_trips.user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. TABLA: trippulse_stops
-- =====================================================
create table if not exists public.trippulse_stops (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.trippulse_days(id) on delete cascade,
  title varchar(255) not null,
  lat decimal(10, 8) not null,
  lng decimal(11, 8) not null,
  category varchar(100) default 'Interés',
  img text,
  tip text,
  time varchar(50),
  address text,
  order_index integer default 0,
  is_visited boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_trippulse_stops_day on public.trippulse_stops(day_id, order_index);
create index if not exists idx_trippulse_stops_visited on public.trippulse_stops(is_visited);

alter table public.trippulse_stops enable row level security;

drop policy if exists "Users can manage stops of own trips" on public.trippulse_stops;

create policy "Users can manage stops of own trips"
  on public.trippulse_stops for all
  using (
    exists (
      select 1 from public.trippulse_days
      join public.trippulse_trips on trippulse_trips.id = trippulse_days.trip_id
      where trippulse_days.id = trippulse_stops.day_id and trippulse_trips.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trippulse_days
      join public.trippulse_trips on trippulse_trips.id = trippulse_days.trip_id
      where trippulse_days.id = trippulse_stops.day_id and trippulse_trips.user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. updated_at triggers
-- =====================================================
create or replace function public.trippulse_update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trippulse_update_trips_updated_at on public.trippulse_trips;
create trigger trippulse_update_trips_updated_at
  before update on public.trippulse_trips
  for each row execute function public.trippulse_update_updated_at_column();

drop trigger if exists trippulse_update_days_updated_at on public.trippulse_days;
create trigger trippulse_update_days_updated_at
  before update on public.trippulse_days
  for each row execute function public.trippulse_update_updated_at_column();

drop trigger if exists trippulse_update_stops_updated_at on public.trippulse_stops;
create trigger trippulse_update_stops_updated_at
  before update on public.trippulse_stops
  for each row execute function public.trippulse_update_updated_at_column();

-- =====================================================
-- 6. Storage bucket para imágenes
-- =====================================================
insert into storage.buckets (id, name, public)
values ('trippulse-trip-images', 'trippulse-trip-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read trippulse-trip-images" on storage.objects;
drop policy if exists "Authenticated upload trippulse-trip-images" on storage.objects;
drop policy if exists "Authenticated update trippulse-trip-images" on storage.objects;
drop policy if exists "Authenticated delete trippulse-trip-images" on storage.objects;

-- Lectura pública (son fotos de lugares turísticos, no sensibles)
create policy "Public read trippulse-trip-images"
  on storage.objects for select
  using ( bucket_id = 'trippulse-trip-images' );

-- Solo usuarios autenticados pueden subir/editar/borrar
create policy "Authenticated upload trippulse-trip-images"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'trippulse-trip-images' );

create policy "Authenticated update trippulse-trip-images"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'trippulse-trip-images' );

create policy "Authenticated delete trippulse-trip-images"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'trippulse-trip-images' );

-- =====================================================
-- 7. GRANTs explícitos (esta instancia NO otorga privilegios de
-- escritura por defecto a tablas nuevas; RLS por sí sola no basta,
-- sin el GRANT PostgREST devuelve 404 en INSERT/UPDATE/DELETE)
-- =====================================================
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.trippulse_trips to authenticated;
grant select, insert, update, delete on public.trippulse_days to authenticated;
grant select, insert, update, delete on public.trippulse_stops to authenticated;
grant select, insert, update on public.trippulse_profiles to authenticated;

-- anon solo necesita poder leer (RLS igual bloquea todo sin sesión;
-- no se otorga insert/update/delete a anon por diseño)
grant select on public.trippulse_trips to anon;
grant select on public.trippulse_days to anon;
grant select on public.trippulse_stops to anon;
grant select on public.trippulse_profiles to anon;

-- =====================================================
-- 8. Verificación
-- =====================================================
select 'RLS Status' as check_type, tablename, rowsecurity::text as enabled
from pg_tables
where schemaname = 'public' and tablename in ('trippulse_trips', 'trippulse_days', 'trippulse_stops', 'trippulse_profiles');
