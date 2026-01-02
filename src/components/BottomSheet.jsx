import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const BottomSheet = ({ place, isOpen, onClose, isVisited, onToggleVisited, onDelete, onUpdateImage }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (place) {
        setImgSrc(null);
        let url;

        // Estrategia Híbrida:
        // 1. Si tenemos una URL real (Unsplash o data:image), la usamos directamente.
        // 2. Si solo tenemos una palabra clave (lugares nuevos), usamos IA para generar una referencia.
        if (place.img && (place.img.startsWith('http') || place.img.startsWith('data:image'))) {
            url = place.img;
        } else if (place.img) {
            const query = encodeURIComponent(place.img + " in New York City photorealistic 4k");
            url = `https://image.pollinations.ai/prompt/${query}?width=800&height=600&nologo=true&seed=${place.id}`;
        } else {
            // Fallback si no hay imagen
            url = 'https://images.unsplash.com/photo-1496442226666-8d4a0e29e128?w=800&q=80';
        }
        
        const img = new Image();
        img.onload = () => setImgSrc(url);
        img.onerror = () => setImgSrc('https://images.unsplash.com/photo-1496442226666-8d4a0e29e128?w=800&q=80');
        img.src = url;
    }
  }, [place]);

  const handleImageUpload = (e) => {
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

  const handleDelete = () => {
    if (window.confirm(`¿Seguro que quieres eliminar "${place.title}" del itinerario?`)) {
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

  return (
    <div 
      className={`fixed bottom-4 left-4 right-4 z-[1000] glass-panel rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[70vh] transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-y-0' : 'translate-y-[120%]'}`}
    >
      {/* Header Image */}
      <div className="h-40 relative bg-slate-200 shrink-0">
        {imgSrc ? (
            <img src={imgSrc} className="w-full h-full object-cover animate-fade-in" alt={place.title} />
        ) : (
            <div className="w-full h-full bg-slate-200 animate-pulse" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        
        <div className="absolute top-3 right-3 flex gap-2 z-10">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600/90 backdrop-blur-md text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-700 transition shadow-lg"
                title="Cambiar foto"
            >
                <i className="fas fa-camera text-sm"></i>
            </button>
            <button 
                onClick={onClose}
                className="bg-black/30 backdrop-blur-md text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/50 transition"
            >
                <i className="fas fa-times"></i>
            </button>
        </div>

        <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
        />

        <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex justify-between items-end">
                <div>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wide border border-white/20 mb-1">
                        {place.cat}
                    </span>
                    <h2 className="text-xl font-bold leading-tight">{place.title}</h2>
                </div>
                
                <button 
                    onClick={handleVisitToggle}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isVisited ? 'bg-green-500 text-white scale-110 shadow-lg' : 'bg-white/20 text-white hover:bg-white/40'}`}
                >
                    <i className={`fas ${isVisited ? 'fa-check' : 'fa-check-circle'}`}></i>
                </button>
            </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 overflow-y-auto hide-scrollbar bg-white/60">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1">Tip de Viajero</div>
                <div className="text-xs font-medium text-indigo-900 leading-snug">
                    {place.tip || "Disfruta el momento y toma muchas fotos."}
                </div>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1">Tiempo Sugerido</div>
                <div className="text-xs font-medium text-emerald-900 leading-snug">
                    {place.time || "A tu ritmo"}
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
            <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=transit`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-xl hover:bg-slate-800 transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <i className="fas fa-map-marked-alt text-amber-400"></i>
                <span>Cómo llegar ahora</span>
            </a>

            {onDelete && (
                <button 
                    onClick={handleDelete}
                    className="w-full bg-red-50 text-red-600 py-2.5 rounded-xl font-semibold text-sm border-2 border-red-200 hover:bg-red-100 transition active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <i className="fas fa-trash-alt"></i>
                    <span>Eliminar del itinerario</span>
                </button>
            )}
        </div>

        {isVisited && (
            <div className="mt-3 text-center text-xs font-bold text-green-600 animate-fade-in">
                ¡Visitado! Agregado a tu diario de viaje.
            </div>
        )}
      </div>
    </div>
  );
};

export default BottomSheet;
