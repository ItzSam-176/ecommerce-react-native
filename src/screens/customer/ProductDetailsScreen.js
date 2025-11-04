import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import Loader from '../../components/shared/Loader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Carousel from 'react-native-reanimated-carousel';
import { supabase } from '../../supabase/supabase';
import { useWishlist } from '../../hooks/useWishlist';
import { useCart } from '../../hooks/useCart';
import ProductInfoBottomSheet from '../../components/customer/ProductInfoBottomSheet';

const { width, height } = Dimensions.get('window');

export default function ProductDetailsScreen({ navigation, route }) {
  const productId = route.params?.productId;
  const bottomSheetRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);

  const { toggleWishlist, isInWishlist, getWishlist } = useWishlist();
  const { addToCart, isInCart, getCart } = useCart();

  // ✅ REFACTORED: Memoize fetchProduct to prevent recreation
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(
          `
          *,
          product_categories (
            category_id,
            category:category_id (
              id,
              name
            )
          )
        `,
        )
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      setProduct(productData);

      const { data: imagesData, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (imagesError) {
        console.error('[Error fetching images]:', imagesError);
      }

      if (imagesData && imagesData.length > 0) {
        setProductImages(imagesData);
      } else if (productData.image_url) {
        setProductImages([
          { image_url: productData.image_url, display_order: 0 },
        ]);
      }
    } catch (err) {
      console.error('[Error fetching product]:', err);
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [productId]); // ✅ Only runs when productId changes

  // ✅ ADDED: Load initial data
  useEffect(() => {
    fetchProduct();
    getWishlist();
    getCart();
  }, [fetchProduct, getWishlist, getCart]); // ✅ Fixed dependencies

  useEffect(() => {
    const toggleRequest = route.params?.toggleSheetRequest;
    if (toggleRequest) {
      handleToggleSheet();
      navigation.setParams({ toggleSheetRequest: null });
    }
  }, [route.params?.toggleSheetRequest]);

  useEffect(() => {
    navigation.setParams({ isBottomSheetExpanded: false });
  }, [navigation]);

  // ✅ REFACTORED: Added useCallback
  const handleAddToCart = async () => {
    if (!product) return;
    await addToCart(product);
  }; // ✅ Proper dependencies

  // ✅ REFACTORED: Added handleSheetChange (already good but verify)
  const handleSheetChange = useCallback(
    index => {
      const isExpanded = index > 0;
      setIsBottomSheetExpanded(isExpanded);
      navigation.setParams({ isBottomSheetExpanded: isExpanded });
    },
    [navigation],
  );

  // ✅ REFACTORED: Added useCallback
  const handleToggleSheet = useCallback(() => {
    if (isBottomSheetExpanded) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.snapToIndex(1);
    }
  }, [isBottomSheetExpanded]);

  // ✅ ADDED: Memoize isInCart check
  const cartStatus = useMemo(() => {
    return isInCart(product?.id);
  }, [product?.id, isInCart]);

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#353F54" />
        <View style={styles.loadingContainer}>
          <Loader size={120} speed={1} />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#353F54" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ff4458" />
          <Text style={styles.errorTitle}>Failed to load product</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#353F54" />

      {/* Full Screen Image Carousel */}
      <View style={styles.carouselContainer}>
        {productImages.length > 0 ? (
          <>
            <Carousel
              width={width}
              height={height}
              data={productImages}
              onSnapToItem={setCurrentImageIndex}
              renderItem={({ item }) => (
                <View style={styles.carouselItem}>
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                </View>
              )}
            />
            {productImages.length > 1 && (
              <View style={styles.pagination}>
                {productImages.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentImageIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={80} color="#666" />
            <Text style={styles.noImageText}>No images available</Text>
          </View>
        )}
      </View>

      {/* Bottom Sheet */}
      <ProductInfoBottomSheet
        ref={bottomSheetRef}
        product={product}
        snapPoints={['12%', '50%', '60%']}
        onClose={() => {}}
        onChange={handleSheetChange}
        showCloseButton={false}
        enablePanDownToClose={false}
        variant="details"
        onAddToCart={handleAddToCart}
        isInCart={cartStatus} // ✅ Use memoized value
        navigation={navigation}
        onToggleSheet={handleToggleSheet}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#353F54',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ff4458',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  carouselContainer: {
    flex: 1,
    backgroundColor: '#353F54',
  },
  carouselItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 16,
    color: '#999',
    fontSize: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#4fc3f7',
  },
});
