import React from 'react';

const DaySelector = ({ days, activeDayId, onSelectDay }) => {
  return (
    <div className="absolute top-24 left-0 right-0 z-[450] px-4 animate-fade-in-down pointer-events-none">
        <div className="glass-panel p-1.5 rounded-2xl overflow-hidden shadow-2xl mx-auto max-w-lg bg-slate-900/80 backdrop-blur-xl border-white/10 pointer-events-auto">
            <div className="flex overflow-x-auto gap-1.5 hide-scrollbar snap-x px-0.5">
                {days.map((day) => {
                    const isActive = day.id === activeDayId;
                    return (
                        <button
                            key={day.id}
                            onClick={() => onSelectDay(day.id)}
                            className={`flex-shrink-0 px-4 py-2.5 rounded-xl transition-all duration-300 flex flex-col items-center justify-center min-w-[72px] snap-center relative overflow-hidden group
                                ${isActive 
                                    ? 'bg-slate-900 text-white shadow-lg scale-100' 
                                    : 'bg-transparent text-slate-500 hover:bg-slate-100'
                                }
                            `}
                        >
                            {/* Active Indicator Background Effect */}
                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 z-0"></div>
                            )}

                            <span className={`text-[9px] uppercase font-bold tracking-wider mb-0.5 z-10 transition-colors ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                                DÍA {day.id}
                            </span>
                            <span className={`text-sm font-bold whitespace-nowrap z-10 leading-none ${isActive ? 'text-white' : 'text-slate-700'}`}>
                                {day.title.split(' ')[0]}
                            </span>
                            
                            {/* Dots Indicator */}
                            <div className="flex gap-0.5 mt-1.5 z-10 h-1">
                                {day.stops.slice(0, 3).map((_, i) => (
                                    <div key={i} className={`w-1 h-1 rounded-full transition-all ${isActive ? 'bg-amber-400' : 'bg-slate-300 group-hover:bg-slate-400'}`} />
                                ))}
                                {day.stops.length > 3 && (
                                    <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-slate-600' : 'bg-slate-200'}`} />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    </div>
  );
};

export default DaySelector;
