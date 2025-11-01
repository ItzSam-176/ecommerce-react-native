// src/hooks/useCoupon.js
import { useState, useCallback } from 'react';
import { supabase } from '../supabase/supabase';

export const useCoupon = () => {
  const [coupons, setCoupons] = useState([]);
  const [applicableCoupons, setApplicableCoupons] = useState([]);
  const [disabledCoupons, setDisabledCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch all active coupons
  const fetchAllCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*, category:category_id(id, name)')
        .eq('is_active', true);

      if (error) throw error;
      setCoupons(data || []);
    } catch (err) {
      console.error('[Fetch coupons error]:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Filter applicable + disabled coupons
  const filterApplicableCoupons = useCallback(
    cartData => {
      if (!cartData || cartData.length === 0) {
        setApplicableCoupons([]);
        setDisabledCoupons([]);
        setSelectedCoupon(null);
        setCouponDiscount(0);
        return;
      }

      // Get all categories in cart
      const cartCategories = new Set();
      cartData.forEach(item => {
        item.products.product_categories?.forEach(pc => {
          cartCategories.add(String(pc.category_id));
        });
      });

      // Get coupons from cart categories
      const relevantCoupons = coupons.filter(coupon =>
        cartCategories.has(String(coupon.category_id)),
      );

      // Separate into applicable and disabled
      const applicable = [];
      const disabled = [];

      relevantCoupons.forEach(coupon => {
        const matchingSubtotal = cartData
          .filter(item =>
            item.products.product_categories?.some(
              pc => String(pc.category_id) === String(coupon.category_id),
            ),
          )
          .reduce((t, item) => t + item.products.price * item.quantity, 0);

        const isApplicable = matchingSubtotal >= coupon.minimum_order_value;

        const couponObj = {
          label: `${coupon.code} - ₹${coupon.discount_amount} off (${coupon.category.name})`,
          value: coupon.id,
          coupon: coupon,
          isApplicable: isApplicable,
          reason: null,
        };

        // ✅ SET REASON IF NOT APPLICABLE
        if (!isApplicable) {
          const needed = coupon.minimum_order_value - matchingSubtotal;
          couponObj.reason = `Add ₹${needed.toFixed(2)} worth ${coupon.category.name} products`;
        }

        if (isApplicable) {
          applicable.push(couponObj);
        } else {
          disabled.push(couponObj);
        }
      });

      // Sort applicable by highest discount
      const sortedApplicable = applicable.sort(
        (a, b) => b.coupon.discount_amount - a.coupon.discount_amount,
      );

      setApplicableCoupons(sortedApplicable);
      setDisabledCoupons(disabled);
    },
    [coupons],
  );

  // ✅ Select coupon
  const selectCoupon = useCallback(couponItem => {
    if (couponItem?.isApplicable) {
      setSelectedCoupon(couponItem);
      if (couponItem?.coupon) {
        setCouponDiscount(couponItem.coupon.discount_amount);
      }
    }
  }, []);

  // ✅ Remove coupon
  const removeCoupon = useCallback(() => {
    setSelectedCoupon(null);
    setCouponDiscount(0);
  }, []);

  // ✅ Get coupon details
  const getCouponDetails = useCallback(() => {
    if (!selectedCoupon?.coupon) return null;
    return {
      code: selectedCoupon.coupon.code,
      discount: couponDiscount,
      category: selectedCoupon.coupon.category.name,
    };
  }, [selectedCoupon, couponDiscount]);

  // ✅ Calculate final total
  const calculateTotal = useCallback(
    subtotal => {
      return Math.max(0, subtotal - couponDiscount);
    },
    [couponDiscount],
  );

  return {
    // State
    coupons,
    applicableCoupons,
    disabledCoupons, // ✅ NEW
    selectedCoupon,
    couponDiscount,
    loading,

    // Methods
    fetchAllCoupons,
    filterApplicableCoupons,
    selectCoupon,
    removeCoupon,
    getCouponDetails,
    calculateTotal,
  };
};
 