import { Router } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { supabaseAdmin } from './supabaseAuth.js';
import { sendAgencyRequestEmail, sendAgencyWelcomeEmail } from './email.js';
import { resolvePublicUrl } from './appUrl.js';
import { verifyCaptcha } from './captcha.js';
import { findOrCreateAccount } from './userProvisioning.js';

const router = Router();

const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL;
if (!ADMIN_NOTIFICATION_EMAIL) {
  console.error('⚠️  ADMIN_NOTIFICATION_EMAIL no configurada. Las solicitudes de agencia no notificarán a nadie.');
}

const TOKEN_VALID_DAYS = 7;

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function slugify(name) {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar acentos tras normalizar
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
}

// Límite defensivo: evita que alguien inunde el correo del admin.
const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
});

// Límite más generoso para lectura/acciones sobre un token (defensa en
// profundidad -- el token de 32 bytes ya es imposible de adivinar).
const tokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/agency-requests', requestLimiter, async (req, res) => {
  try {
    const { agencyName, contactName, contactEmail, phone, city, estimatedTravelers, message, captchaToken } = req.body;

    if (!(await verifyCaptcha(captchaToken))) {
      return res.status(400).json({ error: 'Verificación de seguridad fallida. Intenta de nuevo.' });
    }

    if (!agencyName?.trim() || !contactName?.trim() || !contactEmail?.trim()) {
      return res.status(400).json({ error: 'Agencia, contacto y email son requeridos' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const token = generateToken();
    const tokenExpiresAt = new Date(Date.now() + TOKEN_VALID_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data: request, error } = await supabaseAdmin
      .from('trippulse_agency_requests')
      .insert([{
        agency_name: agencyName.trim(),
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        phone: phone?.trim() || null,
        city: city?.trim() || null,
        estimated_travelers: estimatedTravelers || null,
        message: message?.trim() || null,
        approval_token: token,
        token_expires_at: tokenExpiresAt,
      }])
      .select()
      .single();

    if (error) throw error;

    if (ADMIN_NOTIFICATION_EMAIL) {
      await sendAgencyRequestEmail({
        to: ADMIN_NOTIFICATION_EMAIL,
        request,
        approveUrl: `${resolvePublicUrl(req)}/admin/approve-agency?token=${token}`,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error creando solicitud de agencia:', error);
    res.status(500).json({ error: 'Error al enviar la solicitud' });
  }
});

async function findValidRequest(token) {
  const { data, error } = await supabaseAdmin
    .from('trippulse_agency_requests')
    .select('*')
    .eq('approval_token', token)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { request: null, reason: 'not_found' };
  if (data.status !== 'pending') return { request: data, reason: 'already_handled' };
  if (new Date(data.token_expires_at) < new Date()) return { request: data, reason: 'expired' };
  return { request: data, reason: null };
}

router.get('/agency-requests/by-token/:token', tokenLimiter, async (req, res) => {
  try {
    const { request, reason } = await findValidRequest(req.params.token);
    if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (reason === 'already_handled') {
      return res.status(410).json({ error: `Esta solicitud ya fue ${request.status === 'approved' ? 'aprobada' : 'rechazada'}`, status: request.status });
    }
    if (reason === 'expired') {
      return res.status(410).json({ error: 'Este link expiró' });
    }

    res.json({
      agencyName: request.agency_name,
      contactName: request.contact_name,
      contactEmail: request.contact_email,
      phone: request.phone,
      city: request.city,
      estimatedTravelers: request.estimated_travelers,
      message: request.message,
      createdAt: request.created_at,
    });
  } catch (error) {
    console.error('Error obteniendo solicitud:', error);
    res.status(500).json({ error: 'Error al obtener la solicitud' });
  }
});

router.post('/agency-requests/by-token/:token/approve', tokenLimiter, async (req, res) => {
  try {
    const { request, reason } = await findValidRequest(req.params.token);
    if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (reason) return res.status(410).json({ error: 'Este link ya no es válido' });

    const { data: agency, error: agencyError } = await supabaseAdmin
      .from('trippulse_agencies')
      .insert([{
        name: request.agency_name,
        slug: slugify(request.agency_name),
        contact_email: request.contact_email,
      }])
      .select()
      .single();

    if (agencyError) throw agencyError;

    // La cuenta se crea (o se detecta si ya existía) de una vez, en vez de
    // dejarla pendiente hasta que el contacto se autoregistre -- ese salto
    // manual era el punto de fricción real: si el contacto nunca completaba
    // el registro, la agencia quedaba "aprobada" pero sin nadie que pudiera
    // entrar.
    const account = await findOrCreateAccount(request.contact_email, {
      fullName: request.contact_name,
      redirectTo: `${resolvePublicUrl(req)}/`,
    });

    const { error: promoteError } = await supabaseAdmin
      .from('trippulse_profiles')
      .update({ role: 'agency_admin', agency_id: agency.id })
      .eq('id', account.userId);
    if (promoteError) throw promoteError;

    const { error: updateRequestError } = await supabaseAdmin
      .from('trippulse_agency_requests')
      .update({ status: 'approved', approved_at: new Date().toISOString(), approved_agency_id: agency.id })
      .eq('id', request.id);
    if (updateRequestError) throw updateRequestError;

    try {
      await sendAgencyWelcomeEmail({
        to: request.contact_email,
        agencyName: request.agency_name,
        actionLink: account.actionLink,
        loginUrl: `${resolvePublicUrl(req)}/`,
      });
    } catch (emailError) {
      // La cuenta y el rol ya quedaron activos -- que falle el envío del
      // correo de bienvenida no debe reportarse como si la aprobación
      // hubiera fallado (el admin ya vería "aprobada" del lado de Supabase).
      console.error('Error enviando correo de bienvenida a agencia:', emailError);
    }

    res.json({ agency, accountCreated: account.created });
  } catch (error) {
    console.error('Error aprobando solicitud de agencia:', error);
    res.status(500).json({ error: 'Error al aprobar la solicitud' });
  }
});

router.post('/agency-requests/by-token/:token/reject', tokenLimiter, async (req, res) => {
  try {
    const { request, reason } = await findValidRequest(req.params.token);
    if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (reason) return res.status(410).json({ error: 'Este link ya no es válido' });

    const { error } = await supabaseAdmin
      .from('trippulse_agency_requests')
      .update({ status: 'rejected' })
      .eq('id', request.id);
    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error rechazando solicitud de agencia:', error);
    res.status(500).json({ error: 'Error al rechazar la solicitud' });
  }
});

export default router;
