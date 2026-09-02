import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('agency');
  const token = new URLSearchParams(window.location.search).get('token');

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!token) {
      setError(t('agency:approve.missingToken'));
      setLoading(false);
      return;
    }
    agencyRequestService
      .getByToken(token)
      .then(setRequest)
      .catch((err) => setError(err.message || t('agency:approve.loadError')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleApprove = async () => {
    setActing(true);
    try {
      const data = await agencyRequestService.approve(token);
      setResult({ type: 'approved', ...data });
    } catch (err) {
      setError(err.message || t('agency:approve.approveError'));
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
      setError(err.message || t('agency:approve.rejectError'));
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 shadow-lg shadow-blue-500/30 overflow-hidden">
            <img src="/icons/icon-192x192.png" alt="TripPulse" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('agency:approve.title')}</h1>
        </div>

        {loading && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <i className="fas fa-circle-notch fa-spin text-2xl mb-3"></i>
            <p>{t('agency:approve.loading')}</p>
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
              <Field label={t('agency:approve.fields.agency')} value={request.agencyName} />
              <Field label={t('agency:approve.fields.contact')} value={request.contactName} />
              <Field label={t('agency:approve.fields.email')} value={request.contactEmail} />
              <Field label={t('agency:approve.fields.phone')} value={request.phone} />
              <Field label={t('agency:approve.fields.city')} value={request.city} />
              <Field label={t('agency:approve.fields.travelers')} value={request.estimatedTravelers} />
              <Field label={t('agency:approve.fields.message')} value={request.message} />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={acting}
                className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition disabled:opacity-50"
              >
                {t('agency:approve.reject')}
              </button>
              <button
                onClick={handleApprove}
                disabled={acting}
                className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-blue-900/40 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {acting ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fas fa-circle-notch fa-spin"></i> {t('agency:approve.processing')}
                  </span>
                ) : (
                  t('agency:approve.approve')
                )}
              </button>
            </div>
          </>
        )}

        {result?.type === 'approved' && (
          <div className="text-center py-6">
            <i className="fas fa-circle-check text-4xl text-green-500 mb-4"></i>
            <p className="text-slate-900 dark:text-white font-bold mb-2">{t('agency:approve.activatedTitle')}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {result.accountCreated
                ? t('agency:approve.activatedWithAccount')
                : t('agency:approve.activatedExistingAccount')}
            </p>
          </div>
        )}

        {result?.type === 'rejected' && (
          <div className="text-center py-6">
            <i className="fas fa-circle-xmark text-4xl text-slate-400 mb-4"></i>
            <p className="text-slate-900 dark:text-white font-bold">{t('agency:approve.rejectedTitle')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApproveAgencyScreen;
