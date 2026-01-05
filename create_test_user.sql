-- ==============================================================================
-- SCRIPT PARA CREAR USUARIO DE PRUEBA MANUALMENTE
-- Úsalo si el botón "Add user" del dashboard no funciona o si no tienes acceso a la configuración de providers.
-- ==============================================================================

-- 1. Asegurar que la extensión de encriptación existe
create extension if not exists pgcrypto;

-- 2. Insertar el usuario en auth.users
-- NOTA: Esto crea un usuario con email 'test@example.com' y contraseña 'password123'
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000', -- ID de instancia por defecto en self-hosted
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')), -- Contraseña encriptada
  now(), -- Email confirmado automáticamente
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Usuario Prueba"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- El trigger 'on_auth_user_created' (si ya corriste supabase_setup.sql) 
-- debería encargarse de crear el perfil en public.profiles automáticamente.
