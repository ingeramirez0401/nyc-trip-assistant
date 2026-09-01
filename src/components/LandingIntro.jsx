import React from 'react';

const HIGHLIGHTS = [
  {
    icon: 'fa-brain',
    title: 'IA que conoce el destino',
    text: 'Nada de "lugares genéricos". Coordenadas reales, tips locales y un itinerario armado en segundos, no en horas de pestañas abiertas.',
  },
  {
    icon: 'fa-map-location-dot',
    title: 'Todo en un mapa, todo el viaje',
    text: 'Rutas por día, paradas guardadas, fotos y notas. Abres la app y sabes exactamente a dónde ir.',
  },
  {
    icon: 'fa-handshake',
    title: 'Hecho para tu agencia',
    text: 'Dale a cada cliente una experiencia con tu marca, no un link genérico. Ellos viven el viaje, tú te quedas en su radar.',
  },
];

const LandingIntro = () => {
  return (
    <div className="max-w-5xl w-full mb-14">
      <div className="grid lg:grid-cols-2 gap-10 items-center mb-14">
        {/* Texto */}
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 dark:bg-blue-500/15 border border-blue-600/20 dark:border-blue-500/25 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
            <i className="fas fa-wand-magic-sparkles"></i>
            Planificación con IA
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 leading-[1.1] tracking-tight">
            Deja que la IA arme tu{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] dark:from-blue-300 dark:to-indigo-300">
              itinerario perfecto
            </span>
          </h2>
          <p className="text-slate-600 dark:text-blue-200 text-base md:text-lg mb-8">
            Dinos tu destino, tus días y tus intereses. TripPulse te devuelve un plan
            completo, con mapa y todo, listo para vivirse — no para seguir editando.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <a
              href="#viajeros"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 dark:shadow-blue-900/40 hover:shadow-blue-900/40 active:scale-95 transition-all"
            >
              <i className="fas fa-suitcase-rolling mr-2"></i>
              Soy viajero
            </a>
            <a
              href="#agencias"
              className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-800 dark:text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-white/20 active:scale-95 transition-all shadow-sm"
            >
              <i className="fas fa-building mr-2"></i>
              Soy una agencia de viajes
            </a>
          </div>
        </div>

        {/* Foto */}
        <div className="relative">
          <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
            <img
              src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80"
              alt="Un viaje por carretera entre paisajes de piedra roja"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-slate-100 dark:border-white/10">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <i className="fas fa-wand-magic-sparkles text-sm"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-none mb-1">Itinerario listo</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none">en segundos, con IA</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto mb-14">
        {[
          { value: '3+', label: 'Días por viaje' },
          { value: '6', label: 'Lugares por día' },
          { value: 'GPS', label: 'Coordenadas reales' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-3 py-4 shadow-sm text-center"
          >
            <p className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] dark:from-blue-300 dark:to-indigo-300">
              {stat.value}
            </p>
            <p className="text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4 text-left">
        {HIGHLIGHTS.map((item) => (
          <div
            key={item.title}
            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-lg dark:shadow-none hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--brand-600)] to-[var(--brand-700)] text-white flex items-center justify-center mb-3 shadow-md shadow-blue-900/20">
              <i className={`fas ${item.icon}`}></i>
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
