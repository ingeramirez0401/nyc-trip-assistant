import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import BottomSheet from './components/BottomSheet';
import DaySelector from './components/DaySelector';
import PlaceSearch from './components/PlaceSearch';
import EditPlaceModal from './components/EditPlaceModal';
import SideMenu from './components/SideMenu';
import ItineraryList from './components/ItineraryList';
import WelcomeScreen from './components/WelcomeScreen';
import TripSetup from './components/TripSetup';
import { useSupabaseItinerary } from './hooks/useSupabaseItinerary';
import { useGeolocation } from './hooks/useGeolocation';
import { testConnection } from './lib/supabase';

function App() {
  // App State Management
  const [currentTrip, setCurrentTrip] = useState(() => {
    const saved = localStorage.getItem('currentTrip');
    return saved ? JSON.parse(saved) : null;
  });
  const [setupMode, setSetupMode] = useState(false);
  const [activeDayId, setActiveDayId] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [placeToEdit, setPlaceToEdit] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [centerOnUser, setCenterOnUser] = useState(false);

  // Geolocalización en tiempo real
  const { location: userLocation, error: geoError } = useGeolocation();

  // Supabase Hook (only when trip is selected)
  const { 
    trip,
    days, 
    visited, 
    loading,
    error,
    toggleVisited, 
    addStop, 
    removeStop, 
    updateStopImage, 
    updateStop, 
    reorderStopsByDistance, 
    baseLocation,
    refreshData 
  } = useSupabaseItinerary(currentTrip?.id);

  // Test Supabase connection on mount
  useEffect(() => {
    const runTests = async () => {
      await testConnection();
      // Importar y ejecutar test de inserción
      const { testInsert } = await import('./lib/supabase');
      await testInsert();
    };
    runTests();
  }, []);

  // Set first day as active when days load
  useEffect(() => {
    if (days.length > 0 && !activeDayId) {
      setActiveDayId(days[0].id);
    }
  }, [days]);

  const activeDay = days.find(d => d.id === activeDayId);

  const handleSelectTrip = (trip) => {
    setCurrentTrip(trip);
    localStorage.setItem('currentTrip', JSON.stringify(trip));
  };

  const handleCreateTrip = (trip) => {
    setCurrentTrip(trip);
    localStorage.setItem('currentTrip', JSON.stringify(trip));
    setSetupMode(true);
  };

  const handleExitTrip = () => {
    setCurrentTrip(null);
    localStorage.removeItem('currentTrip');
    setActiveDayId(null);
    setSelectedStop(null);
  };

  const handleSetupComplete = async () => {
    setSetupMode(false);
    await refreshData();
  };

  const handleDeleteStop = (stopId) => {
    removeStop(activeDayId, stopId);
  };

  const handleUpdateImage = (stopId, imageUrl) => {
    updateStopImage(stopId, imageUrl);
  };


  const handleStopClick = (stop) => {
    setSelectedStop(stop);
  };

  const handleCenterOnUser = () => {
    if (userLocation) {
      setCenterOnUser(true);
      setTimeout(() => setCenterOnUser(false), 100);
    }
  };

  const handleCenterOnBase = () => {
    if (baseLocation) {
      setSelectedStop(null);
      // Trigger map to center on base location
      const mapEvent = new CustomEvent('centerOnBase', { detail: baseLocation });
      window.dispatchEvent(mapEvent);
    }
  };

  const handleAddPlace = (placeData) => {
    const newStop = {
      id: `custom-${Date.now()}`,
      ...placeData,
      tip: placeData.tip || "Agregado por ti",
      time: placeData.time || "N/A"
    };
    addStop(activeDayId, newStop);
    
    // Reordenar automáticamente por distancia
    setTimeout(() => {
      reorderStopsByDistance(activeDayId);
    }, 100);
    
    setIsSearchOpen(false);
    setTimeout(() => setSelectedStop(newStop), 500);
  };

  const handleEditPlace = (place) => {
    setPlaceToEdit(place);
    setIsEditOpen(true);
  };

  const handleSaveEdit = (updatedPlace) => {
    updateStop(activeDayId, updatedPlace);
    setIsEditOpen(false);
    setPlaceToEdit(null);
    setSelectedStop(updatedPlace);
    
    // Reordenar después de editar
    setTimeout(() => {
      reorderStopsByDistance(activeDayId);
    }, 100);
  };

  // Show Welcome Screen if no trip selected
  if (!currentTrip) {
    return <WelcomeScreen onSelectTrip={handleSelectTrip} onCreateTrip={handleCreateTrip} />;
  }

  // Show Setup Screen if in setup mode
  if (setupMode) {
    return <TripSetup trip={currentTrip} onComplete={handleSetupComplete} />;
  }

  // Show Loading State
  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-medium">Cargando itinerario...</p>
        </div>
      </div>
    );
  }

  // Show Error State
  if (error) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
          <h2 className="text-2xl font-bold text-white mb-2">Error de Conexión</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Main App UI
  return (
    <div className={`h-screen w-screen overflow-hidden relative ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      
      {/* MAPA */}
      <MapComponent 
        baseLocation={baseLocation}
        activeDay={activeDay}
        selectedStop={selectedStop}
        onStopClick={handleStopClick}
        userLocation={userLocation}
        visited={visited}
        isDarkMode={isDarkMode}
        centerOnUser={centerOnUser}
      />

      {/* HEADER CONTROLS */}
      <div className="absolute top-6 left-4 z-[500]">
        <button 
          onClick={() => setIsMenuOpen(true)}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 ${isDarkMode ? 'bg-slate-900/90 text-white border border-white/10' : 'bg-white text-slate-800'}`}
        >
          <i className="fas fa-bars text-lg"></i>
        </button>
      </div>

      {/* SIDE MENU */}
      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
        onOpenList={() => setIsListOpen(true)}
        onExitTrip={handleExitTrip}
      />

      {/* ITINERARY LIST OVERLAY */}
      {isListOpen && activeDay && (
        <ItineraryList 
          activeDay={activeDay}
          stops={activeDay.stops}
          visited={visited}
          onClose={() => setIsListOpen(false)}
          onStopClick={(stop) => {
            handleStopClick(stop);
            setIsListOpen(false);
          }}
          onToggleVisited={toggleVisited}
          onDelete={handleDeleteStop}
          onEdit={(place) => {
              setIsListOpen(false);
              handleEditPlace(place);
          }}
        />
      )}

      {/* FLOATING ACTION BUTTONS */}
      <div className="absolute bottom-[170px] right-4 z-[400] flex flex-col gap-3 pointer-events-none">
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] flex items-center justify-center hover:bg-blue-500 active:scale-95 transition-all pointer-events-auto border border-white/20 backdrop-blur-sm"
        >
            <i className="fas fa-plus text-lg"></i>
        </button>
        <button 
          onClick={handleCenterOnUser}
          disabled={!userLocation}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all pointer-events-auto border border-white/20 backdrop-blur-sm ${
            userLocation 
              ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
          title="Ir a mi ubicación"
        >
            <i className="fas fa-location-arrow text-lg"></i>
        </button>
        <button 
          onClick={handleCenterOnBase}
          disabled={!baseLocation}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all pointer-events-auto border border-white/20 backdrop-blur-sm ${
            baseLocation
              ? isDarkMode ? 'bg-slate-900/90 text-amber-400 hover:bg-slate-800' : 'bg-white text-amber-500 hover:bg-slate-50'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
          title="Ir a ubicación base"
        >
            <i className="fas fa-bed text-lg"></i>
        </button>
      </div>

      {/* BOTTOM SHEET DETAIL */}
      <BottomSheet 
        place={selectedStop} 
        isOpen={!!selectedStop} 
        onClose={() => setSelectedStop(null)}
        isVisited={selectedStop ? !!visited[selectedStop.id] : false}
        onToggleVisited={toggleVisited}
        onDelete={handleDeleteStop}
        onUpdateImage={handleUpdateImage}
        onEdit={handleEditPlace}
        city={trip?.city || currentTrip?.city}
      />

      {/* EDIT MODAL */}
      {isEditOpen && placeToEdit && (
        <EditPlaceModal 
          place={placeToEdit}
          onSave={handleSaveEdit}
          onClose={() => {
            setIsEditOpen(false);
            setPlaceToEdit(null);
          }}
        />
      )}

      {/* DAY SELECTOR */}
      <DaySelector 
        days={days} 
        activeDayId={activeDayId} 
        onSelectDay={setActiveDayId} 
      />

      {/* SEARCH MODAL */}
      {isSearchOpen && (
        <PlaceSearch 
          onAddPlace={handleAddPlace} 
          onClose={() => setIsSearchOpen(false)} 
        />
      )}

    </div>
  );
}

export default App;
