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
import { AddressService } from '../../services/AdressService';
import { CartService } from '../../services/CartService';
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

  // NEW: Add this ref to track selectedProductIds for handleCheckout
  const selectedProductIdsRef = useRef(new Set());

  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const { cartData, setCartData, removeFromCart, updateCartQuantity, getCart } =
    useCart([], null, navigation);

  const {
    allCoupons,
    selectedCoupon,
    fetchAllCoupons,
    filterApplicableCoupons,
    selectCoupon,
    removeCoupon,
    checkUsedCoupons,
    validateCouponApplicability,
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
    couponRef.current = selectedCoupon;
  }, [selectedCoupon]);

  const selectedProductIds = useMemo(() => {
    const selected = new Set();
    cartData.forEach(item => {
      if (item.is_selected) {
        selected.add(item.products.id);
      }
    });
    return selected;
  }, [cartData]);

  useEffect(() => {
    selectedProductIdsRef.current = selectedProductIds;
  }, [selectedProductIds]);

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

  // REPLACE the old filterApplicableCoupons useEffect with this:
  useEffect(() => {
    const selectedItems = cartData.filter(i =>
      selectedProductIds.has(i.products.id),
    );

    // Re-filter coupons for selected items
    filterApplicableCoupons(selectedItems);

    // IMPORTANT: Validate the currently applied coupon with fresh logic
    if (selectedCoupon) {
      const isStillApplicable = validateCouponApplicability(
        selectedCoupon,
        selectedItems,
      );
      // If coupon became inapplicable, auto-remove it
      if (!isStillApplicable && selectedCoupon.isApplicable) {
        removeCoupon();
      }
    }
  }, [
    cartData,
    selectedProductIds,
    selectedCoupon,
    removeCoupon,
    filterApplicableCoupons,
  ]);

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
    const rows = cartData.filter(i => selectedProductIds.has(i.products.id));

    const subtotal = rows.reduce(
      (t, i) => t + Number(i.products.price) * Number(i.quantity),
      0,
    );

    // Strict category-based coupon handling (works only if product_categories exist on product objects)
    let discount = 0;
    const couponObj = selectedCoupon?.coupon || null;
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
  }, [cartData, selectedCoupon, calculateDeliveryCharge, selectedProductIds]);

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

    try {
      // Refresh cart data
      const cartResult = await getCart();
      if (!cartResult.success) {
        showAlert('Error', cartResult.error || 'Failed to load cart', 'error');
      }

      // Refresh coupons
      await fetchAllCoupons();
      if (user?.id) {
        await checkUsedCoupons(user.id);
      }

      // Refresh addresses
      if (user?.id) {
        await loadAddresses();
      }
    } catch (error) {
      console.error('Refresh error:', error);
      showAlert('Error', 'Failed to refresh data', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [
    getCart,
    fetchAllCoupons,
    checkUsedCoupons,
    loadAddresses,
    user?.id,
    showAlert,
  ]);

  const loadAddresses = async () => {
    const result = await AddressService.getAddresses(user.id);
    if (result.success) {
      setAddresses(result.data);
      const defaultAddr = result.data?.find(a => a.is_default);
      if (defaultAddr) setSelectedAddress(defaultAddr);
    } else {
      console.error('[ERROR] Load addresses:', result.error);
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

  const toggleSelectProduct = useCallback(
    async productId => {
      const currentItem = cartData.find(i => i.products.id === productId);
      if (!currentItem) return;

      const newSelectionState = !currentItem.is_selected;

      // Optimistic UI update
      setCartData(prev =>
        prev.map(item =>
          item.products.id === productId
            ? { ...item, is_selected: newSelectionState }
            : item,
        ),
      );

      // Use CartService method
      const result = await CartService.toggleCartItemSelection(
        productId,
        newSelectionState,
      );

      if (!result.success) {
        console.error('[CartScreen] Failed to sync selection:', result.error);
        // Revert on error
        setCartData(prev =>
          prev.map(item =>
            item.products.id === productId
              ? { ...item, is_selected: !newSelectionState }
              : item,
          ),
        );
      }
    },
    [cartData],
  );

  const isProductSelected = useCallback(
    productId => selectedProductIds.has(productId),
    [selectedProductIds],
  );
  const placeOrderConfirmed = async (selectedIds = null) => {
    setPlacingOrder(true);

    try {
      // Get selected cart rows from current cartData state
      const selectedCartRows = cartData.filter(
        item => !selectedIds || selectedIds.includes(item.products.id),
      );

      if (selectedCartRows.length === 0) {
        showAlert('Error', 'No items selected for order', 'error');
        setPlacingOrder(false);
        return;
      }

      // Build payload with cart row IDs for deletion
      const result = await OrderService.createOrder(selectedCartRows, {
        coupon: selectedCoupon?.coupon || null,
        discount: Number(summaryData.discount),
        delivery_address_id: selectedAddress?.id,
        delivery_charge: Number(summaryData.deliveryFee),
        totalAmount: Number(summaryData.total),
        selectedItems: selectedCartRows.map(r => r.id), // cart row IDs
      });

      if (result.success) {
        // Update local state
        const productIdsToRemove = selectedCartRows.map(i => i.products.id);
        setCartData(prev =>
          prev.filter(i => !productIdsToRemove.includes(i.products.id)),
        );

        // Refresh from DB
        await getCart();

        // Clear coupon
        removeCoupon && removeCoupon();
        if (user?.id) checkUsedCoupons && checkUsedCoupons(user.id);

        showToast('Order placed successfully!', '', 'success');
      } else {
        showAlert('Error', result.error || 'Failed to place order', 'error');
      }
    } catch (err) {
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

    // CHANGED: Use ref here too
    if (selectedProductIdsRef.current.size === 0) {
      showAlert(
        'Error',
        'Please select at least one item to checkout',
        'error',
      );
      return;
    }

    // CHANGED: Use ref in filter
    const rowsToCheckout = cartData.filter(i =>
      selectedProductIdsRef.current.has(i.products.id),
    );

    if (!rowsToCheckout || rowsToCheckout.length === 0) {
      showAlert('Error', 'No items available for checkout', 'error');
      return;
    }

    const stockValidation = await OrderService.validateStock(rowsToCheckout);

    if (!stockValidation.success) {
      showAlert('Stock Issues Detected', stockValidation.message, 'error');
      return;
    }

    showConfirm(
      'Confirm Order',
      `Delivering to: ${selectedAddress.label}\nItems: ${rowsToCheckout.length}`,
      async () => {
        const selectedIds = rowsToCheckout.map(r => r.products.id);
        await placeOrderConfirmed(selectedIds);
      },
      { confirmText: 'Place Order', cancelText: 'Cancel' },
    );
  };

  const renderCartItem = ({ item }) => {
    const productImage = getProductPrimaryImage(item.products);
    const selected = isProductSelected(item.products.id);

    return (
      <View style={styles.cartItem}>
        {/* Checkbox on the left */}
        <TouchableOpacity
          onPress={() => toggleSelectProduct(item.products.id)}
          activeOpacity={0.7}
          style={styles.checkboxWrapper}
        >
          <Ionicons
            name={selected ? 'checkbox' : 'square-outline'}
            size={24}
            color={selected ? '#4fc3f7' : '#8a9fb5'}
          />
        </TouchableOpacity>

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
      </View>
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
            cartData.length > 0 && { paddingBottom: 420 },
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
            {/* SINGLE COLLAPSIBLE TOGGLE - BOTH ADDRESS & COUPON */}
            <TouchableOpacity
              style={styles.collapsibleToggle}
              onPress={() => setDetailsExpanded(!detailsExpanded)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={detailsExpanded ? 'chevron-down' : 'chevron-up'}
                size={24}
                color="#4fc3f7"
              />
            </TouchableOpacity>

            {detailsExpanded && (
              <>
                {/* ADDRESS SELECTION SECTION */}
                <View style={styles.addressSelectionSection}>
                  <View style={styles.addressSectionHeader}>
                    <Text style={styles.addressSectionTitle}>
                      Delivery Address
                    </Text>
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
                      <View>
                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color="#4fc3f7"
                        />
                      </View>
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

                {/* COUPON SECTION */}
                <View style={styles.couponSection}>
                  <View style={styles.couponHeader}>
                    <Text style={styles.couponLabel}>Apply Coupon</Text>
                    {maxSavings > 0 && (
                      <View style={styles.savingsBadge}>
                        <Ionicons name="pricetag" size={12} color="#4fc3f7" />
                        <Text style={styles.savingsText}>
                          Save up to {maxSavings}
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
                            Save {Number(summaryData.discount).toFixed(2)}
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
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#8a9fb5"
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}

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
              disabled={
                selectedProductIds.size === 0 ||
                cartData.some(
                  i =>
                    selectedProductIds.has(i.products.id) &&
                    i.products.quantity <= 0,
                )
              }
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
    alignItems: 'center',
  },
  checkboxWrapper: {
    marginRight: 12,
    padding: 4,
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
    paddingTop: 10,
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
  modalAddressCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalAddressCardText: {
    fontSize: 12,
    color: '#8a9fb5',
    marginBottom: 4,
  },
  collapsibleToggle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
