import React, { useState, useRef } from 'react';

const PlaceSearch = ({ onAddPlace, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
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
            img: uploadedImage || selectedPlace.title // Si hay imagen subida, usarla; sino usar el título como keyword
        });
        setSelectedPlace(null);
        setUploadedImage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-fade-in-down">
            
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <button onClick={() => {
                    if (selectedPlace) {
                        setSelectedPlace(null);
                        setUploadedImage(null);
                    } else {
                        onClose();
                    }
                }} className="text-gray-400 hover:text-gray-600">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h2 className="font-bold text-lg text-slate-800">
                    {selectedPlace ? 'Confirmar Lugar' : 'Agregar Lugar'}
                </h2>
            </div>

            {!selectedPlace ? (
                <>
                    <form onSubmit={searchPlaces} className="p-4 bg-gray-50">
                        <div className="relative">
                            <i className="fas fa-search absolute left-4 top-3.5 text-gray-400"></i>
                            <input 
                                type="text" 
                                placeholder="Ej: Harry Potter Store, Katz Delicatessen..." 
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </form>

                    <div className="flex-1 overflow-y-auto p-2">
                {loading && (
                    <div className="p-8 text-center text-gray-400">
                        <i className="fas fa-circle-notch fa-spin text-2xl mb-2"></i>
                        <p>Buscando en NYC...</p>
                    </div>
                )}

                {!loading && results.length === 0 && query && (
                    <div className="p-8 text-center text-gray-400">
                        <p>No encontramos lugares. Intenta ser más específico.</p>
                    </div>
                )}

                        <div className="flex flex-col gap-2">
                            {results.map((item) => (
                                <button 
                                    key={item.place_id}
                                    onClick={() => handleSelectPlace(item)}
                                    className="text-left p-3 rounded-xl hover:bg-blue-50 transition flex items-start gap-3 group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                                        <i className="fas fa-map-pin"></i>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 leading-tight">
                                            {item.name || item.display_name.split(',')[0]}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                            {item.display_name}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg mb-1">{selectedPlace.title}</h3>
                            <p className="text-sm text-gray-500">{selectedPlace.address}</p>
                        </div>

                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                            {uploadedImage ? (
                                <div className="relative">
                                    <img src={uploadedImage} alt="Preview" className="w-full h-40 object-cover rounded-lg mb-2" />
                                    <button 
                                        onClick={() => setUploadedImage(null)}
                                        className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-8 text-gray-400 hover:text-blue-600 transition"
                                >
                                    <i className="fas fa-camera text-3xl mb-2"></i>
                                    <p className="text-sm font-medium">Toca para agregar una foto</p>
                                    <p className="text-xs mt-1">Opcional - Puedes usar tu cámara o galería</p>
                                </button>
                            )}
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                accept="image/*" 
                                capture="environment"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>

                        <button 
                            onClick={handleConfirmAdd}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            Agregar al itinerario
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default PlaceSearch;
