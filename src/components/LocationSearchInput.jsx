import { useState, useEffect, useRef } from 'react';

const LocationSearchInput = ({ onLocationSelect, placeholder = "Buscar ubicación..." }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      searchLocation(query);
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  const searchLocation = async (searchQuery) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: searchQuery,
          format: 'json',
          limit: '5',
          addressdetails: '1',
        }),
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'TripPlannerApp/1.0',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }

      const data = await response.json();
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching location:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (location) => {
    const locationData = {
      name: location.display_name,
      lat: parseFloat(location.lat),
      lng: parseFloat(location.lon),
      city: location.address?.city || 
            location.address?.town || 
            location.address?.village || 
            location.address?.municipality ||
            location.name,
      country: location.address?.country || '',
      address: location.display_name,
    };

    setQuery(locationData.city);
    setShowResults(false);
    onLocationSelect(locationData);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-11 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <i className={`fas ${isSearching ? 'fa-spinner fa-spin' : 'fa-search'} absolute left-4 top-1/2 -translate-y-1/2 text-slate-400`}></i>
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setShowResults(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelectLocation(result)}
              className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors border-b border-white/5 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <i className="fas fa-map-marker-alt text-blue-400 mt-1 shrink-0"></i>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {result.address?.city || 
                     result.address?.town || 
                     result.address?.village ||
                     result.name}
                  </p>
                  <p className="text-slate-400 text-sm truncate">
                    {result.display_name}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && query.length >= 3 && !isSearching && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl p-4 text-center">
          <i className="fas fa-search text-slate-500 text-2xl mb-2"></i>
          <p className="text-slate-400 text-sm">No se encontraron resultados</p>
        </div>
      )}
    </div>
  );
};

export default LocationSearchInput;
