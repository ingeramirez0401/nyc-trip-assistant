import { supabase } from '../lib/supabase';
import { assertOnline } from '../lib/connectivity';
import i18n from '../i18n';

// Mismo patrón de callAPI que licenseService.js -- panel del dueño de la
// plataforma, requiere sesión con el email fijo de src/lib/superAdmin.js
// (el servidor es quien realmente lo exige, esto es solo el choke point de
// fetch).
async function callAPI(path, options = {}) {
  assertOnline('useLicenseService');
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error(i18n.t('agency:licenseService.notAuthenticated'));
  }

  const separator = path.includes('?') ? '&' : '?';
  const response = await fetch(`/api${path}${separator}lang=${i18n.language}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || i18n.t('agency:licenseService.genericError'));
  }

  return data;
}

// Arma el query string solo con los params presentes -- evita mandar
// page=1&pageSize=20&search= vacío en cada request.
function toQueryString(params) {
  const usp = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') usp.set(key, value);
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

export const adminService = {
  async listAgencies({ page, pageSize, search } = {}) {
    const { agencies, total } = await callAPI(`/admin/agencies${toQueryString({ page, pageSize, search })}`);
    return { items: agencies, total };
  },

  async adjustAgencyPool(agencyId, delta) {
    const { agency } = await callAPI(`/admin/agencies/${agencyId}/pool`, {
      method: 'POST',
      body: JSON.stringify({ delta }),
    });
    return agency;
  },
};
