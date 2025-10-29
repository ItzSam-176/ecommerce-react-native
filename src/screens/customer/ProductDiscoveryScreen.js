// // src/screens/customer/ProductDiscoveryScreen.js
// import React, { useEffect, useState, useCallback, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Dimensions,
//   StatusBar,
//   Image,
//   TouchableOpacity,
//   FlatList,
// } from 'react-native';
// import {
//   GestureHandlerRootView,
//   PanGestureHandler,
// } from 'react-native-gesture-handler';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withTiming,
//   withSpring,
//   useAnimatedGestureHandler,
//   runOnJS,
// } from 'react-native-reanimated';
// import LinearGradient from 'react-native-linear-gradient';
// import { usePaginatedQuery } from '../../hooks/usePaginatedQuery';
// import { useWishlist } from '../../hooks/useWishlist';
// import { useCart } from '../../hooks/useCart';
// import ProductDetailsBottomSheet from '../../components/customer/ProductDetailsBottomSheet';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import { useFocusEffect } from '@react-navigation/native';
// import ShimmerDiscovery from '../../components/shimmer/ShimmerDiscovery';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useToastify } from '../../hooks/useToastify';
// import { AnimatedHeart } from '../../components/shared/AnimatedHeart';
// import {
//   TourGuideProvider,
//   TourGuideZone,
//   useTourGuideController,
// } from 'rn-tourguide';
// import CustomTooltip from '../../components/tour/CustomTooltip';
// import {
//   hasCompletedTour,
//   setTourCompleted,
//   TOUR_KEYS,
//   resetTour,
// } from '../../utils/tourGuideHelper';

// const { width, height } = Dimensions.get('window');
// const CARD_WIDTH = width * 1;
// const CARD_HEIGHT = height * 1;
// const SWIPE_THRESHOLD = 0.25 * width;
// const VELOCITY_THRESHOLD = 800;

// function ProductDiscoveryContent({ navigation, route }) {
//   const { showToast } = useToastify();
//   const { canStart, start, stop } = useTourGuideController();

//   const rawInitialCategoryId = route?.params?.categoryId ?? null;
//   const normalizeCategoryId = id => {
//     if (id == null) return null;
//     const s = String(id).trim();
//     if (!s || s.toLowerCase() === 'all') return null;
//     return s;
//   };
//   const initialCategoryId = normalizeCategoryId(rawInitialCategoryId);
//   const initialCategoryNameRaw = route?.params?.categoryName ?? 'All';
//   const startProductId = route?.params?.startProductId ?? null;

//   const [selectedCategoryId, setSelectedCategoryId] =
//     useState(initialCategoryId);
//   const initialCategoryName =
//     initialCategoryId == null ? 'All' : initialCategoryNameRaw;
//   const [selectedCategoryName, setSelectedCategoryName] =
//     useState(initialCategoryName);
//   const [pickerOpen, setPickerOpen] = useState(false);
//   const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
//   const [index, setIndex] = useState(0);

//   const [frontProduct, setFrontProduct] = useState(null);
//   const [backProduct, setBackProduct] = useState(null);
//   const [backDirection, setBackDirection] = useState(0);

//   const frontX = useSharedValue(0);
//   const backX = useSharedValue(0);
//   const frontOpacity = useSharedValue(1);
//   const backOpacity = useSharedValue(0);
//   const currentIndex = useSharedValue(0);

//   const insets = useSafeAreaInsets();

//   const [optimisticWishlist, setOptimisticWishlist] = useState(new Set());
//   const [optimisticCart, setOptimisticCart] = useState(new Set());

//   const heartRef = useRef(null);
//   const tourStartedRef = useRef(false);

//   useEffect(() => {
//     currentIndex.value = index;
//   }, [index, currentIndex]);

//   const {
//     data: allProducts,
//     loadingInitial,
//     hasMore,
//     fetchPage,
//     loadingMore,
//   } = usePaginatedQuery('products', 50, '', {
//     column: 'created_at',
//     ascending: false,
//   });

//   const CATEGORIES_PAGE_SIZE = 5;
//   const { data: categoriesRaw, fetchPage: fetchCategories } = usePaginatedQuery(
//     'category',
//     CATEGORIES_PAGE_SIZE,
//   );

//   const categories = React.useMemo(() => {
//     const list = categoriesRaw ?? [];
//     return [{ id: null, name: 'All' }, ...list];
//   }, [categoriesRaw]);

//   const products = React.useMemo(() => {
//     if (!allProducts || allProducts.length === 0) return [];

//     if (selectedCategoryId === null) {
//       return allProducts;
//     }

//     return allProducts.filter(product => {
//       const productCategories = product.product_categories || [];
//       return productCategories.some(pc => {
//         const categoryId = pc.category_id || pc.category?.id;
//         return String(categoryId) === String(selectedCategoryId);
//       });
//     });
//   }, [allProducts, selectedCategoryId]);

//   const {
//     toggleWishlist,
//     isInWishlist,
//     getWishlist,
//     loading: wishlistLoading,
//   } = useWishlist(undefined, null);

//   const {
//     addToCart,
//     isInCart,
//     getCart,
//     loading: cartLoading,
//   } = useCart(undefined, null);

//   // Check if tour should start
//   useEffect(() => {
//     const checkAndStartTour = async () => {
//       if (tourStartedRef.current) return;
//       if (!frontProduct) return;
//       if (!canStart) return;

//       const completed = await hasCompletedTour(TOUR_KEYS.PRODUCT_DISCOVERY);
//       if (!completed) {
//         tourStartedRef.current = true;
//         setTimeout(() => {
//           start();
//         }, 800);
//       }
//       resetTour(TOUR_KEYS.PRODUCT_DISCOVERY);
//     };

//     checkAndStartTour();
//   }, [frontProduct, canStart, start]);

//   const handleTourFinish = async () => {
//     await setTourCompleted(TOUR_KEYS.PRODUCT_DISCOVERY);
//     stop();
//   };

//   useEffect(() => {
//     const init = async () => {
//       await fetchCategories?.(true);
//       await fetchCategories?.();
//     };
//     init();
//   }, []);

//   useEffect(() => {
//     fetchPage(true);
//   }, []);

//   useEffect(() => {
//     frontX.value = 0;
//     backX.value = 0;
//     frontOpacity.value = 1;
//     backOpacity.value = 0;
//     setBackProduct(null);
//     setBackDirection(0);
//     setIndex(0);
//     currentIndex.value = 0;
//   }, [selectedCategoryId]);

//   const total = products.length;
//   const boundedIndex = Math.max(0, Math.min(index, total - 1));

//   useEffect(() => {
//     const fp = products?.[boundedIndex] ?? null;
//     setFrontProduct(fp);
//     setBackProduct(null);
//     setBackDirection(0);
//     frontX.value = 0;
//     backX.value = 0;
//     frontOpacity.value = 1;
//     backOpacity.value = 0;
//   }, [products, boundedIndex]);

//   const startJumpedRef = React.useRef(false);
//   useEffect(() => {
//     if (!startProductId || startJumpedRef.current) return;
//     if (!products?.length) return;
//     const i = products.findIndex(p => p?.id === startProductId);
//     if (i >= 0) {
//       setIndex(i);
//       currentIndex.value = i;
//       startJumpedRef.current = true;
//     }
//   }, [startProductId, products]);

//   const memoizedGetCart = useCallback(() => {
//     getCart?.();
//   }, [getCart]);

//   const memoizedGetWishlist = useCallback(() => {
//     getWishlist?.();
//   }, [getWishlist]);

//   useFocusEffect(
//     useCallback(() => {
//       memoizedGetCart();
//       memoizedGetWishlist();
//     }, [memoizedGetCart, memoizedGetWishlist]),
//   );

//   useEffect(() => {
//     if (!hasMore || loadingInitial || loadingMore) return;
//     if (
//       allProducts &&
//       allProducts.length > 0 &&
//       index >= Math.max(allProducts.length - 10, 0)
//     ) {
//       fetchPage();
//     }
//   }, [index, hasMore, loadingInitial, loadingMore, allProducts?.length]);

//   const getImageUrl = p => p?.image_url;

//   const handleHeartPress = async () => {
//     if (!frontProduct) return;

//     const productId = frontProduct.id;
//     const wasInWishlist =
//       isInWishlist(productId) || optimisticWishlist.has(productId);

//     if (!wasInWishlist) {
//       setOptimisticWishlist(prev => new Set([...prev, productId]));
//       heartRef.current?.animate();
//       await toggleWishlist(frontProduct);
//       setOptimisticWishlist(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(productId);
//         return newSet;
//       });
//     } else {
//       navigation.navigate('WishlistScreen');
//     }
//   };

//   const handleSwipeWishlist = async () => {
//     if (!frontProduct) return;

//     const productId = frontProduct.id;
//     const wasInWishlist =
//       isInWishlist(productId) || optimisticWishlist.has(productId);

//     if (!wasInWishlist) {
//       heartRef.current?.animate();
//       setOptimisticWishlist(prev => new Set([...prev, productId]));
//     } else {
//       setOptimisticWishlist(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(productId);
//         return newSet;
//       });
//     }

//     await toggleWishlist(frontProduct);
//     setOptimisticWishlist(prev => {
//       const newSet = new Set(prev);
//       newSet.delete(productId);
//       return newSet;
//     });
//   };

//   const currentIsInWishlist = frontProduct
//     ? optimisticWishlist.has(frontProduct.id) || isInWishlist(frontProduct.id)
//     : false;

//   const jsSetNeighbor = (dir, iNeighbor) => {
//     const p = products?.[iNeighbor] ?? null;
//     if (!p) return;
//     setBackDirection(dir);
//     setBackProduct(p);
//     if (dir === -1) {
//       backX.value = width;
//       backOpacity.value = 1;
//     } else if (dir === 1) {
//       backX.value = -width;
//       backOpacity.value = 1;
//     }
//   };

//   const jsCommitIndex = iNew => {
//     setIndex(iNew);
//   };

//   const jsSwapCards = () => {
//     setFrontProduct(backProduct);
//     setBackProduct(null);
//     setBackDirection(0);
//   };

//   const panGestureHandler = useAnimatedGestureHandler({
//     onStart: () => {
//       runOnJS(setPickerOpen)(false);
//     },
//     onActive: e => {
//       frontX.value = e.translationX;

//       if (e.translationX < 0) {
//         const iNext = boundedIndex + 1;
//         if (iNext < total && backDirection !== -1) {
//           runOnJS(jsSetNeighbor)(-1, iNext);
//         }
//         backX.value = Math.max(0, width + e.translationX * 0.85);
//       } else if (e.translationX > 0) {
//         const iPrev = boundedIndex - 1;
//         if (iPrev >= 0 && backDirection !== 1) {
//           runOnJS(jsSetNeighbor)(1, iPrev);
//         }
//         backX.value = Math.min(0, -width + e.translationX * 0.85);
//       } else {
//         backX.value = 0;
//       }
//     },
//     onEnd: e => {
//       const dx = e.translationX;
//       const vx = e.velocityX;
//       const dy = e.translationY;
//       const vy = e.velocityY;

//       const goNext = dx < -SWIPE_THRESHOLD || vx < -VELOCITY_THRESHOLD;
//       const goPrev = dx > SWIPE_THRESHOLD || vx > VELOCITY_THRESHOLD;
//       const goUp = dy < -SWIPE_THRESHOLD * 0.6 || vy < -VELOCITY_THRESHOLD;
//       const goDown = dy > SWIPE_THRESHOLD * 0.6 || vy > VELOCITY_THRESHOLD;

//       const iNow = currentIndex.value;
//       const totalNow = total;

//       if (goNext && iNow < totalNow - 1) {
//         frontX.value = withTiming(-width, { duration: 180 });
//         backX.value = withTiming(0, { duration: 180 });

//         frontOpacity.value = withTiming(0, { duration: 180 }, finished => {
//           if (!finished) return;
//           const iNew = Math.min(iNow + 1, totalNow - 1);
//           runOnJS(jsCommitIndex)(iNew);
//           runOnJS(jsSwapCards)();
//           frontX.value = 0;
//           backX.value = 0;
//           frontOpacity.value = withTiming(1, { duration: 100 });
//           backOpacity.value = 0;
//         });
//         return;
//       }

//       if (goPrev && iNow > 0) {
//         frontX.value = withTiming(width, { duration: 180 });
//         backX.value = withTiming(0, { duration: 180 });

//         frontOpacity.value = withTiming(0, { duration: 180 }, finished => {
//           if (!finished) return;
//           const iNew = Math.max(iNow - 1, 0);
//           runOnJS(jsCommitIndex)(iNew);
//           runOnJS(jsSwapCards)();
//           frontX.value = 0;
//           backX.value = 0;
//           frontOpacity.value = withTiming(1, { duration: 100 });
//           backOpacity.value = 0;
//         });
//         return;
//       }

//       if (goUp && frontProduct) {
//         runOnJS(handleSwipeWishlist)();
//         frontX.value = withSpring(0);
//         backX.value = withSpring(
//           backDirection === -1 ? width : backDirection === 1 ? -width : 0,
//         );
//         backOpacity.value = withSpring(0);
//         return;
//       }
//       if (goDown && frontProduct) {
//         runOnJS(addToCart)(frontProduct);
//         frontX.value = withSpring(0);
//         backX.value = withSpring(
//           backDirection === -1 ? width : backDirection === 1 ? -width : 0,
//         );
//         backOpacity.value = withSpring(0);
//         return;
//       }

//       frontX.value = withSpring(0);
//       backX.value = withSpring(
//         backDirection === -1 ? width : backDirection === 1 ? -width : 0,
//         {},
//         () => {
//           backOpacity.value = 0;
//           runOnJS(setBackProduct)(null);
//           runOnJS(setBackDirection)(0);
//         },
//       );
//     },
//   });

//   const frontStyle = useAnimatedStyle(() => ({
//     transform: [
//       { translateX: frontX.value },
//       { rotateZ: `${(frontX.value / width) * 18}deg` },
//     ],
//     opacity: frontOpacity.value,
//   }));

//   const backStyle = useAnimatedStyle(() => ({
//     transform: [
//       { translateX: backX.value },
//       { rotateZ: `${(backX.value / width) * 6}deg` },
//     ],
//     opacity: backOpacity.value,
//   }));

//   const hasCards = products.length > 0 && !!frontProduct;
//   const showNoProducts = !loadingInitial && products.length === 0;

//   return (
//     <GestureHandlerRootView>
//       <View style={styles.container}>
//         <StatusBar hidden={false} />
//         {loadingInitial && <ShimmerDiscovery />}

//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity
//             style={[styles.headerButton, { paddingLeft: 0 }]}
//             onPress={() => navigation.goBack()}
//           >
//             <LinearGradient
//               colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
//               style={styles.headerGradientButton}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 1 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </LinearGradient>
//           </TouchableOpacity>
//           <TourGuideZone
//             zone={1}
//             text="Category Filter"
//             shape="rectangle"
//             borderRadius={8}
//             maskOffset={8}
//             isTourGuide
//           >
//             <View
//               collapsable={false}
//               onLayout={e => {
//                 const { x, y, width, height } = e.nativeEvent.layout;
//                 console.log(
//                   `[DEBUG] Zone 1 layout: x=${x}, y=${y}, w=${width}, h=${height}`,
//                 );
//               }}
//             >
//               <TouchableOpacity
//                 style={styles.centerPicker}
//                 onPress={() => setPickerOpen(v => !v)}
//                 activeOpacity={0.8}
//               >
//                 <Text style={styles.headerText} numberOfLines={1}>
//                   {selectedCategoryName} • {total > 0 ? boundedIndex + 1 : 0} of{' '}
//                   {total}
//                 </Text>
//                 <Ionicons
//                   name={pickerOpen ? 'chevron-up' : 'chevron-down'}
//                   size={18}
//                   color="#fff"
//                 />
//               </TouchableOpacity>
//             </View>
//           </TourGuideZone>

//           <View style={styles.rightHeaderButtons}>
//             <TourGuideZone
//               zone={2}
//               text="Go To Wishlist"
//               shape="circle"
//               isTourGuide
//             >
//               <TouchableOpacity
//                 style={styles.headerButton}
//                 onPress={() => navigation.navigate('WishlistScreen')}
//               >
//                 <LinearGradient
//                   colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
//                   style={styles.headerGradientButton}
//                   start={{ x: 0, y: 0 }}
//                   end={{ x: 1, y: 1 }}
//                 >
//                   <Ionicons name="heart-outline" size={24} color="#fff" />
//                 </LinearGradient>
//               </TouchableOpacity>
//             </TourGuideZone>

//             <TourGuideZone
//               zone={3}
//               text="Product Details"
//               shape="circle"
//               isTourGuide
//             >
//               <TouchableOpacity
//                 style={styles.headerButton}
//                 onPress={() => setBottomSheetVisible(true)}
//                 disabled={!frontProduct}
//               >
//                 <LinearGradient
//                   colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
//                   style={styles.headerGradientButton}
//                   start={{ x: 0, y: 0 }}
//                   end={{ x: 1, y: 1 }}
//                 >
//                   <Ionicons
//                     name="information-circle-outline"
//                     size={28}
//                     color={frontProduct ? '#fff' : '#666'}
//                   />
//                 </LinearGradient>
//               </TouchableOpacity>
//             </TourGuideZone>
//           </View>
//         </View>

//         {pickerOpen && (
//           <View style={styles.pickerSheet}>
//             <FlatList
//               data={categories}
//               keyExtractor={c => (c && c.id != null ? String(c.id) : 'all')}
//               renderItem={({ item }) => (
//                 <TouchableOpacity
//                   style={styles.pickerItem}
//                   onPress={() => {
//                     const nid = normalizeCategoryId(
//                       item.id == null ? null : item.id,
//                     );
//                     setSelectedCategoryId(nid);
//                     setSelectedCategoryName(item.name ?? 'Category');
//                     setPickerOpen(false);
//                   }}
//                 >
//                   <Text style={styles.pickerItemText}>
//                     {item.name ?? 'Category'}
//                   </Text>
//                   {((item.id === null && selectedCategoryId === null) ||
//                     item.id === selectedCategoryId) && (
//                     <Ionicons name="checkmark" size={20} color="#4CAF50" />
//                   )}
//                 </TouchableOpacity>
//               )}
//               style={{ maxHeight: 5 * 52 }}
//               showsVerticalScrollIndicator={false}
//               onEndReached={() => fetchCategories?.()}
//               onEndReachedThreshold={0.5}
//             />
//           </View>
//         )}

//         {backProduct && (
//           <Animated.View style={[styles.productContainer, backStyle]}>
//             <Animated.Image
//               key={backProduct?.id}
//               source={{ uri: getImageUrl(backProduct) }}
//               style={styles.image}
//               resizeMode="cover"
//               fadeDuration={0}
//             />
//           </Animated.View>
//         )}

//         {hasCards ? (
//           <PanGestureHandler onGestureEvent={panGestureHandler}>
//             {/* ⚠️ MOVE ZONE 4 HERE - Only wrap the bottom card */}

//             <Animated.View style={[styles.productContainer, frontStyle]}>
//               <TourGuideZone
//                 zone={4}
//                 text="Swipe left/right to browse, swipe up to add to wishlist, swipe down to add to cart"
//                 borderRadius={16}
//                 isTourGuide
//                 tooltipBottomOffset={-230}
//               >
//                 <Animated.Image
//                   key={frontProduct?.id}
//                   source={{ uri: getImageUrl(frontProduct) }}
//                   style={styles.image}
//                   resizeMode="contain"
//                   fadeDuration={0}
//                 />
//                 <LinearGradient
//                   colors={[
//                     'rgba(0,0,0,0)',
//                     'rgba(0,0,0,0.1)',
//                     'rgba(0,0,0,0.3)',
//                     'rgba(0,0,0,0.6)',
//                     'rgba(0,0,0,0.85)',
//                   ]}
//                   locations={[0, 0.3, 0.5, 0.7, 1]}
//                   style={[
//                     styles.infoOverlay,
//                     { paddingBottom: Math.max(40, insets.bottom + 16) },
//                   ]}
//                 >
//                   <View style={styles.mainContainer}>
//                     <View style={styles.wholeBackground}>
//                       <View style={styles.detailsSection}>
//                         <Text
//                           style={styles.productName}
//                           numberOfLines={2}
//                           onPress={() => setBottomSheetVisible(true)}
//                         >
//                           {frontProduct?.name || 'Unknown Product'}
//                         </Text>

//                         <Text style={styles.productPrice}>
//                           {require('../../utils/formatCurrency').default(
//                             frontProduct?.price,
//                           ) || '0.00'}
//                         </Text>

//                         {frontProduct?.description ? (
//                           <Text
//                             style={styles.productDescription}
//                             numberOfLines={3}
//                             onPress={() => setBottomSheetVisible(true)}
//                           >
//                             {frontProduct.description}
//                           </Text>
//                         ) : null}
//                       </View>

//                       <View style={styles.iconsSection}>
//                         <TourGuideZone
//                           zone={5}
//                           text="Quick Wishlist"
//                           shape="circle"
//                           borderRadius={24}
//                           isTourGuide
//                         >
//                           <TouchableOpacity
//                             style={styles.actionIconButton}
//                             onPress={handleHeartPress}
//                             activeOpacity={0.7}
//                           >
//                             <AnimatedHeart
//                               ref={heartRef}
//                               isFavorite={currentIsInWishlist}
//                               size={32}
//                               color="#4fc3f7"
//                               outlineColor="#fff"
//                             />
//                           </TouchableOpacity>
//                         </TourGuideZone>
//                       </View>
//                     </View>
//                   </View>
//                 </LinearGradient>
//               </TourGuideZone>
//             </Animated.View>
//           </PanGestureHandler>
//         ) : showNoProducts ? (
//           <View style={styles.noMoreCards}>
//             <Ionicons name="bag-outline" size={64} color="#666" />
//             <Text style={styles.noMoreCardsText}>
//               {selectedCategoryId == null
//                 ? 'No products available'
//                 : `No products in ${selectedCategoryName}`}
//             </Text>
//             <Text style={styles.noMoreCardsSubtext}>
//               Try selecting a different category
//             </Text>
//           </View>
//         ) : null}

//         <ProductDetailsBottomSheet
//           product={frontProduct}
//           visible={bottomSheetVisible}
//           onClose={() => setBottomSheetVisible(false)}
//           onAddToWishlist={() => toggleWishlist(frontProduct)}
//           onAddToCart={() => addToCart(frontProduct)}
//           isInWishlist={frontProduct ? isInWishlist(frontProduct.id) : false}
//           isInCart={frontProduct ? isInCart(frontProduct.id) : false}
//           navigation={navigation}
//         />
//       </View>
//     </GestureHandlerRootView>
//   );
// }

// // Update TourGuideProvider config
// // In ProductDiscoveryScreen.js
// export default function ProductDiscoveryScreen({ navigation, route }) {
//   return (
//     <TourGuideProvider
//       tooltipComponent={CustomTooltip}
//       androidStatusBarVisible={true}
//       preventOutsideInteraction={true} // ⚠️ CHANGED BACK: Enable backdrop interaction block
//       {...{
//         backdropColor: 'rgba(0, 0, 0, 0.8)', // ⚠️ CHANGED: Darker backdrop
//         verticalOffset: 0,
//         stepNumbersEnabled: true,
//         maskOffset: 10, // ⚠️ ADDED: Global mask offset
//       }}
//     >
//       <ProductDiscoveryContent navigation={navigation} route={route} />
//     </TourGuideProvider>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#353F54',
//   },
//   header: {
//     position: 'absolute',
//     top: 25,
//     left: 20,
//     right: 20,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     zIndex: 10,
//   },
//   rightHeaderButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   headerButton: {
//     shadowColor: '#4fc3f7',
//     shadowOpacity: 0.6,
//     shadowOffset: { width: 0, height: 4 },
//     shadowRadius: 8,
//     elevation: 10,
//   },
//   headerGradientButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderBottomWidth: 2,
//     borderBottomColor: 'rgba(0, 0, 0, 0.15)',
//   },
//   headerText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   centerPicker: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     maxWidth: '100%',
//   },
//   pickerSheet: {
//     position: 'absolute',
//     top: 90,
//     left: 20,
//     right: 20,
//     backgroundColor: 'rgba(20,20,20,0.96)',
//     borderRadius: 12,
//     paddingVertical: 8,
//     zIndex: 12,
//   },
//   pickerItem: {
//     paddingVertical: 10,
//     paddingHorizontal: 14,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   pickerItemText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   productContainer: {
//     position: 'absolute',
//     top: (height - CARD_HEIGHT) / 2,
//     left: (width - CARD_WIDTH) / 2,
//     width: CARD_WIDTH,
//     height: CARD_HEIGHT,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.25,
//     shadowRadius: 15,
//     elevation: 10,
//     backgroundColor: '#353F54',
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//   },
//   infoOverlay: {
//     position: 'absolute',
//     bottom: 55,
//     left: 0,
//     right: 0,
//     height: 280,
//     justifyContent: 'flex-end',
//     paddingHorizontal: 24,
//     paddingVertical: 20,
//   },
//   mainContainer: {
//     width: '100%',
//   },
//   wholeBackground: {
//     flexDirection: 'row',
//     backgroundColor: 'rgba(42, 56, 71, 0.85)',
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(79, 195, 247, 0.25)',
//     gap: 16,
//     alignItems: 'flex-start',
//   },
//   detailsSection: {
//     flex: 1,
//     gap: 8,
//   },
//   iconsSection: {
//     flexDirection: 'column',
//     alignItems: 'flex-start',
//     justifyContent: 'flex-start',
//     gap: 20,
//     paddingTop: 0,
//   },
//   actionIconButton: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//     alignSelf: 'flex-start',
//   },
//   disabledButton: {
//     opacity: 0.5,
//   },
//   disabledIcon: {
//     textShadowColor: 'rgba(0,0,0,0.3)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 2,
//   },
//   productName: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '800',
//     lineHeight: 24,
//   },
//   productPrice: {
//     color: '#4fc3f7',
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   productDescription: {
//     color: '#e0e0e0',
//     fontSize: 13,
//     lineHeight: 18,
//     opacity: 0.95,
//   },
//   iconShadow: {
//     textShadowColor: 'rgba(0,0,0,0.8)',
//     textShadowOffset: { width: 0, height: 2 },
//     textShadowRadius: 4,
//   },
//   noMoreCards: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 40,
//   },
//   noMoreCardsText: {
//     color: '#fff',
//     fontSize: 20,
//     fontWeight: '600',
//     marginTop: 16,
//     textAlign: 'center',
//   },
//   noMoreCardsSubtext: {
//     color: '#999',
//     fontSize: 16,
//     marginTop: 8,
//     textAlign: 'center',
//   },
// });

// src/screens/customer/ProductDiscoveryScreen.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery';
import { useWishlist } from '../../hooks/useWishlist';
import { useCart } from '../../hooks/useCart';
import ProductDetailsBottomSheet from '../../components/customer/ProductDetailsBottomSheet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import ShimmerDiscovery from '../../components/shimmer/ShimmerDiscovery';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastify } from '../../hooks/useToastify';
import { AnimatedHeart } from '../../components/shared/AnimatedHeart';
import {
  TourGuideProvider,
  TourGuideZone,
  useTourGuideController,
} from 'rn-tourguide';
import CustomTooltip from '../../components/tour/CustomTooltip';
import AnimatedFinger from '../../components/tour/AnimatedFinger';
import {
  hasCompletedTour,
  setTourCompleted,
  TOUR_KEYS,
  resetTour,
} from '../../utils/tourGuideHelper';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 1;
const CARD_HEIGHT = height * 1;
const SWIPE_THRESHOLD = 0.25 * width;
const VELOCITY_THRESHOLD = 800;

function ProductDiscoveryContent({ navigation, route }) {
  const { showToast } = useToastify();
  const { canStart, start, stop } = useTourGuideController();

  const rawInitialCategoryId = route?.params?.categoryId ?? null;
  const normalizeCategoryId = id => {
    if (id == null) return null;
    const s = String(id).trim();
    if (!s || s.toLowerCase() === 'all') return null;
    return s;
  };
  const initialCategoryId = normalizeCategoryId(rawInitialCategoryId);
  const initialCategoryNameRaw = route?.params?.categoryName ?? 'All';
  const startProductId = route?.params?.startProductId ?? null;

  const [selectedCategoryId, setSelectedCategoryId] =
    useState(initialCategoryId);
  const initialCategoryName =
    initialCategoryId == null ? 'All' : initialCategoryNameRaw;
  const [selectedCategoryName, setSelectedCategoryName] =
    useState(initialCategoryName);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const [currentStepNumber, setCurrentStepNumber] = useState(1);

  const [frontProduct, setFrontProduct] = useState(null);
  const [backProduct, setBackProduct] = useState(null);
  const [backDirection, setBackDirection] = useState(0);

  const frontX = useSharedValue(0);
  const backX = useSharedValue(0);
  const frontOpacity = useSharedValue(1);
  const backOpacity = useSharedValue(0);
  const currentIndex = useSharedValue(0);

  const insets = useSafeAreaInsets();

  const [optimisticWishlist, setOptimisticWishlist] = useState(new Set());
  const [optimisticCart, setOptimisticCart] = useState(new Set());

  const heartRef = useRef(null);
  const tourStartedRef = useRef(false);

  useEffect(() => {
    currentIndex.value = index;
  }, [index, currentIndex]);

  const {
    data: allProducts,
    loadingInitial,
    hasMore,
    fetchPage,
    loadingMore,
  } = usePaginatedQuery('products', 50, '', {
    column: 'created_at',
    ascending: false,
  });

  const CATEGORIES_PAGE_SIZE = 5;
  const { data: categoriesRaw, fetchPage: fetchCategories } = usePaginatedQuery(
    'category',
    CATEGORIES_PAGE_SIZE,
  );

  const categories = React.useMemo(() => {
    const list = categoriesRaw ?? [];
    return [{ id: null, name: 'All' }, ...list];
  }, [categoriesRaw]);

  const products = React.useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    if (selectedCategoryId === null) return allProducts;

    return allProducts.filter(product => {
      const productCategories = product.product_categories || [];
      return productCategories.some(pc => {
        const categoryId = pc.category_id || pc.category?.id;
        return String(categoryId) === String(selectedCategoryId);
      });
    });
  }, [allProducts, selectedCategoryId]);

  const {
    toggleWishlist,
    isInWishlist,
    getWishlist,
    loading: wishlistLoading,
  } = useWishlist(undefined, null);

  const {
    addToCart,
    isInCart,
    getCart,
    loading: cartLoading,
  } = useCart(undefined, null);

  useEffect(() => {
    const checkAndStartTour = async () => {
      if (tourStartedRef.current) return;
      if (!frontProduct) return;
      if (!canStart) return;

      const completed = await hasCompletedTour(TOUR_KEYS.PRODUCT_DISCOVERY);
      if (!completed) {
        tourStartedRef.current = true;
        setTimeout(() => {
          start();
        }, 800);
      }
      resetTour(TOUR_KEYS.PRODUCT_DISCOVERY);
    };

    checkAndStartTour();
  }, [frontProduct, canStart, start]);

  const handleTourFinish = async () => {
    await setTourCompleted(TOUR_KEYS.PRODUCT_DISCOVERY);
    stop();
  };

  useEffect(() => {
    const init = async () => {
      await fetchCategories?.(true);
      await fetchCategories?.();
    };
    init();
  }, []);

  useEffect(() => {
    fetchPage(true);
  }, []);

  useEffect(() => {
    frontX.value = 0;
    backX.value = 0;
    frontOpacity.value = 1;
    backOpacity.value = 0;
    setBackProduct(null);
    setBackDirection(0);
    setIndex(0);
    currentIndex.value = 0;
  }, [selectedCategoryId]);

  const total = products.length;
  const boundedIndex = Math.max(0, Math.min(index, total - 1));

  useEffect(() => {
    const fp = products?.[boundedIndex] ?? null;
    setFrontProduct(fp);
    setBackProduct(null);
    setBackDirection(0);
    frontX.value = 0;
    backX.value = 0;
    frontOpacity.value = 1;
    backOpacity.value = 0;
  }, [products, boundedIndex]);

  const startJumpedRef = React.useRef(false);
  useEffect(() => {
    if (!startProductId || startJumpedRef.current) return;
    if (!products?.length) return;
    const i = products.findIndex(p => p?.id === startProductId);
    if (i >= 0) {
      setIndex(i);
      currentIndex.value = i;
      startJumpedRef.current = true;
    }
  }, [startProductId, products]);

  const memoizedGetCart = useCallback(() => {
    getCart?.();
  }, [getCart]);

  const memoizedGetWishlist = useCallback(() => {
    getWishlist?.();
  }, [getWishlist]);

  useFocusEffect(
    useCallback(() => {
      memoizedGetCart();
      memoizedGetWishlist();
    }, [memoizedGetCart, memoizedGetWishlist]),
  );

  useEffect(() => {
    if (!hasMore || loadingInitial || loadingMore) return;
    if (
      allProducts &&
      allProducts.length > 0 &&
      index >= Math.max(allProducts.length - 10, 0)
    ) {
      fetchPage();
    }
  }, [index, hasMore, loadingInitial, loadingMore, allProducts?.length]);

  const getImageUrl = p => p?.image_url;

  const handleHeartPress = async () => {
    if (!frontProduct) return;

    const productId = frontProduct.id;
    const wasInWishlist =
      isInWishlist(productId) || optimisticWishlist.has(productId);

    if (!wasInWishlist) {
      setOptimisticWishlist(prev => new Set([...prev, productId]));
      heartRef.current?.animate();
      await toggleWishlist(frontProduct);
      setOptimisticWishlist(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    } else {
      navigation.navigate('WishlistScreen');
    }
  };

  const handleSwipeWishlist = async () => {
    if (!frontProduct) return;

    const productId = frontProduct.id;
    const wasInWishlist =
      isInWishlist(productId) || optimisticWishlist.has(productId);

    if (!wasInWishlist) {
      heartRef.current?.animate();
      setOptimisticWishlist(prev => new Set([...prev, productId]));
    } else {
      setOptimisticWishlist(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }

    await toggleWishlist(frontProduct);
    setOptimisticWishlist(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  };

  const currentIsInWishlist = frontProduct
    ? optimisticWishlist.has(frontProduct.id) || isInWishlist(frontProduct.id)
    : false;

  const jsSetNeighbor = (dir, iNeighbor) => {
    const p = products?.[iNeighbor] ?? null;
    if (!p) return;
    setBackDirection(dir);
    setBackProduct(p);
    if (dir === -1) {
      backX.value = width;
      backOpacity.value = 1;
    } else if (dir === 1) {
      backX.value = -width;
      backOpacity.value = 1;
    }
  };

  const jsCommitIndex = iNew => {
    setIndex(iNew);
  };

  const jsSwapCards = () => {
    setFrontProduct(backProduct);
    setBackProduct(null);
    setBackDirection(0);
  };

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(setPickerOpen)(false);
    },
    onActive: e => {
      frontX.value = e.translationX;

      if (e.translationX < 0) {
        const iNext = boundedIndex + 1;
        if (iNext < total && backDirection !== -1) {
          runOnJS(jsSetNeighbor)(-1, iNext);
        }
        backX.value = Math.max(0, width + e.translationX * 0.85);
      } else if (e.translationX > 0) {
        const iPrev = boundedIndex - 1;
        if (iPrev >= 0 && backDirection !== 1) {
          runOnJS(jsSetNeighbor)(1, iPrev);
        }
        backX.value = Math.min(0, -width + e.translationX * 0.85);
      } else {
        backX.value = 0;
      }
    },
    onEnd: e => {
      const dx = e.translationX;
      const vx = e.velocityX;
      const dy = e.translationY;
      const vy = e.velocityY;

      const goNext = dx < -SWIPE_THRESHOLD || vx < -VELOCITY_THRESHOLD;
      const goPrev = dx > SWIPE_THRESHOLD || vx > VELOCITY_THRESHOLD;
      const goUp = dy < -SWIPE_THRESHOLD * 0.6 || vy < -VELOCITY_THRESHOLD;
      const goDown = dy > SWIPE_THRESHOLD * 0.6 || vy > VELOCITY_THRESHOLD;

      const iNow = currentIndex.value;
      const totalNow = total;

      if (goNext && iNow < totalNow - 1) {
        frontX.value = withTiming(-width, { duration: 180 });
        backX.value = withTiming(0, { duration: 180 });

        frontOpacity.value = withTiming(0, { duration: 180 }, finished => {
          if (!finished) return;
          const iNew = Math.min(iNow + 1, totalNow - 1);
          runOnJS(jsCommitIndex)(iNew);
          runOnJS(jsSwapCards)();
          frontX.value = 0;
          backX.value = 0;
          frontOpacity.value = withTiming(1, { duration: 100 });
          backOpacity.value = 0;
        });
        return;
      }

      if (goPrev && iNow > 0) {
        frontX.value = withTiming(width, { duration: 180 });
        backX.value = withTiming(0, { duration: 180 });

        frontOpacity.value = withTiming(0, { duration: 180 }, finished => {
          if (!finished) return;
          const iNew = Math.max(iNow - 1, 0);
          runOnJS(jsCommitIndex)(iNew);
          runOnJS(jsSwapCards)();
          frontX.value = 0;
          backX.value = 0;
          frontOpacity.value = withTiming(1, { duration: 100 });
          backOpacity.value = 0;
        });
        return;
      }

      if (goUp && frontProduct) {
        runOnJS(handleSwipeWishlist)();
        frontX.value = withSpring(0);
        backX.value = withSpring(
          backDirection === -1 ? width : backDirection === 1 ? -width : 0,
        );
        backOpacity.value = withSpring(0);
        return;
      }
      if (goDown && frontProduct) {
        runOnJS(addToCart)(frontProduct);
        frontX.value = withSpring(0);
        backX.value = withSpring(
          backDirection === -1 ? width : backDirection === 1 ? -width : 0,
        );
        backOpacity.value = withSpring(0);
        return;
      }

      frontX.value = withSpring(0);
      backX.value = withSpring(
        backDirection === -1 ? width : backDirection === 1 ? -width : 0,
        {},
        () => {
          backOpacity.value = 0;
          runOnJS(setBackProduct)(null);
          runOnJS(setBackDirection)(0);
        },
      );
    },
  });

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: frontX.value },
      { rotateZ: `${(frontX.value / width) * 18}deg` },
    ],
    opacity: frontOpacity.value,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: backX.value },
      { rotateZ: `${(backX.value / width) * 6}deg` },
    ],
    opacity: backOpacity.value,
  }));

  const hasCards = products.length > 0 && !!frontProduct;
  const showNoProducts = !loadingInitial && products.length === 0;

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        <StatusBar hidden={false} />
        {loadingInitial && <ShimmerDiscovery />}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.headerButton, { paddingLeft: 0 }]}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
              style={styles.headerGradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Zone 1: Category Filter */}
          <TourGuideZone
            zone={1}
            text="Category Filter"
            shape="rectangle"
            borderRadius={8}
            isTourGuide
          >
            <View collapsable={false}>
              <TouchableOpacity
                style={styles.centerPicker}
                onPress={() => setPickerOpen(v => !v)}
                activeOpacity={0.8}
              >
                <Text style={styles.headerText} numberOfLines={1}>
                  {selectedCategoryName} • {total > 0 ? boundedIndex + 1 : 0} of{' '}
                  {total}
                </Text>
                <Ionicons
                  name={pickerOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </TourGuideZone>

          <View style={styles.rightHeaderButtons}>
            {/* Zone 2: Wishlist Button */}
            <TourGuideZone zone={2} text="Wishlist" shape="circle" isTourGuide>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.navigate('WishlistScreen')}
              >
                <LinearGradient
                  colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
                  style={styles.headerGradientButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="heart-outline" size={24} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </TourGuideZone>

            {/* Zone 3: Product Details */}
            <TourGuideZone
              zone={3}
              text="Product Details"
              shape="circle"
              isTourGuide
            >
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setBottomSheetVisible(true)}
                disabled={!frontProduct}
              >
                <LinearGradient
                  colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
                  style={styles.headerGradientButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={28}
                    color={frontProduct ? '#fff' : '#666'}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </TourGuideZone>
          </View>
        </View>

        {pickerOpen && (
          <View style={styles.pickerSheet}>
            <FlatList
              data={categories}
              keyExtractor={c => (c && c.id != null ? String(c.id) : 'all')}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    const nid = normalizeCategoryId(
                      item.id == null ? null : item.id,
                    );
                    setSelectedCategoryId(nid);
                    setSelectedCategoryName(item.name ?? 'Category');
                    setPickerOpen(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>
                    {item.name ?? 'Category'}
                  </Text>
                  {((item.id === null && selectedCategoryId === null) ||
                    item.id === selectedCategoryId) && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              )}
              style={{ maxHeight: 5 * 52 }}
              showsVerticalScrollIndicator={false}
              onEndReached={() => fetchCategories?.()}
              onEndReachedThreshold={0.5}
            />
          </View>
        )}

        {backProduct && (
          <Animated.View style={[styles.productContainer, backStyle]}>
            <Animated.Image
              key={backProduct?.id}
              source={{ uri: getImageUrl(backProduct) }}
              style={styles.image}
              resizeMode="cover"
              fadeDuration={0}
            />
          </Animated.View>
        )}

        {hasCards ? (
          <PanGestureHandler onGestureEvent={panGestureHandler}>
            <Animated.View style={[styles.productContainer, frontStyle]}>
              {/* Zone 4: Swipe Left (Previous Product) */}
              <TourGuideZone
                zone={4}
                text="Previous Product"
                isTourGuide
                tooltipBottomOffset={-230}
              >
                {/* Zone 5: Swipe Right (Next Product) */}
                <TourGuideZone
                  zone={5}
                  text="Next Product"
                  isTourGuide
                  tooltipBottomOffset={-230}
                >
                  {/* Zone 6: Swipe Up (Add to Wishlist) */}
                  <TourGuideZone
                    zone={6}
                    text="Add to Wishlist"
                    isTourGuide
                    tooltipBottomOffset={-230}
                  >
                    {/* Zone 7: Swipe Down (Add to Cart) */}
                    <TourGuideZone
                      zone={7}
                      text="Add to Cart"
                      isTourGuide
                      tooltipBottomOffset={-230}
                    >
                      <Animated.Image
                        key={frontProduct?.id}
                        source={{ uri: getImageUrl(frontProduct) }}
                        style={styles.image}
                        resizeMode="contain"
                        fadeDuration={0}
                      />

                      {/* Animated Fingers for Zones 4-7 */}
                      <AnimatedFinger
                        direction="left"
                        visible={currentStepNumber === 4}
                      />
                      <AnimatedFinger
                        direction="right"
                        visible={currentStepNumber === 5}
                      />
                      <AnimatedFinger
                        direction="up"
                        visible={currentStepNumber === 6}
                      />
                      <AnimatedFinger
                        direction="down"
                        visible={currentStepNumber === 7}
                      />
                      <LinearGradient
                        colors={[
                          'rgba(0,0,0,0)',
                          'rgba(0,0,0,0.1)',
                          'rgba(0,0,0,0.3)',
                          'rgba(0,0,0,0.6)',
                          'rgba(0,0,0,0.85)',
                        ]}
                        locations={[0, 0.3, 0.5, 0.7, 1]}
                        style={[
                          styles.infoOverlay,
                          { paddingBottom: Math.max(40, insets.bottom + 16) },
                        ]}
                      >
                        <View style={styles.mainContainer}>
                          <View style={styles.wholeBackground}>
                            <View style={styles.detailsSection}>
                              <Text
                                style={styles.productName}
                                numberOfLines={2}
                                onPress={() => setBottomSheetVisible(true)}
                              >
                                {frontProduct?.name || 'Unknown Product'}
                              </Text>

                              <Text style={styles.productPrice}>
                                {require('../../utils/formatCurrency').default(
                                  frontProduct?.price,
                                ) || '0.00'}
                              </Text>

                              {frontProduct?.description ? (
                                <Text
                                  style={styles.productDescription}
                                  numberOfLines={3}
                                  onPress={() => setBottomSheetVisible(true)}
                                >
                                  {frontProduct.description}
                                </Text>
                              ) : null}
                            </View>

                            <View style={styles.iconsSection}>
                              {/* Zone 8: Quick Wishlist */}
                              <TourGuideZone
                                zone={8}
                                text="Quick Wishlist"
                                shape="circle"
                                borderRadius={24}
                                isTourGuide
                              >
                                <TouchableOpacity
                                  style={styles.actionIconButton}
                                  onPress={handleHeartPress}
                                  activeOpacity={0.7}
                                >
                                  <AnimatedHeart
                                    ref={heartRef}
                                    isFavorite={currentIsInWishlist}
                                    size={32}
                                    color="#4fc3f7"
                                    outlineColor="#fff"
                                  />
                                </TouchableOpacity>
                              </TourGuideZone>
                            </View>
                          </View>
                        </View>
                      </LinearGradient>
                    </TourGuideZone>
                  </TourGuideZone>
                </TourGuideZone>
              </TourGuideZone>
            </Animated.View>
          </PanGestureHandler>
        ) : showNoProducts ? (
          <View style={styles.noMoreCards}>
            <Ionicons name="bag-outline" size={64} color="#666" />
            <Text style={styles.noMoreCardsText}>
              {selectedCategoryId == null
                ? 'No products available'
                : `No products in ${selectedCategoryName}`}
            </Text>
            <Text style={styles.noMoreCardsSubtext}>
              Try selecting a different category
            </Text>
          </View>
        ) : null}

        <ProductDetailsBottomSheet
          product={frontProduct}
          visible={bottomSheetVisible}
          onClose={() => setBottomSheetVisible(false)}
          onAddToWishlist={() => toggleWishlist(frontProduct)}
          onAddToCart={() => addToCart(frontProduct)}
          isInWishlist={frontProduct ? isInWishlist(frontProduct.id) : false}
          isInCart={frontProduct ? isInCart(frontProduct.id) : false}
          navigation={navigation}
        />
      </View>
    </GestureHandlerRootView>
  );
}

export default function ProductDiscoveryScreen({ navigation, route }) {
  return (
    <TourGuideProvider
      tooltipComponent={props => (
        <CustomTooltip
          {...props}
          onStepChange={stepNumber => {
            // Track current step for animated finger
          }}
        />
      )}
      androidStatusBarVisible={true}
      preventOutsideInteraction={true}
      {...{
        backdropColor: 'rgba(0, 0, 0, 0.8)',
        verticalOffset: 0,
        stepNumbersEnabled: true,
        maskOffset: 10,
      }}
    >
      <ProductDiscoveryContent navigation={navigation} route={route} />
    </TourGuideProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#353F54',
  },
  header: {
    position: 'absolute',
    top: 25,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  rightHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 10,
  },
  headerGradientButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  centerPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  pickerSheet: {
    position: 'absolute',
    top: 90,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(20,20,20,0.96)',
    borderRadius: 12,
    paddingVertical: 8,
    zIndex: 12,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  productContainer: {
    position: 'absolute',
    top: (height - CARD_HEIGHT) / 2,
    left: (width - CARD_WIDTH) / 2,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    backgroundColor: '#353F54',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 55,
    left: 0,
    right: 0,
    height: 280,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  mainContainer: {
    width: '100%',
  },
  wholeBackground: {
    flexDirection: 'row',
    backgroundColor: 'rgba(42, 56, 71, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.25)',
    gap: 16,
    alignItems: 'flex-start',
  },
  detailsSection: {
    flex: 1,
    gap: 8,
  },
  iconsSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: 20,
    paddingTop: 0,
  },
  actionIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  productName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  productPrice: {
    color: '#4fc3f7',
    fontSize: 16,
    fontWeight: '700',
  },
  productDescription: {
    color: '#e0e0e0',
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.95,
  },
  noMoreCards: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  noMoreCardsText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  noMoreCardsSubtext: {
    color: '#999',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
});
