import { createClient } from '@supabase/supabase-js';
import { resolveLang, tr } from './lib/serverI18n.js';

export const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
// Nombre namespaced a propósito, igual que TRIPPULSE_OPENAI_API_KEY: evita
// colisión con variables genéricas que puedan existir en el host.
const SERVICE_ROLE_KEY = process.env.TRIPPULSE_SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('⚠️  TRIPPULSE_SUPABASE_SERVICE_ROLE_KEY no configurada. Las rutas de licencias fallarán.');
}

// Cliente con privilegios elevados (bypassa RLS) — SOLO se usa aquí, en el
// servidor. Nunca se expone al navegador ni se referencia con prefijo VITE_.
// Necesario porque el canje de licencia vincula una licencia a un usuario
// que todavía no tiene esa relación visible vía RLS desde su propia sesión.
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Verifica que la petición trae una sesión de Supabase válida.
export async function requireAuth(req, res, next) {
  const lang = resolveLang(req);
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: tr(lang, 'No autenticado') });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return res.status(401).json({ error: tr(lang, 'Sesión inválida o expirada') });
    }

    req.user = await response.json();
    next();
  } catch (err) {
    console.error('Error verificando sesión:', err);
    res.status(500).json({ error: tr(lang, 'Error verificando sesión') });
  }
}

// Requiere además que el usuario autenticado sea agency_admin de una
// agencia. Se verifica con el cliente admin (nunca confiando en el cliente).
export async function requireAgencyAdmin(req, res, next) {
  const lang = resolveLang(req);
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('trippulse_profiles')
      .select('role, agency_id')
      .eq('id', req.user.id)
      .single();

    if (error || !profile || profile.role !== 'agency_admin' || !profile.agency_id) {
      return res.status(403).json({ error: tr(lang, 'Requiere permisos de administrador de agencia') });
    }

    req.agencyId = profile.agency_id;
    next();
  } catch (err) {
    console.error('Error verificando rol de agencia:', err);
    res.status(500).json({ error: tr(lang, 'Error verificando permisos') });
  }
}
