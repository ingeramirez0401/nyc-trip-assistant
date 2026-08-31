import crypto from 'crypto';
import { supabaseAdmin } from './supabaseAuth.js';

// 10 bytes = 80 bits de entropía, en alfabeto base64url (sin +, /, = que
// complican copiar/pegar o seleccionar con doble-click en un cliente de
// correo). Suficiente para una clave temporal que el usuario cambiará o
// que queda protegida por "olvidé mi contraseña" de todas formas.
export function generateTempPassword() {
  return crypto.randomBytes(10).toString('base64url');
}

// Punto único para "esta persona necesita una cuenta ya activa". Si el
// email ya tiene perfil, no toca nada (evita duplicar cuentas o pisar una
// contraseña que el usuario ya eligió). Si no existe, la crea vía Admin API
// con email_confirm:true -- la cuenta queda verificada y utilizable de
// inmediato, sin el paso de "revisa tu correo" del signup normal. El
// trigger trippulse_handle_new_user() crea la fila de perfil como parte de
// la misma inserción en auth.users, así que al resolver esta promesa el
// perfil ya existe.
export async function findOrCreateAccount(email, { fullName } = {}) {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existingProfile, error: profileError } = await supabaseAdmin
    .from('trippulse_profiles')
    .select('id, email')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (profileError) throw profileError;

  if (existingProfile) {
    return { userId: existingProfile.id, created: false, password: null };
  }

  const password = generateTempPassword();
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });

  if (error) throw error;

  return { userId: data.user.id, created: true, password };
}
