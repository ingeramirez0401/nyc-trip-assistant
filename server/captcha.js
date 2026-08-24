const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET;

if (!HCAPTCHA_SECRET) {
  console.error('⚠️  HCAPTCHA_SECRET no configurada. El formulario de solicitud de agencia no verificará el captcha en el servidor.');
}

// Sin HCAPTCHA_SECRET configurada no bloqueamos (mismo criterio que el
// resto de las integraciones opcionales de este server) -- solo protege de
// verdad una vez que la variable está puesta.
export async function verifyCaptcha(token) {
  if (!HCAPTCHA_SECRET) return true;
  if (!token) return false;

  const params = new URLSearchParams({ secret: HCAPTCHA_SECRET, response: token });
  const res = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await res.json();
  return !!data.success;
}
