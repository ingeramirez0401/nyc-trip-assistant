import React, { useState, useEffect } from 'react';
import { agencyRequestService } from '../../services/agencyRequestService';

const Field = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-slate-900 dark:text-white text-sm">{value}</p>
    </div>
  );
};

const ApproveAgencyScreen = () => {
  const token = new URLSearchParams(window.location.search).get('token');

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Falta el token en el link.');
      setLoading(false);
      return;
    }
    agencyRequestService
      .getByToken(token)
      .then(setRequest)
      .catch((err) => setError(err.message || 'No se pudo cargar la solicitud'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleApprove = async () => {
    setActing(true);
    try {
      const data = await agencyRequestService.approve(token);
      setResult({ type: 'approved', ...data });
    } catch (err) {
      setError(err.message || 'Error al aprobar');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    setActing(true);
    try {
      await agencyRequestService.reject(token);
      setResult({ type: 'rejected' });
    } catch (err) {
      setError(err.message || 'Error al rechazar');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <i className="fas fa-route text-2xl text-white"></i>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Solicitud de agencia</h1>
        </div>

        {loading && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <i className="fas fa-circle-notch fa-spin text-2xl mb-3"></i>
            <p>Cargando...</p>
          </div>
        )}

        {!loading && error && !result && (
          <div className="text-center py-6">
            <i className="fas fa-triangle-exclamation text-3xl text-amber-500 mb-3"></i>
            <p className="text-slate-600 dark:text-slate-300">{error}</p>
          </div>
        )}

        {!loading && request && !result && (
          <>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 mb-6">
              <Field label="Agencia" value={request.agencyName} />
              <Field label="Contacto" value={request.contactName} />
              <Field label="Email" value={request.contactEmail} />
              <Field label="Teléfono" value={request.phone} />
              <Field label="Ciudad" value={request.city} />
              <Field label="Viajeros/mes" value={request.estimatedTravelers} />
              <Field label="Mensaje" value={request.message} />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={acting}
                className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition disabled:opacity-50"
              >
                Rechazar
              </button>
              <button
                onClick={handleApprove}
                disabled={acting}
                className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-blue-900/40 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {acting ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fas fa-circle-notch fa-spin"></i> Procesando...
                  </span>
                ) : (
                  'Aprobar y Activar'
                )}
              </button>
            </div>
          </>
        )}

        {result?.type === 'approved' && (
          <div className="text-center py-6">
            <i className="fas fa-circle-check text-4xl text-green-500 mb-4"></i>
            <p className="text-slate-900 dark:text-white font-bold mb-2">Agencia activada</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {result.accountCreated
                ? 'Creamos su cuenta y le enviamos un correo con su acceso (correo + contraseña) e instrucciones para iniciar sesión.'
                : 'El contacto ya tenía cuenta en TripPulse -- le avisamos por correo que ahora administra su agencia.'}
            </p>
          </div>
        )}

        {result?.type === 'rejected' && (
          <div className="text-center py-6">
            <i className="fas fa-circle-xmark text-4xl text-slate-400 mb-4"></i>
            <p className="text-slate-900 dark:text-white font-bold">Solicitud rechazada</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApproveAgencyScreen;
