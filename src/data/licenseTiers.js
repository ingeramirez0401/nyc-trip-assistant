// Espejo de LICENSE_TIERS en server/licenseRoutes.js -- solo para mostrar
// cupo/vigencia en la UI (selector de tier en AgencyAdminPanel). El
// servidor es la única fuente de verdad real; si estos números no
// coinciden, lo que manda es el servidor.
export const LICENSE_TIERS = {
  explorer: { quotaAmount: 1, validDays: 365 },
  voyager: { quotaAmount: 3, validDays: 548 },
};

export const LICENSE_TIER_KEYS = Object.keys(LICENSE_TIERS);
