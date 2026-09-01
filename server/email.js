import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

// Correos necesitan una URL absoluta para cualquier imagen -- a diferencia
// del resto de la app, acá no hay un req del que sacar el host. El ícono
// real de la app (mismo que manifest/favicon/apple-touch-icon) reemplaza el
// badge de emoji que tenían antes los correos por defecto (sin marca de
// agencia), para que todos los correos compartan una sola identidad visual.
const APP_PUBLIC_URL = (process.env.APP_PUBLIC_URL || '').replace(/\/$/, '');
const TRIPPULSE_LOGO_URL = `${APP_PUBLIC_URL}/icons/icon-192x192.png`;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.error('⚠️  SENDGRID_API_KEY no configurada. El envío de licencias por email fallará.');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Los valores de marca de agencia (logo_url, primary_color) los escribe el
// agency_admin vía API, sin pasar por el <input type="color"> del panel --
// nunca confiar en que llegan bien formados antes de meterlos en un style="".
const HEX_COLOR_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
function safeAccentColor(value) {
  return typeof value === 'string' && HEX_COLOR_RE.test(value) ? value : null;
}
function safeUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? value : null;
  } catch {
    return null;
  }
}

const DEFAULT_GRADIENT = 'linear-gradient(135deg,#2563eb,#4f46e5)';

// Shell compartido con la identidad visual de la app: banda de color +
// tarjeta blanca redondeada (mismo estilo que ApproveAgencyScreen). Si la
// agencia tiene marca propia (logo/color), la banda y el CTA la usan en vez
// del degradé azul→índigo por defecto de TripPulse.
function emailShell({ badge, title, bodyHtml, accentColor, logoUrl, logoAlt }) {
  const safeColor = safeAccentColor(accentColor);
  const safeLogo = safeUrl(logoUrl);
  const headerBg = safeColor || DEFAULT_GRADIENT;

  const headerMark = safeLogo
    ? `<img src="${escapeHtml(safeLogo)}" alt="${escapeHtml(logoAlt || 'Logo')}" style="max-height:44px;max-width:180px;border-radius:8px;background:#ffffff;padding:4px 8px;margin-bottom:12px;" />`
    : `<img src="${TRIPPULSE_LOGO_URL}" alt="TripPulse" width="52" height="52" style="width:52px;height:52px;border-radius:14px;display:block;margin:0 auto 12px;" />
        <div style="color:#ffffff;font-weight:800;font-size:18px;letter-spacing:0.3px;">TripPulse</div>`;

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>TripPulse</title>
  </head>
  <body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;">
      <div style="background:${headerBg};border-radius:20px 20px 0 0;padding:32px 24px;text-align:center;">
        ${headerMark}
        ${badge ? `<div style="color:#c7d2fe;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">${badge}</div>` : ''}
      </div>
      <div style="background:#ffffff;border-radius:0 0 20px 20px;padding:32px 24px;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
        <h1 style="margin:0 0 16px;font-size:19px;color:#0f172a;">${title}</h1>
        ${bodyHtml}
      </div>
      <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:20px;">TripPulse · Planifica, explora y disfruta cada momento</p>
    </div>
  </body>
</html>`;
}

// href sin validar podía terminar interpolado tal cual en el atributo --
// si algún caller pasaba algo que no fuera un string http(s) bien formado
// (undefined, una URL rota), el botón se veía igual pero no llevaba a
// ningún lado. safeUrl() ya hace exactamente esta validación para logos;
// se reutiliza acá para que un botón roto sea imposible de generar.
function ctaButton(href, label, accentColor) {
  const safeColor = safeAccentColor(accentColor);
  const safeHref = safeUrl(href);
  if (!safeHref) throw new Error(`ctaButton: href inválido: ${href}`);
  return `
    <div style="text-align:center;margin:28px 0 8px;">
      <a href="${escapeHtml(safeHref)}" style="background:${safeColor || DEFAULT_GRADIENT};color:#ffffff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
        ${label}
      </a>
    </div>
  `;
}

const QUOTA_LABELS = { trips: 'viajes', ai_generations: 'generaciones con IA' };

const LICENSE_FEATURES = [
  ['🗺️', 'Arma tu itinerario', 'Día por día, con mapa y rutas listas.'],
  ['🤖', 'Generación con IA', 'Cuéntale tus gustos y arma el plan en segundos.'],
  ['📍', 'Guarda tus lugares', 'Fotos, notas y tips, todo en un solo sitio.'],
];

export async function sendAgencyRequestEmail({ to, request, approveUrl }) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    throw new Error('SendGrid no está configurado en el servidor');
  }

  const FIELD_ICONS = {
    Agencia: '🏢',
    Contacto: '🙋',
    Email: '✉️',
    Teléfono: '📱',
    Ciudad: '📍',
    'Viajeros estimados/mes': '👥',
    Mensaje: '💬',
  };

  const row = (label, value) =>
    value
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
           <tr>
             <td style="width:28px;vertical-align:top;font-size:16px;padding-top:1px;">${FIELD_ICONS[label] || '•'}</td>
             <td style="vertical-align:top;">
               <p style="margin:0 0 1px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(label)}</p>
               <p style="margin:0;font-size:14px;color:#0f172a;">${escapeHtml(value)}</p>
             </td>
           </tr>
         </table>`
      : '';

  const bodyHtml = `
    <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 20px;text-align:center;">
      <strong>${escapeHtml(request.agency_name)}</strong> quiere sumarse como partner de TripPulse.
      Revisa sus datos y actívala con un clic.
    </p>
    <div style="background:#f8fafc;border:1px solid #eef2f7;border-radius:16px;padding:16px 18px;">
      ${row('Agencia', request.agency_name)}
      ${row('Contacto', request.contact_name)}
      ${row('Email', request.contact_email)}
      ${row('Teléfono', request.phone)}
      ${row('Ciudad', request.city)}
      ${row('Viajeros estimados/mes', request.estimated_travelers)}
      ${row('Mensaje', request.message)}
    </div>
    ${ctaButton(approveUrl, '🚀 Revisar y activar')}
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:8px;">El link expira en 7 días y solo funciona una vez.</p>
  `;

  await sgMail.send({
    to,
    from: SENDGRID_FROM_EMAIL,
    subject: `🏢 Nueva solicitud de agencia: ${request.agency_name}`,
    html: emailShell({
      badge: 'Nueva solicitud',
      title: '¡Alguien quiere sumarse! 👋',
      bodyHtml,
    }),
  });
}

// Se dispara al aprobar una solicitud de agencia: la cuenta ya quedó creada
// y activada del lado del servidor (ver agencyRequestRoutes.js). Si es
// cuenta nueva, actionLink es un link tipo "recovery" para que elija su
// propia contraseña (nunca se genera ni se envía una clave en texto plano).
export async function sendAgencyWelcomeEmail({ to, agencyName, actionLink, loginUrl }) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    throw new Error('SendGrid no está configurado en el servidor');
  }

  const safeAgencyName = escapeHtml(agencyName);

  // Si el contacto ya tenía cuenta en TripPulse (ej. como viajero), no hay
  // actionLink -- se reutiliza la contraseña que ya tiene, solo se avisa
  // que ahora es admin de su agencia.
  const bodyHtml = actionLink
    ? `
      <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 24px;text-align:center;">
        ¡Bienvenida, <strong>${safeAgencyName}</strong>! Aprobamos tu solicitud y tu cuenta de
        administrador de agencia ya está lista. Solo falta que elijas tu contraseña.
      </p>
      ${ctaButton(actionLink, '🔑 Crear mi contraseña')}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px;">
        Desde tu panel puedes generar licencias, enviarlas a tus viajeros y personalizar tu marca (logo y color).
      </p>
    `
    : `
      <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 24px;text-align:center;">
        ¡Bienvenida, <strong>${safeAgencyName}</strong>! Aprobamos tu solicitud. Usamos la cuenta
        que ya tenías en TripPulse (<strong>${escapeHtml(to)}</strong>) -- inicia sesión con tu
        contraseña de siempre.
      </p>
      ${ctaButton(loginUrl, '🚀 Iniciar sesión')}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px;">
        Desde tu panel puedes generar licencias, enviarlas a tus viajeros y personalizar tu marca (logo y color).
      </p>
    `;

  await sgMail.send({
    to,
    from: SENDGRID_FROM_EMAIL,
    subject: `¡Bienvenida a TripPulse, ${agencyName}! Tu cuenta ya está activa 🎉`,
    html: emailShell({
      badge: 'Cuenta de agencia activada',
      title: '¡Ya eres parte de TripPulse! 🏢',
      bodyHtml,
    }),
  });
}

// Envío de licencia a un email que NO tenía cuenta: se creó de una vez
// (ver server/licenseRoutes.js) y la licencia ya quedó canjeada -- este
// correo entrega un link para crear contraseña, no un código para canjear.
export async function sendTravelerWelcomeEmail({ to, agencyName, actionLink, quotaType, quotaAmount, logoUrl, primaryColor }) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    throw new Error('SendGrid no está configurado en el servidor');
  }

  const safeAgencyName = escapeHtml(agencyName);
  const quotaLabel = QUOTA_LABELS[quotaType] || quotaType;

  const featureRows = LICENSE_FEATURES.map(([icon, title, text]) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
      <tr>
        <td style="width:32px;vertical-align:top;font-size:20px;padding-top:1px;">${icon}</td>
        <td style="vertical-align:top;">
          <p style="margin:0;font-weight:700;color:#0f172a;font-size:14px;">${title}</p>
          <p style="margin:2px 0 0;color:#64748b;font-size:13px;">${text}</p>
        </td>
      </tr>
    </table>
  `).join('');

  const bodyHtml = `
    <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 8px;text-align:center;">
      <strong>${safeAgencyName}</strong> te regaló acceso a TripPulse, el planificador con IA
      que arma tu itinerario completo en segundos. Ya creamos tu cuenta y activamos tu licencia
      de <strong>${escapeHtml(String(quotaAmount))} ${quotaLabel}</strong> -- solo falta que elijas
      tu contraseña para empezar.
    </p>
    ${ctaButton(actionLink, '🔑 Crear mi contraseña y empezar', primaryColor)}
    <div style="border-top:1px solid #f1f5f9;padding-top:20px;">
      ${featureRows}
    </div>
  `;

  await sgMail.send({
    to,
    from: SENDGRID_FROM_EMAIL,
    subject: `${agencyName} te regaló tu próxima aventura ✈️`,
    html: emailShell({
      badge: safeAgencyName,
      title: '¡Tu cuenta ya está lista! 🎒',
      bodyHtml,
      accentColor: primaryColor,
      logoUrl,
      logoAlt: agencyName,
    }),
  });
}

// Envío de licencia a un email que YA tenía cuenta: no hay credenciales
// nuevas que dar, solo avisar que la licencia quedó activa y cómo entrar.
export async function sendLicenseActivatedEmail({ to, agencyName, loginUrl, quotaType, quotaAmount, logoUrl, primaryColor }) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    throw new Error('SendGrid no está configurado en el servidor');
  }

  const safeAgencyName = escapeHtml(agencyName);
  const quotaLabel = QUOTA_LABELS[quotaType] || quotaType;

  const bodyHtml = `
    <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 24px;text-align:center;">
      <strong>${safeAgencyName}</strong> activó una licencia de
      <strong>${escapeHtml(String(quotaAmount))} ${quotaLabel}</strong> en tu cuenta de TripPulse
      (${escapeHtml(to)}). Ya puedes usarla, no hace falta canjear ningún código.
    </p>
    ${ctaButton(loginUrl, '🔑 Iniciar sesión', primaryColor)}
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:20px;">
      ¿No recuerdas tu contraseña? Usa "¿Olvidaste tu contraseña?" en la pantalla de inicio de sesión.
    </p>
  `;

  await sgMail.send({
    to,
    from: SENDGRID_FROM_EMAIL,
    subject: `${agencyName} activó una nueva licencia en tu cuenta TripPulse 🎉`,
    html: emailShell({
      badge: safeAgencyName,
      title: '¡Tienes una licencia nueva activa! ✨',
      bodyHtml,
      accentColor: primaryColor,
      logoUrl,
      logoAlt: agencyName,
    }),
  });
}
