// Traducción de los mensajes de error/validación que el API devuelve tal
// cual al cliente (no pasan por react-i18next, viven en el servidor). Mismo
// criterio de whitelist que el resto del backend (placesRoutes.js,
// server/index.js): solo 'es'/'en' soportados, 'es' de default. El cliente
// manda el idioma activo como ?lang= (GET) o { language } (POST body) -- ver
// licenseService.js, agencyRequestService.js, placesService.js, aiService.js.
//
// Diseño: diccionario ES→EN de las strings literales tal como ya existen en
// cada route handler, en vez de reescribir cada handler a un sistema de
// claves -- son mensajes finales y estables, y esto evita tocar la lógica
// de cada ruta más de lo necesario. `tr(lang, texto)` es un no-op en 'es'.
const EN = {
  // licenseRoutes.js
  'quotaType y quotaAmount son requeridos': 'quotaType and quotaAmount are required',
  'quantity debe ser un entero entre 1 y 500': 'quantity must be an integer between 1 and 500',
  'email es requerido': 'email is required',
  'Email inválido': 'Invalid email',
  'Licencia no encontrada': 'License not found',
  'Esta licencia ya fue canjeada': 'This license has already been redeemed',
  'Esta licencia fue revocada': 'This license has been revoked',
  'Esta licencia acaba de cambiar de estado, intenta de nuevo': 'This license just changed status, please try again',
  'Esta licencia todavía no está canjeada': "This license hasn't been redeemed yet",
  'Esta licencia no tiene un correo asociado': "This license doesn't have an email associated with it",
  'code es requerido': 'code is required',
  'Código inválido': 'Invalid code',
  'Este código ya no está disponible': 'This code is no longer available',
  'Este código fue enviado a otro correo': 'This code was sent to a different email',
  viajes: 'trips',
  'generaciones con IA': 'AI generations',

  // agencyRequestRoutes.js
  'Demasiadas solicitudes. Intenta de nuevo más tarde.': 'Too many requests. Please try again later.',
  'Verificación de seguridad fallida. Intenta de nuevo.': 'Security verification failed. Please try again.',
  'Agencia, contacto y email son requeridos': 'Agency, contact, and email are required',
  'Error al enviar la solicitud': 'Error sending the request',
  'Solicitud no encontrada': 'Request not found',
  'Este link expiró': 'This link has expired',
  'Error al obtener la solicitud': 'Error fetching the request',
  'Este link ya no es válido': 'This link is no longer valid',
  'Error al aprobar la solicitud': 'Error approving the request',
  'Error al rechazar la solicitud': 'Error rejecting the request',
  aprobada: 'approved',
  rechazada: 'rejected',

  // placesRoutes.js
  'Buscador de lugares no configurado': 'Places search is not configured',
  'Error consultando el buscador de lugares': 'Error querying the places search service',
  'Error obteniendo el detalle del lugar': "Error fetching the place's details",
  'photoName inválido': 'Invalid photoName',
  'Error obteniendo la foto del lugar': "Error fetching the place's photo",

  // server/index.js
  'Demasiadas solicitudes de IA. Intenta de nuevo más tarde.': 'Too many AI requests. Please try again later.',
  'Demasiadas búsquedas de lugares. Espera un momento.': 'Too many place searches. Please wait a moment.',
  'city, country y numDays son requeridos': 'city, country, and numDays are required',
  'Error al generar itinerario': 'Error generating itinerary',
  'query y city son requeridos': 'query and city are required',
  'stops es requerido': 'stops is required',

  // supabaseAuth.js
  'No autenticado': 'Not authenticated',
  'Sesión inválida o expirada': 'Invalid or expired session',
  'Error verificando sesión': 'Error verifying session',
  'Requiere permisos de administrador de agencia': 'Requires agency admin permissions',
  'Error verificando permisos': 'Error verifying permissions',
};

export function resolveLang(req) {
  const raw = req.query?.lang ?? req.body?.language ?? req.body?.lang;
  return raw === 'en' ? 'en' : 'es';
}

export function tr(lang, esText) {
  if (lang !== 'en') return esText;
  return EN[esText] || esText;
}
