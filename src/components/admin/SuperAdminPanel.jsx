import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../contexts/ToastContext';
import { adminService } from '../../services/adminService';

const SuperAdminPanel = ({ onClose }) => {
  const { t } = useTranslation(['agency', 'common']);
  const toast = useToast();

  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjustingId, setAdjustingId] = useState(null);
  // Draft de cantidad por agencia -- el signo lo decide el botón que se
  // presiona (Agregar/Restar), no el input.
  const [amountDrafts, setAmountDrafts] = useState({});

  useEffect(() => {
    loadAgencies();
  }, []);

  const loadAgencies = async () => {
    try {
      setLoading(true);
      const data = await adminService.listAgencies();
      setAgencies(data);
    } catch (error) {
      toast.error(`${t('agency:superAdmin.errors.load')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async (agency, sign) => {
    const amount = Number(amountDrafts[agency.id]);
    if (!Number.isInteger(amount) || amount <= 0) {
      toast.warning(t('agency:superAdmin.errors.invalidAmount'));
      return;
    }
    try {
      setAdjustingId(agency.id);
      const updated = await adminService.adjustAgencyPool(agency.id, amount * sign);
      setAgencies((prev) => prev.map((a) => (a.id === agency.id ? { ...a, ...updated } : a)));
      setAmountDrafts((prev) => ({ ...prev, [agency.id]: '' }));
      toast.success(t('agency:superAdmin.poolUpdated'));
    } catch (error) {
      toast.error(`${t('agency:superAdmin.errors.adjust')}: ${error.message}`);
    } finally {
      setAdjustingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[1500] bg-slate-50 dark:bg-slate-900 overflow-y-auto">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 pb-16">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between" style={{ paddingTop: 'calc(2rem + env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <i className="fas fa-user-shield text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{t('agency:superAdmin.title')}</h1>
              <p className="text-sm text-indigo-100">{t('agency:superAdmin.subtitle')}</p>
            </div>
          </div>
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

      <div className="max-w-4xl mx-auto p-6 pb-24 -mt-10">
        <section className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            {t('agency:superAdmin.agenciesTitle', { count: agencies.length })}
          </h2>

          {loading ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">{t('agency:admin.loading')}</div>
          ) : agencies.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('agency:superAdmin.empty')}</p>
          ) : (
            <div className="space-y-3">
              {agencies.map((agency) => (
                <div
                  key={agency.id}
                  className="border border-slate-200 dark:border-white/10 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center gap-3"
                >
                  <div className="min-w-[200px]">
                    <p className="font-bold text-slate-900 dark:text-white">{agency.name}</p>
                    {agency.contact_email && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{agency.contact_email}</p>
                    )}
                  </div>

                  <span className="text-sm font-bold px-3 py-1.5 rounded-full w-fit bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                    {agency.license_credits_used}/{agency.license_credits_allocated} {t('agency:superAdmin.licenses')}
                  </span>

                  <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                    <input
                      type="number"
                      min="1"
                      placeholder={t('agency:superAdmin.amountPlaceholder')}
                      value={amountDrafts[agency.id] ?? ''}
                      onChange={(e) => setAmountDrafts((prev) => ({ ...prev, [agency.id]: e.target.value }))}
                      className="w-28 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white"
                    />
                    <button
                      onClick={() => handleAdjust(agency, 1)}
                      disabled={adjustingId === agency.id}
                      className="shrink-0 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition disabled:opacity-50"
                    >
                      <i className="fas fa-plus mr-1"></i>{t('agency:superAdmin.add')}
                    </button>
                    <button
                      onClick={() => handleAdjust(agency, -1)}
                      disabled={adjustingId === agency.id}
                      className="shrink-0 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition disabled:opacity-50"
                    >
                      <i className="fas fa-minus mr-1"></i>{t('agency:superAdmin.subtract')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SuperAdminPanel;
