import { useState, useEffect } from 'react';
import { tripService } from '../services/tripService';
import { dayService } from '../services/dayService';
import { stopService } from '../services/stopService';
import { storageService } from '../services/storageService';

export const useSupabaseItinerary = (tripId) => {
  const [trip, setTrip] = useState(null);
  const [days, setDays] = useState([]);
  const [visited, setVisited] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar viaje y días
  useEffect(() => {
    if (tripId) {
      loadTripData();
    }
  }, [tripId]);

  const loadTripData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar información del viaje
      const tripData = await tripService.getById(tripId);
      setTrip(tripData);

      // Cargar días del viaje
      const daysData = await dayService.getByTripId(tripId);
      
      // Cargar paradas para cada día
      const daysWithStops = await Promise.all(
        daysData.map(async (day) => {
          const stops = await stopService.getByDayId(day.id);
          return {
            id: day.id,
            dayNumber: day.day_number,
            title: day.title,
            color: day.color,
            stops: stops.map(stop => ({
              id: stop.id,
              lat: stop.lat,
              lng: stop.lng,
              title: stop.title,
              cat: stop.category,
              img: stop.img,
              tip: stop.tip,
              time: stop.time,
              address: stop.address,
            })),
          };
        })
      );

      setDays(daysWithStops);

      // Construir objeto de visitados
      const visitedMap = {};
      daysWithStops.forEach(day => {
        day.stops.forEach(async (stop) => {
          const fullStop = await stopService.getById(stop.id);
          visitedMap[stop.id] = fullStop.is_visited;
        });
      });
      setVisited(visitedMap);

    } catch (err) {
      console.error('Error loading trip data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Base location del viaje
  const baseLocation = trip ? {
    lat: trip.base_location_lat || 40.7592,
    lng: trip.base_location_lng || -73.9846,
    title: trip.base_location_title || trip.city,
    desc: trip.base_location_desc || 'Base de Operaciones',
    img: trip.base_location_img || null,
  } : {
    lat: 40.7592,
    lng: -73.9846,
    title: 'Base',
    desc: 'Base de Operaciones',
  };

  // Toggle visitado
  const toggleVisited = async (stopId) => {
    try {
      await stopService.toggleVisited(stopId);
      setVisited(prev => ({ ...prev, [stopId]: !prev[stopId] }));
    } catch (err) {
      console.error('Error toggling visited:', err);
    }
  };

  // Agregar parada
  const addStop = async (dayId, stopData) => {
    try {
      // Guardar imagen directamente (base64 o URL)
      const newStop = await stopService.create({
        dayId,
        title: stopData.title,
        lat: stopData.lat,
        lng: stopData.lng,
        category: stopData.cat || 'Interés',
        img: stopData.img,
        tip: stopData.tip,
        time: stopData.time,
        address: stopData.address,
      });

      // Recargar datos
      await loadTripData();
      return newStop;
    } catch (err) {
      console.error('Error adding stop:', err);
      throw err;
    }
  };

  // Eliminar parada
  const removeStop = async (dayId, stopId) => {
    try {
      // Obtener la parada para eliminar su imagen si existe
      const stop = await stopService.getById(stopId);
      if (stop.img && stop.img.includes('supabase')) {
        try {
          await storageService.deleteImage(stop.img);
        } catch (err) {
          console.warn('Could not delete image:', err);
        }
      }

      await stopService.delete(stopId);
      await loadTripData();
    } catch (err) {
      console.error('Error removing stop:', err);
      throw err;
    }
  };

  // Actualizar imagen de parada
  const updateStopImage = async (stopId, imageData) => {
    try {
      // Guardar directamente (base64 o URL)
      await stopService.updateImage(stopId, imageData);
      await loadTripData();
    } catch (err) {
      console.error('Error updating image:', err);
      throw err;
    }
  };

  // Actualizar parada completa
  const updateStop = async (dayId, updatedStop) => {
    try {
      // Guardar imagen directamente (base64 o URL)
      await stopService.update(updatedStop.id, {
        title: updatedStop.title,
        lat: updatedStop.lat,
        lng: updatedStop.lng,
        category: updatedStop.cat,
        img: updatedStop.img,
        tip: updatedStop.tip,
        time: updatedStop.time,
        address: updatedStop.address,
      });

      await loadTripData();
    } catch (err) {
      console.error('Error updating stop:', err);
      throw err;
    }
  };

  // Reordenar paradas por distancia
  const reorderStopsByDistance = async (dayId) => {
    try {
      const day = days.find(d => d.id === dayId);
      if (!day || day.stops.length <= 1) return;

      // Calcular distancias desde base location
      const stopsWithDistance = day.stops.map(stop => {
        const distance = Math.sqrt(
          Math.pow(stop.lat - baseLocation.lat, 2) +
          Math.pow(stop.lng - baseLocation.lng, 2)
        );
        return { ...stop, distance };
      });

      // Ordenar por distancia
      stopsWithDistance.sort((a, b) => a.distance - b.distance);

      // Actualizar order_index en Supabase
      const updates = stopsWithDistance.map((stop, index) => ({
        id: stop.id,
        orderIndex: index,
      }));

      await stopService.reorder(dayId, updates);
      await loadTripData();
    } catch (err) {
      console.error('Error reordering stops:', err);
      throw err;
    }
  };

  return {
    trip,
    days,
    visited,
    loading,
    error,
    baseLocation,
    toggleVisited,
    addStop,
    removeStop,
    updateStopImage,
    updateStop,
    reorderStopsByDistance,
    refreshData: loadTripData,
  };
};
