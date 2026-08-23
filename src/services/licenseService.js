import { supabase } from '../lib/supabase';

async function callAPI(path, options = {}) {
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
    const { license } = await callAPI(`/agency/licenses/${licenseId}/send`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return license;
  },

  async revoke(licenseId) {
    const { license } = await callAPI(`/agency/licenses/${licenseId}/revoke`, {
      method: 'POST',
    });
    return license;
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
    const { license } = await callAPI('/licenses/my');
    return license;
  },

  // Consumo de cupo: RPC directo a Postgres (no pasa por el backend, no
  // requiere ningún secreto -- solo la sesión propia del usuario, la misma
  // que ya usan tripService/dayService/stopService).
  async consumeQuota(quotaType) {
    const { data, error } = await supabase.rpc('trippulse_consume_license_quota', {
      p_quota_type: quotaType,
    });
    if (error) throw error;
    return data === true;
  },
};
