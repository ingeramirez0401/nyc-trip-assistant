-- =====================================================
-- TripPulse: flag de onboarding para viajeros
-- Ejecutar UNA VEZ en el SQL Editor de Supabase Studio
-- (instancia compartida devsupabase.cambios-app.com)
-- =====================================================
-- No requiere cambios de RLS: la política "Users can update own profile"
-- ya cubre esta columna nueva (es a nivel de fila, no de columna).

alter table public.trippulse_profiles
  add column if not exists has_completed_onboarding boolean not null default false;
