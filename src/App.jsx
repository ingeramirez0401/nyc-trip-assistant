import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import BottomSheet from './components/BottomSheet';
import DaySelector from './components/DaySelector';
import PlaceSearch from './components/PlaceSearch';
import { useItinerary } from './hooks/useItinerary';

function App() {
  const { days, visited, toggleVisited, addStop, removeStop, updateStopImage, baseLocation } = useItinerary();
  
  const [activeDayId, setActiveDayId] = useState(1);
  const [selectedStop, setSelectedStop] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const activeDay = days.find(d => d.id === activeDayId);

  const handleDeleteStop = (stopId) => {
    removeStop(activeDayId, stopId);
  };

  const handleUpdateImage = (stopId, imageUrl) => {
    updateStopImage(stopId, imageUrl);
  };

  // User Location Tracking
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.log("GPS Error", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleStopClick = (stop) => {
    setSelectedStop(stop);
  };

  const handleAddPlace = (placeData) => {
    const newStop = {
      id: `custom-${Date.now()}`,
      ...placeData,
      tip: "Agregado por ti",
      time: "N/A"
    };
    addStop(activeDayId, newStop);
    setIsSearchOpen(false);
    
    // Auto select new place
    setTimeout(() => setSelectedStop(newStop), 500);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-900 relative">
      
      {/* MAPA */}
      <MapComponent 
        baseLocation={baseLocation}
        activeDay={activeDay}
        selectedStop={selectedStop}
        onStopClick={handleStopClick}
        userLocation={userLocation}
        visited={visited}
      />

      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 z-[500] p-4 pointer-events-none">
        <div className="flex justify-between items-start pointer-events-auto">
            {/* Title Card */}
            <div className="glass-panel rounded-2xl p-3 pl-4 flex items-center gap-3 animate-fade-in-down">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg">
                    <i className="fas fa-plane-departure"></i>
                </div>
                <div>
                    <h1 className="text-sm font-bold text-slate-800 leading-none">NYC 2026</h1>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        {activeDay?.title}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="glass-panel w-11 h-11 rounded-full flex items-center justify-center text-emerald-600 shadow-lg active:scale-90 transition-transform"
                >
                    <i className="fas fa-plus"></i>
                </button>
                <button 
                  onClick={() => setSelectedStop(null)} // TODO: Pass center logic if needed or just use this to clear selection
                  className="glass-dark w-11 h-11 rounded-full flex items-center justify-center text-amber-300 shadow-lg active:scale-90 transition-transform"
                >
                    <i className="fas fa-bed"></i>
                </button>
            </div>
        </div>
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
      />

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
