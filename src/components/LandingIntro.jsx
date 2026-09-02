import React from 'react';
import { useTranslation } from 'react-i18next';

const HIGHLIGHT_ICONS = ['fa-brain', 'fa-map-location-dot', 'fa-handshake'];

const LandingIntro = () => {
  const { t } = useTranslation('agency');
  const highlights = t('agency:landing.highlights', { returnObjects: true });

  return (
    <div className="max-w-5xl w-full mb-14">
      <div className="grid lg:grid-cols-2 gap-10 items-center mb-14">
        {/* Texto */}
        <div className="text-center lg:text-left">
          <p className="text-blue-600 dark:text-blue-300 font-bold uppercase tracking-widest text-xs md:text-sm mb-3">
            {t('agency:landing.eyebrow')}
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
            {t('agency:landing.title')}
          </h2>
          <p className="text-slate-600 dark:text-blue-200 text-base md:text-lg mb-8">
            {t('agency:landing.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <a
              href="#viajeros"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 dark:shadow-blue-900/40 hover:shadow-blue-900/40 active:scale-95 transition-all"
            >
              <i className="fas fa-suitcase-rolling mr-2"></i>
              {t('agency:landing.ctaTraveler')}
            </a>
            <a
              href="#agencias"
              className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-800 dark:text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-white/20 active:scale-95 transition-all shadow-sm"
            >
              <i className="fas fa-building mr-2"></i>
              {t('agency:landing.ctaAgency')}
            </a>
          </div>
        </div>

        {/* Foto */}
        <div className="relative">
          <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
            <img
              src="/images/landing-hero.jpg"
              alt={t('agency:landing.heroAlt')}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-slate-100 dark:border-white/10">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <i className="fas fa-wand-magic-sparkles text-sm"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-none mb-1">{t('agency:landing.itineraryReady')}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none">{t('agency:landing.itineraryReadySub')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 text-left">
        {highlights.map((item, i) => (
          <div
            key={item.title}
            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-lg dark:shadow-none"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-3">
              <i className={`fas ${HIGHLIGHT_ICONS[i]}`}></i>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1.5">{item.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LandingIntro;
