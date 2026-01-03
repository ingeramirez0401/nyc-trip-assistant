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

  const updateStop = (dayId, updatedStop) => {
    setDays(prevDays => prevDays.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          stops: day.stops.map(stop => 
            stop.id === updatedStop.id ? updatedStop : stop
          )
        };
      }
      return day;
    }));
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const reorderStopsByDistance = (dayId) => {
    setDays(prevDays => prevDays.map(day => {
      if (day.id !== dayId || day.stops.length <= 1) return day;

      const stops = [...day.stops];
      const ordered = [];
      let current = stops[0]; // Empezar con el primer lugar
      ordered.push(current);
      stops.splice(0, 1);

      // Algoritmo greedy: siempre ir al lugar más cercano
      while (stops.length > 0) {
        let nearestIndex = 0;
        let minDistance = Infinity;

        stops.forEach((stop, index) => {
          const distance = calculateDistance(
            current.lat, current.lng,
            stop.lat, stop.lng
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestIndex = index;
          }
        });

        current = stops[nearestIndex];
        ordered.push(current);
        stops.splice(nearestIndex, 1);
      }

      return { ...day, stops: ordered };
    }));
  };

  return { days, visited, toggleVisited, addStop, removeStop, updateStopImage, updateStop, reorderStopsByDistance, baseLocation };
}
