import React from 'react';

const DaySelector = ({ days, activeDayId, onSelectDay }) => {
  return (
    <div className="absolute bottom-6 left-0 right-0 z-[500] px-4 transition-all duration-500">
        <div className="glass-panel p-2 rounded-2xl overflow-hidden">
            <div className="flex overflow-x-auto gap-2 hide-scrollbar snap-x px-1">
                {days.map((day) => {
                    const isActive = day.id === activeDayId;
                    return (
                        <button
                            key={day.id}
                            onClick={() => onSelectDay(day.id)}
                            className={`flex-shrink-0 px-5 py-3 rounded-xl transition-all duration-300 shadow-sm border flex flex-col items-center gap-1 min-w-[80px] snap-center
                                ${isActive 
                                    ? 'bg-slate-900 text-white scale-105 border-slate-900' 
                                    : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                                }
                            `}
                        >
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                                Día {day.id}
                            </span>
                            <span className="text-sm font-bold whitespace-nowrap">
                                {day.title.split(' ')[0]}
                            </span>
                            {/* Progress Indicator (dots for stops) */}
                            <div className="flex gap-0.5 mt-1">
                                {day.stops.slice(0, 5).map((_, i) => (
                                    <div key={i} className={`w-1 h-1 rounded-full ${isActive ? 'bg-white/50' : 'bg-slate-300'}`} />
                                ))}
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
