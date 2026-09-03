// Fijo a propósito (decisión de negocio, ver server/supabaseAuth.js) --
// esto solo controla si el botón del panel se muestra. El chequeo real de
// seguridad vive en el servidor (requireSuperAdmin), scoped por el token
// de sesión, no por este valor del cliente.
export const SUPER_ADMIN_EMAIL = 'ingeramirez0401@gmail.com';

export const isSuperAdmin = (user) => user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
