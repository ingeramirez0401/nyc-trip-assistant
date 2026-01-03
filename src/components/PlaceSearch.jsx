import React, { useState, useRef } from 'react';
import { categories } from '../data/categories';

const PlaceSearch = ({ onAddPlace, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Interés');
  const fileInputRef = useRef(null);

  const searchPlaces = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
        // Using Nominatim OpenStreetMap API
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' New York')}&addressdetails=1&limit=5`);
        const data = await res.json();
        setResults(data);
    } catch (err) {
        console.error("Search failed", err);
    } finally {
        setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            setUploadedImage(event.target.result);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSelectPlace = (item) => {
    setSelectedPlace({
        title: item.name || item.display_name.split(',')[0],
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        cat: item.type || 'Interés',
        address: item.display_name
    });
  };

  const handleConfirmAdd = () => {
    if (selectedPlace) {
        onAddPlace({
            ...selectedPlace,
            cat: selectedCategory,
            img: uploadedImage || selectedPlace.title
        });
        setSelectedPlace(null);
        setUploadedImage(null);
        setSelectedCategory('Interés');
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
        <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-down">
            
            <div className="p-5 border-b border-white/10 flex items-center gap-4 bg-white/5">
                <button onClick={() => {
                    if (selectedPlace) {
                        setSelectedPlace(null);
                        setUploadedImage(null);
                    } else {
                        onClose();
                    }
                }} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition">
                    <i className="fas fa-arrow-left text-sm"></i>
                </button>
                <h2 className="font-bold text-lg text-white">
                    {selectedPlace ? 'Confirmar Lugar' : 'Agregar Nuevo Lugar'}
                </h2>
            </div>

            {!selectedPlace ? (
                <>
                    <form onSubmit={searchPlaces} className="p-5">
                        <div className="relative">
                            <i className="fas fa-search absolute left-4 top-4 text-slate-400"></i>
                            <input 
                                type="text" 
                                placeholder="Ej: Central Park, Empire State..." 
                                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-800 border border-white/10 text-white placeholder-slate-500 shadow-inner focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </form>

                    <div className="flex-1 overflow-y-auto px-5 pb-5 hide-scrollbar">
                        {loading && (
                            <div className="py-12 text-center text-slate-500">
                                <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin mx-auto mb-4"></div>
                                <p className="font-medium">Buscando en la Gran Manzana...</p>
                            </div>
                        )}

                        {!loading && results.length === 0 && query && (
                            <div className="py-12 text-center text-slate-500 bg-slate-800/50 rounded-2xl border border-white/5 border-dashed mx-2">
                                <i className="fas fa-map-signs text-3xl mb-3 opacity-50"></i>
                                <p>No encontramos lugares con ese nombre.</p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            {results.map((item) => (
                                <button 
                                    key={item.place_id}
                                    onClick={() => handleSelectPlace(item)}
                                    className="text-left p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-blue-500/30 transition-all flex items-start gap-4 group active:scale-[0.98]"
                                >
                                    <div className="w-12 h-12 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition shadow-lg">
                                        <i className="fas fa-map-pin"></i>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg leading-tight mb-1 group-hover:text-blue-400 transition">
                                            {item.name || item.display_name.split(',')[0]}
                                        </h3>
                                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                            {item.display_name}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 overflow-y-auto p-5 hide-scrollbar">
                    <div className="space-y-6">
                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                            <h3 className="font-bold text-white text-xl mb-1">{selectedPlace.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">{selectedPlace.address}</p>
                        </div>

                        {/* Category Selector */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Selecciona una Categoría</label>
                            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.name)}
                                        className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                                            selectedCategory === cat.name
                                                ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                                : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'
                                        }`}
                                    >
                                        <i className={`fas ${cat.icon} text-xl`} style={{ color: selectedCategory === cat.name ? '#60a5fa' : cat.color }}></i>
                                        <p className={`text-[10px] font-bold truncate w-full text-center ${selectedCategory === cat.name ? 'text-white' : 'text-slate-400'}`}>
                                            {cat.name}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-2xl p-6 text-center transition-colors bg-slate-800/30">
                            {uploadedImage ? (
                                <div className="relative group">
                                    <img src={uploadedImage} alt="Preview" className="w-full h-48 object-cover rounded-xl shadow-lg" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                        <button 
                                            onClick={() => setUploadedImage(null)}
                                            className="bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg transform scale-90 hover:scale-100 transition"
                                        >
                                            <i className="fas fa-trash-alt mr-2"></i> Eliminar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-4 flex flex-col items-center gap-3 text-slate-400 hover:text-white transition"
                                >
                                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-2 shadow-inner">
                                        <i className="fas fa-camera text-2xl"></i>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold">Agregar foto del lugar</p>
                                        <p className="text-xs opacity-60 mt-1">Cámara o Galería</p>
                                    </div>
                                </button>
                            )}
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>

                        <button 
                            onClick={handleConfirmAdd}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-900/50 hover:shadow-blue-900/80 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-plus-circle"></i>
                            <span>Agregar al Itinerario</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default PlaceSearch;
