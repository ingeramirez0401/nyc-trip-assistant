import { assertOnline } from '../lib/connectivity';
import i18n from '../i18n';

// Endpoints públicos: quien solicita o aprueba no necesariamente tiene una
// sesión de Supabase (el prospecto no tiene cuenta; el admin entra por un
// link con token, no logueado). Sin bearer token, a diferencia del resto
// de los servicios.
async function callAPI(path, options = {}) {
  assertOnline('completeAction');
  const separator = path.includes('?') ? '&' : '?';
  const response = await fetch(`/api${path}${separator}lang=${i18n.language}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || i18n.t('agency:requestForm.requestError'));
    error.status = response.status;
    throw error;
  }

  return data;
}

export const agencyRequestService = {
  async submit({ agencyName, contactName, contactEmail, phone, city, estimatedTravelers, message, captchaToken }) {
    return await callAPI('/agency-requests', {
      method: 'POST',
      body: JSON.stringify({ agencyName, contactName, contactEmail, phone, city, estimatedTravelers, message, captchaToken }),
    });
  },

  async getByToken(token) {
    return await callAPI(`/agency-requests/by-token/${encodeURIComponent(token)}`);
  },

  async approve(token) {
    return await callAPI(`/agency-requests/by-token/${encodeURIComponent(token)}/approve`, { method: 'POST' });
  },

  async reject(token) {
    return await callAPI(`/agency-requests/by-token/${encodeURIComponent(token)}/reject`, { method: 'POST' });
  },
};
