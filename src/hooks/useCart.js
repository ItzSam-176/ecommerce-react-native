import { useState, useEffect, useCallback } from 'react';
import { CartService } from '../services/CartService';
import { useToastify } from '../hooks/useToastify';
import { EventBus } from '../services/EventBus';

export const useCart = (
  products = [],
  showCustomAlert = null,
  navigation = null,
) => {
  const { showToast } = useToastify();

  const [cartItems, setCartItems] = useState(new Set());
  const [cartData, setCartData] = useState([]);
  const [cartQuantities, setCartQuantities] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if product is in cart
  const checkCartStatus = useCallback(async productId => {
    if (!productId) return;

    try {
      const result = await CartService.isInCart(productId);

      if (result.success && result.isInCart) {
        setCartItems(prev => new Set([...prev, productId]));
        setCartQuantities(
          prev => new Map([...prev, [productId, result.quantity || 1]]),
        );
      }
    } catch (error) {
      console.error('Error checking cart status:', error);
    }
  }, []);

  useEffect(() => {
    if (products && products.length > 0) {
      products.forEach(product => {
        if (product?.id) {
          checkCartStatus(product.id);
        }
      });
    }
  }, [products, checkCartStatus]);

  const addToCart = useCallback(
    async (product, showAlertFlag = true, quantity = 1) => {
      if (!product?.id) {
        const err = 'Invalid product';
        setError(err);
        return { success: false, error: err };
      }

      const productName = product.name || 'Product';
      const productId = product.id;

      if ((product.quantity ?? 0) <= 0) {
        if (showAlertFlag) {
          showToast('Out of Stock', ``, 'error');
        }
        return { success: false, error: 'out_of_stock' };
      }

      if (product.quantity < quantity) {
        if (showAlertFlag) {
          showToast('Insufficient Stock', ``, 'warning');
        }
        return {
          success: false,
          error: 'insufficient_stock',
          availableQuantity: product.quantity,
        };
      }

      if (cartItems.has(productId)) {
        if (showAlertFlag) {
          showToast('Already in Cart', ``, 'info');
        }
        return { success: true, alreadyExists: true };
      }

      setLoading(true);
      setError(null);

      try {
        const result = await CartService.addToCart(productId, quantity);

        if (result.success) {
          setCartItems(prev => new Set([...prev, productId]));
          setCartQuantities(prev => new Map([...prev, [productId, quantity]]));

          // Normalize returned data: ensure we return a cart row that contains
          // the `products` object so UI that reads `item.products.price` won't
          // crash if the backend response doesn't include embedded products.
          const returned = Array.isArray(result.data)
            ? result.data[0]
            : result.data || {};

          const normalizedRow = {
            ...(returned || {}),
            products: returned?.products || product,
            quantity: returned?.quantity || quantity,
          };

          // Notify others about cart change with normalized payload
          EventBus.emit('cart:changed', {
            action: 'add',
            productId,
            quantity,
            data: normalizedRow,
          });

          if (showAlertFlag) {
            showToast('Added to Cart', ``, 'success');
          }

          return { success: true, data: normalizedRow };
        } else {
          setError(result.error);

          if (showAlertFlag) {
            if (result.error === 'out_of_stock') {
              showToast('Out of Stock', result.message, 'error');
            } else if (result.error === 'insufficient_stock') {
              showToast('Insufficient Stock', result.message, 'warning');
            } else {
              showToast('Error', result.error || 'Failed to add to cart', 'error');
            }
          }

          return { success: false, error: result.error };
        }
      } catch (error) {
        const errMsg = error.message || 'Failed to add to cart';
        setError(errMsg);
        if (showAlertFlag) showToast('Error', errMsg, 'error');
        return { success: false, error: errMsg };
      } finally {
        setLoading(false);
      }
    },
    [cartItems, showToast],
  );

  const removeFromCart = useCallback(
    async (product, showAlertFlag = true) => {
      if (!product?.id) {
        const err = 'Invalid product';
        setError(err);
        return { success: false, error: err };
      }

      const productName = product.name || 'Product';
      const productId = product.id;

      if (!cartItems.has(productId)) {
        if (showAlertFlag) {
          showToast('Not in Cart', `${productName} is not in your cart`, 'info');
        }
        return { success: true, notFound: true };
      }

      setLoading(true);
      setError(null);

      try {
        const result = await CartService.removeFromCart(productId);

        if (result.success) {
          setCartItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });

          setCartQuantities(prev => {
            const newMap = new Map(prev);
            newMap.delete(productId);
            return newMap;
          });

          EventBus.emit('cart:changed', { action: 'remove', productId });

          if (showAlertFlag) {
            showToast('Removed from Cart', ``, 'success');
          }

          return { success: true };
        } else {
          setError(result.error);
          if (showAlertFlag)
            showToast('Error', result.error || 'Failed to remove from cart', 'error');
          return { success: false, error: result.error };
        }
      } catch (error) {
        const errMsg = error.message || 'Failed to remove from cart';
        setError(errMsg);
        if (showAlertFlag) showToast('Error', errMsg, 'error');
        return { success: false, error: errMsg };
      } finally {
        setLoading(false);
      }
    },
    [cartItems, showToast],
  );

  const updateCartQuantity = useCallback(
    async (product, action = 'increment', showAlertFlag = true) => {
      if (!product?.id) {
        const err = 'Invalid product';
        setError(err);
        return { success: false, error: err };
      }

      const productId = product.id;
      setLoading(true);
      setError(null);

      try {
        const result = await CartService.updateCartQuantity(productId, action);

        if (result.success) {
          if (result.action === 'removed') {
            setCartItems(prev => {
              const newSet = new Set(prev);
              newSet.delete(productId);
              return newSet;
            });
            setCartQuantities(prev => {
              const newMap = new Map(prev);
              newMap.delete(productId);
              return newMap;
            });
            if (showAlertFlag)
              showToast('Removed', 'Item removed from cart', 'success');
          } else {
            setCartQuantities(prev => {
              const newMap = new Map(prev);
              newMap.set(productId, result.newQuantity);
              return newMap;
            });
            if (showAlertFlag)
              showToast('Updated', `Quantity ${result.action} to ${result.newQuantity}`, 'success');
          }

          return {
            success: true,
            data: result.data,
            newQuantity: result.newQuantity,
          };
        } else {
          setError(result.error);
          if (showAlertFlag)
            showToast('Error', result.error || 'Failed to update cart', 'error');
          return { success: false, error: result.error };
        }
      } catch (error) {
        const errMsg = error.message || 'Failed to update cart';
        setError(errMsg);
        if (showAlertFlag) showToast('Error', errMsg, 'error');
        return { success: false, error: errMsg };
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  const toggleCart = useCallback(
    async (product, quantity = 1, showAlertFlag = true) => {
      if (!product?.id) return { success: false, error: 'Invalid product' };

      const isCurrentlyInCart = cartItems.has(product.id);

      if (isCurrentlyInCart) {
        return await removeFromCart(product, showAlertFlag);
      } else {
        return await addToCart(product, showAlertFlag, quantity);
      }
    },
    [cartItems, addToCart, removeFromCart],
  );

  const getCart = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await CartService.getUserCart();

      if (result.success) {
          // Normalize rows: ensure products object is present for each row and
          // dedupe by product id
          const normalized = Array.isArray(result.data) ? result.data : [];
          const deduped = [];
          const seen = new Set();
          const quantities = new Map();

          for (const row of normalized) {
            const pid = row.products?.id;
            if (!pid) continue;
            if (seen.has(pid)) continue;
            seen.add(pid);
            const r = {
              ...row,
              products: row.products || { id: pid },
              quantity: row.quantity || 1,
            };
            deduped.push(r);
            quantities.set(pid, r.quantity);
          }

          const productIds = Array.from(seen);
          setCartItems(new Set(productIds));
          setCartQuantities(quantities);
          setCartData(deduped);

          // Broadcast the full cart to keep others in sync
          EventBus.emit('cart:changed', { action: 'sync', productIds, data: deduped, quantities });
        return { success: true, data: deduped };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errMsg = error.message || 'Failed to fetch cart';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to external cart changes so multiple hook users stay in sync
  useEffect(() => {
    const off = EventBus.on('cart:changed', payload => {
      if (!payload) return;
      if (payload.action === 'add') {
        setCartItems(prev => new Set([...prev, payload.productId]));
        if (typeof payload.quantity !== 'undefined') {
          setCartQuantities(prev => new Map([...prev, [payload.productId, payload.quantity]]));
        }
        if (payload.data) {
          setCartData(prev => {
            const exists = prev.some(item => (item.products?.id) === payload.productId);
            if (exists) return prev;
            return [payload.data, ...prev];
          });
        }
      } else if (payload.action === 'remove') {
        setCartItems(prev => {
          const next = new Set(prev);
          next.delete(payload.productId);
          return next;
        });
        setCartQuantities(prev => {
          const next = new Map(prev);
          next.delete(payload.productId);
          return next;
        });
        setCartData(prev => prev.filter(item => (item.products?.id) !== payload.productId));
      } else if (payload.action === 'sync') {
        const productIds = payload.productIds || [];
        setCartItems(new Set(productIds));
        if (Array.isArray(payload.data)) setCartData(payload.data);
        if (payload.quantities instanceof Map || typeof payload.quantities === 'object') {
          // normalize quantities to Map
          const map = new Map();
          if (payload.quantities instanceof Map) {
            for (const [k, v] of payload.quantities.entries()) map.set(k, v);
          } else if (typeof payload.quantities === 'object') {
            for (const k of Object.keys(payload.quantities)) map.set(k, payload.quantities[k]);
          }
          setCartQuantities(map);
        }
      }
    });

    return () => off();
  }, []);

  useEffect(() => {
    if (!navigation) return;
    const unsubscribe = navigation.addListener('focus', () => {
      getCart();
    });
    return unsubscribe;
  }, [navigation, getCart]);

  const getCartCount = useCallback(async () => {
    try {
      const result = await CartService.getCartCount();
      return result.success ? result.count : 0;
    } catch (error) {
      console.error('Error getting cart count:', error);
      return 0;
    }
  }, []);

  const clearCart = useCallback(() => {
    setCartItems(new Set());
    setCartQuantities(new Map());
    setError(null);
  }, []);

  const isInCart = useCallback(
    productId => {
      return cartItems.has(productId);
    },
    [cartItems],
  );

  const getQuantity = useCallback(
    productId => {
      return cartQuantities.get(productId) || 0;
    },
    [cartQuantities],
  );

  const totalQuantity = Array.from(cartQuantities.values()).reduce(
    (total, qty) => total + qty,
    0,
  );

  return {
    cartItems,
    cartQuantities,
    loading,
    error,
    cartData,

    addToCart,
    removeFromCart,
    updateCartQuantity,
    toggleCart,
    getCart,
    getCartCount,
    clearCart,
    checkCartStatus,
    setCartData,

    setCartItems,
    setCartQuantities,

    isInCart,
    getQuantity,
    cartCount: cartItems.size,
    totalQuantity,

    isEmpty: cartItems.size === 0,
  };
};
