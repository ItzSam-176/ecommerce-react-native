import { useState, useCallback } from 'react';
import { supabase } from '../supabase/supabase';

export const useCoupon = () => {
  const [coupons, setCoupons] = useState([]);
  const [allCoupons, setAllCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [usedCouponIds, setUsedCouponIds] = useState(new Set());

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

  const checkUsedCoupons = useCallback(async customerId => {
    try {
      const { data, error } = await supabase
        .from('coupon_usage')
        .select('coupon_id')
        .eq('customer_id', customerId);

      if (error) throw error;

      const usedIds = new Set(data?.map(item => item.coupon_id) || []);
      setUsedCouponIds(usedIds);
    } catch (err) {
      console.error('[Check used coupons error]:', err);
    }
  }, []);

  const filterApplicableCoupons = useCallback(
    cartData => {
      if (!cartData || cartData.length === 0) {
        setAllCoupons([]);
        setSelectedCoupon(null);
        setCouponDiscount(0);
        return;
      }

      const cartCategories = new Set();
      cartData.forEach(item => {
        item.products.product_categories?.forEach(pc => {
          cartCategories.add(String(pc.category_id));
        });
      });

      const relevantCoupons = coupons.filter(coupon =>
        cartCategories.has(String(coupon.category_id)),
      );

      const couponList = relevantCoupons.map(coupon => {
        const isAlreadyUsed = usedCouponIds.has(coupon.id);

        const matchingSubtotal = cartData
          .filter(item =>
            item.products.product_categories?.some(
              pc => String(pc.category_id) === String(coupon.category_id),
            ),
          )
          .reduce((t, item) => t + item.products.price * item.quantity, 0);

        const isApplicable =
          !isAlreadyUsed && matchingSubtotal >= coupon.minimum_order_value;

        let reason = null;
        if (isAlreadyUsed) {
          reason = 'You have already used this coupon';
        } else if (!isApplicable) {
          const needed = coupon.minimum_order_value - matchingSubtotal;
          reason = `Add ₹${needed.toFixed(2)} worth of ${coupon.category.name}`;
        }

        return {
          label: `${coupon.code} - ₹${coupon.discount_amount} off`,
          value: coupon.id,
          coupon: coupon,
          isApplicable: isApplicable,
          isAlreadyUsed: isAlreadyUsed,
          reason: reason,
          matchingSubtotal: matchingSubtotal,
          minRequired: coupon.minimum_order_value,
        };
      });

      const sorted = couponList.sort((a, b) => {
        if (a.isApplicable !== b.isApplicable) {
          return a.isApplicable ? -1 : 1;
        }
        if (a.isAlreadyUsed !== b.isAlreadyUsed) {
          return a.isAlreadyUsed ? 1 : -1;
        }
        return b.coupon.discount_amount - a.coupon.discount_amount;
      });

      setAllCoupons(sorted);
    },
    [coupons, usedCouponIds],
  );

  const selectCoupon = useCallback(couponItem => {
    if (couponItem?.isApplicable && !couponItem?.isAlreadyUsed) {
      setSelectedCoupon(couponItem);
      if (couponItem?.coupon) {
        setCouponDiscount(couponItem.coupon.discount_amount);
      }
    }
  }, []);

  const removeCoupon = useCallback(() => {
    setSelectedCoupon(null);
    setCouponDiscount(0);
  }, []);

  const getCouponDetails = useCallback(() => {
    if (!selectedCoupon?.coupon) return null;
    return {
      code: selectedCoupon.coupon.code,
      discount: couponDiscount,
      category: selectedCoupon.coupon.category.name,
    };
  }, [selectedCoupon, couponDiscount]);

  const calculateTotal = useCallback(
    subtotal => {
      return Math.max(0, subtotal - couponDiscount);
    },
    [couponDiscount],
  );

  const validateCouponApplicability = useCallback((couponToValidate, items) => {
    if (!couponToValidate) return false;

    const couponObj = couponToValidate.coupon;
    const couponCategoryId = couponObj?.category_id;
    const minimumOrderValue = Number(couponObj?.minimum_order_value || 0);

    // Calculate subtotal
    const subtotal = items.reduce(
      (t, i) => t + Number(i.products.price) * Number(i.quantity),
      0,
    );

    console.log('[validateCouponApplicability]', {
      couponCode: couponObj?.code,
      subtotal,
      minimumOrderValue,
      meetsMinimum: subtotal >= minimumOrderValue,
    });

    // Check minimum order value
    if (subtotal < minimumOrderValue) {
      return false;
    }

    // If global coupon, applicable if items exist
    if (!couponCategoryId) {
      return items.length > 0;
    }

    // Check category match
    return items.some(
      item =>
        Array.isArray(item.products.product_categories) &&
        item.products.product_categories.some(
          pc => pc.category_id === couponCategoryId,
        ),
    );
  }, []);

  return {
    coupons,
    allCoupons,
    selectedCoupon,
    couponDiscount,
    loading,
    usedCouponIds,
    fetchAllCoupons,
    filterApplicableCoupons,
    selectCoupon,
    removeCoupon,
    getCouponDetails,
    calculateTotal,
    checkUsedCoupons,
    validateCouponApplicability,
  };
};
