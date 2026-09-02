import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// Segundo rediseño. El primero (pestaña activa que crece con título +
// progreso inline, ver git blame) tenía dos problemas reales que el
// usuario reportó probándolo en dispositivo:
// 1. Al crecer, la pestaña activa empujaba el resto de la fila -- si el
//    viajero pasaba al día 2, el círculo del día 1 podía terminar tapado
//    por el degradado de fade del borde izquierdo sin forma fácil de
//    volver a verlo/tocarlo.
// 2. El título dentro de esa pestaña vivía en un ancho fijo de 150px con
//    line-clamp-2 -- un título largo se leía diminuto y cortado.
// Ahora: todos los círculos de día son del MISMO tamaño siempre (activo o
// no), así que la fila nunca cambia de ancho por día -- el día 1 sigue
// exactamente donde estaba sin importar cuál esté activo, y un
// scrollIntoView automático centra el día activo en vez de dejar que el
// viajero lo busque a mano. El título del día activo se muestra aparte,
// en su propia píldora de ancho completo (una sola línea con ellipsis en
// vez de 2 líneas diminutas). De paso, se posiciona con
// env(safe-area-inset-top) igual que los botones de menú/modo oscuro de
// App.jsx (que antes usaba `top-24` fijo) -- en un dispositivo con notch
// esos botones bajan por el safe-area pero este selector no lo hacía, así
// que en pantallas con notch terminaban chocando.
const DaySelector = ({ days, activeDayId, onSelectDay, visited = {}, onOpenList }) => {
  const { t } = useTranslation('itinerary');
  const hasOverflow = days.length > 5;
  const activeBtnRef = useRef(null);

  const activeDay = days.find((d) => d.id === activeDayId);
  const total = activeDay ? activeDay.stops.length : 0;
  const done = activeDay ? activeDay.stops.filter((s) => visited[s.id]).length : 0;

  useEffect(() => {
    activeBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeDayId]);

  return (
    <div className="absolute top-[calc(5rem+env(safe-area-inset-top))] left-0 right-0 z-[450] px-4 animate-fade-in-down pointer-events-none">
      <div className="mx-auto max-w-lg pointer-events-auto flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
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
                  return (
                    <button
                      key={day.id}
                      ref={isActive ? activeBtnRef : null}
                      onClick={() => onSelectDay(day.id)}
                      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center snap-center font-black text-sm transition-all duration-300 ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-lg scale-110'
                          : 'bg-transparent text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {day.dayNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {onOpenList && (
            <button
              onClick={onOpenList}
              title={t('itinerary:openFullList')}
              aria-label={t('itinerary:openFullList')}
              className="shrink-0 w-9 h-9 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center shadow-2xl hover:bg-slate-800 active:scale-95 transition-all"
            >
              <i className="fas fa-list-ul text-sm"></i>
            </button>
          )}
        </div>

        {/* Título del día activo, aparte de los círculos -- así puede usar
            todo el ancho disponible en vez de los 150px cramped de antes,
            y una sola línea con ellipsis se lee mejor que dos líneas
            diminutas cortadas. */}
        {activeDay && (
          <div className="rounded-xl px-3.5 py-1.5 bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-lg flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-white truncate min-w-0">{activeDay.title}</span>
            {total > 0 && (
              <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-auto">
                {t('itinerary:visitedCount', { count: total, done, total })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DaySelector;
