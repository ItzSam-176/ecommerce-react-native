import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  ScrollView,
  Image,
  Keyboard,
  Modal,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import SwipeToCheckout from '../../components/customer/SwipeToCheckout';
import { OrderService } from '../../services/OrderService';
import { useCart } from '../../hooks/useCart';
import { useAlert } from '../../components/informative/AlertProvider';
import { useToastify } from '../../hooks/useToastify';
import formatCurrency from '../../utils/formatCurrency';
import ShimmerProductsCard from '../../components/shimmer/ShimmerProductsCard';
import { getProductPrimaryImage } from '../../utils/productImageHelper';
import Loader from '../../components/shared/Loader';
import { useCoupon } from '../../hooks/useCoupon';
import CouponBottomSheet from '../../components/customer/CouponBottomSheet';
import { useAuth } from '../../navigation/AuthProvider';
import { supabase } from '../../supabase/supabase';
import { useDeliveryCharge } from '../../hooks/useDeliveryCharge';

export default function CartScreen({ navigation, route }) {
  const { showAlert, showConfirm } = useAlert();
  const { showToast } = useToastify();
  const { user } = useAuth();

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingItems, setLoadingItems] = useState(new Set());
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const [couponSheetVisible, setCouponSheetVisible] = useState(false);
  const couponRef = useRef(null);

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);

  // selectMode is driven by header via route.params.selectMode
  const [selectMode, setSelectMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());

  const toggleSelectMode = useCallback(() => {
    setSelectMode(prev => !prev);
  }, []);

  const { cartData, setCartData, removeFromCart, updateCartQuantity, getCart } =
    useCart([], null, navigation);

  const {
    allCoupons,
    selectedCoupon,
    couponDiscount,
    loading: couponLoading,
    fetchAllCoupons,
    filterApplicableCoupons,
    selectCoupon,
    removeCoupon,
    calculateTotal,
    checkUsedCoupons,
  } = useCoupon();

  const { calculateDeliveryCharge, getFreeShippingThreshold } =
    useDeliveryCharge();

  useEffect(() => {
    if (user?.id && checkUsedCoupons) {
      checkUsedCoupons(user.id);
    }
  }, [user?.id, checkUsedCoupons]);

  useEffect(() => {
    if (user?.id) {
      loadAddresses();
    }
  }, [user?.id]);

  useEffect(() => {
    const routeSelectMode = Boolean(route?.params?.selectMode);
    setSelectMode(routeSelectMode);

    if (routeSelectMode) {
      setSelectedProductIds(new Set(cartData.map(i => i.products.id)));
    } else {
      setSelectedProductIds(new Set());
    }
  }, [route?.params?.selectMode, cartData]);

  useEffect(() => {
    couponRef.current = selectedCoupon;
  }, [selectedCoupon]);

  // Sync selectMode with route params (header will toggle route.params.selectMode)
  useEffect(() => {
    const routeSelectMode = Boolean(route?.params?.selectMode);
    setSelectMode(routeSelectMode);

    if (routeSelectMode) {
      // preselect all product ids when entering select mode
      setSelectedProductIds(new Set(cartData.map(i => i.products.id)));
    } else {
      // clear selection when leaving select mode
      setSelectedProductIds(new Set());
    }
  }, [route?.params?.selectMode, cartData]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      if (initialLoading) {
        (async () => {
          const res = await getCart();
          if (!res.success) {
            showAlert('Error', res.error || 'Failed to load cart', 'error');
          }
          if (mounted) setInitialLoading(false);
        })();
      }
      return () => {
        mounted = false;
      };
    }, [initialLoading, getCart]),
  );

  useEffect(() => {
    fetchAllCoupons();
  }, [fetchAllCoupons]);

  useEffect(() => {
    filterApplicableCoupons(cartData);
  }, [cartData, filterApplicableCoupons]);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const keyboardDidHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  // SUMMARY: compute totals either for whole cart or for selected subset.
  // Coupon is applied in a strict category-based way: the coupon's category must appear
  // in the chosen rows for the discount to apply.
  const summaryData = useMemo(() => {
    const rows =
      selectMode && selectedProductIds.size > 0
        ? cartData.filter(i => selectedProductIds.has(i.products.id))
        : cartData;

    const subtotal = rows.reduce(
      (t, i) => t + Number(i.products.price) * Number(i.quantity),
      0,
    );

    // Strict category-based coupon handling (works only if product_categories exist on product objects)
    let discount = 0;
    const couponObj = couponRef.current?.coupon || null;
    if (couponObj && couponObj.discount_amount) {
      const couponCategoryId = couponObj.category_id;
      if (!couponCategoryId) {
        // global coupon fallback
        discount = Number(couponObj.discount_amount) || 0;
      } else {
        // check if any of the rows contains the coupon category
        const matches = rows.some(
          row =>
            Array.isArray(row.products.product_categories) &&
            row.products.product_categories.some(
              pc => pc.category_id === couponCategoryId,
            ),
        );
        if (matches) discount = Number(couponObj.discount_amount) || 0;
        else discount = 0;
      }
    }

    // If product_categories are missing on products in cartData, we treat that as no-match (strict)
    const amountForDelivery = Math.max(0, subtotal - discount);
    const deliveryFee = calculateDeliveryCharge(amountForDelivery);
    const total = amountForDelivery + deliveryFee;

    return {
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      amountForDelivery: amountForDelivery.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      total: total.toFixed(2),
    };
  }, [
    cartData,
    couponDiscount,
    calculateDeliveryCharge,
    selectMode,
    selectedProductIds,
  ]);

  const freeShippingRemaining = summaryData?.amountForDelivery
    ? getFreeShippingThreshold(parseFloat(summaryData.amountForDelivery))
    : null;

  const maxSavings = useMemo(() => {
    const applicableCoupon = allCoupons.find(
      c => c.isApplicable && c.coupon?.discount_amount > 0,
    );
    return applicableCoupon?.coupon?.discount_amount || 0;
  }, [allCoupons]);

  const applicableCouponsCount = useMemo(
    () => allCoupons.filter(c => c.isApplicable).length,
    [allCoupons],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const res = await getCart();
    if (!res.success) {
      showAlert('Error', res.error || 'Failed to load cart', 'error');
    }
    setRefreshing(false);
  }, [getCart]);

  const loadAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);

      const defaultAddr = data?.find(a => a.is_default);
      if (defaultAddr) setSelectedAddress(defaultAddr);
    } catch (error) {
      console.error('[ERROR] Load addresses:', error);
    }
  };

  const handleIncrement = async item => {
    const originalQuantity = item.quantity;
    const newQuantity = originalQuantity + 1;

    setCartData(prev =>
      prev.map(c => (c.id === item.id ? { ...c, quantity: newQuantity } : c)),
    );
    setLoadingItems(prev => new Set(prev).add(item.id));

    try {
      const result = await updateCartQuantity(
        item.products,
        'increment',
        false,
      );
      if (
        result.success &&
        result.newQuantity &&
        result.newQuantity !== newQuantity
      ) {
        setCartData(prev =>
          prev.map(c =>
            c.id === item.id ? { ...c, quantity: result.newQuantity } : c,
          ),
        );
      } else if (!result.success) {
        setCartData(prev =>
          prev.map(c =>
            c.id === item.id ? { ...c, quantity: originalQuantity } : c,
          ),
        );
        showAlert(
          'Error',
          result.error || 'Failed to update quantity',
          'error',
        );
      }
    } catch {
      setCartData(prev =>
        prev.map(c =>
          c.id === item.id ? { ...c, quantity: originalQuantity } : c,
        ),
      );
      showAlert('Error', 'Failed to update quantity', 'error');
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleDecrement = async item => {
    const originalQuantity = item.quantity;
    const newQuantity = Math.max(1, originalQuantity - 1);
    if (originalQuantity <= 1) return handleRemoveFromCart(item);

    setCartData(prev =>
      prev.map(c => (c.id === item.id ? { ...c, quantity: newQuantity } : c)),
    );
    setLoadingItems(prev => new Set(prev).add(item.id));

    try {
      const result = await updateCartQuantity(
        item.products,
        'decrement',
        false,
      );
      if (result.success) {
        if (result.newQuantity === undefined) {
          setCartData(prev => prev.filter(c => c.id !== item.id));
          showToast('Item removed from cart', '', 'success');
        } else if (result.newQuantity !== newQuantity) {
          setCartData(prev =>
            prev.map(c =>
              c.id === item.id ? { ...c, quantity: result.newQuantity } : c,
            ),
          );
        }
      } else {
        setCartData(prev =>
          prev.map(c =>
            c.id === item.id ? { ...c, quantity: originalQuantity } : c,
          ),
        );
        showAlert(
          'Error',
          result.error || 'Failed to update quantity',
          'error',
        );
      }
    } catch {
      setCartData(prev =>
        prev.map(c =>
          c.id === item.id ? { ...c, quantity: originalQuantity } : c,
        ),
      );
      showAlert('Error', 'Failed to update quantity', 'error');
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleRemoveFromCart = async item => {
    showConfirm(
      'Remove Item',
      `Remove ${item.products.name} from cart?`,
      async () => {
        const result = await removeFromCart(item.products, false);
        if (result.success) {
          setCartData(prev => prev.filter(c => c.id !== item.id));
          showToast('Item removed from cart', '', 'success');
        } else {
          showAlert('Error', result.error || 'Failed to remove item', 'error');
        }
      },
      { confirmText: 'Remove', destructive: true },
    );
  };

  const toggleSelectProduct = useCallback(productId => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, []);

  const isProductSelected = useCallback(
    productId => selectedProductIds.has(productId),
    [selectedProductIds],
  );

  // place order (accepts array of product ids to checkout)
  // Replace your placeOrderConfirmed with this exact function
  const placeOrderConfirmed = async (selectedIds = null) => {
    setPlacingOrder(true);

    try {
      // Auth check
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;
      if (!currentUser?.id) {
        showAlert(
          'Error',
          'Authentication required. Please login again.',
          'error',
        );
        setPlacingOrder(false);
        return;
      }

      // 1) Fetch the user's cart rows from DB (fresh)
      const { data: cartRows, error: cartErr } = await supabase
        .from('cart')
        .select('id, quantity, product_id')
        .eq('customer_id', currentUser.id);

      if (cartErr) {
        showAlert(
          'Error',
          `Failed to fetch cart data: ${cartErr.message}`,
          'error',
        );
        setPlacingOrder(false);
        return;
      }

      if (!cartRows || cartRows.length === 0) {
        showAlert('Error', 'Your cart is empty', 'error');
        setPlacingOrder(false);
        return;
      }

      // 2) Determine which cart rows to process (selected subset or full)
      const filteredCartRows =
        Array.isArray(selectedIds) && selectedIds.length > 0
          ? cartRows.filter(r => selectedIds.includes(r.product_id))
          : cartRows;

      if (filteredCartRows.length === 0) {
        showAlert('Error', 'No selected items found in cart', 'error');
        setPlacingOrder(false);
        return;
      }

      // 3) Fetch product data and product_categories for those product_ids
      const productIds = filteredCartRows.map(r => r.product_id);

      const { data: products, error: prodErr } = await supabase
        .from('products')
        .select('id, name, price, quantity')
        .in('id', productIds);

      if (prodErr) {
        showAlert(
          'Error',
          `Failed to fetch product data: ${prodErr.message}`,
          'error',
        );
        setPlacingOrder(false);
        return;
      }

      const { data: categories, error: catErr } = await supabase
        .from('product_categories')
        .select('product_id, category_id')
        .in('product_id', productIds);

      if (catErr) {
        showAlert(
          'Error',
          `Failed to fetch product categories: ${catErr.message}`,
          'error',
        );
        setPlacingOrder(false);
        return;
      }

      // 4) Build maps
      const categoryMap = new Map();
      categories?.forEach(c => {
        if (!categoryMap.has(c.product_id)) categoryMap.set(c.product_id, []);
        categoryMap.get(c.product_id).push({ category_id: c.category_id });
      });

      const productMap = new Map();
      products?.forEach(p => {
        productMap.set(p.id, {
          id: p.id,
          name: p.name,
          price: Number(p.price) || 0,
          quantity: Number(p.quantity) || 0,
          product_categories: categoryMap.get(p.id) || [],
        });
      });

      // 5) Build latestCart (only selected rows), and compute an itemized payload
      const latestCart = filteredCartRows.map(row => {
        const product = productMap.get(row.product_id);
        if (!product) {
          throw new Error(`Product not found for cart row: ${row.id}`);
        }
        return {
          cart_row_id: row.id, // DB cart row id (useful for deletion)
          product_id: product.id,
          quantity: Number(row.quantity),
          unit_price: Number(product.price),
          product_name: product.name,
          product_categories: product.product_categories,
          item_subtotal: Number(product.price) * Number(row.quantity),
        };
      });

      // 6) Re-validate stock on server-side (important)
      const stockValidation = await OrderService.validateStock(latestCart);
      if (!stockValidation.success) {
        showAlert('Stock Issues Detected', stockValidation.message, 'error');
        setPlacingOrder(false);
        return;
      }

      // 7) Coupon logic (strict category-based - same as UI summary)
      const couponObj = couponRef.current?.coupon || null;
      let discountAmount = 0;
      if (couponObj && couponObj.discount_amount) {
        const couponCategoryId = couponObj.category_id;
        if (!couponCategoryId) {
          discountAmount = Number(couponObj.discount_amount) || 0;
        } else {
          const matches = latestCart.some(item =>
            (item.product_categories || []).some(
              pc => pc.category_id === couponCategoryId,
            ),
          );
          discountAmount = matches ? Number(couponObj.discount_amount) || 0 : 0;
        }
      }

      // 8) Compute totals from latestCart (selected items only)
      const subtotal = latestCart.reduce((s, it) => s + it.item_subtotal, 0);
      // If you have per-item discounts, compute them here instead of a flat coupon_amount
      const amountAfterDiscount = Math.max(0, subtotal - discountAmount);
      const deliveryCharge = calculateDeliveryCharge(amountAfterDiscount);
      const totalAmount = Number(
        (amountAfterDiscount + deliveryCharge).toFixed(2),
      );

      // 9) Build robust payload to send to OrderService (send line items and totals and product ids to remove)
      const lineItemsForServer = latestCart.map(it => ({
        products: {
          id: it.product_id,
          name: it.product_name,
          price: it.unit_price,
          product_categories: it.product_categories,
        },
        quantity: it.quantity,
      }));

      // IMPORTANT: pass cart_row_ids or product_ids so backend knows which cart rows to delete
      const productIdsToRemove = latestCart.map(it => it.product_id);
      const cartRowIdsToRemove = latestCart.map(it => it.cart_row_id);

      const createOrderPayload = {
        line_items: lineItemsForServer,
        subtotal,
        discount: discountAmount,
        delivery_charge: deliveryCharge,
        total_amount: totalAmount,
        coupon_id: couponObj?.id || null,
        delivery_address_id: selectedAddress?.id || null,
        meta: {
          created_by_client_at: new Date().toISOString(),
        },
        // explicit: tell backend which cart rows to delete/mark-ordered
        cart_row_ids: cartRowIdsToRemove,
        product_ids: productIdsToRemove,
      };

      // 10) Call OrderService.createOrder with exact totals and the cart rows to remove
      const result = await OrderService.createOrder(
        lineItemsForServer,
        createOrderPayload,
      );

      // 11) On success: record coupon usage, remove only selected cart rows (DB + local)
      if (result.success) {
        await recordCouponUsageFromOrder(result.orderId);

        // 11a) Attempt to remove only the checked cart rows from DB (safety)
        try {
          // Use cart_row_ids when available — safer
          if (cartRowIdsToRemove && cartRowIdsToRemove.length > 0) {
            const { error: delErr } = await supabase
              .from('cart')
              .delete()
              .in('id', cartRowIdsToRemove)
              .eq('customer_id', currentUser.id);

            if (delErr) {
              console.warn(
                '[Cart deletion warning] failed to delete selected cart rows:',
                delErr,
              );
              // Don't throw — we still update local state below
            }
          } else if (productIdsToRemove && productIdsToRemove.length > 0) {
            const { error: delErr } = await supabase
              .from('cart')
              .delete()
              .in('product_id', productIdsToRemove)
              .eq('customer_id', currentUser.id);

            if (delErr) {
              console.warn(
                '[Cart deletion warning] failed to delete selected product cart rows:',
                delErr,
              );
            }
          }
        } catch (err) {
          console.error('[Cart deletion exception]', err);
        }

        // 11b) Update local cart state to remove only the selected products
        setCartData(prev =>
          prev.filter(i => !productIdsToRemove.includes(i.products.id)),
        );

        // 11c) Refresh backend cart snapshot
        await getCart();

        // 11d) Clear coupon selection + update used coupons
        removeCoupon && removeCoupon();
        if (user?.id) checkUsedCoupons && checkUsedCoupons(user.id);

        showToast('Order placed successfully!', '', 'success');
      } else {
        console.error('[placeOrderConfirmed] createOrder failed', result);
        showAlert('Error', result.error || 'Failed to place order', 'error');
      }
    } catch (err) {
      console.error('[placeOrderConfirmed] exception', err);
      showAlert('Error', err.message || 'Failed to place order', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      showAlert('Error', 'Please select a delivery address', 'error');
      return;
    }

    const rowsToCheckout =
      selectMode && selectedProductIds.size > 0
        ? cartData.filter(i => selectedProductIds.has(i.products.id))
        : cartData;

    if (!rowsToCheckout || rowsToCheckout.length === 0) {
      showAlert('Error', 'No items selected for checkout', 'error');
      return;
    }

    const stockValidation = await OrderService.validateStock(rowsToCheckout);
    if (!stockValidation.success) {
      showAlert('Stock Issues Detected', stockValidation.message, 'error');
      return;
    }

    showConfirm(
      'Confirm Order',
      `Delivering to: ${selectedAddress.label}`,
      async () => {
        const selectedIds = rowsToCheckout.map(r => r.products.id);
        await placeOrderConfirmed(selectedIds);
      },
      {
        confirmText: 'Place Order',
        cancelText: 'Cancel',
      },
    );
  };

  const recordCouponUsageFromOrder = async orderId => {
    try {
      if (!orderId) return;
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('coupon_id')
        .eq('id', orderId)
        .single();

      if (orderError || !orderData?.coupon_id) return;

      const { error } = await supabase.from('coupon_usage').insert([
        {
          coupon_id: orderData.coupon_id,
          customer_id: user.id,
          order_id: orderId,
          used_at: new Date().toISOString(),
        },
      ]);

      if (error) console.error('[Coupon usage recording error]:', error);
    } catch (err) {
      console.error('[Coupon usage recording exception]:', err);
    }
  };

  const renderCartItem = ({ item }) => {
    const productImage = getProductPrimaryImage(item.products);
    const selected = isProductSelected(item.products.id);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (selectMode) toggleSelectProduct(item.products.id);
        }}
        style={[
          styles.cartItem,
          selectMode && selected && { borderColor: '#4fc3f7', borderWidth: 2 },
        ]}
      >
        {selectMode && (
          <TouchableOpacity
            onPress={() => toggleSelectProduct(item.products.id)}
            activeOpacity={0.7}
            style={styles.checkboxWrapper}
          >
            <Ionicons
              name={selected ? 'checkbox-outline' : 'square-outline'}
              size={24}
              color={selected ? '#4fc3f7' : '#8a9fb5'}
            />
          </TouchableOpacity>
        )}

        <View style={styles.productImageContainer}>
          {productImage ? (
            <Image
              source={{ uri: productImage }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={40} color="#666" />
            </View>
          )}
        </View>

        <View style={styles.productDetails}>
          <View style={styles.productHeader}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.products.name}
            </Text>

            {item.products.quantity <= 0 && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
              </View>
            )}

            {item.products.quantity > 0 &&
              item.products.quantity < item.quantity && (
                <View style={styles.stockWarningBadge}>
                  <Ionicons name="warning" size={12} color="#ff9800" />
                  <Text style={styles.stockWarningText}>
                    Only {item.products.quantity} left
                  </Text>
                </View>
              )}
          </View>

          <View style={styles.priceQuantityRow}>
            <Text style={styles.productPrice}>
              {formatCurrency(Number(item.products.price).toFixed(2))}
            </Text>

            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={() => handleIncrement(item)}
                disabled={
                  loadingItems.has(item.id) ||
                  item.quantity >= (item.products?.quantity ?? 0)
                }
                style={styles.quantityButtonWrapper}
              >
                <LinearGradient
                  colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
                  style={styles.quantityButton}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.quantityText}>{item.quantity}</Text>

              <TouchableOpacity
                onPress={() => handleDecrement(item)}
                disabled={loadingItems.has(item.id)}
                style={styles.quantityButtonWrapper}
              >
                <LinearGradient
                  colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
                  style={styles.quantityButton}
                >
                  <Ionicons name="remove" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={80} color="#4fc3f7" />
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>Add some products to get started</Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('HomeStack', { screen: 'Home' })}
      >
        <LinearGradient
          colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
          style={styles.shopButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.shopButtonText}>Start Shopping</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={require('../../assets/gradient-bg.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.listContainer}>
            <ShimmerProductsCard count={5} variant="cart" />
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/gradient-bg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <StatusBar barStyle="light-content" backgroundColor="#353F54" />
        {/* header handles checkbox/select toggle — no header UI here */}

        <FlatList
          data={cartData}
          renderItem={renderCartItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={[
            styles.listContainer,
            cartData.length === 0 && styles.emptyListContainer,
            cartData.length > 0 && { paddingBottom: 520 },
          ]}
          ListEmptyComponent={renderEmptyCart}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!keyboardVisible}
        />

        {cartData.length > 0 && (
          <ScrollView
            style={styles.bottomSection}
            scrollEnabled={false}
            nestedScrollEnabled={true}
          >
            <View style={styles.addressSelectionSection}>
              <View style={styles.addressSectionHeader}>
                <Text style={styles.addressSectionTitle}>Delivery Address</Text>
              </View>

              {selectedAddress ? (
                <TouchableOpacity
                  style={styles.selectedAddressCompact}
                  onPress={() => setShowAddressModal(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.selectedAddressCompactContent}>
                    <View>
                      <Text style={styles.selectedAddressLabel}>
                        {selectedAddress.label}
                      </Text>
                      <Text
                        style={styles.selectedAddressText}
                        numberOfLines={1}
                      >
                        {selectedAddress.address}
                      </Text>
                      <Text
                        style={styles.selectedAddressText}
                        numberOfLines={1}
                      >
                        {selectedAddress.city}, {selectedAddress.zip_code}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#4fc3f7" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.addAddressPrompt}
                  onPress={() =>
                    navigation.navigate('SettingStack', {
                      screen: 'UserDetailsScreen',
                    })
                  }
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color="#4fc3f7"
                  />
                  <Text style={styles.addAddressPromptText}>
                    Add a delivery address
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Modal
              visible={showAddressModal}
              transparent
              animationType="slide"
              onRequestClose={() => setShowAddressModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      Select Delivery Address
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowAddressModal(false)}
                    >
                      <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={addresses}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.modalAddressCard,
                          selectedAddress?.id === item.id &&
                            styles.modalAddressCardSelected,
                        ]}
                        onPress={() => {
                          setSelectedAddress(item);
                          setShowAddressModal(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.modalAddressCardHeader}>
                          <View style={styles.radioButton}>
                            {selectedAddress?.id === item.id && (
                              <View style={styles.radioButtonSelected} />
                            )}
                          </View>
                          <View style={styles.modalAddressCardTitleContainer}>
                            <Text style={styles.modalAddressCardLabel}>
                              {item.label}
                            </Text>
                            {item.is_default && (
                              <View style={styles.defaultBadge}>
                                <Text style={styles.defaultBadgeText}>
                                  Default
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Text style={styles.modalAddressCardText}>
                          {item.address}
                        </Text>
                        <Text style={styles.modalAddressCardText}>
                          {item.city}, {item.zip_code}, {item.country}
                        </Text>
                      </TouchableOpacity>
                    )}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                  />

                  <TouchableOpacity
                    style={styles.addNewAddressButton}
                    onPress={() => {
                      setShowAddressModal(false);
                      navigation.navigate('SettingStack', {
                        screen: 'UserDetailsScreen',
                      });
                    }}
                  >
                    <Ionicons name="add" size={20} color="#4fc3f7" />
                    <Text style={styles.addNewAddressButtonText}>
                      Add New Address
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <View style={styles.couponSection}>
              <View style={styles.couponHeader}>
                <Text style={styles.couponLabel}>Apply Coupon</Text>
                {maxSavings > 0 && (
                  <View style={styles.savingsBadge}>
                    <Ionicons name="pricetag" size={12} color="#4fc3f7" />
                    <Text style={styles.savingsText}>
                      Save up to ₹{maxSavings}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setCouponSheetVisible(true)}
                style={styles.couponSelector}
                activeOpacity={0.7}
              >
                {selectedCoupon ? (
                  <View style={styles.selectedCouponPreview}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#4fc3f7"
                    />
                    <View style={styles.selectedCouponTextContainer}>
                      <Text style={styles.selectedCouponCode}>
                        {selectedCoupon.coupon.code}
                      </Text>
                      <Text style={styles.selectedCouponSavings}>
                        Save ₹{Number(summaryData.discount).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.couponPlaceholderContainer}>
                    <Ionicons
                      name="pricetag-outline"
                      size={18}
                      color="#8a9fb5"
                    />
                    <Text style={styles.couponPlaceholder}>
                      {applicableCouponsCount > 0
                        ? `${applicableCouponsCount} coupon${
                            applicableCouponsCount > 1 ? 's' : ''
                          } available`
                        : 'No coupons available'}
                    </Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#8a9fb5" />
              </TouchableOpacity>
            </View>

            {Number(summaryData.deliveryFee) === 0 ? (
              <View style={styles.freeShippingBanner}>
                <Text style={styles.freeShippingText}>
                  Your bag qualifies for free shipping
                </Text>
              </View>
            ) : freeShippingRemaining ? (
              <View style={styles.freeShippingBanner}>
                <Text style={styles.freeShippingText}>
                  Add ₹
                  {freeShippingRemaining.toFixed(0) == 0
                    ? 1
                    : freeShippingRemaining.toFixed(0)}{' '}
                  more to get free shipping
                </Text>
              </View>
            ) : null}

            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>₹{summaryData.subtotal}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee:</Text>
                <Text style={styles.summaryValue}>
                  ₹{summaryData.deliveryFee}
                </Text>
              </View>

              {Number(summaryData.discount) > 0 && (
                <View style={[styles.summaryRow, styles.discountRow]}>
                  <Text style={styles.summaryLabel}>Coupon Discount:</Text>
                  <Text style={styles.discountValue}>
                    -₹{Number(summaryData.discount).toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>₹{summaryData.total}</Text>
              </View>
            </View>

            <SwipeToCheckout
              onSwipeSuccess={handleCheckout}
              disabled={cartData.some(i => i.products.quantity <= 0)}
              isProcessing={placingOrder}
            />
          </ScrollView>
        )}
      </ImageBackground>

      <CouponBottomSheet
        isVisible={couponSheetVisible}
        onClose={() => setCouponSheetVisible(false)}
        allCoupons={allCoupons}
        selectedCoupon={selectedCoupon}
        onCouponSelect={selectCoupon}
        onCouponRemove={removeCoupon}
      />

      <Loader visible={placingOrder} size={120} speed={1} />
    </View>
  );
}

// STYLES — unchanged from your file
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#353F54',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    minHeight: 500,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 24,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 12,
  },
  shopButton: {
    marginTop: 32,
  },
  shopButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(42, 56, 71, 0.8)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.2)',
  },
  checkboxWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(42, 56, 71, 0.5)',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  productHeader: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  outOfStockBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.4)',
  },
  outOfStockText: {
    color: '#ff6b6b',
    fontSize: 10,
    fontWeight: '700',
  },
  stockWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.4)',
  },
  stockWarningText: {
    color: '#ff9800',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  priceQuantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4fc3f7',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  quantityButtonWrapper: {
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    minWidth: 30,
    textAlign: 'center',
  },
  bottomSection: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    backgroundColor: '#353F54',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    borderTopWidth: 2,
    borderTopColor: 'rgba(79, 195, 247, 0.2)',
  },
  couponSection: {
    marginBottom: 16,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  couponLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4fc3f7',
  },
  couponSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(42, 56, 71, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
    marginBottom: 8,
  },
  selectedCouponPreview: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedCouponTextContainer: {
    flex: 1,
  },
  selectedCouponCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4fc3f7',
  },
  selectedCouponSavings: {
    fontSize: 12,
    color: '#8a9fb5',
    marginTop: 2,
  },
  couponPlaceholderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponPlaceholder: {
    fontSize: 14,
    color: '#8a9fb5',
  },
  removeCouponButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 68, 88, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 88, 0.3)',
  },
  removeCouponButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff4458',
  },
  freeShippingBanner: {
    backgroundColor: 'rgba(79, 195, 247, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
  },
  freeShippingText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
  summarySection: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#ccc',
  },
  summaryValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  discountRow: {
    marginTop: 4,
  },
  discountValue: {
    fontSize: 16,
    color: '#4fc3f7',
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(79, 195, 247, 0.2)',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4fc3f7',
  },
  addressSelectionSection: {
    marginBottom: 20,
  },
  addressSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4fc3f7',
  },
  changeAddressLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4fc3f7',
  },
  addressesContainer: {
    gap: 12,
  },
  addressCard: {
    backgroundColor: '#2a3847',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.2)',
    padding: 12,
  },
  addressCardSelected: {
    borderColor: '#4fc3f7',
    borderWidth: 2,
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4fc3f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4fc3f7',
  },
  addressCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: '#4fc3f7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  addressCardText: {
    fontSize: 12,
    color: '#8a9fb5',
    marginBottom: 4,
  },
  addAddressPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
    paddingVertical: 16,
  },
  addAddressPromptText: {
    fontSize: 14,
    color: '#4fc3f7',
    fontWeight: '600',
  },
  addressSelectionSection: {
    marginBottom: 16,
  },
  addressSectionHeader: {
    marginBottom: 12,
  },
  addressSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4fc3f7',
  },
  selectedAddressCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a3847',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
    padding: 12,
  },
  selectedAddressCompactContent: {
    flex: 1,
  },
  selectedAddressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4fc3f7',
    marginBottom: 4,
  },
  selectedAddressText: {
    fontSize: 12,
    color: '#8a9fb5',
  },
  addAddressPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
    paddingVertical: 14,
  },
  addAddressPromptText: {
    fontSize: 14,
    color: '#4fc3f7',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#353F54',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  modalAddressCard: {
    backgroundColor: '#2a3847',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.2)',
    padding: 12,
    marginBottom: 12,
  },
  modalAddressCardSelected: {
    borderColor: '#4fc3f7',
    borderWidth: 2,
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
  },
  modalAddressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  modalAddressCardTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addNewAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(79, 195, 247, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
    paddingVertical: 14,
    marginTop: 8,
  },
  addNewAddressButtonText: {
    fontSize: 14,
    color: '#4fc3f7',
    fontWeight: '600',
  },
});
