// services/AddressService.js
import { supabase } from '../supabase/supabase';

export class AddressService {
  static async getAddresses(userId) {
    try {
      const { data, error } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error loading addresses:', error);
      return { success: false, error: error.message };
    }
  }
}
