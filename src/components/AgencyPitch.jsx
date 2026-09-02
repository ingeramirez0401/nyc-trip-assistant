import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AgencyRequestForm from './AgencyRequestForm';

const VALUE_PROP_ICONS = ['fa-palette', 'fa-layer-group', 'fa-paper-plane'];

const AgencyPitch = ({ onAgencyLogin }) => {
  const { t } = useTranslation('agency');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const valueProps = t('agency:pitch.valueProps', { returnObjects: true });

  return (
    <div
      id="agencias"
      className="relative w-full border border-white/10 rounded-3xl p-8 md:p-12 mb-14 scroll-mt-24 overflow-hidden"
    >
      <img
        src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=70"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/85"></div>

      <div className="relative max-w-3xl mx-auto text-center mb-10">
        <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs md:text-sm mb-3">
          {t('agency:pitch.eyebrow')}
        </p>
        <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
          {t('agency:pitch.title')}
        </h2>
        <p className="text-blue-200 max-w-xl mx-auto">
          {t('agency:pitch.subtitle')}
        </p>
      </div>

      <div className="relative grid sm:grid-cols-3 gap-4 mb-10">
        {valueProps.map((item, i) => (
          <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-3">
              <i className={`fas ${VALUE_PROP_ICONS[i]}`}></i>
            </div>
            <h3 className="font-bold text-white mb-1.5">{item.title}</h3>
            <p className="text-sm text-blue-200/80 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="relative flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button
          onClick={onAgencyLogin}
          className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 active:scale-95 transition-all shadow-lg"
        >
          <i className="fas fa-right-to-bracket mr-2"></i>
          {t('agency:pitch.loginCta')}
        </button>
        <button
          onClick={() => setShowRequestForm(true)}
          className="text-blue-200 hover:text-white font-semibold px-6 py-3 transition-colors"
        >
          {t('agency:pitch.requestCta')} <i className="fas fa-arrow-right ml-1"></i>
        </button>
      </div>

      {showRequestForm && <AgencyRequestForm onClose={() => setShowRequestForm(false)} />}
    </div>
  );
};

export default AgencyPitch;
