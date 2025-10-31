import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase/supabase';
import ProductCard from '../../components/admin/ProductsCard';
import SortBottomSheet from '../../components/admin/SortBottomSheet';
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery';
import ScrollToTopButton from '../../components/shared/ScrollToTopButton';
import Input from '../../components/Form/Input';
import { useSort } from '../../hooks/useSort';
import ShimmerProductsCard from '../../components/shimmer/ShimmerProductsCard';
import { useToastify } from '../../hooks/useToastify';
import { useAlert } from '../../components/informative/AlertProvider';

export default function ProductsScreen({ navigation, route }) {
  const flatListRef = useRef(null);
  const [isSortVisible, setSortVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const hasLoadedInitially = useRef(false);
  const [refreshing, setRefreshing] = useState(false);

  const { sortKey, sortConfig, applySort } = useSort();
  const { showToast } = useToastify();
  const { showAlert, showConfirm } = useAlert();

  const {
    data: products,
    loadingInitial,
    loadingMore,
    hasMore,
    fetchPage,
    reset,
    setData,
    pageSize,
    totalFetched,
  } = usePaginatedQuery('products', 10, debouncedSearchText, sortConfig);

  useEffect(() => {
    if (route.params?.showSearchInput !== undefined) {
      setShowSearchInput(route.params.showSearchInput);
    }
  }, [route.params?.showSearchInput]);

  useEffect(() => {
    if (!showSearchInput) setSearchText('');
  }, [showSearchInput]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchText]);

  useEffect(() => {
    reset();
    fetchPage(true);
    setSortVisible(false);
    hasLoadedInitially.current = true;
  }, [sortConfig, debouncedSearchText]);

  // Listen for navigation events
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if coming back from Add/Edit screen
      if (navigation.getState().routes.some(r => r.params?.productChanged)) {
        reset();
        fetchPage(true);

        // Clear the flag
        navigation.setParams({ productChanged: false });
      } else if (!hasLoadedInitially.current) {
        reset();
        fetchPage(true);
        hasLoadedInitially.current = true;
      }
    });

    return unsubscribe;
  }, [navigation]);

  const handleScroll = useCallback(e => {
    const offsetY = e.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 200);
  }, []);

  useEffect(() => {
    if (route.params?.showSort) {
      setSortVisible(true);
      navigation.setParams({ showSort: false });
    }
  }, [route.params?.showSort]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    reset();
    await fetchPage(true);
    setRefreshing(false);
  }, [reset, fetchPage]);

  const confirmDelete = useCallback(
    id => {
      showConfirm(
        'Delete product',
        'Delete this product?',
        () => handleDelete(id),
        { confirmText: 'Delete', destructive: true },
      );
    },
    [showConfirm],
  );

  const handleDelete = useCallback(
    async id => {
      try {
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error('[Error fetching product]:', fetchError);
          showAlert('Error', fetchError.message, 'error');
          return;
        }

        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('id', id);

        if (deleteError) {
          console.error('[Error deleting product]:', deleteError);
          showAlert('Error', deleteError.message, 'error');
          return;
        }

        setData(prevProducts => prevProducts.filter(p => p.id !== id));
        showToast('Product deleted successfully', '', 'success');

        if (product.image_folder) {
          deleteProductImages(product.image_folder);
        }
      } catch (err) {
        console.error('[Delete error]:', err);
        showToast(
          'Something went wrong while deleting the product.',
          '',
          'error',
        );
      }
    },
    [showAlert, showToast, setData],
  );

  // [Info]: Separate function for storage cleanup (runs in background)
  const deleteProductImages = useCallback(async imageFolder => {
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('product-images')
        .list(imageFolder);

      if (listError) {
        console.error('[Error listing files]:', listError.message);
        return;
      }

      if (!files || files.length === 0) {
        return;
      }

      const filePaths = files.map(file => `${imageFolder}/${file.name}`);

      const { error: removeError } = await supabase.storage
        .from('product-images')
        .remove(filePaths);

      if (removeError) {
        console.error('[Error deleting files]:', removeError.message);
      }
    } catch (err) {
      console.error('[Storage cleanup error]:', err);
    }
  }, []);

  return (
    <View style={styles.container}>
      {showSearchInput && (
        <Input
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search products"
          style={{ marginBottom: 10 }}
        />
      )}

      <FlatList
        ref={flatListRef}
        data={products}
        keyExtractor={(item, index) => item.id.toString()}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onEdit={() =>
              navigation.navigate('AddProductsScreen', { product: item })
            }
            onDelete={() => confirmDelete(item.id)}
          />
        )}
        onEndReached={() => {
          if (hasMore && !loadingMore && totalFetched >= pageSize) {
            fetchPage();
          }
        }}
        onEndReachedThreshold={0.2}
        onScroll={handleScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4fc3f7']}
            tintColor="#4fc3f7"
          />
        }
        ListHeaderComponent={
          loadingInitial ? <ShimmerProductsCard count={8} /> : null
        }
        ListFooterComponent={
          loadingMore ? <ShimmerProductsCard count={2} /> : null
        }
        contentContainerStyle={{
          paddingBottom: 75,
          paddingTop: 10,
        }}
      />

      <ScrollToTopButton
        visible={showScrollTop}
        onPress={() =>
          flatListRef.current.scrollToOffset({ offset: 0, animated: true })
        }
      />

      <SortBottomSheet
        isVisible={isSortVisible}
        onClose={() => setSortVisible(false)}
        onSelect={applySort}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    backgroundColor: '#353F54',
  },
});
