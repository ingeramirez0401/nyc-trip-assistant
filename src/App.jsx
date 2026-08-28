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
import AgencyAdminPanel from './components/AgencyAdminPanel';
import ResetPasswordScreen from './components/auth/ResetPasswordScreen';
import { useSupabaseItinerary } from './hooks/useSupabaseItinerary';
import { useGeolocation } from './hooks/useGeolocation';
import { useAuth } from './hooks/useAuth';
import { useAppRoute } from './hooks/useAppRoute';
import { useToast } from './contexts/ToastContext';
import { tripService } from './services/tripService';
import { testConnection } from './lib/supabase';

function App() {
  // Navegación real basada en URL (home / agencia / viaje) -- ver
  // useAppRoute.js. currentTrip sigue siendo el objeto completo del viaje
  // (lo necesitan useSupabaseItinerary y los hijos); la URL solo carga el
  // id, así que se resuelve por fetch cuando no coincide con lo que ya
  // está en memoria (ver efecto más abajo).
  const [route, navigate] = useAppRoute();
  const toast = useToast();

  // App State Management
  const [currentTrip, setCurrentTrip] = useState(() => {
    const saved = localStorage.getItem('currentTrip');
    return saved ? JSON.parse(saved) : null;
  });
  const [resolvingTrip, setResolvingTrip] = useState(false);
  const [activeDayId, setActiveDayId] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [placeToEdit, setPlaceToEdit] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [centerOnUser, setCenterOnUser] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);

  // Geolocalización en tiempo real (solo si está habilitada)
  const { location: userLocation, error: geoError } = useGeolocation(gpsEnabled);

  // Efecto para aplicar la clase 'dark' al html tag
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
    navigate({ screen: 'trip', tripId: trip.id });
  };

  const handleCreateTrip = (trip) => {
    setCurrentTrip(trip);
    localStorage.setItem('currentTrip', JSON.stringify(trip));
    navigate({ screen: 'trip-setup', tripId: trip.id });
  };

  const handleExitTrip = () => {
    setCurrentTrip(null);
    localStorage.removeItem('currentTrip');
    setActiveDayId(null);
    setSelectedStop(null);
    navigate({ screen: 'home' });
  };

  // Resuelve currentTrip contra la URL: si el viaje activo en memoria no
  // coincide con el id de la ruta (deep link directo, refresh, o volver
  // atrás/adelante), lo trae por id. Cubre el mismo caso que antes cubría
  // el localStorage de currentTrip, pero ahora la URL manda.
  useEffect(() => {
    if (route.screen !== 'trip' && route.screen !== 'trip-setup') return;
    if (currentTrip?.id === route.tripId) return;

    let cancelled = false;
    setResolvingTrip(true);
    tripService
      .getById(route.tripId)
      .then((trip) => {
        if (cancelled) return;
        setCurrentTrip(trip);
        localStorage.setItem('currentTrip', JSON.stringify(trip));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('No se pudo cargar el viaje desde la URL:', err);
        toast.error('No se encontró ese viaje o ya no tienes acceso a él.');
        navigate({ screen: 'home' }, { replace: true });
      })
      .finally(() => {
        if (!cancelled) setResolvingTrip(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.screen, route.tripId]);

  // Al cerrar sesión, salir del viaje activo -- si no, useSupabaseItinerary
  // sigue corriendo con hooks trip-scoped después de que la sesión ya no
  // existe, y cualquier fetch en vuelo termina chocando con RLS (PGRST116).
  const { user, isPasswordRecovery } = useAuth();
  useEffect(() => {
    if (!user && currentTrip) {
      handleExitTrip();
    }
  }, [user]);

  const handleSetupComplete = async () => {
    navigate({ screen: 'trip', tripId: currentTrip.id });
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

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const handleCenterOnUser = () => {
    if (!gpsEnabled) {
      setGpsEnabled(true);
      setTimeout(() => {
        setCenterOnUser(true);
        setTimeout(() => setCenterOnUser(false), 100);
      }, 500);
    } else if (userLocation) {
      setCenterOnUser(true);
      setTimeout(() => setCenterOnUser(false), 100);
    }
  };

  const toggleGPS = () => {
    setGpsEnabled(!gpsEnabled);
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

  // Show password recovery form if the user arrived via a reset-password link
  if (isPasswordRecovery) {
    return <ResetPasswordScreen />;
  }

  // Volver de la agencia adonde estaba antes: a su viaje si tenía uno
  // cargado en memoria, o a home si no -- mismo comportamiento que había
  // antes de esto ser una ruta real, solo que ahora también sobrevive un
  // refresh o el botón atrás/adelante del navegador.
  const closeAgencyPanel = () =>
    navigate(currentTrip ? { screen: 'trip', tripId: currentTrip.id } : { screen: 'home' });

  // Show Agency Admin Panel if requested (works with or without a trip selected)
  if (route.screen === 'agency') {
    return (
      <AgencyAdminPanel
        onClose={closeAgencyPanel}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
    );
  }

  // Show Welcome Screen if no trip selected
  if (route.screen === 'home') {
    return (
      <WelcomeScreen
        onSelectTrip={handleSelectTrip}
        onCreateTrip={handleCreateTrip}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onOpenAgencyPanel={() => navigate({ screen: 'agency' })}
      />
    );
  }

  // Viaje aún no resuelto contra la URL (deep link directo o refresh) --
  // antes de esto, se veía "Cargando..." solo mientras useSupabaseItinerary
  // no tenía días; ahora también puede faltar el viaje mismo.
  if (resolvingTrip || !currentTrip || currentTrip.id !== route.tripId) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-medium">Cargando viaje...</p>
        </div>
      </div>
    );
  }

  // Show Setup Screen if in setup mode
  if (route.screen === 'trip-setup') {
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
        gpsEnabled={gpsEnabled}
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

      <div className="absolute top-6 right-4 z-[500]">
        <button 
          onClick={toggleTheme}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 ${isDarkMode ? 'bg-slate-900/90 text-amber-400 border border-white/10' : 'bg-white text-slate-800'}`}
        >
          <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
        </button>
      </div>

      {/* SIDE MENU */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onOpenList={() => setIsListOpen(true)}
        onExitTrip={handleExitTrip}
        onOpenAgencyPanel={() => navigate({ screen: 'agency' })}
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
          onClick={toggleGPS}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all pointer-events-auto border border-white/20 backdrop-blur-sm ${
            gpsEnabled 
              ? 'bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.5)]' 
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
          title={gpsEnabled ? "GPS Activado - Click para desactivar" : "GPS Desactivado - Click para activar"}
        >
            <i className={`fas ${gpsEnabled ? 'fa-satellite-dish' : 'fa-satellite-dish'} text-lg`}></i>
        </button>
        <button 
          onClick={handleCenterOnUser}
          disabled={!gpsEnabled || !userLocation}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all pointer-events-auto border border-white/20 backdrop-blur-sm ${
            gpsEnabled && userLocation 
              ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
          title={!gpsEnabled ? "Activa el GPS primero" : "Ir a mi ubicación"}
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
        visited={visited}
        onOpenList={() => setIsListOpen(true)}
      />

      {/* SEARCH MODAL */}
      {isSearchOpen && (
        <PlaceSearch
          onAddPlace={handleAddPlace}
          onClose={() => setIsSearchOpen(false)}
          city={trip?.city || currentTrip?.city}
        />
      )}

    </div>
  );
}

export default App;
