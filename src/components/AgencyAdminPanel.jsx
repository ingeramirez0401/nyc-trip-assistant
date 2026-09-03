import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { agencyService } from '../services/agencyService';
import { licenseService } from '../services/licenseService';
import { storageService } from '../services/storageService';
import { normalizeSquareLogo, getLogoRequirementsLabel } from '../lib/imageProcessing';
import { quotaUnitLabel } from '../lib/licenseFormat';
import { LICENSE_TIERS, LICENSE_TIER_KEYS } from '../data/licenseTiers';
import { usePaginatedList } from '../hooks/usePaginatedList';
import Pagination from './Pagination';
import SideMenu from './SideMenu';

const STATUS_FILTER_VALUES = ['unused', 'sent', 'redeemed', 'expired', 'revoked'];

const STATUS_COLOR = {
  unused: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  redeemed: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  expired: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  revoked: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
};

const AgencyAdminPanel = ({ onClose, isDarkMode, toggleTheme }) => {
  const { t } = useTranslation(['agency', 'common']);
  const { profile } = useAuth();
  const toast = useToast();
  const STATUS_LABEL = t('agency:admin.statusLabels', { returnObjects: true });

  const [agency, setAgency] = useState(null);
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
  const [genForm, setGenForm] = useState({ tier: 'explorer', quantity: 5 });
  const [statusFilter, setStatusFilter] = useState('');

  // Lista de licencias -- paginada/filtrada server-side, mismo hook que
  // usa SuperAdminPanel para agencias. La agencia (un solo registro) se
  // carga aparte, no participa de la paginación.
  const fetchLicenses = useCallback((params) => licenseService.list(params), []);
  const {
    items: licenses,
    setItems: setLicenses,
    total: licensesTotal,
    totalPages,
    page,
    setPage,
    search: licenseSearch,
    setSearch: setLicenseSearch,
    setFilters: setLicenseFilters,
    loading: licensesLoading,
    reload: reloadLicenses,
    extra: licensesExtra,
  } = usePaginatedList(fetchLicenses, { pageSize: 20 });

  useEffect(() => {
    loadAgency();
  }, []);

  useEffect(() => {
    // Copia local porque el cleanup corre después del unmount, cuando el
    // ref ya podría estar en otro objeto.
    const timers = emailCheckTimers.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  const loadAgency = async () => {
    if (!profile?.agency_id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const agencyData = await agencyService.getById(profile.agency_id);
      setAgency(agencyData);
      setBrandForm({
        name: agencyData.name || '',
        logo_url: agencyData.logo_url || '',
        primary_color: agencyData.primary_color || '#2563eb',
      });
    } catch (error) {
      toast.error(`${t('agency:admin.brand.errors.load')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setLicenseFilters(value ? { status: value } : {});
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
      toast.success(t('agency:admin.brand.logoUploaded'));
    } catch (error) {
      toast.error(error.message || t('agency:admin.brand.errors.logo'));
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
      toast.success(t('agency:admin.brand.success'));
    } catch (error) {
      toast.error(`${t('agency:admin.brand.errors.save')}: ${error.message}`);
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
      quantity: clampValue(genForm.quantity, 1, { max: 500 }),
    };
    setGenForm(normalized);
    try {
      setGenerating(true);
      await licenseService.generate(normalized);
      toast.success(t('agency:admin.generate.success', { count: normalized.quantity }));
      await Promise.all([reloadLicenses(), loadAgency()]);
    } catch (error) {
      toast.error(`${t('agency:admin.generate.error')}: ${error.message}`);
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
      toast.warning(t('agency:admin.list.emailRequired'));
      return;
    }
    try {
      setSendingId(license.id);
      const { license: updated, accountCreated } = await licenseService.send(license.id, email);
      setLicenses((prev) => prev.map((l) => (l.id === license.id ? updated : l)));
      toast.success(
        accountCreated
          ? t('agency:admin.list.accountCreatedAndActivated', { email })
          : t('agency:admin.list.activated', { email })
      );
    } catch (error) {
      toast.error(`${t('agency:admin.list.errors.send')}: ${error.message}`);
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
      toast.success(t('agency:admin.list.resent', { email: license.traveler_email }));
    } catch (error) {
      toast.error(`${t('agency:admin.list.errors.resend')}: ${error.message}`);
    } finally {
      setResendingId(null);
    }
  };

  const handleRevoke = async (license) => {
    if (!(await toast.confirm(t('agency:admin.list.confirmRevoke', { code: license.code })))) return;
    try {
      const updated = await licenseService.revoke(license.id);
      setLicenses((prev) => prev.map((l) => (l.id === license.id ? updated : l)));
      toast.success(t('agency:admin.list.revoked'));
    } catch (error) {
      toast.error(`${t('agency:admin.list.errors.revoke')}: ${error.message}`);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(t('agency:admin.list.codeCopied'));
  };

  if (!profile?.agency_id) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-6 z-[1500]">
        <div className="text-center max-w-md">
          <p className="text-white mb-4">{t('agency:admin.noAgency')}</p>
          <button onClick={onClose} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">
            {t('agency:admin.back')}
          </button>
        </div>
      </div>
    );
  }

  // Del servidor, siempre sobre el total de la agencia -- nunca sobre la
  // página/filtro que se esté viendo (ver server/licenseRoutes.js).
  const {
    totalLicenses = 0,
    redeemedCount = 0,
    sentCount = 0,
    quotaDistributed = 0,
  } = licensesExtra.metrics || {};

  const METRICS = [
    { label: t('agency:admin.metrics.generated'), value: totalLicenses, icon: 'fa-ticket', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
    { label: t('agency:admin.metrics.redeemed'), value: redeemedCount, icon: 'fa-circle-check', color: 'text-green-600 dark:text-green-400 bg-green-500/10' },
    { label: t('agency:admin.metrics.sentUnredeemed'), value: sentCount, icon: 'fa-paper-plane', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' },
    { label: t('agency:admin.metrics.totalQuota'), value: quotaDistributed, icon: 'fa-layer-group', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' },
  ];

  const poolAllocated = agency?.license_credits_allocated ?? 0;
  const poolUsed = agency?.license_credits_used ?? 0;
  const poolRemaining = Math.max(poolAllocated - poolUsed, 0);

  return (
    <div className="fixed inset-0 z-[1500] bg-slate-50 dark:bg-slate-900 overflow-y-auto">
      {/* Header band */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 pb-16">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between" style={{ paddingTop: 'calc(2rem + env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <i className="fas fa-building text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{t('agency:admin.title')}</h1>
              {agency?.name && (
                <p className="text-sm text-blue-100">{agency.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              title={t('agency:admin.accountMenu')}
              aria-label={t('agency:admin.accountMenu')}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition"
            >
              <i className="fas fa-bars"></i>
            </button>
            <button
              onClick={onClose}
              title={t('agency:admin.closePanel')}
              aria-label={t('agency:admin.closePanel')}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 pb-24 -mt-10">
        {/* Pool de licencias -- cupo cargado por TripPulse, distinto de las
            métricas de abajo (que cuentan licencias YA generadas). */}
        {!loading && (
          <div className="mb-6 flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <i className="fas fa-box-archive"></i>
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-none">
                {poolUsed}/{poolAllocated}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('agency:admin.pool.label')}</p>
            </div>
          </div>
        )}

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
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">{t('agency:admin.loading')}</div>
        ) : (
          <div className="space-y-8">
            {/* Marca */}
            <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('agency:admin.brand.title')}</h2>
              <form onSubmit={handleSaveBrand} className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    {t('agency:admin.brand.nameLabel')}
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
                    {t('agency:admin.brand.logoLabel')}
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
                      {uploadingLogo ? t('agency:admin.brand.uploading') : brandForm.logo_url ? t('agency:admin.brand.change') : t('agency:admin.brand.upload')}
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoSelect} disabled={uploadingLogo} className="hidden" />
                    </label>
                    {brandForm.logo_url && !uploadingLogo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        title={t('agency:admin.brand.removeLogo')}
                        aria-label={t('agency:admin.brand.removeLogo')}
                        className="shrink-0 w-9 h-9 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition flex items-center justify-center"
                      >
                        <i className="fas fa-trash-alt text-sm"></i>
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">{getLogoRequirementsLabel()}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    {t('agency:admin.brand.colorLabel')}
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
                    {savingBrand ? t('agency:admin.brand.saving') : t('agency:admin.brand.save')}
                  </button>
                </div>
              </form>
            </section>

            {/* Generar licencias */}
            <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{t('agency:admin.generate.title')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {t('agency:admin.generate.poolHint', { remaining: poolRemaining })}
              </p>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  {LICENSE_TIER_KEYS.map((tierKey) => {
                    const cfg = LICENSE_TIERS[tierKey];
                    const selected = genForm.tier === tierKey;
                    return (
                      <button
                        key={tierKey}
                        type="button"
                        onClick={() => setGenForm({ ...genForm, tier: tierKey })}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          selected
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10'
                            : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                      >
                        <span className="font-bold text-slate-900 dark:text-white block mb-1">
                          {t(`agency:tiers.${tierKey}.name`)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {t('agency:admin.generate.tierSummary', { trips: cfg.quotaAmount, days: cfg.validDays })}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="grid sm:grid-cols-3 gap-4 items-end">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      {t('agency:admin.generate.quantityLabel')}
                    </label>
                    <input
                      {...numberField('quantity', 1, { max: 500 })}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={generating}
                    className="sm:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-blue-900/40 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {generating ? t('agency:admin.generate.generating') : t('agency:admin.generate.submit')}
                  </button>
                </div>
              </form>
            </section>

            {/* Lista de licencias */}
            <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t('agency:admin.list.title', { count: licensesTotal })}
                </h2>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative sm:w-56">
                    <i className="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                    <input
                      type="text"
                      value={licenseSearch}
                      onChange={(e) => setLicenseSearch(e.target.value)}
                      placeholder={t('agency:admin.list.searchPlaceholder')}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">{t('agency:admin.list.allStatuses')}</option>
                    {STATUS_FILTER_VALUES.map((value) => (
                      <option key={value} value={value}>{STATUS_LABEL[value] || value}</option>
                    ))}
                  </select>
                </div>
              </div>

              {licensesLoading ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">{t('agency:admin.loading')}</div>
              ) : licenses.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {licenseSearch || statusFilter ? t('agency:admin.list.noResults') : t('agency:admin.list.empty')}
                </p>
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
                          title={t('agency:admin.list.copyCode')}
                          aria-label={t('agency:admin.list.copyCode')}
                          className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        >
                          {license.code} <i className="fas fa-copy text-xs ml-1 opacity-50"></i>
                        </button>
                      </div>

                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full w-fit ${STATUS_COLOR[license.status]}`}>
                        {STATUS_LABEL[license.status] || license.status}
                      </span>

                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {license.tier ? t(`agency:tiers.${license.tier}.name`) : null}{' '}
                        {license.quota_remaining}/{license.quota_amount}{' '}
                        {quotaUnitLabel(t, license.quota_type)}
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
                                placeholder={t('agency:admin.list.emailPlaceholder')}
                                value={emailDrafts[license.id] ?? license.traveler_email ?? ''}
                                onChange={(e) => handleEmailChange(license, e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white w-full sm:w-44"
                              />
                              {emailChecks[license.id] === 'checking' && (
                                <span className="text-[11px] text-slate-400">{t('agency:admin.list.checking')}</span>
                              )}
                              {emailChecks[license.id] === 'exists' && (
                                <span className="text-[11px] text-blue-500 dark:text-blue-400 font-semibold">
                                  <i className="fas fa-circle-check mr-1"></i>{t('agency:admin.list.hasAccount')}
                                </span>
                              )}
                              {emailChecks[license.id] === 'new' && (
                                <span className="text-[11px] text-slate-400">
                                  <i className="fas fa-user-plus mr-1"></i>{t('agency:admin.list.willCreateAccount')}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleSend(license)}
                              disabled={sendingId === license.id}
                              className="shrink-0 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50"
                            >
                              {sendingId === license.id ? t('agency:admin.list.sending') : license.status === 'sent' ? t('agency:admin.list.resend') : t('agency:admin.list.send')}
                            </button>
                          </>
                        ) : null}

                        {license.status === 'redeemed' && license.traveler_email && (
                          <button
                            onClick={() => handleResend(license)}
                            disabled={resendingId === license.id}
                            title={t('agency:admin.list.resendAccessTitle')}
                            className="shrink-0 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition disabled:opacity-50"
                          >
                            {resendingId === license.id ? t('agency:admin.list.resending') : t('agency:admin.list.resendAccess')}
                          </button>
                        )}

                        {license.status !== 'redeemed' && license.status !== 'revoked' && license.status !== 'expired' && (
                          <button
                            onClick={() => handleRevoke(license)}
                            className="shrink-0 text-red-500 hover:text-red-600 text-sm font-bold px-3 py-2"
                          >
                            {t('agency:admin.list.revoke')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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
