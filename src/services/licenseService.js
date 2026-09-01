import { supabase } from '../lib/supabase';
import { assertOnline } from '../lib/connectivity';

// Único choke point de este servicio -- un solo assertOnline acá cubre
// generate/list/send/revoke/resend/checkEmail/redeem/getMine/branding de
// una vez. Ninguna de estas llamadas tiene fallback local (a diferencia de
// trips/days/stops), así que bloquear antes de intentar da un mensaje
// claro en vez de un error de red crudo -- el resultado final (sin datos)
// es el mismo de cualquier forma.
async function callAPI(path, options = {}) {
  assertOnline('usar el servicio de licencias');
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Debes iniciar sesión.');
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en el servicio de licencias');
  }

  return data;
}

export const licenseService = {
  // ---- Agencia ----
  async generate({ quotaType, quotaAmount, validDays = 365, quantity = 1 }) {
    const { licenses } = await callAPI('/agency/licenses', {
      method: 'POST',
      body: JSON.stringify({ quotaType, quotaAmount, validDays, quantity }),
    });
    return licenses;
  },

  async list() {
    const { licenses } = await callAPI('/agency/licenses');
    return licenses;
  },

  async send(licenseId, email) {
    return callAPI(`/agency/licenses/${licenseId}/send`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async revoke(licenseId) {
    const { license } = await callAPI(`/agency/licenses/${licenseId}/revoke`, {
      method: 'POST',
    });
    return license;
  },

  async resend(licenseId) {
    return callAPI(`/agency/licenses/${licenseId}/resend`, { method: 'POST' });
  },

  async checkEmail(email) {
    const { exists } = await callAPI(`/agency/check-email?email=${encodeURIComponent(email)}`);
    return exists;
  },

  // ---- Viajero ----
  async redeem(code) {
    const { license } = await callAPI('/licenses/redeem', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return license;
  },

  async getMine() {
    const { licenses } = await callAPI('/licenses/my');
    return licenses;
  },

  async getMyAgencyBranding() {
    const { branding } = await callAPI('/agency/branding');
    return branding;
  },

  // Consumo de cupo: RPC directo a Postgres (no pasa por el backend, no
  // requiere ningún secreto -- solo la sesión propia del usuario, la misma
  // que ya usan tripService/dayService/stopService).
  async consumeQuota(quotaType) {
    assertOnline('usar tu licencia');
    const { data, error } = await supabase.rpc('trippulse_consume_license_quota', {
      p_quota_type: quotaType,
    });
    if (error) throw error;
    return data === true;
  },
};
