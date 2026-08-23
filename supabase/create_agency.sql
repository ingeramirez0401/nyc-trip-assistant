-- =====================================================
-- Alta manual de una agencia (por venta directa)
-- Ejecutar en el SQL Editor DESPUÉS de que la persona que administrará
-- la agencia ya se haya registrado una vez en la app (necesita existir
-- en auth.users / trippulse_profiles).
-- =====================================================

-- 1. Reemplaza estos valores:
--    - name / slug / contact_email de la agencia
--    - el email de la cuenta que ya se registró y será el admin

do $$
declare
  v_agency_id uuid;
  v_admin_email text := 'admin@agencia-ejemplo.com'; -- <-- CAMBIAR
begin
  insert into public.trippulse_agencies (name, slug, contact_email)
  values ('Agencia Ejemplo', 'agencia-ejemplo', 'contacto@agencia-ejemplo.com') -- <-- CAMBIAR
  returning id into v_agency_id;

  update public.trippulse_profiles
  set role = 'agency_admin',
      agency_id = v_agency_id
  where email = v_admin_email;

  if not found then
    raise notice 'No se encontró un perfil con email %. La persona debe registrarse primero en la app.', v_admin_email;
  else
    raise notice 'Agencia % creada (id=%) y % promovido a agency_admin.', 'Agencia Ejemplo', v_agency_id, v_admin_email;
  end if;
end $$;

-- 2. Verificar:
select p.email, p.role, a.name as agency_name, a.slug
from public.trippulse_profiles p
join public.trippulse_agencies a on a.id = p.agency_id
where p.role = 'agency_admin';
