-- =====================================================
-- TripPulse - Fix: "permission denied for table trippulse_profiles"
-- al cambiar de idioma
-- =====================================================
-- Causa real (no es un grant faltante por accidente): PROFILE_COLUMN_SECURITY_FIX.sql
-- ya revocó el UPDATE de tabla completa sobre trippulse_profiles para el rol
-- `authenticated` (evitaba que cualquier usuario logueado pudiera pisar
-- columnas como tier/role/agency_id vía la consola del navegador) y lo
-- reemplazó por un GRANT column-scoped. La columna `language`
-- (LANGUAGE_PREFERENCE_SETUP.sql, agregada después) nunca se sumó a esa
-- lista -- por eso changeLanguage() choca con el mismo muro que bloquea
-- tier/role/agency_id. Este script SOLO agrega `language` a la lista
-- permitida, no reabre el UPDATE de tabla completa.

-- 1) Diagnóstico: columnas donde `authenticated` hoy tiene UPDATE.
--    Si 'language' no aparece en la lista, ese es el problema.
select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'trippulse_profiles'
  and grantee = 'authenticated'
  and privilege_type = 'UPDATE'
order by column_name;

-- 2) Fix: sumar `language` al whitelist column-scoped existente.
--    (GRANT es aditivo -- no reemplaza ni quita las columnas ya otorgadas.)
grant update (language) on public.trippulse_profiles to authenticated;

-- 3) Verificación: repetir la consulta de (1). Debe aparecer 'language'
--    junto a full_name / avatar_url / has_completed_onboarding /
--    trips_created_count / ai_generations_used -- y seguir SIN aparecer
--    tier / role / agency_id / email.
select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'trippulse_profiles'
  and grantee = 'authenticated'
  and privilege_type = 'UPDATE'
order by column_name;

-- NOTIFY pgrst, 'reload schema';

-- =====================================================
-- Hallazgo aparte (informativo, no automatizado en este script):
-- el rol `anon` tiene hoy privilegios de tabla completa sobre
-- trippulse_profiles (DELETE/INSERT/UPDATE/TRUNCATE/TRIGGER/REFERENCES),
-- muy por encima del `grant select` que diseña COMPLETE_SETUP.sql. En la
-- práctica la RLS (`auth.uid() = id`) sigue bloqueando escrituras porque
-- una request anónima no tiene auth.uid(), pero es una superficie de
-- permisos más ancha de lo previsto en una tabla con PII (email,
-- full_name). Si querés, corremos por separado:
--   revoke insert, update, delete, truncate, trigger, references
--     on public.trippulse_profiles from anon;
-- =====================================================
