import { supabase } from '../lib/supabase';

// =====================================================
// TRIPS (Viajes/Ciudades)
// =====================================================

export const tripService = {
  // Obtener todos los viajes
  async getAll() {
    const { data, error } = await supabase
      .from('trippulse_trips')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Obtener un viaje por ID
  async getById(id) {
    const { data, error } = await supabase
      .from('trippulse_trips')
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
        user_id: tripData.user_id || null, // Add user_id association
      };
      
      console.log('📝 Inserting trip data:', insertData);
      console.log('🔗 Supabase URL:', supabase.supabaseUrl);
      
      // Usar insert directo
      const response = await supabase
        .from('trippulse_trips')
        .insert([insertData])
        .select()
        .single();
      
      console.log('📦 Full response:', response);
      console.log('📦 Response data:', response.data);
      console.log('📦 Response error:', response.error);
      console.log('📦 Response status:', response.status);
      console.log('📦 Response statusText:', response.statusText);
      
      if (response.error) {
        console.error('❌ Supabase error details:', {
          message: response.error.message,
          details: response.error.details,
          hint: response.error.hint,
          code: response.error.code,
          full: response.error
        });
        throw new Error(response.error.message || response.error.hint || 'Error al crear el viaje');
      }
      
      if (!response.data) {
        console.error('❌ No data received. Full response:', JSON.stringify(response, null, 2));
        throw new Error('No se recibieron datos del servidor. Verifica la conexión con Supabase.');
      }
      
      console.log('✅ Trip created successfully:', response.data);
      return response.data;
    } catch (err) {
      console.error('❌ Exception in create:', err);
      console.error('❌ Error name:', err.name);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error stack:', err.stack);
      throw err;
    }
  },

  // Actualizar un viaje
  async update(id, tripData) {
    const { data, error } = await supabase
      .from('trippulse_trips')
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
      .from('trippulse_trips')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Buscar viajes por ciudad
  async searchByCity(cityName) {
    const { data, error } = await supabase
      .from('trippulse_trips')
      .select('*')
      .ilike('city', `%${cityName}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
};
