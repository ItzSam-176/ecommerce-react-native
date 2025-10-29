// screens/customer/Home.js
import React, {
  useEffect,
  useMemo,
  useCallback,
  useState,
  useLayoutEffect,
  useRef,
} from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
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

const { width: screenWidth, height } = Dimensions.get('window');

export default function Home({ navigation, route }) {
  const flatListRef = useRef(null);
  const searchInputRef = useRef(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showCategoryChips, setShowCategoryChips] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');

  const [alert, setAlert] = useState({ visible: false });
  const showCustomAlert = (title, message, type = 'info', buttons = []) =>
    setAlert({ visible: true, title, message, type, buttons });
  const hideAlert = () => setAlert(p => ({ ...p, visible: false }));

  const {
    data: products,
    fetchPage: fetchProducts,
    loadingInitial: loadingProducts,
    error: productsError,
    reset: resetProducts,
  } = usePaginatedQuery('products', 50, debouncedSearchText, {
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

  // Debounce search text
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchText]);

  // Reset and refetch when debounced search text changes
  useEffect(() => {
    if (debouncedSearchText !== undefined) {
      fetchProducts(true);
    }
  }, [debouncedSearchText]);

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
        const result = await addToCart(p);
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
        const result = await toggleWishlist(p);
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

    const mapped = products.map(p => {
      const imageUri = p.image_url || p.imageurl || p.image || null;

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

    return mapped;
  }, [products, isInWishlist, isInCart, getQuantity, loadingCartIds]);

  const filteredProducts = useMemo(() => {
    if (!mappedProducts.length) return [];
    if (!visibleColumns || visibleColumns.length === 0) return mappedProducts;

    const visibleSet = new Set(visibleColumns.map(String));
    const filtered = mappedProducts.filter(p => {
      const cats = p.categories;
      if (!cats || cats.length === 0) {
        return visibleSet.has('others');
      }
      return cats.some(cid => visibleSet.has(String(cid)));
    });

    return filtered;
  }, [mappedProducts, visibleColumns]);

  const selectedCategories = useMemo(() => {
    if (!columns || columns.length === 0) return [];
    return columns
      .filter(c => visibleColumns.includes(String(c.key)))
      .map(c => ({ id: String(c.key), name: c.label }));
  }, [columns, visibleColumns]);

  const onPressProduct = useCallback(
    item => {
      navigation.navigate('ProductDiscoveryScreen', {
        startProductId: item.id,
      });
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

  const clearSearch = useCallback(() => {
    setSearchText('');
    searchInputRef.current?.focus();
  }, []);

  const toggleSearch = useCallback(() => {
    setShowSearchInput(prev => !prev);
    if (!showSearchInput) {
      // Will focus after next render via autoFocus
    } else {
      setSearchText('');
    }
  }, [showSearchInput]);

  useEffect(() => {
    const req = route?.params?.toggleSearchRequest;
    if (req) {
      setShowSearchInput(prev => !prev);
      navigation.setParams({ toggleSearchRequest: null });
    }
  }, [route?.params?.toggleSearchRequest]);

  // Update loading condition to not show full page loader during search
  if (loadingProducts && products.length === 0) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={require('../../assets/gradient-bg.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4fc3f7" />
            <Text style={styles.loadingText}>Loading products...</Text>
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
        {/* Search Input Section */}
        {showSearchInput && (
          <View style={styles.searchSection}>
            <View style={styles.searchInputContainer}>
              <Ionicons
                name="search-outline"
                size={20}
                color="#4fc3f7"
                style={styles.searchIcon}
              />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor="#999"
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                autoFocus={true}
              />
              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={clearSearch}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Filter Button Row */}
        <View style={styles.filterSection}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              onPress={() => {
                setColumnModalVisible(true);
              }}
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

        {!filteredProducts || filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {searchText
                ? `No products found for "${searchText}"`
                : visibleColumns.length > 0
                ? 'No products in selected categories'
                : 'No products available'}
            </Text>
            <Text style={styles.emptyMessage}>
              {searchText
                ? 'Try different search terms'
                : visibleColumns.length > 0
                ? 'Try selecting different categories'
                : 'Check back later for new products'}
            </Text>
            {(visibleColumns.length > 0 || searchText) && (
              <TouchableOpacity
                onPress={() => {
                  setVisibleColumns([]);
                  setSearchText('');
                }}
                style={styles.showAllButton}
              >
                <Text style={styles.showAllButtonText}>Show All Products</Text>
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
            renderItem={({ item }) => {
              return (
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
              );
            }}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            onEndReached={() => fetchProducts(false)}
            onEndReachedThreshold={0.5}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
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
  searchSection: {
    backgroundColor: 'rgba(42, 56, 71, 0.5)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#fff',
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
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
