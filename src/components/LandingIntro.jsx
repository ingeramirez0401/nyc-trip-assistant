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
    <div className="max-w-4xl w-full mb-14 text-center">
      <p className="text-blue-600 dark:text-blue-300 md:text-blue-300 font-bold uppercase tracking-widest text-xs md:text-sm mb-3">
        Planificación de viajes con IA
      </p>
      <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white md:text-white mb-4 leading-tight">
        Deja que la IA arme tu itinerario perfecto
      </h2>
      <p className="text-slate-600 dark:text-blue-200 md:text-blue-200 text-base md:text-lg max-w-2xl mx-auto mb-8">
        Dinos tu destino, tus días y tus intereses. TripPulse te devuelve un plan
        completo, con mapa y todo, listo para vivirse — no para seguir editando.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
        <a
          href="#viajeros"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 active:scale-95 transition-all"
        >
          <i className="fas fa-suitcase-rolling mr-2"></i>
          Soy viajero
        </a>
        <a
          href="#agencias"
          className="bg-slate-900/5 dark:bg-white/10 md:bg-white/10 border border-slate-300 dark:border-white/20 md:border-white/20 text-slate-800 dark:text-white md:text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 active:scale-95 transition-all backdrop-blur-sm"
        >
          <i className="fas fa-building mr-2"></i>
          Soy una agencia de viajes
        </a>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 text-left">
        {HIGHLIGHTS.map((item) => (
          <div
            key={item.title}
            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-lg dark:shadow-none"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-3">
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
