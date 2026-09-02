import { supabase } from '../lib/supabase';
import { offlineDb } from '../lib/offlineDb';
import { assertOnline, withOfflineFallback } from '../lib/connectivity';

// =====================================================
// DAYS (Días del itinerario)
// =====================================================

export const dayService = {
  // Obtener todos los días de un viaje -- sin señal, cae a la copia local.
  async getByTripId(tripId) {
    return withOfflineFallback(
      async () => {
        const { data, error } = await supabase
          .from('trippulse_days')
          .select('*')
          .eq('trip_id', tripId)
          .order('day_number', { ascending: true });

        if (error) throw error;
        await offlineDb.days.bulkPut(data);
        return data;
      },
      async () => {
        const cached = await offlineDb.days.where('trip_id').equals(tripId).toArray();
        return cached.sort((a, b) => a.day_number - b.day_number);
      }
    );
  },

  // Obtener un día específico
  async getById(id) {
    return withOfflineFallback(
      async () => {
        const { data, error } = await supabase
          .from('trippulse_days')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        await offlineDb.days.put(data);
        return data;
      },
      () => offlineDb.days.get(id)
    );
  },

  // Crear un nuevo día
  async create(dayData) {
    assertOnline('addDay');
    const { data, error } = await supabase
      .from('trippulse_days')
      .insert([{
        trip_id: dayData.tripId,
        day_number: dayData.dayNumber,
        title: dayData.title,
        color: dayData.color || '#3b82f6',
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Crear múltiples días a la vez
  async createMultiple(tripId, daysData) {
    assertOnline('createDays');
    const days = daysData.map((day, index) => ({
      trip_id: tripId,
      day_number: day.dayNumber || index + 1,
      title: day.title,
      color: day.color || '#3b82f6',
    }));

    const { data, error } = await supabase
      .from('trippulse_days')
      .insert(days)
      .select();
    
    if (error) throw error;
    return data;
  },

  // Actualizar un día
  async update(id, dayData) {
    assertOnline('saveDayChanges');
    const { data, error } = await supabase
      .from('trippulse_days')
      .update({
        title: dayData.title,
        color: dayData.color,
        day_number: dayData.dayNumber,
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar un día (CASCADE eliminará paradas)
  async delete(id) {
    assertOnline('deleteDay');
    const { error } = await supabase
      .from('trippulse_days')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Obtener el conteo de días de un viaje
  async countByTripId(tripId) {
    const { count, error } = await supabase
      .from('trippulse_days')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId);
    
    if (error) throw error;
    return count;
  },
};
