import { supabase } from '../lib/supabase';

// =====================================================
// STOPS (Paradas/Sitios a visitar)
// =====================================================

export const stopService = {
  // Obtener todas las paradas de un día
  async getByDayId(dayId) {
    const { data, error } = await supabase
      .from('stops')
      .select('*')
      .eq('day_id', dayId)
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Obtener una parada específica
  async getById(id) {
    const { data, error } = await supabase
      .from('stops')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Crear una nueva parada
  async create(stopData) {
    // Obtener el siguiente order_index
    const { count } = await supabase
      .from('stops')
      .select('*', { count: 'exact', head: true })
      .eq('day_id', stopData.dayId);

    const { data, error } = await supabase
      .from('stops')
      .insert([{
        day_id: stopData.dayId,
        title: stopData.title,
        lat: stopData.lat,
        lng: stopData.lng,
        category: stopData.category || 'Interés',
        img: stopData.img || null,
        tip: stopData.tip || null,
        time: stopData.time || null,
        address: stopData.address || null,
        order_index: count || 0,
        is_visited: false,
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Actualizar una parada
  async update(id, stopData) {
    const updateData = {};
    
    if (stopData.title !== undefined) updateData.title = stopData.title;
    if (stopData.lat !== undefined) updateData.lat = stopData.lat;
    if (stopData.lng !== undefined) updateData.lng = stopData.lng;
    if (stopData.category !== undefined) updateData.category = stopData.category;
    if (stopData.img !== undefined) updateData.img = stopData.img;
    if (stopData.tip !== undefined) updateData.tip = stopData.tip;
    if (stopData.time !== undefined) updateData.time = stopData.time;
    if (stopData.address !== undefined) updateData.address = stopData.address;
    if (stopData.orderIndex !== undefined) updateData.order_index = stopData.orderIndex;
    if (stopData.isVisited !== undefined) updateData.is_visited = stopData.isVisited;

    const { data, error } = await supabase
      .from('stops')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Actualizar solo la imagen
  async updateImage(id, imageUrl) {
    const { data, error } = await supabase
      .from('stops')
      .update({ img: imageUrl })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Toggle estado de visitado
  async toggleVisited(id) {
    // Primero obtener el estado actual
    const { data: currentStop } = await supabase
      .from('stops')
      .select('is_visited')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('stops')
      .update({ is_visited: !currentStop.is_visited })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar una parada
  async delete(id) {
    const { error } = await supabase
      .from('stops')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Reordenar paradas (actualizar order_index de múltiples paradas)
  async reorder(dayId, stopsWithNewOrder) {
    // stopsWithNewOrder es un array de { id, orderIndex }
    const updates = stopsWithNewOrder.map(stop => 
      supabase
        .from('stops')
        .update({ order_index: stop.orderIndex })
        .eq('id', stop.id)
    );

    await Promise.all(updates);
    
    // Retornar las paradas actualizadas
    return await this.getByDayId(dayId);
  },

  // Obtener paradas visitadas de un día
  async getVisitedByDayId(dayId) {
    const { data, error } = await supabase
      .from('stops')
      .select('*')
      .eq('day_id', dayId)
      .eq('is_visited', true)
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Contar paradas de un día
  async countByDayId(dayId) {
    const { count, error } = await supabase
      .from('stops')
      .select('*', { count: 'exact', head: true })
      .eq('day_id', dayId);
    
    if (error) throw error;
    return count;
  },
};
