import { supabaseAdmin, SUPABASE_URL } from './supabaseAuth.js';

const SERVICE_ROLE_KEY = process.env.TRIPPULSE_SUPABASE_SERVICE_ROLE_KEY;

// supabase-js no expone el filtro por email de GoTrue en listUsers() -- se
// llama al endpoint admin directo. Solo se usa como fallback (ver abajo),
// nunca en el camino feliz.
async function findAuthUserByEmail(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) throw new Error(`Error buscando usuario existente en auth: ${res.status}`);
  const data = await res.json();
  return (data.users || []).find((u) => u.email?.toLowerCase() === email.toLowerCase()) || null;
}

// Punto único para "esta persona necesita una cuenta ya activa". Si el
// email ya tiene perfil, no toca nada (evita duplicar cuentas o pisar una
// contraseña que el usuario ya eligió). Si no existe, la crea vía Admin API
// con email_confirm:true -- la cuenta queda verificada y utilizable de
// inmediato, sin el paso de "revisa tu correo" del signup normal. El
// trigger trippulse_handle_new_user() crea la fila de perfil como parte de
// la misma inserción en auth.users, así que al resolver esta promesa el
// perfil ya existe.
//
// Nunca se genera ni se guarda una contraseña acá -- mandar una clave en
// texto plano por correo es justo el patrón que más dispara filtros de
// spam (y una peor práctica de seguridad en general). En vez de eso, una
// cuenta nueva recibe un link tipo "recovery" (mismo mecanismo que "olvidé
// mi contraseña", que ya cae en la pantalla ResetPasswordScreen existente)
// para que el usuario elija su propia clave la primera vez que entra.
export async function findOrCreateAccount(email, { fullName, redirectTo } = {}) {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existingProfile, error: profileError } = await supabaseAdmin
    .from('trippulse_profiles')
    .select('id, email')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (profileError) throw profileError;

  if (existingProfile) {
    return { userId: existingProfile.id, created: false, actionLink: null };
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });

  let userId;
  if (!error) {
    userId = data.user.id;
  } else if (error.code === 'email_exists' || error.status === 422) {
    // GoTrue ya tiene un auth.users con este correo pero no hay perfil --
    // cuenta huérfana (ej. un signup que nunca terminó de sincronizar el
    // trigger). En vez de tumbar todo el flujo con un 500, se adopta esa
    // cuenta: se le crea el perfil que le falta, igual que lo haría el
    // trigger en un signup normal, y se sigue como si ya existiera.
    const existingUser = await findAuthUserByEmail(normalizedEmail);
    if (!existingUser) throw error;

    const { error: insertError } = await supabaseAdmin
      .from('trippulse_profiles')
      .insert([{
        id: existingUser.id,
        email: existingUser.email,
        full_name: fullName || existingUser.user_metadata?.full_name || null,
        avatar_url: existingUser.user_metadata?.avatar_url || null,
        role: 'traveler',
        agency_id: null,
      }]);
    if (insertError) throw insertError;

    return { userId: existingUser.id, created: false, actionLink: null };
  } else {
    throw error;
  }

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: normalizedEmail,
    options: redirectTo ? { redirectTo } : undefined,
  });
  if (linkError) throw linkError;

  return { userId, created: true, actionLink: linkData.properties.action_link };
}

// Lectura-solo de "findOrCreateAccount", para dejar que la agencia sepa de
// antemano si un correo ya tiene cuenta antes de enviar una licencia (evita
// sorpresas del tipo "pensé que le iba a crear cuenta nueva").
export async function accountExists(email) {
  const { data, error } = await supabaseAdmin
    .from('trippulse_profiles')
    .select('id')
    .ilike('email', email.trim().toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return !!data;
}
