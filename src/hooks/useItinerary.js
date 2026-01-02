import { useState, useEffect } from 'react';
import { initialItinerary, baseLocation } from '../data/itinerary';

export function useItinerary() {
  const [days, setDays] = useState(() => {
    const saved = localStorage.getItem('nyc_itinerary_v1');
    return saved ? JSON.parse(saved) : initialItinerary;
  });

  const [visited, setVisited] = useState(() => {
    const saved = localStorage.getItem('nyc_visited_v1');
    return saved ? JSON.parse(saved) : {};
  });

  // Persist changes
  useEffect(() => {
    localStorage.setItem('nyc_itinerary_v1', JSON.stringify(days));
  }, [days]);

  useEffect(() => {
    localStorage.setItem('nyc_visited_v1', JSON.stringify(visited));
  }, [visited]);

  const toggleVisited = (stopId) => {
    setVisited(prev => ({
      ...prev,
      [stopId]: !prev[stopId]
    }));
  };

  const addStop = (dayId, newStop) => {
    setDays(prevDays => prevDays.map(day => {
      if (day.id === dayId) {
        return { ...day, stops: [...day.stops, newStop] };
      }
      return day;
    }));
  };

  const removeStop = (dayId, stopId) => {
    setDays(prevDays => prevDays.map(day => {
      if (day.id === dayId) {
        return { ...day, stops: day.stops.filter(s => s.id !== stopId) };
      }
      return day;
    }));
    
    // Limpiar del estado de visitados también
    setVisited(prev => {
      const newVisited = { ...prev };
      delete newVisited[stopId];
      return newVisited;
    });
  };

  const updateStopImage = (stopId, imageUrl) => {
    setDays(prevDays => prevDays.map(day => ({
      ...day,
      stops: day.stops.map(stop => 
        stop.id === stopId ? { ...stop, img: imageUrl } : stop
      )
    })));
  };

  return { days, visited, toggleVisited, addStop, removeStop, updateStopImage, baseLocation };
}
