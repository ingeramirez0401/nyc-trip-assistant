import React from 'react';
import { useTranslation } from 'react-i18next';

const PlansSection = ({ onStartFree, onLogin }) => {
  const { t } = useTranslation('agency');
  const freeFeatures = t('agency:plans.free.features', { returnObjects: true });
  const vipFeatures = t('agency:plans.vip.features', { returnObjects: true });

  return (
    <div className="max-w-3xl w-full mb-10 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('agency:plans.title')}</h2>
        <p className="text-slate-600 dark:text-blue-300 mb-3">{t('agency:plans.subtitle')}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('agency:plans.alreadyHaveAccount')}{' '}
          <button
            onClick={onLogin}
            className="text-blue-600 dark:text-blue-300 font-bold hover:underline"
          >
            {t('agency:plans.login')}
          </button>
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Free */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col shadow-xl dark:shadow-none">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('agency:plans.free.name')}</h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              $0 <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('agency:plans.free.priceSuffix')}</span>
            </p>
          </div>
          <ul className="space-y-2.5 mb-6 flex-1">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                <i className="fas fa-check text-green-500 mt-0.5"></i>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={onStartFree}
            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {t('agency:plans.free.cta')}
          </button>
        </div>

        {/* VIP */}
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 flex flex-col shadow-2xl shadow-blue-900/40 border border-white/10">
          <span className="absolute -top-3 right-6 bg-amber-400 text-amber-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide">
            {t('agency:plans.vip.badge')}
          </span>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white">{t('agency:plans.vip.name')}</h3>
            <p className="text-sm font-medium text-blue-100 mt-1">{t('agency:plans.vip.subtitle')}</p>
          </div>
          <ul className="space-y-2.5 mb-6 flex-1">
            {vipFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-blue-50">
                <i className="fas fa-wand-magic-sparkles text-amber-300 mt-0.5"></i>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <a
            href={`mailto:hello@nodalyst.ai?subject=${encodeURIComponent(t('agency:plans.vip.mailSubject'))}`}
            className="w-full text-center bg-white text-blue-700 py-3 rounded-xl font-bold hover:bg-blue-50 active:scale-[0.98] transition-all shadow-lg"
          >
            {t('agency:plans.vip.cta')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default PlansSection;
