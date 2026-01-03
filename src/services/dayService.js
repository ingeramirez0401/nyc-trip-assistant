import { supabase } from '../lib/supabase';

// =====================================================
// DAYS (Días del itinerario)
// =====================================================

export const dayService = {
  // Obtener todos los días de un viaje
  async getByTripId(tripId) {
    const { data, error } = await supabase
      .from('days')
      .select('*')
      .eq('trip_id', tripId)
      .order('day_number', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Obtener un día específico
  async getById(id) {
    const { data, error } = await supabase
      .from('days')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Crear un nuevo día
  async create(dayData) {
    const { data, error } = await supabase
      .from('days')
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
    const days = daysData.map((day, index) => ({
      trip_id: tripId,
      day_number: day.dayNumber || index + 1,
      title: day.title,
      color: day.color || '#3b82f6',
    }));

    const { data, error } = await supabase
      .from('days')
      .insert(days)
      .select();
    
    if (error) throw error;
    return data;
  },

  // Actualizar un día
  async update(id, dayData) {
    const { data, error } = await supabase
      .from('days')
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
    const { error } = await supabase
      .from('days')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Obtener el conteo de días de un viaje
  async countByTripId(tripId) {
    const { count, error } = await supabase
      .from('days')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId);
    
    if (error) throw error;
    return count;
  },
};
