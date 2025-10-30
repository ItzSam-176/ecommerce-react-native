import React, { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  Image,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useWishlist } from '../../hooks/useWishlist';
import { useCart } from '../../hooks/useCart';
import { useAlert } from '../../components/informative/AlertProvider';
import { useToastify } from '../../hooks/useToastify';
import ShimmerProductsCard from '../../components/shimmer/ShimmerProductsCard';
import formatCurrency from '../../utils/formatCurrency';
import { getProductPrimaryImage } from '../../utils/productImageHelper';

export default function WishlistScreen({ navigation }) {
  const { showAlert, showConfirm } = useAlert();
  const { showToast } = useToastify();

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingItems, setLoadingItems] = useState(new Set());
  const hasLoadedOnce = useRef(false);

  const { removeFromWishlist, getWishlist, wishlistData } = useWishlist(
    [],
    null,
    navigation,
  );

  const { addToCart } = useCart();

  // Load wishlist only on first mount
  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnce.current) {
        console.log('[WishlistScreen] Initial load');
        (async () => {
          const res = await getWishlist();
          if (!res.success) {
            showAlert('Error', res.error || 'Failed to load wishlist', 'error');
          }
          setInitialLoading(false);
          hasLoadedOnce.current = true;
        })();
      } else {
        console.log('[WishlistScreen] Already loaded, skipping');
      }
    }, []), // EMPTY DEPENDENCY ARRAY - don't include getWishlist
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const res = await getWishlist();
    if (!res.success) {
      showAlert('Error', res.error || 'Failed to load wishlist', 'error');
    }
    setRefreshing(false);
  }, [getWishlist]);
  const handleRemoveFromWishlist = item => {
    showConfirm(
      'Remove Item',
      `Remove ${item.products.name} from wishlist?`,
      async () => {
        setLoadingItems(prev => new Set(prev).add(item.id));
        const result = await removeFromWishlist(item.products, true);
        setLoadingItems(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        if (result.success) {
          showToast('Item removed from wishlist', '', 'success');
        } else {
          showAlert('Error', result.error || 'Failed to remove item', 'error');
        }
      },
      { confirmText: 'Remove', destructive: true },
    );
  };

  const handleMoveToCart = async item => {
    setLoadingItems(prev => new Set(prev).add(item.id));

    // First add to cart
    const addResult = await addToCart(item.products);

    if (addResult.success) {
      // Then remove from wishlist
      const removeResult = await removeFromWishlist(item.products, true);

      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });

      if (removeResult.success) {
        showToast('Moved to cart', '', 'success');
      } else {
        showAlert(
          'Warning',
          'Added to cart but failed to remove from wishlist',
          'warning',
        );
      }
    } else {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      showAlert('Error', addResult.error || 'Failed to move to cart', 'error');
    }
  };

  const renderWishlistItem = ({ item }) => {
    const isLoading = loadingItems.has(item.id);
    const productImage = getProductPrimaryImage(item.products);

    return (
      <View style={styles.wishlistItem}>
        <View style={styles.topSection}>
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

          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.products.name}
            </Text>

            <Text style={styles.productPrice}>
              {formatCurrency(Number(item.products.price).toFixed(2))}
            </Text>

            {item.products.description && (
              <Text style={styles.productDescription} numberOfLines={2}>
                {item.products.description}
              </Text>
            )}
          </View>
        </View>

        {/* Buttons in separate section at bottom */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => handleMoveToCart(item)}
            disabled={isLoading || item.products.quantity <= 0}
            style={styles.moveToCartButtonWrapper}
          >
            <LinearGradient
              colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
              style={[
                styles.moveToCartButton,
                (isLoading || item.products.quantity <= 0) &&
                  styles.disabledButton,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="cart-outline" size={16} color="#fff" />
                  <Text style={styles.moveToCartText}>
                    {item.products.quantity <= 0
                      ? 'Out of Stock'
                      : 'Move to Cart'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleRemoveFromWishlist(item)}
            disabled={isLoading}
            style={styles.removeButtonWrapper}
          >
            <LinearGradient
              colors={['#ff6b6b', '#ee5a6f', '#dc4f73']}
              style={styles.removeButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyWishlist = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={80} color="#4fc3f7" />
      <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
      <Text style={styles.emptySubtitle}>Save items you love for later</Text>
      <TouchableOpacity
        style={styles.shopButtonWrapper}
        onPress={() => navigation.navigate('HomeStack', { screen: 'Home' })}
      >
        <LinearGradient
          colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
          style={styles.shopButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.shopButtonText}>Discover Products</Text>
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
            <ShimmerProductsCard count={5} variant="wishlist" />
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
          data={wishlistData}
          renderItem={renderWishlistItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={[
            styles.listContainer,
            wishlistData.length === 0 && styles.emptyListContainer,
          ]}
          ListEmptyComponent={renderEmptyWishlist}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
        />
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
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
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
  shopButtonWrapper: {
    marginTop: 32,
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 12,
  },
  shopButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  wishlistItem: {
    backgroundColor: 'rgba(42, 56, 71, 0.8)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.2)',
  },
  topSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImageContainer: {
    width: 110,
    height: 110,
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
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'flex-start',
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4fc3f7',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#aaa',
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(79, 195, 247, 0.2)',
  },
  moveToCartButtonWrapper: {
    flex: 1,
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  moveToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  },
  moveToCartText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  removeButtonWrapper: {
    shadowColor: '#ff6b6b',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  removeButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
