import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  TextInput,
  Image,
  ActivityIndicator,
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

export default function CartScreen({ navigation }) {
  const { showAlert, showConfirm } = useAlert();
  const { showToast } = useToastify();

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingItems, setLoadingItems] = useState(new Set());
  const [promoCode, setPromoCode] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  const { cartData, setCartData, removeFromCart, updateCartQuantity, getCart } =
    useCart([], null, navigation);

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

  const calculateSubtotal = () =>
    cartData.reduce((t, i) => t + i.products.price * i.quantity, 0);

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.3;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return subtotal - discount;
  };

  const handleCheckout = async () => {
    if (cartData.length === 0) {
      showAlert('Error', 'Your cart is empty', 'error');
      return;
    }

    // Validate stock first
    setPlacingOrder(true);
    const stockValidation = await OrderService.validateStock(cartData);

    if (!stockValidation.success) {
      setPlacingOrder(false);
      showAlert('Stock Issues Detected', stockValidation.message, 'error');
      return;
    }

    // Reset placingOrder before showing confirm dialog
    setPlacingOrder(false);

    // Confirm order
    showConfirm(
      'Confirm Order',
      `Place order for ${formatCurrency(calculateTotal().toFixed(2))}?`,
      async () => {
        // Set placingOrder to true when user confirms
        setPlacingOrder(true);

        try {
          const result = await OrderService.createOrder(cartData);

          if (result.success) {
            // Clear cart data FIRST
            setCartData([]);

            // Refresh cart from server in background
            getCart();

            // Then hide loading
            setPlacingOrder(false);

            // Show success toast
            showToast('Order placed successfully!', '', 'success');
          } else {
            setPlacingOrder(false);
            if (
              result.error === 'out_of_stock' ||
              result.error === 'insufficient_stock'
            ) {
              showAlert('Stock Issue', result.message, 'error', [
                {
                  text: 'Refresh Cart',
                  onPress: () => getCart(),
                },
              ]);
            } else {
              showAlert(
                'Error',
                result.error || 'Failed to place order',
                'error',
              );
            }
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

        {placingOrder && (
          <View style={styles.orderingOverlay}>
            <View style={styles.orderingBox}>
              <ActivityIndicator size="large" color="#4fc3f7" />
              <Text style={styles.orderingText}>Placing your order...</Text>
            </View>
          </View>
        )}

        <FlatList
          data={cartData}
          renderItem={renderCartItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={[
            styles.listContainer,
            cartData.length === 0 && styles.emptyListContainer,
            cartData.length > 0 && { paddingBottom: 450 },
          ]}
          ListEmptyComponent={renderEmptyCart}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
        />

        {cartData.length > 0 && (
          <View style={styles.bottomSection}>
            <View style={styles.promoSection}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter promo code"
                placeholderTextColor="#999"
                value={promoCode}
                onChangeText={setPromoCode}
              />
              <TouchableOpacity style={styles.applyButtonWrapper}>
                <LinearGradient
                  colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
                  style={styles.applyButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </LinearGradient>
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
                <Text style={styles.summaryValue}>
                  {formatCurrency(calculateSubtotal().toFixed(2))}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(0)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount:</Text>
                <Text style={styles.discountValue}>30%</Text>
              </View>

              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(calculateTotal().toFixed(2))}
                </Text>
              </View>
            </View>

            <SwipeToCheckout
              onSwipeSuccess={handleCheckout}
              disabled={cartData.some(i => i.products.quantity <= 0)}
              isProcessing={placingOrder}
            />
          </View>
        )}
      </ImageBackground>
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
    backgroundColor: 'rgba(42, 56, 71, 0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(79, 195, 247, 0.2)',
  },
  promoSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  promoInput: {
    flex: 1,
    backgroundColor: 'rgba(42, 56, 71, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
  },
  applyButtonWrapper: {
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  applyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
});
