import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useToast } from '../contexts/ToastContext';

const BottomSheet = ({ place, isOpen, onClose, isVisited, onToggleVisited, onDelete, onUpdateImage, onEdit, city = "travel destination" }) => {
  const toast = useToast();
  const [imgSrc, setImgSrc] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (place) {
        let url;

        // Estrategia Híbrida:
        // 1. Si tenemos una URL real (Unsplash o data:image), la usamos directamente.
        // 2. Si solo tenemos una palabra clave (lugares nuevos), usamos IA para generar una referencia.
        if (place.img && (place.img.startsWith('http') || place.img.startsWith('data:image'))) {
            url = place.img;
            setImgSrc(url); // Actualizar inmediatamente si es URL o base64
        } else if (place.img) {
            const query = encodeURIComponent(`${place.img} in ${city} photorealistic 4k`);
            url = `https://image.pollinations.ai/prompt/${query}?width=800&height=600&nologo=true&seed=${place.id}`;
            // Cargar imagen generada con validación
            const img = new Image();
            img.onload = () => setImgSrc(url);
            img.onerror = () => setImgSrc('https://images.unsplash.com/photo-1496442226666-8d4a0e29e128?w=800&q=80');
            img.src = url;
        } else {
            // Fallback si no hay imagen
            setImgSrc('https://images.unsplash.com/photo-1496442226666-8d4a0e29e128?w=800&q=80');
        }
    }
  }, [place, place?.img, city]); // Escuchar cambios en place.img y city

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            setImgSrc(dataUrl);
            if (onUpdateImage) {
                onUpdateImage(place.id, dataUrl);
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const handleDelete = async () => {
    if (await toast.confirm(`¿Seguro que quieres eliminar "${place.title}" del itinerario?`)) {
        onDelete(place.id);
        onClose();
    }
  };

  const handleVisitToggle = () => {
    const newVal = !isVisited;
    onToggleVisited(place.id);
    if (newVal) {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            zIndex: 2000
        });
    }
  };

  if (!place) return null;

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-[1000] overflow-hidden shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-500 cubic-bezier(0.19, 1, 0.22, 1) 
        ${isExpanded ? 'h-[90vh] rounded-t-[32px]' : 'h-[140px] rounded-t-[24px]'}
        bg-white dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/10`}
    >
      {/* Toggle Handle */}
      <div 
        onClick={toggleExpand}
        className="w-full h-8 flex justify-center items-center shrink-0 cursor-pointer active:bg-black/5 dark:active:bg-white/5 transition"
      >
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/20 rounded-full"></div>
      </div>

      {/* Compact View - Always rendered to maintain state, just hidden/shown via CSS for better perf */}
      <div 
        className={`flex items-center gap-4 px-5 pb-5 transition-all duration-300 ${isExpanded ? 'opacity-0 h-0 overflow-hidden py-0' : 'opacity-100 h-auto'}`}
        onClick={toggleExpand}
      >
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 shadow-lg border border-slate-200 dark:border-white/10 relative group">
            {imgSrc ? (
                <img 
                    src={imgSrc} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    alt={place.title}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80';
                    }}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                    <i className="fas fa-image text-xl"></i>
                </div>
            )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-500/20">
                    {place.cat}
                </span>
                {place.time && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        <i className="fas fa-clock mr-1"></i>{place.time}
                    </span>
                )}
            </div>
            <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight truncate mb-0.5">{place.title}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm truncate">{place.tip}</p>
        </div>

        <button 
            onClick={(e) => {
                e.stopPropagation();
                handleVisitToggle();
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 shadow-lg border ${isVisited ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        >
            <i className={`fas ${isVisited ? 'fa-check' : 'fa-check'} text-lg`}></i>
        </button>
      </div>

      {/* Expanded View Content */}
      <div className={`flex-1 overflow-y-auto flex flex-col transition-all duration-500 ${isExpanded ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Hero Image Section */}
        <div className="h-64 relative bg-slate-800 shrink-0 group">
            {imgSrc ? (
                <img 
                    src={imgSrc} 
                    className="w-full h-full object-cover" 
                    alt={place.title}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80';
                    }}
                />
            ) : (
                <div className="w-full h-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-white/20 dark:via-slate-900/20 to-transparent"></div>
            
            {/* Top Actions */}
            <div className="absolute top-2 right-4 flex gap-3 z-10">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/60 transition active:scale-95"
                >
                    <i className="fas fa-camera"></i>
                </button>
                <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/60 transition active:scale-95"
                >
                    <i className="fas fa-times"></i>
                </button>
            </div>

            <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
            />

            {/* Title Block on Image */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-white dark:from-slate-900 to-transparent">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex gap-2 mb-2">
                             <span className="px-2.5 py-1 rounded-lg bg-black/50 dark:bg-white/10 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest border border-white/10">
                                {place.cat}
                            </span>
                            {isVisited && (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/90 dark:bg-emerald-500/20 backdrop-blur-md text-white dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1">
                                    <i className="fas fa-check"></i> Visitado
                                </span>
                            )}
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-1 drop-shadow-sm">{place.title}</h2>
                        <p className="text-slate-600 dark:text-slate-400 text-sm flex items-center gap-2">
                            <i className="fas fa-map-pin text-amber-500 dark:text-amber-400"></i> New York City
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 pb-12 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
            
            {/* Action Bar */}
            <div className="flex gap-3">
                 <button 
                    onClick={handleVisitToggle}
                    className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${isVisited 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                        : 'bg-slate-100 dark:bg-white text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-100'}`}
                >
                    <i className={`fas ${isVisited ? 'fa-check-circle' : 'fa-circle'}`}></i>
                    {isVisited ? 'Completado' : 'Marcar Visitado'}
                </button>
                 <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=transit`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-slate-800 dark:bg-slate-800 text-white border border-slate-700 dark:border-white/10 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-700 transition active:scale-95 flex items-center justify-center gap-2"
                >
                    <i className="fas fa-location-arrow text-blue-400"></i>
                    <span>Ir Ahora</span>
                </a>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-3">
                        <i className="fas fa-lightbulb text-amber-500 dark:text-amber-400 text-sm"></i>
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Tip de Viajero</div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">
                        {place.tip || "Disfruta el momento y toma muchas fotos."}
                    </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center mb-3">
                        <i className="fas fa-clock text-purple-500 dark:text-purple-400 text-sm"></i>
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Tiempo Sugerido</div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">
                        {place.time || "A tu ritmo"}
                    </div>
                </div>
            </div>

            {/* Secondary Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/5">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-4">Gestión</div>
                <div className="grid grid-cols-2 gap-3">
                    {onEdit && (
                        <button 
                            onClick={() => onEdit(place)}
                            className="bg-slate-50 dark:bg-slate-800 text-blue-500 dark:text-blue-400 py-3 rounded-xl font-semibold text-sm border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-edit"></i>
                            <span>Editar Datos</span>
                        </button>
                    )}
                    {onDelete && (
                        <button 
                            onClick={handleDelete}
                            className="bg-slate-50 dark:bg-slate-800 text-red-500 dark:text-red-400 py-3 rounded-xl font-semibold text-sm border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-trash-alt"></i>
                            <span>Eliminar</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
