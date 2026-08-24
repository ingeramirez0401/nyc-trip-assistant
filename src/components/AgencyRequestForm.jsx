import React, { useState } from 'react';
import { agencyRequestService } from '../services/agencyRequestService';

const TRAVELER_RANGES = ['1-10', '11-50', '51-200', 'Más de 200'];

const AgencyRequestForm = ({ onClose }) => {
  const [form, setForm] = useState({
    agencyName: '',
    contactName: '',
    contactEmail: '',
    phone: '',
    city: '',
    estimatedTravelers: TRAVELER_RANGES[0],
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await agencyRequestService.submit(form);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Ha ocurrido un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-2 z-10"
        >
          <i className="fas fa-times text-xl"></i>
        </button>

        <div className="p-8">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/10 dark:bg-green-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-check text-3xl text-green-600 dark:text-green-400"></i>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¡Solicitud enviada!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Revisaremos tu solicitud y te contactaremos pronto para activar tu cuenta de agencia.
              </p>
              <button
                onClick={onClose}
                className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <i className="fas fa-building text-2xl text-white"></i>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Cuéntanos de tu agencia</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Revisamos cada solicitud a mano y te activamos apenas encaje.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Nombre de la agencia *</label>
                    <input
                      type="text"
                      value={form.agencyName}
                      onChange={update('agencyName')}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Tu nombre *</label>
                    <input
                      type="text"
                      value={form.contactName}
                      onChange={update('contactName')}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Correo *</label>
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={update('contactEmail')}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Teléfono</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Ciudad</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={update('city')}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Viajeros al mes (aprox.)</label>
                    <select
                      value={form.estimatedTravelers}
                      onChange={update('estimatedTravelers')}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {TRAVELER_RANGES.map((range) => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Cuéntanos un poco más (opcional)</label>
                  <textarea
                    value={form.message}
                    onChange={update('message')}
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                    <i className="fas fa-exclamation-circle text-red-400 mt-0.5"></i>
                    <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="fas fa-circle-notch fa-spin"></i>
                      Enviando...
                    </span>
                  ) : (
                    'Enviar solicitud'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgencyRequestForm;
