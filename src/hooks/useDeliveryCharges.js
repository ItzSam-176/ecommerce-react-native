// src/hooks/useDeliveryCharges.js
import { useState, useCallback } from 'react';
import { supabase } from '../supabase/supabase';

export const useDeliveryCharges = () => {
  const [deliveryCharges, setDeliveryCharges] = useState({});

  // ✅ Fetch delivery charge for a city
  const getDeliveryCharge = useCallback(async (city, subtotal) => {
    try {
      const { data, error } = await supabase
        .from('delivery_charges')
        .select('*')
        .eq('city', city)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) return { charge: 0, estimatedDays: 3 }; // Default

      // ✅ Free delivery if subtotal meets minimum
      if (subtotal >= data.min_order_value) {
        return { charge: 0, estimatedDays: data.estimated_days, isFree: true };
      }

      return {
        charge: data.delivery_charge,
        estimatedDays: data.estimated_days,
        isFree: false,
      };
    } catch (err) {
      console.error('[Get delivery charge error]:', err);
      return { charge: 0, estimatedDays: 3 };
    }
  }, []);

  return { getDeliveryCharge };
};
