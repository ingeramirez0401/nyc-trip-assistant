import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth, requireAgencyAdmin, supabaseAdmin } from './supabaseAuth.js';
import { sendTravelerWelcomeEmail, sendLicenseActivatedEmail } from './email.js';
import { resolvePublicUrl } from './appUrl.js';
import { findOrCreateAccount, accountExists } from './userProvisioning.js';

const router = Router();

function generateCode() {
  return crypto.randomBytes(6).toString('hex').toUpperCase().slice(0, 8);
}

// Núcleo compartido de "canjear esta licencia para este usuario", usado
// tanto por el canje manual (/licenses/redeem, el viajero pone un código)
// como por el envío desde el panel de agencia (donde ahora el canje ya no
// depende de que el viajero haga nada -- ver /agency/licenses/:id/send).
// Devuelve { ok:false, status, error } en vez de lanzar para los casos
// esperados (cupo duplicado, carrera de canje) y deja que el caller decida
// cómo responder.
async function redeemLicenseAtomic({ license, userId, userEmail, extraFields = {}, selfService = false }) {
  // Solo una licencia activa por tipo de cupo a la vez -- evita dejar cupo
  // huérfano (invisible) y evita que el RPC de consumo, que no limita a una
  // fila, descuente de dos licencias del mismo tipo a la vez.
  const { data: sameTypeLicenses, error: sameTypeError } = await supabaseAdmin
    .from('trippulse_licenses')
    .select('expires_at')
    .eq('redeemed_by', userId)
    .eq('quota_type', license.quota_type)
    .eq('status', 'redeemed')
    .gt('quota_remaining', 0);

  if (sameTypeError) throw sameTypeError;

  const now = new Date();
  const hasActiveSameType = (sameTypeLicenses || []).some(
    (l) => !l.expires_at || new Date(l.expires_at) > now
  );
  if (hasActiveSameType) {
    const label = license.quota_type === 'trips' ? 'viajes' : 'generaciones con IA';
    const error = selfService
      ? `Ya tienes una licencia activa de ${label}. Espera a que se agote o venza antes de canjear otra del mismo tipo.`
      : `Este usuario ya tiene una licencia activa de ${label}. Debe agotarse o vencer antes de activar otra del mismo tipo.`;
    return { ok: false, status: 409, error };
  }

  const expiresAt = new Date(Date.now() + license.valid_days * 24 * 60 * 60 * 1000).toISOString();

  // Guarda de concurrencia optimista: el WHERE incluye el status leído
  // arriba, así que si dos requests canjean la misma licencia a la vez,
  // solo el primero afecta una fila -- el segundo recibe 0 filas.
  const { data: updatedLicense, error: updateError } = await supabaseAdmin
    .from('trippulse_licenses')
    .update({
      status: 'redeemed',
      redeemed_by: userId,
      redeemed_at: new Date().toISOString(),
      expires_at: expiresAt,
      traveler_email: license.traveler_email || userEmail,
      ...extraFields,
    })
    .eq('id', license.id)
    .eq('status', license.status)
    .select()
    .single();

  if (updateError || !updatedLicense) {
    return { ok: false, status: 409, error: 'Esta licencia acaba de cambiar de estado, intenta de nuevo' };
  }

  const { error: profileError } = await supabaseAdmin
    .from('trippulse_profiles')
    .update({ agency_id: license.agency_id })
    .eq('id', userId);

  if (profileError) throw profileError;

  return { ok: true, license: updatedLicense };
}

// El status 'expired' existe en el schema pero nada lo escribe nunca --
// no hay cron ni job en este stack. En vez de sumar infraestructura para
// una transición que el RPC de consumo de cupo ya hace irrelevante (una
// licencia vencida no se puede seguir usando pase lo que pase), se deriva
// acá en lectura: si venció, se reporta como 'expired' aunque la columna
// real siga en 'redeemed'. Solo afecta lo que ve el agency_admin.
function withEffectiveStatus(license) {
  if (
    license.status === 'redeemed' &&
    license.expires_at &&
    new Date(license.expires_at) <= new Date()
  ) {
    return { ...license, status: 'expired' };
  }
  return license;
}

// ==========================================================
// Agency admin
// ==========================================================

router.post('/agency/licenses', requireAuth, requireAgencyAdmin, async (req, res) => {
  try {
    const { quotaType, quotaAmount, validDays = 365, quantity = 1 } = req.body;

    if (!['trips', 'ai_generations'].includes(quotaType) || !quotaAmount || quotaAmount < 1) {
      return res.status(400).json({ error: 'quotaType y quotaAmount son requeridos' });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
      return res.status(400).json({ error: 'quantity debe ser un entero entre 1 y 500' });
    }

    const rows = Array.from({ length: quantity }, () => ({
      agency_id: req.agencyId,
      code: generateCode(),
      quota_type: quotaType,
      quota_amount: quotaAmount,
      quota_remaining: quotaAmount,
      valid_days: validDays,
    }));

    const { data, error } = await supabaseAdmin
      .from('trippulse_licenses')
      .insert(rows)
      .select();

    if (error) throw error;
    res.json({ licenses: data });
  } catch (error) {
    console.error('Error generando licencias:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/agency/licenses', requireAuth, requireAgencyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('trippulse_licenses')
      .select('*')
      .eq('agency_id', req.agencyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ licenses: (data || []).map(withEffectiveStatus) });
  } catch (error) {
    console.error('Error listando licencias:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/agency/licenses/:id/send', requireAuth, requireAgencyAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email es requerido' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const { data: license, error: fetchError } = await supabaseAdmin
      .from('trippulse_licenses')
      .select('*, trippulse_agencies(name, logo_url, primary_color)')
      .eq('id', req.params.id)
      .eq('agency_id', req.agencyId)
      .single();

    if (fetchError || !license) return res.status(404).json({ error: 'Licencia no encontrada' });
    if (license.status === 'redeemed') return res.status(400).json({ error: 'Esta licencia ya fue canjeada' });
    if (license.status === 'revoked') return res.status(400).json({ error: 'Esta licencia fue revocada' });

    const agencyName = license.trippulse_agencies?.name || 'Tu agencia de viajes';
    const logoUrl = license.trippulse_agencies?.logo_url || null;
    const primaryColor = license.trippulse_agencies?.primary_color || null;
    const loginUrl = `${resolvePublicUrl(req)}/`;

    // Antes "enviar" solo mandaba un código y dejaba el canje en manos del
    // viajero -- si nunca completaba signup+canje, la licencia quedaba
    // "enviada" para siempre sin que nadie viera el cupo activo (el reporte
    // real que motivó este cambio). Ahora la cuenta se crea/detecta y la
    // licencia se canjea acá mismo, de una vez: "enviar" YA es "activar".
    const account = await findOrCreateAccount(email);

    const result = await redeemLicenseAtomic({
      license,
      userId: account.userId,
      userEmail: email,
      extraFields: { sent_at: new Date().toISOString() },
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    if (account.created) {
      await sendTravelerWelcomeEmail({
        to: email,
        agencyName,
        password: account.password,
        loginUrl,
        quotaType: license.quota_type,
        quotaAmount: license.quota_amount,
        logoUrl,
        primaryColor,
      });
    } else {
      await sendLicenseActivatedEmail({
        to: email,
        agencyName,
        loginUrl,
        quotaType: license.quota_type,
        quotaAmount: license.quota_amount,
        logoUrl,
        primaryColor,
      });
    }

    res.json({ license: result.license, accountCreated: account.created });
  } catch (error) {
    console.error('Error enviando licencia:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deja que el panel de agencia le avise al admin, mientras escribe el
// correo, si esa persona ya tiene cuenta -- para que sepa de antemano si
// "enviar" va a crearle cuenta nueva o solo a activarle la licencia.
router.get('/agency/check-email', requireAuth, requireAgencyAdmin, async (req, res) => {
  try {
    const email = (req.query.email || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    const exists = await accountExists(email);
    res.json({ exists });
  } catch (error) {
    console.error('Error verificando email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reenvía el aviso de "tu licencia está activa" a una licencia ya canjeada
// -- por si el correo original se perdió. No genera una contraseña nueva ni
// vuelve a canjear nada (ya está canjeada); si el viajero perdió una
// contraseña temporal, el mismo correo lo dirige a "olvidé mi contraseña".
router.post('/agency/licenses/:id/resend', requireAuth, requireAgencyAdmin, async (req, res) => {
  try {
    const { data: license, error: fetchError } = await supabaseAdmin
      .from('trippulse_licenses')
      .select('*, trippulse_agencies(name, logo_url, primary_color)')
      .eq('id', req.params.id)
      .eq('agency_id', req.agencyId)
      .single();

    if (fetchError || !license) return res.status(404).json({ error: 'Licencia no encontrada' });
    if (license.status !== 'redeemed') {
      return res.status(400).json({ error: 'Esta licencia todavía no está canjeada' });
    }
    if (!license.traveler_email) {
      return res.status(400).json({ error: 'Esta licencia no tiene un correo asociado' });
    }

    await sendLicenseActivatedEmail({
      to: license.traveler_email,
      agencyName: license.trippulse_agencies?.name || 'Tu agencia de viajes',
      loginUrl: `${resolvePublicUrl(req)}/`,
      quotaType: license.quota_type,
      quotaAmount: license.quota_amount,
      logoUrl: license.trippulse_agencies?.logo_url || null,
      primaryColor: license.trippulse_agencies?.primary_color || null,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error reenviando acceso:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/agency/licenses/:id/revoke', requireAuth, requireAgencyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('trippulse_licenses')
      .update({ status: 'revoked' })
      .eq('id', req.params.id)
      .eq('agency_id', req.agencyId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Licencia no encontrada' });
    res.json({ license: data });
  } catch (error) {
    console.error('Error revocando licencia:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================================
// Traveler
// ==========================================================

// Marca (nombre/logo/color) de la agencia a la que el viajero quedó
// vinculado al canjear una licencia. RLS de trippulse_agencies solo deja
// leer vía agency_admin, así que esto pasa por supabaseAdmin -- pero SOLO
// resuelve la agencia del propio perfil del caller (nunca toma un id por
// parámetro), para no abrir una forma de enumerar agencias ajenas.
router.get('/agency/branding', requireAuth, async (req, res) => {
  try {
    const { data: profileRow, error: profileError } = await supabaseAdmin
      .from('trippulse_profiles')
      .select('agency_id')
      .eq('id', req.user.id)
      .single();

    if (profileError) throw profileError;
    if (!profileRow?.agency_id) return res.json({ branding: null });

    const { data: agency, error: agencyError } = await supabaseAdmin
      .from('trippulse_agencies')
      .select('name, logo_url, primary_color')
      .eq('id', profileRow.agency_id)
      .single();

    if (agencyError) throw agencyError;
    res.json({ branding: agency });
  } catch (error) {
    console.error('Error obteniendo marca de agencia:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/licenses/redeem', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code es requerido' });

    const normalizedCode = code.toUpperCase().trim();

    const { data: license, error: fetchError } = await supabaseAdmin
      .from('trippulse_licenses')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (fetchError || !license) {
      return res.status(404).json({ error: 'Código inválido' });
    }
    if (['redeemed', 'revoked', 'expired'].includes(license.status)) {
      return res.status(400).json({ error: 'Este código ya no está disponible' });
    }
    if (license.traveler_email && license.traveler_email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ error: 'Este código fue enviado a otro correo' });
    }

    const result = await redeemLicenseAtomic({
      license,
      userId: req.user.id,
      userEmail: req.user.email,
      selfService: true,
    });
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json({ license: result.license });
  } catch (error) {
    console.error('Error canjeando licencia:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/licenses/my', requireAuth, async (req, res) => {
  try {
    // Puede haber hasta una activa por tipo de cupo (trips + ai_generations
    // a la vez son válidas, no compiten). "Activa" = con cupo restante y sin
    // vencer -- filtrado acá en vez de con .or() de PostgREST por claridad.
    const { data, error } = await supabaseAdmin
      .from('trippulse_licenses')
      .select('*')
      .eq('redeemed_by', req.user.id)
      .eq('status', 'redeemed')
      .gt('quota_remaining', 0)
      .order('redeemed_at', { ascending: false });

    if (error) throw error;
    const now = new Date();
    const active = (data || []).filter((l) => !l.expires_at || new Date(l.expires_at) > now);
    res.json({ licenses: active });
  } catch (error) {
    console.error('Error obteniendo licencias:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
