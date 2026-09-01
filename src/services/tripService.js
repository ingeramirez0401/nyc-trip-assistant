import { supabase } from '../lib/supabase';
import { offlineDb } from '../lib/offlineDb';
import { assertOnline, withOfflineFallback } from '../lib/connectivity';

// =====================================================
// TRIPS (Viajes/Ciudades)
// =====================================================

export const tripService = {
  // Obtener todos los viajes -- sin señal, cae a la última copia local
  // (ver withOfflineFallback en lib/connectivity.js).
  async getAll() {
    return withOfflineFallback(
      async () => {
        const { data, error } = await supabase
          .from('trippulse_trips')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        await offlineDb.trips.bulkPut(data);
        return data;
      },
      async () => {
        const cached = await offlineDb.trips.toArray();
        return cached.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
    );
  },

  // Obtener un viaje por ID
  async getById(id) {
    return withOfflineFallback(
      async () => {
        const { data, error } = await supabase
          .from('trippulse_trips')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        await offlineDb.trips.put(data);
        return data;
      },
      () => offlineDb.trips.get(id)
    );
  },

  // Crear un nuevo viaje
  async create(tripData) {
    assertOnline('crear un viaje nuevo');
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
        base_location_place_id: cleanString(tripData.baseLocation?.placeId),
        user_id: tripData.user_id || null, // Add user_id association
      };
      
      const response = await supabase
        .from('trippulse_trips')
        .insert([insertData])
        .select()
        .single();

      if (response.error) {
        console.error('Error creando el viaje:', response.error);
        throw new Error(response.error.message || response.error.hint || 'Error al crear el viaje');
      }

      if (!response.data) {
        throw new Error('No se recibieron datos del servidor. Verifica la conexión con Supabase.');
      }

      return response.data;
    } catch (err) {
      console.error('Excepción creando el viaje:', err);
      throw err;
    }
  },

  // Actualizar un viaje
  async update(id, tripData) {
    assertOnline('guardar cambios en el viaje');
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
        base_location_place_id: tripData.baseLocation?.placeId,
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar un viaje (CASCADE eliminará días y paradas)
  async delete(id) {
    assertOnline('eliminar el viaje');
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
