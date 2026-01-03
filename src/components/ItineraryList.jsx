import React from 'react';
import { getCategoryIcon } from '../data/categories';

const ItineraryList = ({ activeDay, stops, visited, onClose, onStopClick, onToggleVisited, onDelete, onEdit }) => {
  return (
    <div className="fixed inset-0 z-[1500] bg-slate-900 flex flex-col animate-fade-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-white leading-none mb-1">Día {activeDay.id}</h2>
                <p className="text-sm text-blue-400 font-medium">{activeDay.title}</p>
            </div>
            <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition active:scale-95"
            >
                <i className="fas fa-times"></i>
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
            {stops.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-50">
                    <i className="fas fa-map-marked-alt text-5xl"></i>
                    <p>No hay paradas para este día aún.</p>
                </div>
            ) : (
                <div className="space-y-3 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-slate-800 z-0"></div>

                    {stops.map((stop, index) => {
                        const isVisited = !!visited[stop.id];
                        const category = getCategoryIcon(stop.cat);
                        
                        return (
                            <div key={stop.id} className="relative z-10 flex gap-4 group">
                                {/* Timeline Node */}
                                <div className="flex flex-col items-center pt-1">
                                    <div className={`w-11 h-11 rounded-full border-4 flex items-center justify-center shadow-lg transition-all ${
                                        isVisited 
                                            ? 'bg-emerald-500 border-slate-900 text-white' 
                                            : 'bg-slate-800 border-slate-900 text-slate-400'
                                    }`}>
                                        <span className="font-bold text-sm">{index + 1}</span>
                                    </div>
                                </div>

                                {/* Card */}
                                <div className="flex-1 bg-slate-800/50 border border-white/5 rounded-2xl p-4 active:scale-[0.99] transition-all hover:bg-slate-800 hover:border-white/10">
                                    <div className="flex gap-4">
                                        {/* Image Thumbnail */}
                                        <div className="w-16 h-16 rounded-xl bg-slate-700 overflow-hidden shrink-0">
                                            {stop.img ? (
                                                <img src={stop.img} className="w-full h-full object-cover" alt={stop.title} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                                    <i className="fas fa-image"></i>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-white/5">
                                                    {stop.cat}
                                                </span>
                                                {stop.time && (
                                                    <span className="text-[10px] text-slate-500">
                                                        <i className="fas fa-clock mr-1"></i>{stop.time}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-white text-lg leading-tight mb-1 truncate">{stop.title}</h3>
                                            
                                            {/* Actions */}
                                            <div className="flex items-center gap-3 mt-3">
                                                <button 
                                                    onClick={() => onToggleVisited(stop.id)}
                                                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                                                        isVisited 
                                                            ? 'bg-emerald-500/20 text-emerald-400' 
                                                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                                    }`}
                                                >
                                                    <i className={`fas ${isVisited ? 'fa-check-circle' : 'fa-circle'}`}></i>
                                                    {isVisited ? 'Visitado' : 'Marcar'}
                                                </button>
                                                
                                                <button 
                                                    onClick={() => {
                                                        onStopClick(stop);
                                                        onClose();
                                                    }}
                                                    className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20"
                                                >
                                                    <i className="fas fa-map-marked-alt"></i>
                                                </button>

                                                <div className="flex-1"></div>

                                                <button 
                                                    onClick={() => onEdit(stop)}
                                                    className="w-8 h-8 rounded-lg bg-white/5 text-slate-400 flex items-center justify-center hover:bg-white/10"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if(window.confirm('¿Eliminar parada?')) onDelete(stop.id);
                                                    }}
                                                    className="w-8 h-8 rounded-lg bg-white/5 text-slate-400 flex items-center justify-center hover:text-red-400 hover:bg-red-500/10"
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* End Node */}
                    <div className="flex flex-col items-center pt-1 opacity-50 pb-8">
                        <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                        <div className="text-[10px] font-bold text-slate-600 mt-2 uppercase tracking-widest">Fin del día</div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default ItineraryList;
