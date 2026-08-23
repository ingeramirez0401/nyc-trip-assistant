import React from 'react';

const VALUE_PROPS = [
  {
    icon: 'fa-palette',
    title: 'Tu marca, no la nuestra',
    text: 'Tu logo y color en la experiencia que vive tu cliente. TripPulse es la tecnología detrás, tú eres quien queda bien.',
  },
  {
    icon: 'fa-layer-group',
    title: 'Licencias en lotes',
    text: 'Genera decenas de accesos de una vez, con el cupo que definas: viajes, generaciones con IA, o ambos por separado.',
  },
  {
    icon: 'fa-paper-plane',
    title: 'Se envían solas',
    text: 'Cada licencia sale por email directo a tu cliente, con su código listo para activar. Tú generas, nosotros entregamos.',
  },
];

const AgencyPitch = ({ onAgencyLogin }) => {
  return (
    <div
      id="agencias"
      className="w-full bg-slate-900 md:bg-slate-950/60 border border-white/10 rounded-3xl p-8 md:p-12 mb-14 scroll-mt-24"
    >
      <div className="max-w-3xl mx-auto text-center mb-10">
        <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs md:text-sm mb-3">
          Para agencias de viaje
        </p>
        <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
          Regálale a tus clientes una app, no un PDF
        </h2>
        <p className="text-blue-200 max-w-xl mx-auto">
          Compra paquetes de licencias, repártelas a tus viajeros y deja que la IA
          les arme el itinerario en segundos — con tu agencia como la que lo hizo posible.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {VALUE_PROPS.map((item) => (
          <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-3">
              <i className={`fas ${item.icon}`}></i>
            </div>
            <h3 className="font-bold text-white mb-1.5">{item.title}</h3>
            <p className="text-sm text-blue-200/80 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button
          onClick={onAgencyLogin}
          className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 active:scale-95 transition-all shadow-lg"
        >
          <i className="fas fa-right-to-bracket mr-2"></i>
          Acceso Agencias
        </button>
        <a
          href="mailto:hello@nodalyst.ai?subject=Quiero%20ser%20agencia%20partner%20de%20TripPulse"
          className="text-blue-200 hover:text-white font-semibold px-6 py-3 transition-colors"
        >
          ¿Aún no eres partner? Escríbenos <i className="fas fa-arrow-right ml-1"></i>
        </a>
      </div>
    </div>
  );
};

export default AgencyPitch;
