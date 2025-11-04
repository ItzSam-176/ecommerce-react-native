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
export default function CartScreen({ navigation }) {
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

  const { cartData, setCartData, removeFromCart, updateCartQuantity, getCart } =
    useCart([], null, navigation);

  // ✅ Use coupon hook
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

  useEffect(() => {
    if (user?.id) {
      checkUsedCoupons(user.id);
    }
  }, [user?.id, checkUsedCoupons]);

  useEffect(() => {
    if (user?.id) {
      loadAddresses();
    }
  }, [user?.id]);

  useEffect(() => {
    console.log('Selected Coupon Updated:', selectedCoupon);
    couponRef.current = selectedCoupon;
  }, [selectedCoupon]);

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

  // ✅ Fetch coupons on mount
  useEffect(() => {
    fetchAllCoupons();
  }, [fetchAllCoupons]);

  // ✅ Filter applicable when cart changes
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

  const summaryData = useMemo(() => {
    const subtotal = cartData.reduce(
      (t, i) => t + i.products.price * i.quantity,
      0,
    );
    const total = calculateTotal(subtotal);

    return {
      subtotal: subtotal.toFixed(2),
      discount: couponDiscount.toFixed(2),
      total: total.toFixed(2),
    };
  }, [cartData, couponDiscount, calculateTotal]);

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

      // Auto-select default address
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
  // Update handleCheckout to require address
  const handleCheckout = async () => {
    if (!selectedAddress) {
      showAlert('Error', 'Please select a delivery address', 'error');
      return;
    }

    console.log('Coupon from Ref:', couponRef.current);
    const couponToUse = couponRef.current;
    const discountAmount = couponToUse?.coupon.discount_amount || 0;

    const cartSubtotal = cartData.reduce(
      (t, i) => t + i.products.price * i.quantity,
      0,
    );
    const finalTotal = Math.max(0, cartSubtotal - discountAmount);
    const formattedTotal = formatCurrency(finalTotal.toFixed(2));

    if (cartData.length === 0) {
      showAlert('Error', 'Your cart is empty', 'error');
      return;
    }

    setPlacingOrder(true);
    const stockValidation = await OrderService.validateStock(cartData);

    if (!stockValidation.success) {
      setPlacingOrder(false);
      showAlert('Stock Issues Detected', stockValidation.message, 'error');
      return;
    }

    setPlacingOrder(false);

    showConfirm(
      'Confirm Order',
      `Place order for ${formattedTotal}?\nDelivering to: ${selectedAddress.label}`,
      async () => {
        setPlacingOrder(true);

        try {
          const result = await OrderService.createOrder(cartData, {
            coupon: couponToUse?.coupon,
            discount: discountAmount,
            deliveryAddressId: selectedAddress.id,
          });

          if (result.success) {
            await recordCouponUsageFromOrder(result.orderId);

            setCartData([]);
            getCart();
            removeCoupon();
            if (user?.id) {
              await checkUsedCoupons(user.id);
            }
            setPlacingOrder(false);
            showToast('Order placed successfully!', '', 'success');
          } else {
            setPlacingOrder(false);
            showAlert(
              'Error',
              result.error || 'Failed to place order',
              'error',
            );
          }
        } catch (error) {
          setPlacingOrder(false);
          console.error('Checkout error:', error);
          showAlert('Error', 'Failed to place order', 'error');
        }
      },
      {
        confirmText: 'Place Order',
        cancelText: 'Cancel',
      },
    );
  };

  const recordCouponUsageFromOrder = async orderId => {
    try {
      if (!orderId) {
        console.log('No order ID provided');
        return;
      }

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('coupon_id')
        .eq('id', orderId)
        .single();

      console.log('recordCouponUsageFromOrder', orderData);
      console.log('Order Error recordCouponUsageFromOrder', orderError);

      if (orderError || !orderData?.coupon_id) {
        console.log('No coupon in this order');
        return;
      }

      const { error } = await supabase.from('coupon_usage').insert([
        {
          coupon_id: orderData.coupon_id,
          customer_id: user.id,
          order_id: orderId,
          used_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error('[Coupon usage recording error]:', error);
      } else {
        console.log('[Coupon usage recorded successfully]');
      }
    } catch (err) {
      console.error('[Coupon usage recording exception]:', err);
    }
  };

  const renderCartItem = ({ item }) => {
    const productImage = getProductPrimaryImage(item.products); // ✅ ADD THIS

    return (
      <View style={styles.cartItem}>
        <View style={styles.productImageContainer}>
          {productImage ? ( // ✅ CHANGE THIS
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
            {/* DELIVERY ADDRESS SECTION */}
            {/* DELIVERY ADDRESS SECTION - COMPACT */}
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

            {/* ADDRESS SELECTION MODAL */}
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

            {/* COUPON SECTION */}
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
                        Save ₹{couponDiscount.toFixed(2)}
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

            <View style={styles.freeShippingBanner}>
              <Text style={styles.freeShippingText}>
                Your bag qualifies for free shipping
              </Text>
            </View>

            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>₹{summaryData.subtotal}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee:</Text>
                <Text style={styles.summaryValue}>₹0</Text>
              </View>

              {couponDiscount > 0 && (
                <View style={[styles.summaryRow, styles.discountRow]}>
                  <Text style={styles.summaryLabel}>Coupon Discount:</Text>
                  <Text style={styles.discountValue}>
                    -₹{couponDiscount.toFixed(2)}
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
// COMPLETE STYLESHEET
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
  modalAddressCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
  modalAddressCardText: {
    fontSize: 12,
    color: '#8a9fb5',
    marginBottom: 4,
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
