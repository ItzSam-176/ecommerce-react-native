// screens/customer/Home.js
import React, {
  useEffect,
  useMemo,
  useCallback,
  useState,
  useRef,
} from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Animated,
  StatusBar,
  Platform,
  Keyboard,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import ProductCard from '../../components/customer/ProductCard';
import CategoryChips from '../../components/shared/CategoryChips';
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery';
import { useWishlist } from '../../hooks/useWishlist';
import { useCart } from '../../hooks/useCart';
import CustomAlert from '../../components/informative/CustomAlert';
import ColumnSelectorModal from '../../components/admin/ColumnSelectorModal';
import ScrollToTopButton from '../../components/shared/ScrollToTopButton';
import ShimmerProductsCard from '../../components/shimmer/ShimmerProductsCard';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { getProductViewMode } from '../../utils/userPreferences';
import { getProductPrimaryImage } from '../../utils/productImageHelper';

const { width: screenWidth, height } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 88 : 56;
const STATUS_BAR_HEIGHT =
  Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function Home({ navigation, route }) {
  const flatListRef = useRef(null);
  const searchInputRef = useRef(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showCategoryChips, setShowCategoryChips] = useState(false);

  // ✅ REFACTORED: Animated search states (removed searchResults and isSearchLoading)
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchAnimation = useRef(new Animated.Value(0)).current;
  const [searchText, setSearchText] = useState('');

  // ✅ NEW: Debounce state for shimmer effect only
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const [alert, setAlert] = useState({ visible: false });
  const showCustomAlert = (title, message, type = 'info', buttons = []) =>
    setAlert({ visible: true, title, message, type, buttons });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

  const {
    data: products,
    fetchPage: fetchProducts,
    loadingInitial: loadingProducts,
    error: productsError,
  } = usePaginatedQuery('products', 50, '', {
    column: 'created_at',
    ascending: false,
  });

  const { data: category, fetchPage: fetchCategories } = usePaginatedQuery(
    'category',
    100,
  );

  const { toggleWishlist, isInWishlist, getWishlist } = useWishlist(
    undefined,
    showCustomAlert,
    navigation,
  );

  const { addToCart, isInCart, getCart, getQuantity } = useCart(
    undefined,
    showCustomAlert,
    navigation,
  );

  const [loadingCartIds, setLoadingCartIds] = useState(new Set());
  const [loadingWishIds, setLoadingWishIds] = useState(new Set());

  const [isColumnModalVisible, setColumnModalVisible] = useState(false);
  const [columns, setColumns] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);

  useEffect(() => {
    fetchProducts(true);
    fetchCategories(true);
    getCart();
    getWishlist();
  }, []);

  useEffect(() => {
    if (route?.params?.openSearchNow) {
      openSearch();
      navigation.setParams({ openSearchNow: false });
    }
  }, [route?.params?.openSearchNow]);

  const openSearch = () => {
    setIsSearchActive(true);
    navigation.getParent()?.setParams({ hideTabBar: true });
    Animated.spring(searchAnimation, {
      toValue: 1,
      useNativeDriver: false,
      tension: 65,
      friction: 9,
    }).start(() => {
      searchInputRef.current?.focus();
    });
  };

  const closeSearch = () => {
    Keyboard.dismiss();
    setSearchText('');
    setIsTyping(false);
    navigation.getParent()?.setParams({ hideTabBar: false });

    Animated.sequence([
      Animated.timing(searchAnimation, {
        toValue: 0.5,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(searchAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsSearchActive(false);
      }
    });
  };

  // Search animation interpolations
  const searchContainerHeight = searchAnimation.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, HEADER_HEIGHT, height],
    extrapolate: 'clamp',
  });

  const searchContainerTop = searchAnimation.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [STATUS_BAR_HEIGHT, STATUS_BAR_HEIGHT, 0],
    extrapolate: 'clamp',
  });

  const searchContainerOpacity = searchAnimation.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });

  const inputOpacity = searchAnimation.interpolate({
    inputRange: [0, 0.2, 0.4, 1],
    outputRange: [0, 0, 0.8, 1],
    extrapolate: 'clamp',
  });

  const inputWidth = searchAnimation.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [screenWidth - 80, screenWidth - 80, screenWidth - 80],
    extrapolate: 'clamp',
  });

  const iconOpacity = searchAnimation.interpolate({
    inputRange: [0, 0.1, 0.2],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const closeIconOpacity = searchAnimation.interpolate({
    inputRange: [0.3, 0.5, 1],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const contentOpacity = searchAnimation.interpolate({
    inputRange: [0, 0.2, 0.4],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const req = route?.params?.openColumnModalRequest;
    if (req) {
      setColumnModalVisible(true);
      navigation.setParams({ openColumnModalRequest: null });
    }
  }, [route?.params?.openColumnModalRequest]);

  useEffect(() => {
    if (!category || category.length === 0) return;

    const cols = category.map(c => ({
      key: String(c.id ?? c.category_id ?? c.slug ?? ''),
      label: c.name ?? c.title ?? c.label ?? 'Category',
    }));

    if (!cols.find(x => x.key === 'others')) {
      cols.push({ key: 'others', label: 'Others' });
    }

    setColumns(cols);
    setVisibleColumns(prev => prev ?? []);
  }, [category]);

  const catMap = useMemo(() => {
    const map = new Map();
    for (const c of category ?? []) {
      const id = String(c.id ?? c.category_id ?? c.slug ?? '');
      if (!id) continue;
      const name = c.name ?? c.title ?? c.label ?? 'Others';
      map.set(id, name);
    }
    return map;
  }, [category]);

  const addToCartLocal = useCallback(
    async p => {
      setLoadingCartIds(prev => new Set(prev).add(p.id));
      try {
        await addToCart(p);
      } catch (e) {
        console.error('[Add to cart error]:', e);
        showCustomAlert('Cart', e?.message ?? 'Failed to add to cart', 'error');
      } finally {
        setLoadingCartIds(prev => {
          const next = new Set(prev);
          next.delete(p.id);
          return next;
        });
      }
    },
    [addToCart],
  );

  const toggleWishlistLocal = useCallback(
    async p => {
      setLoadingWishIds(prev => new Set(prev).add(p.id));
      try {
        await toggleWishlist(p);
      } catch (e) {
        console.error('[Wishlist error]:', e);
        showCustomAlert(
          'Wishlist',
          e?.message ?? 'Failed to update wishlist',
          'error',
        );
      } finally {
        setLoadingWishIds(prev => {
          const next = new Set(prev);
          next.delete(p.id);
          return next;
        });
      }
    },
    [toggleWishlist],
  );

  const mappedProducts = useMemo(() => {
    if (!products) return [];

    return products.map(p => {
      const imageUri = getProductPrimaryImage(p);

      return {
        id: p.id,
        name: p.name ?? 'Unnamed Product',
        price: Number(p.price ?? 0),
        description: p.description ?? '',
        imageUri: imageUri,
        quantity: Number(p.quantity ?? 0),
        categories:
          p.product_categories?.map(pc => String(pc.category_id)) ?? [],
        isFavorite: isInWishlist(p.id),
        inCart: isInCart(p.id),
        cartQuantity: getQuantity(p.id),
        disabledAdd: (p.quantity ?? 0) <= 0 || isInCart(p.id),
        loadingAdd: loadingCartIds.has(p.id),
        raw: p,
      };
    });
  }, [products, isInWishlist, isInCart, getQuantity, loadingCartIds]);

  const filteredProducts = useMemo(() => {
    if (!mappedProducts.length) return [];
    if (!visibleColumns || visibleColumns.length === 0) return mappedProducts;

    const visibleSet = new Set(visibleColumns.map(String));
    return mappedProducts.filter(p => {
      const cats = p.categories;
      if (!cats || cats.length === 0) {
        return visibleSet.has('others');
      }
      return cats.some(cid => visibleSet.has(String(cid)));
    });
  }, [mappedProducts, visibleColumns]);

  // ✅ NEW: Instant search results using useMemo (NO loading states!)
  const searchResults = useMemo(() => {
    if (!searchText.trim() || !mappedProducts.length) {
      return [];
    }

    const query = searchText.toLowerCase();
    const filtered = mappedProducts.filter(p =>
      p.name.toLowerCase().includes(query),
    );

    console.log(
      `[Search] Query: "${searchText}" | Results: ${filtered.length}`,
    );
    return filtered;
  }, [searchText, mappedProducts]);

  const selectedCategories = useMemo(() => {
    if (!columns || columns.length === 0) return [];
    return columns
      .filter(c => visibleColumns.includes(String(c.key)))
      .map(c => ({ id: String(c.key), name: c.label }));
  }, [columns, visibleColumns]);

  const onPressProduct = useCallback(
    async item => {
      try {
        const mode = await getProductViewMode();

        if (mode === 'traditional') {
          navigation.navigate('ProductDetailsScreen', {
            productId: item.id,
          });
        } else {
          navigation.navigate('ProductDiscoveryScreen', {
            startProductId: item.id,
          });
        }
      } catch (error) {
        console.error('[Error getting view mode]:', error);
        navigation.navigate('ProductDiscoveryScreen', {
          startProductId: item.id,
        });
      }
    },
    [navigation],
  );

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
  }, []);

  const handleScroll = useCallback(event => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setShowScrollToTop(scrollY > 200);
  }, []);

  // ✅ ADD THIS:
  const handleSearchTextChange = useCallback(text => {
    setSearchText(text);

    if (text.trim()) {
      setIsTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 300);
    } else {
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, []);

  const renderSearchResult = useCallback(
    ({ item }) => {
      const imageUri = getProductPrimaryImage(item.raw || item);
      return (
        <View style={styles.searchProductCardWrapper}>
          <ProductCard
            id={item.id}
            name={item.name}
            description={item.description}
            price={item.price}
            imageUri={imageUri}
            currencySymbol="₹"
            isFavorite={item.isFavorite}
            inCart={item.inCart}
            cartQuantity={item.cartQuantity}
            disabledAdd={item.disabledAdd}
            loadingAdd={item.loadingAdd}
            onToggleFavorite={() => toggleWishlistLocal(item.raw || item)}
            onAddToCart={() => addToCartLocal(item.raw || item)}
            onPress={() => {
              closeSearch();
              onPressProduct(item);
            }}
          />
        </View>
      );
    },
    [toggleWishlistLocal, addToCartLocal, onPressProduct, closeSearch],
  );

  if (loadingProducts && (!products || products.length === 0)) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={require('../../assets/gradient-bg.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.filterSection}>
            <View style={styles.filterRow}>
              <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
                style={styles.filterButtonShimmer}
              />
              <View style={styles.categoryShimmerRow}>
                <ShimmerPlaceholder
                  LinearGradient={LinearGradient}
                  shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
                  style={styles.categoryChipShimmer}
                />
                <ShimmerPlaceholder
                  LinearGradient={LinearGradient}
                  shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
                  style={styles.categoryChipShimmer}
                />
                <ShimmerPlaceholder
                  LinearGradient={LinearGradient}
                  shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
                  style={styles.categoryChipShimmer}
                />
              </View>
            </View>
          </View>

          <View style={styles.shimmerContainer}>
            <View style={styles.shimmerGrid}>
              <ShimmerProductsCard count={10} variant="home" />
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }

  if (productsError) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={require('../../assets/gradient-bg.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Failed to load products</Text>
            <Text style={styles.errorMessage}>{productsError}</Text>
            <TouchableOpacity
              onPress={() => fetchProducts(true)}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
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
        {/* ✅ Animated Search Overlay */}
        {(isSearchActive || searchAnimation._value > 0.1) && (
          <Animated.View
            style={[
              styles.searchContainer,
              {
                height: searchContainerHeight,
                top: searchContainerTop,
                opacity: searchContainerOpacity,
              },
            ]}
          >
            {/* Search Header with Input */}
            <View style={styles.searchHeader}>
              <Animated.View
                style={[
                  styles.searchInputContainer,
                  {
                    opacity: inputOpacity,
                    width: inputWidth,
                  },
                ]}
              >
                <Ionicons name="search" size={20} color="#999" />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  placeholder="Search products..."
                  placeholderTextColor="#999"
                  value={searchText}
                  onChangeText={handleSearchTextChange}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => handleSearchTextChange('')}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </Animated.View>

              <Animated.View
                style={[styles.iconWrapper, { opacity: iconOpacity }]}
                pointerEvents="none"
              >
                <Ionicons name="search" size={24} color="#fff" />
              </Animated.View>

              <Animated.View style={{ opacity: closeIconOpacity }}>
                <TouchableOpacity
                  onPress={closeSearch}
                  style={styles.closeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* ✅ REFACTORED: Search Results with instant filtering */}
            <Animated.View
              style={[styles.searchContent, { opacity: contentOpacity }]}
            >
              {searchText.trim() === '' ? (
                // Empty state
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color="#8a9fb5" />
                  <Text style={styles.emptyStateTitle}>Start Searching</Text>
                  <Text style={styles.emptyStateText}>
                    Type product name to search
                  </Text>
                </View>
              ) : isTyping ? (
                // Optional shimmer while typing (for UX smoothness)
                <View style={styles.shimmerContainer}>
                  <View style={styles.shimmerGrid}>
                    {[1, 2].map(key => (
                      <View
                        key={key}
                        style={[
                          styles.productCardWrapper,
                          styles.searchProductWrapper,
                        ]}
                      >
                        <ShimmerProductsCard variant="home" />
                      </View>
                    ))}
                  </View>
                </View>
              ) : searchResults.length > 0 ? (
                // Results found - show instantly
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={(item, index) =>
                    item.id?.toString() || `${index}`
                  }
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  numColumns={2}
                  columnWrapperStyle={styles.searchColumnWrapper}
                  contentContainerStyle={styles.searchFlatListContent}
                />
              ) : (
                // No results - show instantly after typing stops
                <View style={styles.emptyState}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={48}
                    color="#8a9fb5"
                  />
                  <Text style={styles.emptyStateTitle}>No Results</Text>
                  <Text style={styles.emptyStateText}>
                    Try searching for something else
                  </Text>
                </View>
              )}
            </Animated.View>
          </Animated.View>
        )}

        {/* Filter Button Row */}
        {!isSearchActive && (
          <View style={styles.filterSection}>
            <View style={styles.filterRow}>
              <TouchableOpacity
                onPress={() => setColumnModalVisible(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
                  style={styles.filterButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Image
                    source={require('../../assets/four_squares.png')}
                    style={styles.filterIcon}
                  />
                </LinearGradient>
              </TouchableOpacity>

              {showCategoryChips && selectedCategories.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipsScroll}
                  contentContainerStyle={styles.chipsScrollContent}
                >
                  <CategoryChips
                    categories={selectedCategories}
                    onRemove={cat =>
                      setVisibleColumns(prev =>
                        (prev || []).filter(k => String(k) !== String(cat.id)),
                      )
                    }
                  />
                </ScrollView>
              )}
            </View>
          </View>
        )}

        {/* Products List */}
        {!isSearchActive && (
          <>
            {!loadingProducts &&
            (!filteredProducts || filteredProducts.length === 0) ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>
                  {visibleColumns.length > 0
                    ? 'No products in selected categories'
                    : 'No products available'}
                </Text>
                <Text style={styles.emptyMessage}>
                  {visibleColumns.length > 0
                    ? 'Try selecting different categories'
                    : 'Check back later for new products'}
                </Text>
                {visibleColumns.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setVisibleColumns([])}
                    style={styles.showAllButton}
                  >
                    <Text style={styles.showAllButtonText}>
                      Show All Products
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={filteredProducts}
                keyExtractor={item => String(item.id)}
                numColumns={2}
                key="two-column-grid"
                renderItem={({ item }) => (
                  <View style={styles.productCardWrapper}>
                    <ProductCard
                      id={item.id}
                      name={item.name}
                      description={item.description}
                      price={item.price}
                      imageUri={item.imageUri}
                      currencySymbol="₹"
                      isFavorite={item.isFavorite}
                      inCart={item.inCart}
                      cartQuantity={item.cartQuantity}
                      disabledAdd={item.disabledAdd}
                      loadingAdd={item.loadingAdd}
                      onToggleFavorite={() => toggleWishlistLocal(item)}
                      onAddToCart={() => addToCartLocal(item)}
                      onPress={() => onPressProduct(item)}
                    />
                  </View>
                )}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.flatListContent}
                onEndReached={() => fetchProducts(false)}
                onEndReachedThreshold={0.5}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              />
            )}
          </>
        )}

        <ScrollToTopButton visible={showScrollToTop} onPress={scrollToTop} />
        <CustomAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          type={alert.type}
          buttons={
            alert.buttons?.length
              ? alert.buttons
              : [{ text: 'OK', onPress: hideAlert }]
          }
          onBackdropPress={hideAlert}
        />
        {isColumnModalVisible && (
          <ColumnSelectorModal
            visible={isColumnModalVisible}
            onClose={() => setColumnModalVisible(false)}
            columns={columns}
            visibleColumns={visibleColumns}
            onApply={newSelection => {
              setVisibleColumns(newSelection);
              setShowCategoryChips(newSelection.length > 0);
            }}
            resetColumns={() => {
              setVisibleColumns([]);
              setShowCategoryChips(false);
            }}
          />
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
  headerBar: {
    height: HEADER_HEIGHT,
    backgroundColor: '#353F54',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: STATUS_BAR_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  searchButton: {
    padding: 8,
  },
  searchContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 999,
      },
    }),
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#353F54',
    minHeight: 70,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 0,
  },
  iconWrapper: {
    position: 'absolute',
    left: 16,
    top: STATUS_BAR_HEIGHT + (HEADER_HEIGHT - STATUS_BAR_HEIGHT - 40) / 2,
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchContent: {
    flex: 1,
    paddingTop: 16,
    backgroundColor: '#353F54',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8a9fb5',
    textAlign: 'center',
  },
  searchProductCardWrapper: {
    flex: 1,
    margin: 6,
  },
  searchColumnWrapper: {
    justifyContent: 'space-evenly',
    paddingLeft: 25,
  },
  searchFlatListContent: {
    paddingBottom: 20,
  },
  shimmerContainer: {
    flex: 1,
    paddingTop: 8,
    backgroundColor: '#353F54',
  },
  shimmerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingLeft: 25,
  },
  searchProductWrapper: {
    width: '48%',
    marginVertical: 8,
  },
  filterSection: {
    backgroundColor: 'rgba(42, 56, 71, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
    minWidth: 30,
  },
  filterIcon: {
    width: 18,
    height: 18,
    tintColor: '#fff',
  },
  filterButtonShimmer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#4a5568',
  },
  categoryShimmerRow: {
    flex: 1,
    flexDirection: 'row',
    marginRight: 12,
    gap: 8,
  },
  categoryChipShimmer: {
    width: 80,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4a5568',
  },
  chipsScroll: {
    flex: 1,
    marginRight: 12,
  },
  chipsScrollContent: {
    alignItems: 'center',
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
    fontSize: 18,
    color: '#ff4458',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorMessage: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4fc3f7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyMessage: {
    color: '#ccc',
    textAlign: 'center',
  },
  showAllButton: {
    backgroundColor: '#4fc3f7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  showAllButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  productCardWrapper: {
    flex: 1,
    margin: 6,
  },
  columnWrapper: {
    justifyContent: 'space-evenly',
    paddingLeft: 25,
  },
  flatListContent: {
    paddingBottom: 20,
  },
});
