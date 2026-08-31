import React, { useState, useRef, useEffect } from 'react';
import { categories } from '../data/categories';
import { placesService } from '../services/placesService';

// Ícono + color representativo por tipo de lugar de Google -- para que la
// lista de resultados no se vea con el mismo pin genérico repetido para
// todo. Google manda varios `types` por resultado, se usa el primero que
// reconocemos; si no reconocemos ninguno, cae al pin genérico.
const GOOGLE_TYPE_STYLE = {
  restaurant: { icon: 'fa-utensils', color: '#dc2626' },
  cafe: { icon: 'fa-mug-hot', color: '#92400e' },
  bar: { icon: 'fa-martini-glass', color: '#a855f7' },
  night_club: { icon: 'fa-martini-glass', color: '#a855f7' },
  museum: { icon: 'fa-building-columns', color: '#6366f1' },
  art_gallery: { icon: 'fa-palette', color: '#ec4899' },
  park: { icon: 'fa-tree', color: '#22c55e' },
  tourist_attraction: { icon: 'fa-camera', color: '#06b6d4' },
  lodging: { icon: 'fa-bed', color: '#f59e0b' },
  shopping_mall: { icon: 'fa-bag-shopping', color: '#7c3aed' },
  store: { icon: 'fa-bag-shopping', color: '#7c3aed' },
  church: { icon: 'fa-place-of-worship', color: '#78716c' },
  hindu_temple: { icon: 'fa-place-of-worship', color: '#78716c' },
  mosque: { icon: 'fa-place-of-worship', color: '#78716c' },
  synagogue: { icon: 'fa-place-of-worship', color: '#78716c' },
  stadium: { icon: 'fa-baseball', color: '#f97316' },
  amusement_park: { icon: 'fa-star', color: '#f59e0b' },
  zoo: { icon: 'fa-paw', color: '#22c55e' },
  aquarium: { icon: 'fa-fish', color: '#0ea5e9' },
  movie_theater: { icon: 'fa-film', color: '#db2777' },
  spa: { icon: 'fa-spa', color: '#10b981' },
  gym: { icon: 'fa-dumbbell', color: '#f97316' },
};
const DEFAULT_TYPE_STYLE = { icon: 'fa-map-pin', color: '#64748b' };
const styleForTypes = (types) => {
  for (const t of types || []) {
    if (GOOGLE_TYPE_STYLE[t]) return GOOGLE_TYPE_STYLE[t];
  }
  return DEFAULT_TYPE_STYLE;
};

const PlaceSearch = ({ onAddPlace, onClose, city }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Interés');
  // Restringe la búsqueda a la ciudad del viaje por default -- dentro de un
  // viaje ya creado no tiene sentido ofrecer un café de París en un viaje a
  // Nueva York. El viajero lo puede apagar si de verdad quiere salir de la
  // ciudad. Sin `city` (no debería pasar dentro de un viaje, pero por si
  // acaso) no hay nada que restringir.
  const [restrictToCity, setRestrictToCity] = useState(true);
  const fileInputRef = useRef(null);

  const runSearch = async (restrict) => {
    if (!query.trim()) return;

    setLoading(true);
    setSearchError(null);
    try {
      const predictions = await placesService.autocomplete(query, city, restrict);
      setResults(predictions);
    } catch (err) {
      console.error('Search failed', err);
      setResults([]);
      setSearchError(err.message || 'Error en la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  // Autobúsqueda: en móvil "presiona Enter para buscar" no es un patrón que
  // el usuario espere (el teclado ni siempre muestra esa tecla). Se busca
  // sola 550ms después de que el usuario deja de escribir -- y de una vez
  // reacciona a cambiar el toggle "Solo en {ciudad}" sin necesitar código
  // aparte para eso.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }
    const handle = setTimeout(() => runSearch(restrictToCity), 550);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, restrictToCity, city]);

  // Enter sigue funcionando para quien prefiera no esperar el debounce.
  const searchPlaces = (e) => {
    e.preventDefault();
    runSearch(restrictToCity);
  };

  const handleToggleRestrict = () => setRestrictToCity((prev) => !prev);

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

  const handleSelectPlace = async (prediction) => {
    try {
      const details = await placesService.getDetails(prediction.placeId);
      setSelectedPlace({
        title: details.name || prediction.text,
        lat: details.lat,
        lng: details.lng,
        cat: 'Interés',
        address: details.address,
        placesImg: placesService.getPhotoUrl(details.photoName),
        placeRating: details.rating,
        placeRatingCount: details.ratingCount,
        placePhone: details.phone,
        placeWebsite: details.website,
        placeHours: details.hours,
      });
    } catch (err) {
      console.error('Error getting place details', err);
      setSearchError('No se pudo obtener el detalle de ese lugar. Intenta de nuevo.');
    }
  };

  const handleConfirmAdd = () => {
    if (selectedPlace) {
        onAddPlace({
            ...selectedPlace,
            cat: selectedCategory,
            // Prioridad: foto que el usuario subió > foto real de Google
            // Places > el título solo (BottomSheet la interpreta como
            // prompt y genera una imagen aproximada con IA de respaldo).
            img: uploadedImage || selectedPlace.placesImg || selectedPlace.title
        });
        setSelectedPlace(null);
        setUploadedImage(null);
        setSelectedCategory('Interés');
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] animate-fade-in-down transition-colors duration-300">
            
            <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center gap-4 bg-slate-50 dark:bg-white/5">
                <button onClick={() => {
                    if (selectedPlace) {
                        setSelectedPlace(null);
                        setUploadedImage(null);
                    } else {
                        onClose();
                    }
                }} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition">
                    <i className="fas fa-arrow-left text-sm"></i>
                </button>
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                    {selectedPlace ? 'Confirmar Lugar' : 'Agregar Nuevo Lugar'}
                </h2>
            </div>

            {!selectedPlace ? (
                <>
                    <form onSubmit={searchPlaces} className="p-5">
                        <div className="relative group">
                            {/* top-4.5 no existe en la escala de Tailwind -- se
                                ignora en silencio y el ícono queda sin posición
                                vertical real. top-1/2 -translate-y-1/2 es el
                                patrón que ya usa el resto de la app (ver
                                LoginScreen.jsx) para centrar de verdad sin
                                depender de un valor fijo que se descuadra si
                                cambia el padding del input. */}
                            <i className={`fas fa-search absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${loading ? 'text-blue-500' : 'text-slate-400 group-focus-within:text-blue-500'}`}></i>
                            <input
                                type="text"
                                placeholder="Ej: Central Park, Empire State..."
                                className="w-full pl-11 pr-11 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-inner focus:ring-0 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                autoFocus
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                                >
                                    <i className="fas fa-times text-xs"></i>
                                </button>
                            )}
                        </div>

                        {city && (
                            // onClick en el <label>, no solo en el switch -- un <div> custom no
                            // hereda el reenvío de clic que un <input> nativo sí tiene dentro de
                            // <label>, así que tocar el texto no hacía nada sin esto.
                            <label
                                onClick={handleToggleRestrict}
                                className="flex items-center gap-2.5 mt-3.5 px-1 cursor-pointer select-none"
                            >
                                <div
                                    className={`w-9 h-5 rounded-full shrink-0 p-0.5 transition-colors ${restrictToCity ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${restrictToCity ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                    Solo en <strong className="text-slate-900 dark:text-white">{city}</strong>
                                    {!restrictToCity && <span className="text-slate-400 dark:text-slate-500"> (apagado, buscando en todo el mundo)</span>}
                                </span>
                            </label>
                        )}
                    </form>

                    <div className="flex-1 overflow-y-auto px-5 pb-5 hide-scrollbar">
                        {query.trim().length > 0 && query.trim().length < 2 && (
                            <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-6">Sigue escribiendo...</p>
                        )}

                        {loading && (
                            <div className="py-12 text-center text-slate-500">
                                <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-500 animate-spin mx-auto mb-4"></div>
                                <p className="font-medium">Buscando lugares...</p>
                            </div>
                        )}

                        {!loading && searchError && (
                            <div className="py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 border-dashed mx-2">
                                <i className="fas fa-triangle-exclamation text-3xl mb-3 opacity-50"></i>
                                <p>{searchError}</p>
                            </div>
                        )}

                        {!loading && !searchError && results.length === 0 && query.trim().length >= 2 && (
                            <div className="py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 border-dashed mx-2">
                                <i className="fas fa-map-signs text-3xl mb-3 opacity-50"></i>
                                <p>No encontramos lugares con ese nombre.</p>
                                {restrictToCity && city && (
                                    <p className="text-xs mt-1.5 opacity-75">Prueba apagando &quot;Solo en {city}&quot; para buscar en todo el mundo.</p>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col gap-2.5">
                            {results.map((prediction, i) => {
                                const style = styleForTypes(prediction.types);
                                return (
                                    <button
                                        key={prediction.placeId}
                                        onClick={() => handleSelectPlace(prediction)}
                                        style={{ animationDelay: `${i * 40}ms` }}
                                        className="text-left p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 hover:border-blue-500/40 hover:shadow-md transition-all flex items-center gap-3.5 group active:scale-[0.98] animate-fade-in-down"
                                    >
                                        <div
                                            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110"
                                            style={{ backgroundColor: `${style.color}1a`, color: style.color }}
                                        >
                                            <i className={`fas ${style.icon}`}></i>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                                                {prediction.text}
                                            </h3>
                                        </div>
                                        <i className="fas fa-chevron-right ml-auto text-slate-300 dark:text-slate-600 text-xs group-hover:text-blue-500 transition"></i>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 overflow-y-auto p-5 hide-scrollbar">
                    <div className="space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-xl mb-1">{selectedPlace.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{selectedPlace.address}</p>
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
                                                ? 'bg-blue-500/10 dark:bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <i className={`fas ${cat.icon} text-xl`} style={{ color: selectedCategory === cat.name ? '#3b82f6' : cat.color }}></i>
                                        <p className={`text-[10px] font-bold truncate w-full text-center ${selectedCategory === cat.name ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {cat.name}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-2xl p-6 text-center transition-colors bg-slate-50 dark:bg-slate-800/30">
                            {uploadedImage || selectedPlace.placesImg ? (
                                <div className="relative group">
                                    <img
                                        src={uploadedImage || selectedPlace.placesImg}
                                        alt="Preview"
                                        className="w-full h-48 object-cover rounded-xl shadow-lg"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
                                        {uploadedImage ? (
                                            <button
                                                onClick={() => setUploadedImage(null)}
                                                className="bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg transform scale-90 hover:scale-100 transition"
                                            >
                                                <i className="fas fa-trash-alt mr-2"></i> Quitar
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="bg-white text-slate-900 px-4 py-2 rounded-full font-bold shadow-lg transform scale-90 hover:scale-100 transition"
                                            >
                                                <i className="fas fa-camera mr-2"></i> Cambiar foto
                                            </button>
                                        )}
                                    </div>
                                    {!uploadedImage && (
                                        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                            Foto de Google Places
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-4 flex flex-col items-center gap-3 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                                >
                                    <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-2 shadow-inner">
                                        <i className="fas fa-camera text-2xl text-slate-500 dark:text-slate-400"></i>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Agregar foto del lugar</p>
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
