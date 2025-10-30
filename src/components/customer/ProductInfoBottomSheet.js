// src/components/customer/ProductInfoBottomSheet.js
import React, {
  useMemo,
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetFooter,
} from '@gorhom/bottom-sheet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const ProductInfoBottomSheet = forwardRef(
  (
    {
      product,
      snapPoints,
      onClose,
      onChange,
      showCloseButton = true,
      enablePanDownToClose = true,
      variant = 'discover', // 'discover' or 'details'
      onAddToCart,
      isInCart,
      navigation,
    },
    ref,
  ) => {
    const bottomSheetRef = useRef(null);
    const [activeTab, setActiveTab] = useState('description');
    const [currentSnapIndex, setCurrentSnapIndex] = useState(0);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      present: () => bottomSheetRef.current?.present(),
      close: () => bottomSheetRef.current?.close(),
      snapToIndex: index => bottomSheetRef.current?.snapToIndex(index),
    }));

    const handleSheetChange = useCallback(
      index => {
        setCurrentSnapIndex(index);
        if (index === -1 && enablePanDownToClose) {
          onClose?.();
        }
        onChange?.(index);
      },
      [onClose, onChange, enablePanDownToClose],
    );

    const productCategories = useMemo(() => {
      if (!product || !product.product_categories) return [];

      return product.product_categories
        .map(pc => ({
          id: pc.category_id || pc.category?.id,
          name: pc.category?.name || 'Unknown Category',
        }))
        .filter(cat => cat.id && cat.name);
    }, [product]);

    const handleCartButtonPress = useCallback(() => {
      if (isInCart) {
        onClose?.();
        navigation?.navigate('CartStack', {
          screen: 'CartScreen',
        });
      } else {
        onAddToCart?.();
      }
    }, [isInCart, onAddToCart, onClose, navigation]);

    // Render footer based on variant
    const renderFooter = useCallback(
      props => {
        // For discover variant: always show footer
        // For details variant: only show when expanded (index > 0)
        const shouldShowFooter = variant === 'discover' || currentSnapIndex > 0;

        if (!shouldShowFooter) return null;

        const { animatedFooterPosition, bottomInset = -20 } = props;
        return (
          <BottomSheetFooter
            animatedFooterPosition={animatedFooterPosition}
            bottomInset={bottomInset}
          >
            <View style={styles.footerContainer}>
              <View style={styles.priceSection}>
                <Text style={styles.footerPriceLabel}>Price</Text>
                <Text style={styles.footerPriceValue}>
                  {require('../../utils/formatCurrency').default(
                    product?.price,
                  )}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.fullWidthCartButton,
                  product?.quantity <= 0 && styles.disabledButton,
                ]}
                onPress={handleCartButtonPress}
                disabled={product?.quantity <= 0}
              >
                <LinearGradient
                  colors={
                    product?.quantity <= 0
                      ? ['#999', '#888']
                      : isInCart
                      ? ['#5fd4f7', '#4fc3f7', '#3aa5c7']
                      : ['#5fd4f7', '#4fc3f7', '#3aa5c7']
                  }
                  style={styles.cartButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cartButtonContent}>
                    <Text style={styles.cartButtonText}>
                      {product?.quantity <= 0
                        ? 'Out of Stock'
                        : isInCart
                        ? 'View in Cart'
                        : 'Add to Cart'}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BottomSheetFooter>
        );
      },
      [
        isInCart,
        handleCartButtonPress,
        product?.quantity,
        product?.price,
        variant,
        currentSnapIndex,
      ],
    );

    if (!product) return null;

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={variant === 'discover' ? -1 : 0}
        snapPoints={['30%', ...snapPoints ]}
        enablePanDownToClose={enablePanDownToClose}
        onChange={handleSheetChange}
        backgroundStyle={styles.bottomSheet}
        handleIndicatorStyle={styles.handle}
        footerComponent={renderFooter}
      >
        {/* Close Button (conditional) */}
        {showCloseButton && (
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Tab Section */}
        <View style={styles.tabContainer}>
          <View style={{ paddingBottom: 8 }}>
            <View style={styles.tabWrapper}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'description' && styles.activeTab,
                ]}
                onPress={() => setActiveTab('description')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'description' && styles.activeTabText,
                  ]}
                >
                  Description
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'specification' && styles.activeTab,
                ]}
                onPress={() => setActiveTab('specification')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'specification' && styles.activeTabText,
                  ]}
                >
                  Specification
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Scrollable Content */}
        <BottomSheetScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'description' ? (
            <View>
              <Text style={styles.productTitle}>{product.name}</Text>

              {product.description ? (
                <Text style={styles.productDescription}>
                  {product.description}
                </Text>
              ) : (
                <Text style={styles.noDataText}>No description available</Text>
              )}
            </View>
          ) : (
            <View>
              <Text style={styles.productTitle}>Specifications</Text>

              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Price:</Text>
                <Text style={styles.specValue}>
                  {require('../../utils/formatCurrency').default(product.price)}
                </Text>
              </View>

              {productCategories.length > 0 && (
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Categories:</Text>
                  <Text style={styles.specValue}>
                    {productCategories.map(cat => cat.name).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 12 }} />
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

export default ProductInfoBottomSheet;

const styles = StyleSheet.create({
  bottomSheet: {
    backgroundColor: '#2a3847',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  handle: {
    // display: 'none',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#2a3847',
  },
  closeButton: {
    padding: 5,
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    borderRadius: 8,
  },
  tabContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#2a3847',
    alignItems: 'center',
    zIndex: 10,
  },
  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    gap: 16,
  },
  tab: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.3)',
    borderLeftColor: 'rgba(0, 0, 0, 0.2)',
    borderRightColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 0,
  },
  activeTab: {
    backgroundColor: '#3a4a5a',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomColor: 'rgba(0, 0, 0, 0.2)',
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  activeTabText: {
    color: '#4fc3f7',
    fontWeight: '700',
    textShadowColor: 'rgba(79, 195, 247, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: '#2a3847',
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 15,
    color: '#e0e0e0',
    lineHeight: 22,
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 15,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79, 195, 247, 0.15)',
  },
  specLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#aaa',
  },
  specValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  footerContainer: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#2a3847',
    borderTopWidth: 1,
    borderTopColor: 'rgba(79, 195, 247, 0.15)',
    marginBottom: 20,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  footerPriceLabel: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
  },
  footerPriceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4fc3f7',
  },
  fullWidthCartButton: {
    width: '100%',
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 10,
  },
  cartButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  },
  cartButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
