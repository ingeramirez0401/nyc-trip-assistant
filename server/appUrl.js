const APP_PUBLIC_URL = process.env.APP_PUBLIC_URL;

// Links en emails (aprobar agencia, canjear licencia) necesitan una URL
// estable. Depender solo del header Origin/Host de la petición es frágil
// (pruebas manuales, proxies, clientes sin Origin) -- si APP_PUBLIC_URL
// está seteada, siempre gana.
export function resolvePublicUrl(req) {
  const url = APP_PUBLIC_URL || req.headers.origin || `${req.protocol}://${req.get('host')}`;
  return url.replace(/\/$/, '');
}
