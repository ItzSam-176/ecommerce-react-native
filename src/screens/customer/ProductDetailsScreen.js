// // src/screens/customer/ProductDetailsScreen.js
// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Dimensions,
//   StatusBar,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import LinearGradient from 'react-native-linear-gradient';
// import Carousel from 'react-native-reanimated-carousel';
// import { supabase } from '../../supabase/supabase';
// import ProductDetailsBottomSheet from '../../components/customer/ProductDetailsBottomSheet';
// import { useWishlist } from '../../hooks/useWishlist';
// import { useCart } from '../../hooks/useCart';
// import ProductInfoBottomSheet from '../../components/customer/ProductInfoBottomSheet';

// const { width, height } = Dimensions.get('window');

// export default function ProductDetailsScreen({ navigation, route }) {
//   const productId = route.params?.productId;
//   const bottomSheetRef = useRef(null);

//   const [product, setProduct] = useState(null);
//   const [productImages, setProductImages] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);

//   const { toggleWishlist, isInWishlist, getWishlist } = useWishlist();
//   const { addToCart, isInCart, getCart } = useCart();

//   useEffect(() => {
//     fetchProduct();
//     getWishlist();
//     getCart();
//   }, [productId]);

//   const fetchProduct = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       console.log('[Fetching product details]:', productId);

//       // Fetch product
//       const { data: productData, error: productError } = await supabase
//         .from('products')
//         .select(
//           `
//           *,
//           product_categories (
//             category_id,
//             category:category_id (
//               id,
//               name
//             )
//           )
//         `,
//         )
//         .eq('id', productId)
//         .single();

//       if (productError) throw productError;

//       setProduct(productData);

//       // Fetch product images
//       const { data: imagesData, error: imagesError } = await supabase
//         .from('product_images')
//         .select('*')
//         .eq('product_id', productId)
//         .order('display_order', { ascending: true });

//       if (imagesError) {
//         console.error('[Error fetching images]:', imagesError);
//       }

//       if (imagesData && imagesData.length > 0) {
//         setProductImages(imagesData);
//       } else if (productData.image_url) {
//         // Fallback to legacy image_url
//         setProductImages([
//           { image_url: productData.image_url, display_order: 0 },
//         ]);
//       }

//       console.log('[Product loaded]:', productData.name);
//     } catch (err) {
//       console.error('[Error fetching product]:', err);
//       setError(err.message || 'Failed to load product');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddToCart = async () => {
//     if (!product) return;
//     await addToCart(product);
//   };

//   const handleToggleBottomSheet = () => {
//     if (isBottomSheetExpanded) {
//       bottomSheetRef.current?.snapToIndex(0); // Minimize
//     } else {
//       bottomSheetRef.current?.snapToIndex(1); // Expand
//     }
//   };

//   const handleSheetChange = useCallback(index => {
//     setIsBottomSheetExpanded(index === 1);
//   }, []);

//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <StatusBar barStyle="light-content" backgroundColor="#353F54" />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#4fc3f7" />
//           <Text style={styles.loadingText}>Loading product...</Text>
//         </View>
//       </View>
//     );
//   }

//   if (error || !product) {
//     return (
//       <View style={styles.container}>
//         <StatusBar barStyle="light-content" backgroundColor="#353F54" />
//         <SafeAreaView edges={['top']}>
//           <View style={styles.header}>
//             <TouchableOpacity
//               style={styles.backButton}
//               onPress={() => navigation.goBack()}
//             >
//               <LinearGradient
//                 colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
//                 style={styles.headerButton}
//               >
//                 <Ionicons name="arrow-back" size={24} color="#fff" />
//               </LinearGradient>
//             </TouchableOpacity>
//           </View>
//         </SafeAreaView>
//         <View style={styles.errorContainer}>
//           <Ionicons name="alert-circle-outline" size={64} color="#ff4458" />
//           <Text style={styles.errorTitle}>Failed to load product</Text>
//           <Text style={styles.errorMessage}>{error}</Text>
//           <TouchableOpacity onPress={fetchProduct} style={styles.retryButton}>
//             <Text style={styles.retryButtonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#353F54" />

//       {/* Full Screen Image Carousel */}
//       <View style={styles.carouselContainer}>
//         {productImages.length > 0 ? (
//           <>
//             <Carousel
//               width={width}
//               height={height}
//               data={productImages}
//               onSnapToItem={setCurrentImageIndex}
//               renderItem={({ item }) => (
//                 <View style={styles.carouselItem}>
//                   <Image
//                     source={{ uri: item.image_url }}
//                     style={styles.productImage}
//                     resizeMode="contain"
//                   />
//                 </View>
//               )}
//             />
//             {productImages.length > 1 && (
//               <View style={styles.pagination}>
//                 {productImages.map((_, index) => (
//                   <View
//                     key={index}
//                     style={[
//                       styles.paginationDot,
//                       index === currentImageIndex && styles.paginationDotActive,
//                     ]}
//                   />
//                 ))}
//               </View>
//             )}
//           </>
//         ) : (
//           <View style={styles.noImageContainer}>
//             <Ionicons name="image-outline" size={80} color="#666" />
//             <Text style={styles.noImageText}>No images available</Text>
//           </View>
//         )}
//       </View>

//       {/* Fixed Header */}
//       <SafeAreaView edges={['top']} style={styles.headerContainer}>
//         <View style={styles.header}>
//           <TouchableOpacity
//             style={styles.backButton}
//             onPress={() => navigation.goBack()}
//           >
//             <LinearGradient
//               colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
//               style={styles.headerButton}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </LinearGradient>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.toggleButton}
//             onPress={() => {
//               if (isBottomSheetExpanded) {
//                 bottomSheetRef.current?.snapToIndex(0);
//               } else {
//                 bottomSheetRef.current?.snapToIndex(1);
//               }
//             }}
//           >
//             <LinearGradient
//               colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
//               style={styles.headerButton}
//             >
//               <Ionicons
//                 name={isBottomSheetExpanded ? 'chevron-down' : 'chevron-up'}
//                 size={28}
//                 color="#fff"
//               />
//             </LinearGradient>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>

//       <ProductInfoBottomSheet
//         ref={bottomSheetRef}
//         product={product}
//         snapPoints={['12%', '50%', '60%']}
//         onClose={() => {}}
//         onChange={handleSheetChange}
//         showCloseButton={false}
//         enablePanDownToClose={false}
//         variant="details"
//         onAddToCart={handleAddToCart}
//         isInCart={isInCart(product?.id)}
//         navigation={navigation}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#353F54',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 16,
//     color: '#fff',
//     fontSize: 16,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   errorTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#ff4458',
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   errorMessage: {
//     fontSize: 14,
//     color: '#999',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   retryButton: {
//     backgroundColor: '#4fc3f7',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   headerContainer: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 10,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//   },
//   backButton: {
//     shadowColor: '#4fc3f7',
//     shadowOpacity: 0.6,
//     shadowOffset: { width: 0, height: 4 },
//     shadowRadius: 8,
//     elevation: 10,
//   },
//   toggleButton: {
//     shadowColor: '#4fc3f7',
//     shadowOpacity: 0.6,
//     shadowOffset: { width: 0, height: 4 },
//     shadowRadius: 8,
//     elevation: 10,
//   },
//   headerButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderBottomWidth: 2,
//     borderBottomColor: 'rgba(0, 0, 0, 0.15)',
//   },
//   carouselContainer: {
//     flex: 1,
//     backgroundColor: '#353F54',
//   },
//   carouselItem: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   productImage: {
//     width: '100%',
//     height: '100%',
//   },
//   noImageContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   noImageText: {
//     marginTop: 16,
//     color: '#999',
//     fontSize: 16,
//   },
//   pagination: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     position: 'absolute',
//     bottom: 200,
//     left: 0,
//     right: 0,
//     gap: 8,
//   },
//   paginationDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   paginationDotActive: {
//     width: 24,
//     backgroundColor: '#4fc3f7',
//   },
// });

// src/screens/customer/ProductDetailsScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
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

  useEffect(() => {
    fetchProduct();
    getWishlist();
    getCart();
  }, [productId]);

  // Add this useEffect in ProductDetailsScreen
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

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[Fetching product details]:', productId);

      // Fetch product
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

      // Fetch product images
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

      console.log('[Product loaded]:', productData.name);
    } catch (err) {
      console.error('[Error fetching product]:', err);
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    await addToCart(product);
  };

const handleSheetChange = useCallback(
  index => {
    const isExpanded = index > 0;
    setIsBottomSheetExpanded(isExpanded);

    // Update navigation params so header can read the state
    navigation.setParams({ isBottomSheetExpanded: isExpanded });
  },
  [navigation],
);

  const handleToggleSheet = useCallback(() => {
    if (isBottomSheetExpanded) {
      bottomSheetRef.current?.snapToIndex(0); // Minimize
    } else {
      bottomSheetRef.current?.snapToIndex(1); // Expand
    }
  }, [isBottomSheetExpanded]);

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#353F54" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4fc3f7" />
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
        isInCart={isInCart(product?.id)}
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
