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

export async function sendLicenseEmail({ to, agencyName, code, redeemUrl }) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    throw new Error('SendGrid no está configurado en el servidor');
  }

  const safeAgencyName = escapeHtml(agencyName);

  const bodyHtml = `
    <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 8px;">
      Activa tu acceso a <strong>TripPulse</strong>, el planificador de viajes con inteligencia artificial de tu agencia.
    </p>
    ${ctaButton(redeemUrl, 'Activar mi acceso')}
    <p style="color:#64748b;font-size:13px;margin:20px 0 6px;">O ingresa este código manualmente dentro de la app:</p>
    <p style="font-size:26px;font-weight:800;letter-spacing:3px;color:#2563eb;margin:0;">${escapeHtml(code)}</p>
    <p style="color:#94a3b8;font-size:12px;margin-top:28px;">Si no esperabas este correo, puedes ignorarlo con confianza.</p>
  `;

  await sgMail.send({
    to,
    from: SENDGRID_FROM_EMAIL,
    subject: `${agencyName} te invita a planear tu próximo viaje con TripPulse`,
    html: emailShell({
      badge: safeAgencyName,
      title: `¡${safeAgencyName} te tiene un regalo!`,
      bodyHtml,
    }),
  });
}

export async function sendAgencyRequestEmail({ to, request, approveUrl }) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    throw new Error('SendGrid no está configurado en el servidor');
  }

  const row = (label, value) =>
    value
      ? `<div style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
           <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(label)}</p>
           <p style="margin:0;font-size:14px;color:#0f172a;">${escapeHtml(value)}</p>
         </div>`
      : '';

  const bodyHtml = `
    <p style="color:#334155;font-size:14px;line-height:1.6;margin:0 0 16px;">
      Alguien quiere ser partner de TripPulse. Revisa los datos y actívalo con un clic.
    </p>
    <div style="background:#f8fafc;border-radius:14px;padding:6px 16px;">
      ${row('Agencia', request.agency_name)}
      ${row('Contacto', request.contact_name)}
      ${row('Email', request.contact_email)}
      ${row('Teléfono', request.phone)}
      ${row('Ciudad', request.city)}
      ${row('Viajeros estimados/mes', request.estimated_travelers)}
      ${row('Mensaje', request.message)}
    </div>
    ${ctaButton(approveUrl, 'Revisar y activar →')}
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:8px;">El link expira en 7 días y solo funciona una vez.</p>
  `;

  await sgMail.send({
    to,
    from: SENDGRID_FROM_EMAIL,
    subject: `Nueva solicitud de agencia: ${request.agency_name}`,
    html: emailShell({
      badge: 'Nueva solicitud',
      title: 'Solicitud de agencia partner',
      bodyHtml,
    }),
  });
}
