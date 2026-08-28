import React from 'react';

// Rediseño: antes cada pestaña mostraba día + título + puntitos por parada
// -- no escalaba (viajes largos se volvían una fila interminable de texto)
// y los puntos no comunicaban nada legible. Ahora: pestañas compactas
// (solo el número) que se expanden con el título + progreso SOLO la
// activa, más un botón aparte para abrir el itinerario completo -- leer
// el itinerario de verdad vive en ItineraryList (pantalla completa, ya
// scrollea bien), no hace falta que el mapa intente mostrarlo también.
// De paso: el original leía `day.day_number` pero el dato real llega como
// `day.dayNumber` (ver useSupabaseItinerary.js) -- el número de día nunca
// se estaba pintando.
const DaySelector = ({ days, activeDayId, onSelectDay, visited = {}, onOpenList }) => {
  const hasOverflow = days.length > 5;

  return (
    <div className="absolute top-24 left-0 right-0 z-[450] px-4 animate-fade-in-down pointer-events-none">
      <div className="mx-auto max-w-lg flex items-center gap-2 pointer-events-auto">
        <div className="relative flex-1 min-w-0">
          {hasOverflow && (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-slate-900/90 to-transparent z-10 rounded-l-2xl" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-slate-900/90 to-transparent z-10 rounded-r-2xl" />
            </>
          )}
          <div className="p-1.5 rounded-2xl overflow-x-auto overflow-y-hidden shadow-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 hide-scrollbar">
            <div className="flex gap-1.5 snap-x w-max">
              {days.map((day) => {
                const isActive = day.id === activeDayId;
                const total = day.stops.length;
                const done = day.stops.filter((s) => visited[s.id]).length;

                return (
                  <button
                    key={day.id}
                    onClick={() => onSelectDay(day.id)}
                    className={`shrink-0 rounded-xl transition-all duration-300 flex items-center snap-center ${
                      isActive
                        ? 'bg-white text-slate-900 gap-2 pl-3.5 pr-4 py-2 shadow-lg'
                        : 'bg-transparent text-slate-400 hover:bg-white/10 hover:text-white w-11 h-11 justify-center'
                    }`}
                  >
                    <span className={`font-black leading-none ${isActive ? 'text-lg' : 'text-sm'}`}>{day.dayNumber}</span>
                    {isActive && (
                      <span className="flex flex-col items-start leading-tight max-w-[110px]">
                        <span className="text-xs font-bold truncate w-full">{day.title}</span>
                        {total > 0 && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            {done}/{total} visitado{total !== 1 ? 's' : ''}
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {onOpenList && (
          <button
            onClick={onOpenList}
            title="Ver itinerario completo del día"
            className="shrink-0 w-11 h-11 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center shadow-2xl hover:bg-slate-800 active:scale-95 transition-all"
          >
            <i className="fas fa-list-ul"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default DaySelector;
