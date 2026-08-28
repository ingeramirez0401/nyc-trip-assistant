-- =====================================================
-- TripPulse - Cierra escalación de privilegios en trippulse_profiles
-- Ejecutar UNA VEZ en el SQL Editor de Supabase Studio, cuanto antes.
-- =====================================================
-- VULNERABILIDAD: la policy "Users can update own profile." (COMPLETE_SETUP.sql)
-- solo restringe QUÉ FILA puede tocar cada usuario (auth.uid() = id), nunca
-- QUÉ COLUMNAS. El GRANT original ("grant ... update on
-- public.trippulse_profiles to authenticated") es de tabla completa. Como
-- `role`, `agency_id` y `tier` viven en esa misma fila, cualquier usuario
-- autenticado puede, desde la consola del navegador, con la anon key
-- pública que ya está en el bundle:
--
--   supabase.from('trippulse_profiles')
--     .update({ tier: 'vip', role: 'agency_admin', agency_id: '<uuid ajeno>' })
--     .eq('id', session.user.id)
--
-- ...y quedar VIP gratis, o admin de una agencia que no es suya (con
-- permiso real para generar/enviar/revocar licencias de esa agencia, ver
-- requireAgencyAdmin en server/supabaseAuth.js).
--
-- FIX: revocar el UPDATE de tabla completa y otorgarlo solo en las
-- columnas que el propio usuario legítimamente necesita tocar desde el
-- cliente hoy (ver profileService.js: updateProfile, incrementTripCount,
-- incrementAIUsage). `tier`, `role`, `agency_id`, `email` quedan fuera --
-- esas solo las debe escribir el backend con supabaseAdmin (service_role),
-- que no se ve afectado por este REVOKE porque apunta específicamente al
-- rol `authenticated`.

revoke update on public.trippulse_profiles from authenticated;

grant update (
  full_name,
  avatar_url,
  has_completed_onboarding,
  trips_created_count,
  ai_generations_used
) on public.trippulse_profiles to authenticated;

-- Verificación: confirma que el grant quedó column-scoped (no debería
-- aparecer 'tier', 'role', 'agency_id' ni 'email' en esta lista).
select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'trippulse_profiles'
  and grantee = 'authenticated'
  and privilege_type = 'UPDATE'
order by column_name;
