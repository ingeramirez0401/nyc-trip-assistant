import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

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

// Shell compartido con la identidad visual de la app: banda con gradiente
// azul→índigo + tarjeta blanca redondeada (mismo estilo que ApproveAgencyScreen).
function emailShell({ badge, title, bodyHtml }) {
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
      <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);border-radius:20px 20px 0 0;padding:32px 24px;text-align:center;">
        <div style="width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,0.18);display:inline-block;line-height:52px;font-size:24px;margin-bottom:12px;">🧭</div>
        <div style="color:#ffffff;font-weight:800;font-size:18px;letter-spacing:0.3px;">TripPulse</div>
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

function ctaButton(href, label) {
  return `
    <div style="text-align:center;margin:28px 0 8px;">
      <a href="${href}" style="background:linear-gradient(135deg,#2563eb,#4f46e5);color:#ffffff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
        ${label}
      </a>
    </div>
  `;
}

const LICENSE_FEATURES = [
  ['🗺️', 'Arma tu itinerario', 'Día por día, con mapa y rutas listas.'],
  ['🤖', 'Generación con IA', 'Cuéntale tus gustos y arma el plan en segundos.'],
  ['📍', 'Guarda tus lugares', 'Fotos, notas y tips, todo en un solo sitio.'],
];

export async function sendLicenseEmail({ to, agencyName, code, redeemUrl }) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    throw new Error('SendGrid no está configurado en el servidor');
  }

  const safeAgencyName = escapeHtml(agencyName);
  const safeCode = escapeHtml(code);

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
    <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 24px;text-align:center;">
      <strong>${safeAgencyName}</strong> te regaló acceso a TripPulse, el planificador con IA
      que arma tu itinerario completo en segundos.
    </p>
    ${ctaButton(redeemUrl, '✨ Crear mi cuenta y empezar')}
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin:6px 0 28px;">
      Un clic y ya estás dentro — el botón ya trae tu código, no hace falta copiar nada.
    </p>
    <div style="border-top:1px solid #f1f5f9;padding-top:20px;">
      ${featureRows}
    </div>
    <p style="color:#94a3b8;font-size:11px;margin-top:20px;text-align:center;">
      ¿El botón no funciona? Copia este código dentro de la app:
      <strong style="color:#475569;letter-spacing:2px;">${safeCode}</strong>
    </p>
  `;

  await sgMail.send({
    to,
    from: SENDGRID_FROM_EMAIL,
    subject: `${agencyName} te regaló tu próxima aventura ✈️`,
    html: emailShell({
      badge: safeAgencyName,
      title: '¡Tu aventura está a un clic! 🎒',
      bodyHtml,
    }),
  });
}

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
