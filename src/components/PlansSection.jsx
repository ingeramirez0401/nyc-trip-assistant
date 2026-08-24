import React from 'react';

const FREE_FEATURES = [
  'Hasta 3 viajes activos',
  'Mapa interactivo y rutas por día',
  'Guarda paradas, fotos y notas',
  'Marca lugares como visitados',
];

const VIP_FEATURES = [
  'Viajes ilimitados',
  'Generación de itinerarios con IA',
  'Todo lo del plan Free',
  'Soporte prioritario',
];

const PlansSection = ({ onStartFree, onLogin }) => {
  return (
    <div className="max-w-3xl w-full mb-10 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Elige cómo empezar</h2>
        <p className="text-slate-600 dark:text-blue-300 mb-3">Crea tu cuenta gratis, sin tarjeta de crédito</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <button
            onClick={onLogin}
            className="text-blue-600 dark:text-blue-300 font-bold hover:underline"
          >
            Inicia sesión
          </button>
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Free */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col shadow-xl dark:shadow-none">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Free</h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              $0 <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/ siempre</span>
            </p>
          </div>
          <ul className="space-y-2.5 mb-6 flex-1">
            {FREE_FEATURES.map((feature) => (
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
            Comenzar Gratis
          </button>
        </div>

        {/* VIP */}
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 flex flex-col shadow-2xl shadow-blue-900/40 border border-white/10">
          <span className="absolute -top-3 right-6 bg-amber-400 text-amber-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide">
            Próximamente
          </span>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white">VIP</h3>
            <p className="text-sm font-medium text-blue-100 mt-1">Para viajeros frecuentes</p>
          </div>
          <ul className="space-y-2.5 mb-6 flex-1">
            {VIP_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-blue-50">
                <i className="fas fa-sparkles text-amber-300 mt-0.5"></i>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <a
            href="mailto:hello@nodalyst.ai?subject=Interés en TripPulse VIP"
            className="w-full text-center bg-white text-blue-700 py-3 rounded-xl font-bold hover:bg-blue-50 active:scale-[0.98] transition-all shadow-lg"
          >
            Contáctanos
          </a>
        </div>
      </div>
    </div>
  );
};

export default PlansSection;
