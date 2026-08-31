import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { agencyService } from '../services/agencyService';
import { licenseService } from '../services/licenseService';
import { storageService } from '../services/storageService';
import { normalizeSquareLogo, LOGO_REQUIREMENTS_LABEL } from '../lib/imageProcessing';
import SideMenu from './SideMenu';

const STATUS_LABEL = {
  unused: 'Sin usar',
  sent: 'Enviada',
  redeemed: 'Canjeada',
  expired: 'Expirada',
  revoked: 'Revocada',
};

const STATUS_COLOR = {
  unused: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  redeemed: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  expired: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  revoked: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
};

const AgencyAdminPanel = ({ onClose, isDarkMode, toggleTheme }) => {
  const { profile } = useAuth();
  const toast = useToast();

  const [agency, setAgency] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingBrand, setSavingBrand] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [emailDrafts, setEmailDrafts] = useState({});
  // Por licencia: null (sin chequear), 'checking', 'exists' o 'new' -- se
  // llena con debounce mientras el admin escribe el correo, para que sepa
  // de antemano si "Enviar" le va a crear cuenta nueva o solo activarle la
  // licencia a una que ya tiene.
  const [emailChecks, setEmailChecks] = useState({});
  const emailCheckTimers = useRef({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [brandForm, setBrandForm] = useState({ name: '', logo_url: '', primary_color: '' });
  const [genForm, setGenForm] = useState({ quotaType: 'trips', quotaAmount: 3, validDays: 365, quantity: 5 });

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    // Copia local porque el cleanup corre después del unmount, cuando el
    // ref ya podría estar en otro objeto.
    const timers = emailCheckTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  const loadAll = async () => {
    if (!profile?.agency_id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [agencyData, licenseData] = await Promise.all([
        agencyService.getById(profile.agency_id),
        licenseService.list(),
      ]);
      setAgency(agencyData);
      setBrandForm({
        name: agencyData.name || '',
        logo_url: agencyData.logo_url || '',
        primary_color: agencyData.primary_color || '#2563eb',
      });
      setLicenses(licenseData);
    } catch (error) {
      toast.error('Error al cargar el panel de agencia: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo si algo falla
    if (!file) return;
    try {
      setUploadingLogo(true);
      const normalized = await normalizeSquareLogo(file);
      const publicUrl = await storageService.uploadImage(normalized, 'agency-logos');
      setBrandForm((prev) => ({ ...prev, logo_url: publicUrl }));
      toast.success('Logo cargado — haz clic en "Guardar marca" para aplicarlo');
    } catch (error) {
      toast.error(error.message || 'No se pudo procesar el logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => setBrandForm((prev) => ({ ...prev, logo_url: '' }));

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    try {
      setSavingBrand(true);
      const updated = await agencyService.update(profile.agency_id, {
        name: brandForm.name,
        logo_url: brandForm.logo_url || null,
        primary_color: brandForm.primary_color || null,
      });
      setAgency(updated);
      toast.success('Marca actualizada');
    } catch (error) {
      toast.error('Error al guardar: ' + error.message);
    } finally {
      setSavingBrand(false);
    }
  };

  // Mientras se edita, el campo puede quedar en '' (borrando para escribir un
  // número nuevo) -- solo se fuerza el mínimo al salir del campo o al enviar.
  const clampValue = (rawValue, fallback, { min = 1, max } = {}) => {
    const n = Number(rawValue);
    let value = rawValue !== '' && Number.isFinite(n) ? n : fallback;
    value = Math.max(value, min);
    if (max) value = Math.min(value, max);
    return value;
  };

  const numberField = (field, fallback, options) => ({
    type: 'number',
    min: options?.min ?? 1,
    ...(options?.max && { max: options.max }),
    value: genForm[field],
    onChange: (e) => {
      const raw = e.target.value;
      setGenForm({ ...genForm, [field]: raw === '' ? '' : Number(raw) });
    },
    onBlur: () => setGenForm((prev) => ({ ...prev, [field]: clampValue(prev[field], fallback, options) })),
  });

  const handleGenerate = async (e) => {
    e.preventDefault();
    const normalized = {
      ...genForm,
      quotaAmount: clampValue(genForm.quotaAmount, 1),
      validDays: clampValue(genForm.validDays, 365),
      quantity: clampValue(genForm.quantity, 1, { max: 500 }),
    };
    setGenForm(normalized);
    try {
      setGenerating(true);
      await licenseService.generate(normalized);
      toast.success(`${normalized.quantity} licencia(s) generada(s)`);
      const updated = await licenseService.list();
      setLicenses(updated);
    } catch (error) {
      toast.error('Error al generar licencias: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async (license) => {
    // El input muestra emailDrafts[id] ?? license.traveler_email como valor
    // visible -- pero si el admin nunca lo edita, emailDrafts sigue vacío.
    // Hay que aplicar el mismo fallback acá o "Reenviar" pide un correo que
    // en realidad ya está ahí, visible en pantalla.
    const email = (emailDrafts[license.id] ?? license.traveler_email ?? '').trim();
    if (!email) {
      toast.warning('Ingresa el correo del viajero');
      return;
    }
    try {
      setSendingId(license.id);
      const { license: updated, accountCreated } = await licenseService.send(license.id, email);
      setLicenses((prev) => prev.map((l) => (l.id === license.id ? updated : l)));
      toast.success(
        accountCreated
          ? `Cuenta creada y licencia activada para ${email}`
          : `Licencia activada para ${email}`
      );
    } catch (error) {
      toast.error('Error al enviar: ' + error.message);
    } finally {
      setSendingId(null);
    }
  };

  const handleEmailChange = (license, value) => {
    setEmailDrafts({ ...emailDrafts, [license.id]: value });
    setEmailChecks((prev) => ({ ...prev, [license.id]: null }));

    clearTimeout(emailCheckTimers.current[license.id]);
    const trimmed = value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;

    emailCheckTimers.current[license.id] = setTimeout(async () => {
      setEmailChecks((prev) => ({ ...prev, [license.id]: 'checking' }));
      try {
        const exists = await licenseService.checkEmail(trimmed);
        setEmailChecks((prev) => ({ ...prev, [license.id]: exists ? 'exists' : 'new' }));
      } catch {
        setEmailChecks((prev) => ({ ...prev, [license.id]: null }));
      }
    }, 400);
  };

  const handleResend = async (license) => {
    try {
      setResendingId(license.id);
      await licenseService.resend(license.id);
      toast.success(`Correo reenviado a ${license.traveler_email}`);
    } catch (error) {
      toast.error('Error al reenviar: ' + error.message);
    } finally {
      setResendingId(null);
    }
  };

  const handleRevoke = async (license) => {
    if (!(await toast.confirm(`¿Revocar la licencia ${license.code}? Ya no podrá canjearse.`))) return;
    try {
      const updated = await licenseService.revoke(license.id);
      setLicenses((prev) => prev.map((l) => (l.id === license.id ? updated : l)));
      toast.success('Licencia revocada');
    } catch (error) {
      toast.error('Error al revocar: ' + error.message);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado');
  };

  if (!profile?.agency_id) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-6 z-[1500]">
        <div className="text-center max-w-md">
          <p className="text-white mb-4">Esta cuenta no administra ninguna agencia.</p>
          <button onClick={onClose} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">
            Volver
          </button>
        </div>
      </div>
    );
  }

  const totalLicenses = licenses.length;
  const redeemedCount = licenses.filter((l) => l.status === 'redeemed').length;
  const sentCount = licenses.filter((l) => l.status === 'sent').length;
  const quotaDistributed = licenses.reduce((sum, l) => sum + (l.quota_amount || 0), 0);

  const METRICS = [
    { label: 'Licencias generadas', value: totalLicenses, icon: 'fa-ticket', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
    { label: 'Canjeadas', value: redeemedCount, icon: 'fa-circle-check', color: 'text-green-600 dark:text-green-400 bg-green-500/10' },
    { label: 'Enviadas, sin canjear', value: sentCount, icon: 'fa-paper-plane', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' },
    { label: 'Cupo total distribuido', value: quotaDistributed, icon: 'fa-layer-group', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' },
  ];

  return (
    <div className="fixed inset-0 z-[1500] bg-slate-50 dark:bg-slate-900 overflow-y-auto">
      {/* Header band */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 pb-16">
        <div className="max-w-4xl mx-auto px-6 pt-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <i className="fas fa-building text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Panel de Agencia</h1>
              {agency?.name && (
                <p className="text-sm text-blue-100">{agency.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              title="Mi cuenta"
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition"
            >
              <i className="fas fa-bars"></i>
            </button>
            <button
              onClick={onClose}
              title="Cerrar panel"
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 pb-24 -mt-10">
        {/* Metrics */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {METRICS.map((metric) => (
              <div
                key={metric.label}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-lg"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${metric.color}`}>
                  <i className={`fas ${metric.icon} text-sm`}></i>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">{metric.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{metric.label}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">Cargando...</div>
        ) : (
          <div className="space-y-8">
            {/* Marca */}
            <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Marca de la agencia</h2>
              <form onSubmit={handleSaveBrand} className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={brandForm.name}
                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Logo
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
                      {uploadingLogo ? (
                        <i className="fas fa-spinner fa-spin text-slate-400"></i>
                      ) : brandForm.logo_url ? (
                        <img src={brandForm.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <i className="fas fa-image text-slate-300 dark:text-slate-600"></i>
                      )}
                    </div>
                    <label className="flex-1 cursor-pointer px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-bold text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                      {uploadingLogo ? 'Subiendo...' : brandForm.logo_url ? 'Cambiar' : 'Subir imagen'}
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoSelect} disabled={uploadingLogo} className="hidden" />
                    </label>
                    {brandForm.logo_url && !uploadingLogo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        title="Quitar logo"
                        className="shrink-0 w-9 h-9 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition flex items-center justify-center"
                      >
                        <i className="fas fa-trash-alt text-sm"></i>
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">{LOGO_REQUIREMENTS_LABEL}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Color principal
                  </label>
                  <input
                    type="color"
                    value={brandForm.primary_color || '#2563eb'}
                    onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })}
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={savingBrand}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {savingBrand ? 'Guardando...' : 'Guardar marca'}
                  </button>
                </div>
              </form>
            </section>

            {/* Generar licencias */}
            <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Generar licencias</h2>
              <form onSubmit={handleGenerate} className="grid sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Tipo de cupo
                  </label>
                  <select
                    value={genForm.quotaType}
                    onChange={(e) => setGenForm({ ...genForm, quotaType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="trips">Viajes</option>
                    <option value="ai_generations">Generaciones IA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Cantidad de cupo
                  </label>
                  <input
                    {...numberField('quotaAmount', 1)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Vigencia (días)
                  </label>
                  <input
                    {...numberField('validDays', 365)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    N.° de licencias
                  </label>
                  <input
                    {...numberField('quantity', 1, { max: 500 })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={generating}
                  className="sm:col-span-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-blue-900/40 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {generating ? 'Generando...' : 'Generar licencias'}
                </button>
              </form>
            </section>

            {/* Lista de licencias */}
            <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Licencias ({licenses.length})
              </h2>

              {licenses.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm">Aún no has generado licencias.</p>
              ) : (
                <div className="space-y-3 overflow-x-auto">
                  {licenses.map((license) => (
                    <div
                      key={license.id}
                      className="border border-slate-200 dark:border-white/10 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:flex-wrap gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-[180px]">
                        <button
                          onClick={() => copyCode(license.code)}
                          title="Copiar código"
                          className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        >
                          {license.code} <i className="fas fa-copy text-xs ml-1 opacity-50"></i>
                        </button>
                      </div>

                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full w-fit ${STATUS_COLOR[license.status]}`}>
                        {STATUS_LABEL[license.status] || license.status}
                      </span>

                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {license.quota_remaining}/{license.quota_amount}{' '}
                        {license.quota_type === 'trips' ? 'viajes' : 'gen. IA'}
                        {license.traveler_email && (
                          <span className="block truncate max-w-[220px]">{license.traveler_email}</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                        {license.status === 'unused' || license.status === 'sent' ? (
                          <>
                            <div className="flex flex-col gap-1">
                              <input
                                type="email"
                                placeholder="email@viajero.com"
                                value={emailDrafts[license.id] ?? license.traveler_email ?? ''}
                                onChange={(e) => handleEmailChange(license, e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white w-full sm:w-44"
                              />
                              {emailChecks[license.id] === 'checking' && (
                                <span className="text-[11px] text-slate-400">Verificando...</span>
                              )}
                              {emailChecks[license.id] === 'exists' && (
                                <span className="text-[11px] text-blue-500 dark:text-blue-400 font-semibold">
                                  <i className="fas fa-circle-check mr-1"></i>Ya tiene cuenta
                                </span>
                              )}
                              {emailChecks[license.id] === 'new' && (
                                <span className="text-[11px] text-slate-400">
                                  <i className="fas fa-user-plus mr-1"></i>Se creará cuenta nueva
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleSend(license)}
                              disabled={sendingId === license.id}
                              className="shrink-0 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50"
                            >
                              {sendingId === license.id ? 'Enviando...' : license.status === 'sent' ? 'Reenviar' : 'Enviar'}
                            </button>
                          </>
                        ) : null}

                        {license.status === 'redeemed' && license.traveler_email && (
                          <button
                            onClick={() => handleResend(license)}
                            disabled={resendingId === license.id}
                            title="Reenviar el correo de acceso por si se perdió"
                            className="shrink-0 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition disabled:opacity-50"
                          >
                            {resendingId === license.id ? 'Reenviando...' : 'Reenviar acceso'}
                          </button>
                        )}

                        {license.status !== 'redeemed' && license.status !== 'revoked' && license.status !== 'expired' && (
                          <button
                            onClick={() => handleRevoke(license)}
                            className="shrink-0 text-red-500 hover:text-red-600 text-sm font-bold px-3 py-2"
                          >
                            Revocar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        hasActiveTrip={false}
        onOpenList={() => {}}
        onExitTrip={() => {}}
        onOpenAgencyPanel={() => {}}
      />
    </div>
  );
};

export default AgencyAdminPanel;
