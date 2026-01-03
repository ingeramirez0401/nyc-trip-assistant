import { supabase } from '../lib/supabase';

// =====================================================
// TRIPS (Viajes/Ciudades)
// =====================================================

export const tripService = {
  // Obtener todos los viajes
  async getAll() {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Obtener un viaje por ID
  async getById(id) {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Crear un nuevo viaje
  async create(tripData) {
    try {
      // Helper para limpiar strings vacíos a null
      const cleanString = (str) => {
        if (!str || str.trim() === '') return null;
        return str.trim();
      };
      
      const insertData = {
        name: cleanString(tripData.name),
        city: cleanString(tripData.city),
        country: cleanString(tripData.country),
        base_location_lat: tripData.baseLocation?.lat || null,
        base_location_lng: tripData.baseLocation?.lng || null,
        base_location_title: cleanString(tripData.baseLocation?.title),
        base_location_desc: cleanString(tripData.baseLocation?.desc),
        base_location_img: cleanString(tripData.baseLocation?.img),
      };
      
      console.log('📝 Inserting trip data:', insertData);
      console.log('🔗 Supabase URL:', supabase.supabaseUrl);
      
      // Usar upsert en lugar de insert para evitar problemas de permisos
      const response = await supabase
        .from('trips')
        .upsert([insertData], { onConflict: 'id' })
        .select()
        .single();
      
      console.log('📦 Full response:', response);
      
      if (response.error) {
        console.error('❌ Supabase error object:', JSON.stringify(response.error, null, 2));
        throw new Error(response.error.message || 'Error desconocido al crear el viaje');
      }
      
      if (!response.data) {
        throw new Error('No se recibieron datos del servidor');
      }
      
      console.log('✅ Trip created successfully:', response.data);
      return response.data;
    } catch (err) {
      console.error('❌ Exception in create:', err);
      throw err;
    }
  },

  // Actualizar un viaje
  async update(id, tripData) {
    const { data, error } = await supabase
      .from('trips')
      .update({
        name: tripData.name,
        city: tripData.city,
        country: tripData.country,
        base_location_lat: tripData.baseLocation?.lat,
        base_location_lng: tripData.baseLocation?.lng,
        base_location_title: tripData.baseLocation?.title,
        base_location_desc: tripData.baseLocation?.desc,
        base_location_img: tripData.baseLocation?.img,
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar un viaje (CASCADE eliminará días y paradas)
  async delete(id) {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Buscar viajes por ciudad
  async searchByCity(cityName) {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .ilike('city', `%${cityName}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
};
