import { supabase } from '../lib/supabase';

export const profileService = {
  // Get profile by ID
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update profile data
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Increment trip count
  async incrementTripCount(userId) {
    // We use a stored procedure (RPC) if available for atomicity, 
    // or fetch-update for MVP simplicity. 
    // Ideally, this should be an RPC: increment_trip_count(user_id)
    
    // Fallback client-side increment
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('trips_created_count')
      .eq('id', userId)
      .single();
      
    if (fetchError) throw fetchError;

    const newCount = (profile.trips_created_count || 0) + 1;

    const { data, error } = await supabase
      .from('profiles')
      .update({ trips_created_count: newCount })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Increment AI generation usage
  async incrementAIUsage(userId) {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('ai_generations_used')
      .eq('id', userId)
      .single();
      
    if (fetchError) throw fetchError;

    const newCount = (profile.ai_generations_used || 0) + 1;

    const { data, error } = await supabase
      .from('profiles')
      .update({ ai_generations_used: newCount })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
