import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { placesService } from '../services/placesService';

const LocationSearchInput = ({ onLocationSelect, placeholder, city }) => {
  const { t } = useTranslation('placeSearch');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState(null);
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
  }, [query, city]);

  const searchLocation = async (searchQuery) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const predictions = await placesService.autocomplete(searchQuery, city);
      setResults(predictions);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching location:', error);
      setResults([]);
      setSearchError(error.message || t('placeSearch:errors.search'));
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = async (prediction) => {
    setShowResults(false);
    setQuery(prediction.text);
    try {
      const details = await placesService.getDetails(prediction.placeId);
      onLocationSelect({
        name: details.name || prediction.text,
        lat: details.lat,
        lng: details.lng,
        city: details.city || details.name,
        country: details.country || '',
        address: details.address,
        img: placesService.getPhotoUrl(details.photoName),
        // placeId se guarda junto con el viaje (base_location_place_id) --
        // sin él no hay forma de volver a pedirle a Google los datos en
        // vivo (rating, teléfono, horario) del hotel/base más adelante
        // (ver App.jsx handleBaseClick y useSupabaseItinerary.js).
        placeId: prediction.placeId,
      });
    } catch (error) {
      console.error('Error getting place details:', error);
      setSearchError(t('placeSearch:errors.details'));
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder || t('placeSearch:defaultPlaceholder')}
          className="w-full px-4 py-3 pl-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <i className={`fas ${isSearching ? 'fa-spinner fa-spin' : 'fa-search'} absolute left-4 top-1/2 -translate-y-1/2 text-slate-400`}></i>
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setShowResults(false);
              setSearchError(null);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
          {results.map((prediction) => (
            <button
              key={prediction.placeId}
              onClick={() => handleSelectLocation(prediction)}
              className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-white/5 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <i className="fas fa-map-marker-alt text-blue-500 dark:text-blue-400 mt-1 shrink-0"></i>
                <p className="text-slate-900 dark:text-white font-medium truncate">
                  {prediction.text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && query.length >= 3 && !isSearching && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-4 text-center">
          <i className={`fas ${searchError ? 'fa-triangle-exclamation' : 'fa-search'} text-slate-400 dark:text-slate-500 text-2xl mb-2`}></i>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {searchError || t('placeSearch:noResultsFound')}
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationSearchInput;
