import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AgencyRequestForm from './AgencyRequestForm';

const AgencyPricing = () => {
  const { t } = useTranslation('agency');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const packs = t('agency:pricing.packs', { returnObjects: true });

  return (
    <div className="relative w-full border border-white/10 rounded-3xl p-8 md:p-12 mb-14 bg-slate-950">
      <div className="relative max-w-2xl mx-auto text-center mb-10">
        <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs md:text-sm mb-3">
          {t('agency:pricing.eyebrow')}
        </p>
        <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
          {t('agency:pricing.title')}
        </h2>
        <p className="text-blue-200 max-w-xl mx-auto">
          {t('agency:pricing.subtitle')}
        </p>
      </div>

      {/* Qué incluye cada plan -- necesario antes de la tabla de precios,
          si no "$20/licencia" no dice qué está comprando la agencia. */}
      <div className="grid sm:grid-cols-2 gap-4 mb-3 max-w-2xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <span className="inline-block text-xs font-black uppercase tracking-wide text-indigo-300 mb-2">Explorer</span>
          <p className="text-white font-bold">{t('agency:pricing.tierExplainer.explorer')}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <span className="inline-block text-xs font-black uppercase tracking-wide text-indigo-300 mb-2">Voyager</span>
          <p className="text-white font-bold">{t('agency:pricing.tierExplainer.voyager')}</p>
        </div>
      </div>
      <p className="text-center text-xs text-blue-300/70 max-w-xl mx-auto mb-10">
        {t('agency:pricing.tierNote')}
      </p>

      {/* Lotes por volumen */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {packs.map((pack, i) => {
          const isEnterprise = i === packs.length - 1;
          return (
            <div
              key={pack.name}
              className={`relative rounded-2xl p-5 border flex flex-col ${
                isEnterprise
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-white/10'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {pack.discount && (
                <span className="absolute -top-3 right-4 bg-emerald-400 text-emerald-950 text-[11px] font-black px-2.5 py-1 rounded-full">
                  {pack.discount}
                </span>
              )}
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-300 mb-1">{pack.range}</p>
              <h3 className="text-lg font-bold text-white mb-2">{pack.name}</h3>
              <p className="text-3xl font-black text-white mb-1 leading-none">
                {pack.price}
                {pack.priceSuffix && (
                  <span className="text-xs font-medium text-blue-200 ml-1.5 align-middle">{pack.priceSuffix}</span>
                )}
              </p>
              <p className="text-sm text-blue-200/80 mt-auto pt-4">{pack.example}</p>
            </div>
          );
        })}
      </div>

      <div className="relative flex justify-center mt-10">
        <button
          onClick={() => setShowRequestForm(true)}
          className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 active:scale-95 transition-all shadow-lg"
        >
          {t('agency:pricing.cta')} <i className="fas fa-arrow-right ml-2"></i>
        </button>
      </div>

      {showRequestForm && <AgencyRequestForm onClose={() => setShowRequestForm(false)} />}
    </div>
  );
};

export default AgencyPricing;
