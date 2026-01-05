-- ==============================================================================
-- SEGURIDAD PARA DAYS Y STOPS (RLS) - VERSIÓN ROBUSTA
-- ==============================================================================

-- 1. SEGURIDAD PARA TABLA DAYS
alter table public.days enable row level security;

-- Borrar políticas previas para evitar conflictos
drop policy if exists "Users can manage days of own trips" on public.days;
drop policy if exists "Anon access to days of legacy trips" on public.days;

-- Crear políticas
create policy "Users can manage days of own trips"
  on public.days for all
  using (
    exists (
      select 1 from public.trips
      where trips.id = days.trip_id
      and trips.user_id = auth.uid()
    )
  );

create policy "Anon access to days of legacy trips"
  on public.days for all
  using (
    exists (
      select 1 from public.trips
      where trips.id = days.trip_id
      and trips.user_id is null
    )
  );

-- 2. SEGURIDAD PARA TABLA STOPS
alter table public.stops enable row level security;

-- Borrar políticas previas
drop policy if exists "Users can manage stops of own trips" on public.stops;
drop policy if exists "Anon access to stops of legacy trips" on public.stops;

-- Crear políticas
create policy "Users can manage stops of own trips"
  on public.stops for all
  using (
    exists (
      select 1 from public.days
      join public.trips on trips.id = days.trip_id
      where days.id = stops.day_id
      and trips.user_id = auth.uid()
    )
  );

create policy "Anon access to stops of legacy trips"
  on public.stops for all
  using (
    exists (
      select 1 from public.days
      join public.trips on trips.id = days.trip_id
      where days.id = stops.day_id
      and trips.user_id is null
    )
  );
