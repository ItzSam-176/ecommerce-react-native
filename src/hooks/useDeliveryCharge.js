import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase/supabase';

const DEFAULT_RULES = [
  { min_cart_value: 0, max_cart_value: 499, charge_amount: 50 },
  { min_cart_value: 500, max_cart_value: 999, charge_amount: 30 },
  { min_cart_value: 1000, max_cart_value: null, charge_amount: 0 },
];

export const useDeliveryCharge = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_charge_rules')
        .select('*')
        .eq('is_active', true)
        .order('min_cart_value', { ascending: true });

      if (error) throw error;
      setRules(data.length > 0 ? data : DEFAULT_RULES);
    } catch (err) {
      console.error('[useDeliveryCharge] Fetch error:', err);
      setRules(DEFAULT_RULES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Calculate the charge based on subtotal
  // Calculate the charge based on subtotal
  const calculateDeliveryCharge = useCallback(
    subtotal => {
      if (!subtotal || subtotal <= 0) return 0;

      const rule = rules.find(
        r =>
          subtotal >= r.min_cart_value &&
          (r.max_cart_value === null || subtotal <= r.max_cart_value),
      );

      return rule ? Number(rule.charge_amount) : 0;
    },
    [rules],
  );

  // Find how much more is needed to reach free shipping
  const getFreeShippingThreshold = useCallback(
    subtotal => {
      if (!rules || rules.length === 0) return null;
      const freeRule = rules.find(r => r.charge_amount === 0);

      if (!freeRule || freeRule.min_cart_value <= subtotal) return null;
      const remaining = Math.max(0, freeRule.min_cart_value - subtotal);
      return remaining > 0 ? remaining : null;
    },
    [rules],
  );

  return {
    loading,
    rules,
    fetchRules,
    calculateDeliveryCharge,
    getFreeShippingThreshold,
  };
};
