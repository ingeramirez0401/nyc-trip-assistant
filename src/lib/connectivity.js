// Único punto de verdad de "¿hay señal?" -- usado tanto por el guard de
// acciones (assertOnline) como por el hook de UI (useOnlineStatus), para
// que ambos coincidan siempre.
export function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

// Se llama al inicio de cada acción que escribe o depende de red (crear
// viaje, generar con IA, subir foto, iniciar sesión, licencias...) --
// corta ANTES de intentar el fetch, con un mensaje específico a esa
// acción, en vez de dejar que falle con un error crudo de red. `mensaje`
// va después de "Necesitas conexión para ", ej. assertOnline('crear un viaje').
export function assertOnline(mensaje) {
  if (!isOnline()) {
    const error = new Error(`Necesitas conexión para ${mensaje}.`);
    error.isOfflineError = true;
    throw error;
  }
}

// Distingue un fallo de RED real (fetch nunca llegó a completarse -- sin
// señal, DNS, CORS) de un error de la aplicación (permisos, validación,
// una fila que no existe). Solo el primer caso amerita caer a la copia
// local -- lo segundo nunca debe taparse con datos viejos.
//
// supabase-js NO relanza el TypeError nativo del fetch fallido: lo atrapa
// dentro de PostgrestBuilder y lo devuelve como resultado normal --
// {error: {message: "TypeError: Failed to fetch", code: '', ...}, data:
// null} -- así que por el momento en que este código hace `if (error)
// throw error`, ya es un objeto plano, no un TypeError de verdad. Se
// reconoce por ese patrón: code vacío + mensaje con el prefijo que arma
// esa librería específicamente para fallos de fetch (ver
// PostgrestBuilder.ts, rama `res.catch`). Un error real de la app
// (PGRST*, RLS, validación de Postgres) siempre trae un code no vacío.
export function isNetworkError(err) {
  if (err instanceof TypeError) return true;
  if (err && typeof err.message === 'string' && !err.code) {
    return /^(TypeError|FetchError):/.test(err.message);
  }
  return false;
}

// Wrapper para los métodos de lectura de los servicios: intenta la red y
// -- si tuvo éxito -- deja la copia local al día; si falló por red (no por
// la app), cae a lo último guardado. Si no hay nada guardado, deja que el
// error original suba (no hay nada mejor que mostrar).
// Uso en el catch de una acción: si la causa fue falta de señal, muestra
// el mensaje ya claro de assertOnline como aviso (no como error, es un
// estado esperado); si no, el toast de error normal con el prefijo de
// siempre. Evita repetir el mismo `if (error.isOfflineError)` en cada
// handler que llama a un servicio con guard.
export function notifyActionError(toast, error, fallbackMessage) {
  if (error?.isOfflineError) {
    toast.warning(error.message);
  } else {
    toast.error(`${fallbackMessage}: ${error.message}`);
  }
}

export async function withOfflineFallback(run, fallback) {
  try {
    return await run();
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    const cached = await fallback();
    const isEmpty = cached == null || (Array.isArray(cached) && cached.length === 0);
    if (isEmpty) throw err;
    return cached;
  }
}
