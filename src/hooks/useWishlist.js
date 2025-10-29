//---
import { useState, useEffect, useCallback } from 'react';
import { WishlistService } from '../services/WishlistService';
import { EventBus } from '../services/EventBus';
import { useToastify } from '../hooks/useToastify';
import HapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';

const triggerHapticFeedback = () => {
  HapticFeedback.trigger(HapticFeedbackTypes.impactMedium, {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  });
};

export const useWishlist = (
  products = [],
  showCustomAlert = null,
  navigation = null,
  onWishlistChange = null,
) => {
  const { showToast } = useToastify();

  const [wishlistItems, setWishlistItems] = useState(new Set());
  const [wishlistData, setWishlistData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if product is in wishlist
  const checkWishlistStatus = useCallback(async productId => {
    if (!productId) return;

    try {
      const result = await WishlistService.isInWishlist(productId);

      if (result.success && result.isInWishlist) {
        setWishlistItems(prev => new Set([...prev, productId]));
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  }, []);

  // Load initial wishlist status for all products
  useEffect(() => {
    if (products && products.length > 0) {
      products.forEach(product => {
        if (product?.id) {
          checkWishlistStatus(product.id);
        }
      });
    }
  }, [products, checkWishlistStatus]);

  // Add to wishlist
  const addToWishlist = useCallback(
    async (product, showAlertFlag = true) => {
      if (!product?.id) {
        const err = 'Invalid product';
        setError(err);
        return { success: false, error: err };
      }

      const productName = product.name || 'Product';
      const productId = product.id;

      if (wishlistItems.has(productId)) {
        if (showAlertFlag) {
          showToast('Already in Wishlist!', '', 'info');
        }
        return { success: true, alreadyExists: true };
      }

      setLoading(true);
      setError(null);

      try {
        const result = await WishlistService.addToWishlist(productId);

        if (result.success) {
          triggerHapticFeedback();
          setWishlistItems(prev => new Set([...prev, productId]));

          // Normalize returned data: Supabase usually returns an array of rows
          const inserted = Array.isArray(result.data)
            ? result.data[0]
            : result.data || {
                id: Date.now(),
                product_id: productId,
                products: product,
              };

          // Notify other listeners that wishlist changed
          EventBus.emit('wishlist:changed', {
            action: 'add',
            productId,
            data: inserted,
          });

          setWishlistData(prev => {
            const exists = prev.some(
              row => (row.product_id ?? row.products?.id) === productId,
            );
            if (exists) return prev;
            return [inserted, ...prev];
          });

          // Notify parent component about successful add
          if (onWishlistChange) {
            onWishlistChange({ action: 'add', productId, success: true });
          }

          if (showAlertFlag) {
            showToast('Added to Wishlist!', '', 'success');
          }
          return { success: true, data: result.data };
        } else {
          setError(result.error);
          if (showAlertFlag) {
            showToast(
              'Error',
              result.error || 'Failed to add to wishlist',
              'error',
            );
          }
          return { success: false, error: result.error };
        }
      } catch (error) {
        const errMsg = error.message || 'Failed to add to wishlist';
        setError(errMsg);
        if (showAlertFlag) showToast('Error', errMsg, 'error');
        return { success: false, error: errMsg };
      } finally {
        setLoading(false);
      }
    },
    [wishlistItems, showToast],
  );

  // Remove from wishlist
  const removeFromWishlist = useCallback(
    async (product, showAlertFlag = true) => {
      if (!product?.id) {
        const err = 'Invalid product';
        setError(err);
        return { success: false, error: err };
      }

      const productName = product.name || 'Product';
      const productId = product.id;

      setLoading(true);
      setError(null);

      try {
        const result = await WishlistService.removeFromWishlist(productId);

        if (result.success) {
          triggerHapticFeedback();

          setWishlistItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });

          setWishlistData(prev =>
            prev.filter(row => {
              const id = row.product_id ?? row.products?.id;
              return id !== productId;
            }),
          );

          // Notify other listeners that wishlist changed
          EventBus.emit('wishlist:changed', { action: 'remove', productId });

          // Notify parent component about successful remove
          if (onWishlistChange) {
            onWishlistChange({ action: 'remove', productId, success: true });
          }

          if (showAlertFlag) {
            showToast('Removed from Wishlist', '', 'success');
          }
          return { success: true };
        } else {
          setError(result.error);
          if (showAlertFlag) {
            showToast(
              'Error',
              result.error || 'Failed to remove from wishlist',
              'error',
            );
          }
          return { success: false, error: result.error };
        }
      } catch (error) {
        const errMsg = error.message || 'Failed to remove from wishlist';
        setError(errMsg);
        console.error('❌ Error in removeFromWishlist:', error);
        if (showAlertFlag) showToast('Error', errMsg, 'error');
        return { success: false, error: errMsg };
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  // Toggle wishlist status
  // FIXED: Toggle wishlist - haptic feedback handled by add/remove functions
  const toggleWishlist = useCallback(
    async (product, showAlertFlag = true) => {
      if (!product?.id) return { success: false, error: 'Invalid product' };

      const isCurrentlyInWishlist = wishlistItems.has(product.id);

      if (isCurrentlyInWishlist) {
        return await removeFromWishlist(product, showAlertFlag);
      } else {
        return await addToWishlist(product, showAlertFlag);
      }
      // REMOVED: Unreachable haptic feedback call
    },
    [wishlistItems, addToWishlist, removeFromWishlist],
  );

  // Get full wishlist
  const getWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await WishlistService.getUserWishlist();

      if (result.success) {
        // Normalize and dedupe
        const normalized = Array.isArray(result.data) ? result.data : [];
        const deduped = [];
        const seen = new Set();
        for (const row of normalized) {
          const pid = row.product_id ?? row.products?.id;
          if (!pid) continue;
          if (seen.has(pid)) continue;
          seen.add(pid);
          deduped.push(row);
        }

        const productIds = Array.from(seen);
        setWishlistItems(new Set(productIds));
        setWishlistData(deduped);

        // Broadcast the full wishlist to keep other hooks/components synced
        EventBus.emit('wishlist:changed', {
          action: 'sync',
          productIds,
          data: deduped,
        });
        return { success: true, data: result.data };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError(error.message || 'Failed to fetch wishlist');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to external wishlist changes so multiple hook users stay in sync
  useEffect(() => {
    const off = EventBus.on('wishlist:changed', payload => {
      if (!payload) return;
      if (payload.action === 'add') {
        setWishlistItems(prev => new Set([...prev, payload.productId]));
        // Optionally prepend to wishlistData if payload.data present
        if (payload.data) {
          setWishlistData(prev => {
            const exists = prev.some(
              row => (row.product_id ?? row.products?.id) === payload.productId,
            );
            if (exists) return prev;
            return [payload.data, ...prev];
          });
        }
      } else if (payload.action === 'remove') {
        setWishlistItems(prev => {
          const next = new Set(prev);
          next.delete(payload.productId);
          return next;
        });
        setWishlistData(prev =>
          prev.filter(row => {
            const id = row.product_id ?? row.products?.id;
            return id !== payload.productId;
          }),
        );
      } else if (payload.action === 'sync') {
        const productIds = payload.productIds || [];
        setWishlistItems(new Set(productIds));
        if (Array.isArray(payload.data)) setWishlistData(payload.data);
      }
    });

    return () => off();
  }, []);

  useEffect(() => {
    if (!navigation) return;
    const unsubscribe = navigation.addListener('focus', () => {
      getWishlist();
    });
    return unsubscribe;
  }, [navigation, getWishlist]);

  const clearWishlist = useCallback(() => {
    setWishlistItems(new Set());
    setError(null);
  }, []);

  const isInWishlist = useCallback(
    productId => {
      return wishlistItems.has(productId);
    },
    [wishlistItems],
  );

  return {
    wishlistItems,
    loading,
    error,
    wishlistData,

    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    getWishlist,
    clearWishlist,
    checkWishlistStatus,

    isInWishlist,
    wishlistCount: wishlistItems.size,

    isEmpty: wishlistItems.size === 0,
  };
};
