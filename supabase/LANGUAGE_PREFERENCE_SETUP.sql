-- =====================================================
-- TripPulse - Idioma preferido del perfil (ES/EN)
-- Ejecutar UNA VEZ en el SQL Editor de Supabase Studio,
-- DESPUÉS de haber corrido supabase/COMPLETE_SETUP.sql
-- =====================================================
-- A diferencia del modo oscuro (que hoy no se persiste en ningún lado),
-- el idioma sí debe viajar con la cuenta -- ver AuthContext.jsx
-- (fetchProfile aplica profile.language al iniciar sesión, changeLanguage
-- lo guarda de vuelta). Invitados sin sesión usan localStorage
-- (tp_language) vía i18next-browser-languagedetector, no esta columna.

alter table public.trippulse_profiles
  add column if not exists language text not null default 'es'
    check (language in ('es', 'en'));

-- Reemplaza el trigger de creación de perfil para que también copie
-- `language` desde el metadata del signup (igual que ya hace con
-- full_name/avatar_url, ver COMPLETE_SETUP.sql) -- si el signup no manda
-- nada, cae a 'es'.
create or replace function public.trippulse_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.trippulse_profiles (id, email, full_name, avatar_url, language)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'language', 'es')
  );
  return new;
end;
$$;

-- IMPORTANTE: después de correr este script, ejecutar también:
--   NOTIFY pgrst, 'reload schema';
-- Si las escrituras siguen dando 404 desde la app, reiniciar el stack
-- completo en Portainer.

select 'trippulse_profiles columns' as check_type, column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'trippulse_profiles'
order by ordinal_position;
