import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.error('⚠️  SENDGRID_API_KEY no configurada. El envío de licencias por email fallará.');
}

export async function sendLicenseEmail({ to, agencyName, code, redeemUrl }) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    throw new Error('SendGrid no está configurado en el servidor');
  }

  await sgMail.send({
    to,
    from: SENDGRID_FROM_EMAIL,
    subject: `${agencyName} te invita a planear tu próximo viaje con TripPulse`,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
        <h2 style="color:#1e293b;">¡${agencyName} te tiene un regalo!</h2>
        <p>Activa tu acceso a <strong>TripPulse</strong>, el planificador de viajes con inteligencia artificial de tu agencia.</p>
        <p style="margin: 28px 0;">
          <a href="${redeemUrl}" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
            Activar mi acceso
          </a>
        </p>
        <p>O ingresa este código manualmente dentro de la app:</p>
        <p style="font-size:26px;font-weight:bold;letter-spacing:3px;color:#2563eb;">${code}</p>
        <p style="color:#64748b;font-size:13px;margin-top:32px;">Si no esperabas este correo, puedes ignorarlo con confianza.</p>
      </div>
    `,
  });
}
