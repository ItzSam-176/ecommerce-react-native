import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { Dropdown } from 'react-native-element-dropdown';
import { useCoupon } from '../../hooks/useCoupon';

export default function CartScreen({ navigation }) {
  const { showAlert, showConfirm } = useAlert();
  const { showToast } = useToastify();

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingItems, setLoadingItems] = useState(new Set());
  const [promoCode, setPromoCode] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  const { cartData, setCartData, removeFromCart, updateCartQuantity, getCart } =
    useCart([], null, navigation);

  // ✅ Use coupon hook
  const {
    applicableCoupons,
    selectedCoupon,
    couponDiscount,
    loading: couponLoading,
    fetchAllCoupons,
    filterApplicableCoupons,
    selectCoupon,
    removeCoupon,
    calculateTotal,
  } = useCoupon();

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const res = await getCart();
    if (!res.success) {
      showAlert('Error', res.error || 'Failed to load cart', 'error');
    }
    setRefreshing(false);
  }, [getCart]);

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

  const handleCheckout = async () => {
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
      `Place order for ${formatCurrency(summaryData.total)}?`,
      async () => {
        setPlacingOrder(true);
        try {
          const result = await OrderService.createOrder(cartData, {
            coupon: selectedCoupon?.coupon,
            discount: couponDiscount,
          });

          if (result.success) {
            setCartData([]);
            getCart();
            removeCoupon(); // ✅ Clear coupon after order
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
          showAlert('Error', 'Failed to place order', 'error');
        }
      },
      {
        confirmText: 'Place Order',
        cancelText: 'Cancel',
      },
    );
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
            cartData.length > 0 && { paddingBottom: 550 },
          ]}
          ListEmptyComponent={renderEmptyCart}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" // ✅ ADD THIS
          scrollEnabled={!keyboardVisible} //
        />

        {cartData.length > 0 && (
          <ScrollView
            style={styles.bottomSection}
            scrollEnabled={false} // ✅ Prevent scrolling, just layout
            nestedScrollEnabled={true} // ✅ Allow nested scrolls
          >
            {/* ✅ UPDATED COUPON SECTION */}
            <View style={styles.couponSection}>
              <View style={styles.couponHeader}>
                <Text style={styles.couponLabel}>Apply Coupon</Text>
                {/* ✅ Show savings badge */}
                {applicableCoupons.length > 0 && (
                  <View style={styles.savingsBadge}>
                    <Ionicons name="pricetag" size={12} color="#4fc3f7" />
                    <Text style={styles.savingsText}>
                      Save up to ₹{applicableCoupons[0]?.coupon.discount_amount}
                    </Text>
                  </View>
                )}
              </View>

              {applicableCoupons.length > 0 ? (
                <View>
                  <Dropdown
                    style={styles.couponDropdown}
                    placeholderStyle={styles.couponPlaceholder}
                    selectedTextStyle={styles.couponSelectedText}
                    containerStyle={styles.couponDropdownContainer}
                    data={applicableCoupons}
                    inputSearchStyle={styles.couponInputSearch}
                    search={true}
                    maxHeight={250} // ✅ REDUCED HEIGHT
                    labelField="label"
                    valueField="value"
                    placeholder="Select coupon..."
                    value={selectedCoupon?.value}
                    onChange={selectCoupon}
                    activeColor="rgba(79, 195, 247, 0.3)"
                    renderItem={item => (
                      <View style={styles.couponItem}>
                        <View style={styles.couponItemContent}>
                          <Text style={styles.couponItemCode}>
                            {item.coupon.code}
                          </Text>
                          <Text style={styles.couponItemDetails}>
                            {item.coupon.category.name}
                          </Text>
                        </View>
                        <View style={styles.couponItemBadge}>
                          <Text style={styles.couponItemSave}>Save</Text>
                          <Text style={styles.couponItemBadgeText}>
                            ₹{item.coupon.discount_amount}
                          </Text>
                        </View>
                      </View>
                    )}
                    renderInputSearch={onSearch => (
                      <View>
                        <View style={styles.searchContainer}>
                          <TextInput
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={text => {
                              setSearchQuery(text);
                              onSearch(text);
                            }}
                            placeholder="Type to search..."
                            placeholderTextColor="#8a9fb5"
                            autoCorrect={false}
                          />
                          {searchQuery.length > 0 && (
                            <TouchableOpacity
                              onPress={() => {
                                handleClearSearch();
                                onSearch('');
                              }}
                              style={styles.clearButton}
                            >
                              <Text style={styles.clearButtonText}>✕</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {selectedCategories.length > 0 && (
                          <View style={styles.insideChipsContainer}>
                            {selectedCategories.map(cat => (
                              <TouchableOpacity
                                key={cat.id}
                                style={styles.insideChip}
                                onPress={() => handleRemoveCategory(cat)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.insideChipText}>
                                  {cat.name}
                                </Text>
                                <Ionicons name="close" size={14} color="#666" />
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  />

                  {/* Selected Coupon Display */}
                  {selectedCoupon && (
                    <View style={styles.selectedCouponDisplay}>
                      <View style={styles.selectedCouponInfo}>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#4fc3f7"
                        />
                        <View style={styles.selectedCouponText}>
                          <Text style={styles.selectedCouponCode}>
                            {selectedCoupon.coupon.code}
                          </Text>
                          <Text style={styles.selectedCouponDiscount}>
                            You save ₹{couponDiscount.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={removeCoupon}
                        style={styles.removeCouponButton}
                      >
                        <Ionicons name="close" size={20} color="#ff4458" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.noCouponsMessage}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color="#8a9fb5"
                  />
                  <Text style={styles.noCouponsText}>
                    No applicable coupons for your cart
                  </Text>
                </View>
              )}
            </View>

            {/* Free Shipping Banner */}
            <View style={styles.freeShippingBanner}>
              <Text style={styles.freeShippingText}>
                Your bag qualifies for free shipping
              </Text>
            </View>

            {/* Summary Section */}
            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>₹{summaryData.subtotal}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee:</Text>
                <Text style={styles.summaryValue}>₹0</Text>
              </View>

              {/* Coupon Discount Row */}
              {couponDiscount > 0 && (
                <View style={[styles.summaryRow, styles.discountRow]}>
                  <Text style={styles.summaryLabel}>Coupon Discount:</Text>
                  <Text style={styles.discountValue}>
                    -₹{couponDiscount.toFixed(2)}
                  </Text>
                </View>
              )}

              {/* Total Row */}
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>₹{summaryData.total}</Text>
              </View>
            </View>

            {/* Checkout Button */}
            <SwipeToCheckout
              onSwipeSuccess={handleCheckout}
              disabled={cartData.some(i => i.products.quantity <= 0)}
              isProcessing={placingOrder}
            />
          </ScrollView>
        )}
      </ImageBackground>
      <Loader visible={placingOrder} size={120} speed={1} />
    </View>
  );
}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  orderingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  orderingBox: {
    backgroundColor: 'rgba(42, 56, 71, 0.95)',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
  },
  orderingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
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
  discountValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
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
  couponDropdown: {
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(42, 56, 71, 0.8)',
    marginBottom: 8,
  },
  couponPlaceholder: {
    fontSize: 14,
    color: '#8a9fb5',
  },
  couponSelectedText: {
    fontSize: 14,
    color: '#4fc3f7',
    fontWeight: '500',
  },
  couponDropdownContainer: {
    borderRadius: 12,
    backgroundColor: '#2a3847',
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
  },
  couponInputSearch: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#fff',
    padding: 8,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#2a3847',
  },
  couponItem: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  couponItemContent: {
    flex: 1,
  },
  couponItemCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4fc3f7',
  },
  couponItemDetails: {
    fontSize: 12,
    color: '#8a9fb5',
    marginTop: 4,
  },
  couponItemBadge: {
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  couponItemSave: {
    fontSize: 10,
    color: '#8a9fb5',
    marginBottom: 2,
  },
  couponItemBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4fc3f7',
  },
  selectedCouponDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 195, 247, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
    marginBottom: 12,
  },
  selectedCouponInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedCouponText: {
    gap: 2,
  },
  selectedCouponCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4fc3f7',
  },
  selectedCouponDiscount: {
    fontSize: 12,
    color: '#8a9fb5',
  },
  removeCouponButton: {
    padding: 4,
  },
  noCouponsMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.2)',
  },
  noCouponsText: {
    fontSize: 12,
    color: '#ff9800',
  },
  discountRow: {
    marginTop: 4,
  },
  discountValue: {
    fontSize: 16,
    color: '#4fc3f7',
    fontWeight: '600',
  },
});
