// `quota_type === 'trips' ? 'viajes' : 'gen. IA'` estaba copy-pegado en
// SideMenu.jsx y WelcomeScreen.jsx (un tercer sitio, AgencyAdminPanel.jsx,
// queda fuera del alcance de esta fase de i18n) -- una sola función y una
// sola clave (`common:license.quotaUnit`, con `context` de i18next) en vez
// de repetir el ternario traducido en cada componente.
export const quotaUnitLabel = (t, quotaType) =>
  t('common:license.quotaUnit', { context: quotaType === 'trips' ? 'trips' : 'ai' });
