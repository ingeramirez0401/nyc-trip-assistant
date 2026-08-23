import { supabase } from '../lib/supabase';

export const agencyService = {
  async getById(agencyId) {
    const { data, error } = await supabase
      .from('trippulse_agencies')
      .select('*')
      .eq('id', agencyId)
      .single();

    if (error) throw error;
    return data;
  },

  async update(agencyId, updates) {
    const { data, error } = await supabase
      .from('trippulse_agencies')
      .update(updates)
      .eq('id', agencyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
