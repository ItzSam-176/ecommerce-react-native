import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  RefreshControl,
} from 'react-native';
import { Table, Row } from 'react-native-reanimated-table';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '../../supabase/supabase';
import SortBottomSheet from '../../components/admin/SortBottomSheet';
import { useSort } from '../../hooks/useSort';
import Loader from '../../components/shared/Loader';
import ColumnSelectorModal from '../../components/admin/ColumnSelectorModal';
import StatusBadge from '../../components/admin/StatusBadge';
import ProductsMenu from '../../components/admin/ProductsMenu';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MIN_COLUMN_WIDTH = 100;

const getStatusConfig = status => {
  const normalizedStatus = (status || '').toLowerCase();

  switch (normalizedStatus) {
    case 'pending':
      return {
        icon: 'alert-circle',
        color: '#92400E',
        backgroundColor: '#FEF3C7',
      };
    case 'rejected':
    case 'canceled':
    case 'cancelled':
      return {
        icon: 'close-circle',
        color: '#991B1B',
        backgroundColor: '#FEE2E2',
      };
    case 'completed':
    case 'delivered':
      return {
        icon: 'checkmark-circle',
        color: '#065F46',
        backgroundColor: '#D1FAE5',
      };
    case 'shipped':
      return {
        icon: 'car',
        color: '#065F46',
        backgroundColor: '#D1FAE5',
      };
    case 'payment pending':
    case 'payment_pending':
      return {
        icon: 'card',
        color: '#C2410C',
        backgroundColor: '#FFEDD5',
      };
    default:
      return {
        icon: 'information-circle',
        color: '#374151',
        backgroundColor: '#F3F4F6',
      };
  }
};

export default function OrdersScreen({ navigation, route }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSortVisible, setSortVisible] = useState(false);
  const [isColumnModalVisible, setColumnModalVisible] = useState(false);

  const horizontalScrollRef = useRef(null);
  const previousColumnCount = useRef(0);

  const { sortKey, sortConfig, applySort, resetSort } = useSort(
    { column: 'created_at', ascending: false },
    'orders',
  );

  const allColumns = [
    { label: 'Order ID', key: 'id' },
    { label: 'Date', key: 'created_at', sortable: true },
    { label: 'Customer', key: 'customer' },
    { label: 'Products', key: 'products' }, // Add this
    { label: 'Items', key: 'items_count', sortable: true },
    { label: 'Subtotal', key: 'subtotal', sortable: true },
    { label: 'Coupon', key: 'coupon_amount', sortable: true },
    { label: 'Delivery', key: 'delivery_charge', sortable: true },
    { label: 'Total', key: 'total_amount', sortable: true },
    { label: 'Status', key: 'status' },
  ];

  const [visibleColumns, setVisibleColumns] = useState(
    allColumns.map(c => c.key),
  );

  useEffect(() => {
    if (route.params?.showSort) {
      setSortVisible(true);
      navigation.setParams({ showSort: false });
    }
  }, [route.params?.showSort]);

  useLayoutEffect(() => {
    navigation.setParams({
      openColumnModal: () => setColumnModalVisible(true),
    });
  }, [navigation]);

  useEffect(() => {
    const req = route?.params?.openColumnModalRequest;
    if (req) {
      setColumnModalVisible(true);
      navigation.setParams({ openColumnModalRequest: null });
    }
  }, [route?.params?.openColumnModalRequest]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase.from('orders').select(`
          id,
          created_at,
          status,
          subtotal,
          coupon_amount,
          delivery_charge,
          total_amount,
          customer:customer_id (
            id,
            email,
            name
          ),
          order_items (
            id,
            quantity,
            unit_price,
            item_total,
            product:product_id (
              id,
              name
            )
          )
        `);

      if (error) {
        console.error('[Error fetching orders]:', error);
        throw error;
      }

      if (data) {
        setRows(data);
      }
    } catch (error) {
      console.error('[Exception fetching orders]:', error);
      Alert.alert('Error', 'Failed to fetch orders');
    }
  };

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      await fetchOrders();
      setLoading(false);
    };

    loadOrders();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const currentColumnCount = visibleColumns.length;
    const wasColumnAdded = currentColumnCount > previousColumnCount.current;
    const wasColumnRemoved = currentColumnCount < previousColumnCount.current;
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        250,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );

    if (wasColumnAdded) {
      setTimeout(() => {
        if (horizontalScrollRef.current) {
          horizontalScrollRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    } else if (wasColumnRemoved) {
      setTimeout(() => {
        if (horizontalScrollRef.current) {
          horizontalScrollRef.current.scrollToEnd({ animated: false });
        }
      }, 50);
    }

    previousColumnCount.current = currentColumnCount;
  }, [visibleColumns]);

  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        console.error('[Error updating status]:', error);
        Alert.alert('Error', 'Failed to update order status');
        return;
      }

      setRows(prevRows =>
        prevRows.map(row =>
          row.id === orderId ? { ...row, status: newStatus } : row,
        ),
      );
    } catch (err) {
      console.error('[Exception updating status]:', err);
      Alert.alert('Error', 'An error occurred while updating status');
    }
  }, []);

  const sortedRows = useMemo(() => {
    if (!rows.length) return [];

    const sorted = [...rows].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.column) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'items_count':
          aValue = Number(a.order_items?.length || 0);
          bValue = Number(b.order_items?.length || 0);
          break;
        case 'subtotal':
          aValue = Number(a.subtotal || 0);
          bValue = Number(b.subtotal || 0);
          break;
        case 'coupon_amount':
          aValue = Number(a.coupon_amount || 0);
          bValue = Number(b.coupon_amount || 0);
          break;
        case 'delivery_charge':
          aValue = Number(a.delivery_charge || 0);
          bValue = Number(b.delivery_charge || 0);
          break;
        case 'total_amount':
          aValue = Number(a.total_amount || 0);
          bValue = Number(b.total_amount || 0);
          break;
        case 'status':
          aValue = (a.status || '').toLowerCase();
          bValue = (b.status || '').toLowerCase();
          break;
        case 'customer':
          aValue = (a.customer?.name || a.customer?.email || '').toLowerCase();
          bValue = (b.customer?.name || b.customer?.email || '').toLowerCase();
          break;
        case 'id':
          aValue = a.id || '';
          bValue = b.id || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.ascending ? -1 : 1;
      if (aValue > bValue) return sortConfig.ascending ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [rows, sortConfig]);

  const calculateColumnWidths = useCallback(columnCount => {
    const maxColumnsWithoutScroll = Math.floor(SCREEN_WIDTH / MIN_COLUMN_WIDTH);

    if (columnCount <= maxColumnsWithoutScroll) {
      const columnWidth = Math.floor(SCREEN_WIDTH / columnCount);
      return {
        widths: Array(columnCount).fill(columnWidth),
        needsScroll: false,
      };
    } else {
      return {
        widths: Array(columnCount).fill(140),
        needsScroll: true,
      };
    }
  }, []);

  const { filteredHeaders, widthArr, tableRows, needsScroll } = useMemo(() => {
    const to2 = n => Number(n ?? 0).toFixed(2);

    const tableRows = sortedRows.map(r => {
      // Get all product details from order_items
      const productsList =
        r.order_items?.map(item => ({
          name: item.product?.name || 'Unknown',
          quantity: item.quantity || 1,
        })) || [];

      console.log('Created productsList:', productsList); // Add this log

      return {
        id: (r.id || '').slice(0, 8),
        fullId: r.id,
        created_at: new Date(r.created_at).toLocaleDateString(),
        customer: r.customer?.name || r.customer?.email || '—',
        products: productsList, // This should be an array
        items_count: String(r.order_items?.length || 0),
        subtotal: `₹${to2(r.subtotal)}`,
        coupon_amount: r.coupon_amount > 0 ? `-₹${to2(r.coupon_amount)}` : '—',
        delivery_charge: `₹${to2(r.delivery_charge)}`,
        total_amount: `₹${to2(r.total_amount)}`,
        status: r.status ?? 'pending',
      };
    });

    const filteredHeaders = allColumns.filter(c =>
      visibleColumns.includes(c.key),
    );

    const { widths, needsScroll } = calculateColumnWidths(
      filteredHeaders.length,
    );

    return {
      filteredHeaders,
      widthArr: widths,
      tableRows,
      needsScroll,
    };
  }, [sortedRows, visibleColumns, calculateColumnWidths]);

  const handleHeaderPress = useCallback(
    key => {
      const isCurrentColumn = sortConfig.column === key;
      const isAtDefault =
        sortConfig.column === 'created_at' &&
        sortConfig.ascending === false &&
        sortKey === 'CREATED_DESC';

      if (!isCurrentColumn) {
        // First click on different column - sort ascending
        applySort(`${key.toUpperCase()}_ASC`);
      } else if (isAtDefault && key === 'created_at') {
        // Second click on created_at at default - sort ascending
        applySort('CREATED_ASC');
      } else if (sortConfig.ascending) {
        // Third click - toggle to descending
        applySort(`${key.toUpperCase()}_DESC`);
      } else {
        // Fourth click - reset to default
        resetSort();
      }
    },
    [sortConfig.column, sortConfig.ascending, sortKey, applySort, resetSort],
  );

  const renderSortIcon = key => {
    if (sortConfig.column !== key) return null;

    return (
      <Ionicons
        name={sortConfig.ascending ? 'arrow-up' : 'arrow-down'}
        size={14}
        color="#4fc3f7"
        style={{ marginLeft: 4 }}
      />
    );
  };

  const handleApplyColumns = useCallback(newSelection => {
    if (newSelection.length === 0) {
      setVisibleColumns(allColumns.map(c => c.key));
    } else {
      setVisibleColumns(newSelection);
    }
  }, []);

  const handleResetColumns = useCallback(() => {
    setVisibleColumns(allColumns.map(c => c.key));
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <Loader size={120} speed={1} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.verticalScroll}
        contentContainerStyle={styles.verticalScrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4fc3f7', '#5fd4f7']}
            tintColor="#4fc3f7"
            progressBackgroundColor="#353F54"
          />
        }
      >
        <ScrollView
          ref={horizontalScrollRef}
          horizontal={needsScroll}
          showsHorizontalScrollIndicator={false}
          scrollEnabled={needsScroll}
        >
          <View style={!needsScroll && styles.fullWidthTable}>
            <Table
              borderStyle={{
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Row
                data={filteredHeaders.map(h =>
                  h.sortable ? (
                    <TouchableOpacity
                      key={h.key}
                      style={styles.sortHeader}
                      onPress={() => handleHeaderPress(h.key)}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.headerText}>{h.label}</Text>
                      {renderSortIcon(h.key)}
                    </TouchableOpacity>
                  ) : (
                    <Text key={h.key} style={styles.headerText}>
                      {h.label}
                    </Text>
                  ),
                )}
                widthArr={widthArr}
                style={styles.header}
              />
            </Table>
            <Table borderStyle={{ borderWidth: 1, borderColor: '#E5E7EB' }}>
              {tableRows.map((rowData, idx) => (
                <Row
                  key={idx}
                  data={filteredHeaders.map(h => {
                    const value = rowData[h.key];

                    if (h.key === 'status') {
                      const config = getStatusConfig(value);
                      return (
                        <StatusBadge
                          status={value}
                          icon={config.icon}
                          color={config.color}
                          backgroundColor={config.backgroundColor}
                          onStatusChange={handleStatusChange}
                          orderId={rowData.fullId}
                        />
                      );
                    }

                    if (h.key === 'products') {
                      return (
                        <ProductsMenu
                          products={value}
                          itemCount={Number(rowData.items_count)}
                        />
                      );
                    }

                    return value;
                  })}
                  widthArr={widthArr}
                  style={[styles.row, idx % 2 === 1 && styles.rowAlt]}
                  textStyle={styles.cellText}
                />
              ))}
            </Table>
          </View>
        </ScrollView>
      </ScrollView>

      <SortBottomSheet
        isVisible={isSortVisible}
        onClose={() => setSortVisible(false)}
        onSelect={key => {
          applySort(key);
          setSortVisible(false);
        }}
        variant="orders"
      />

      {isColumnModalVisible && (
        <ColumnSelectorModal
          visible={isColumnModalVisible}
          onClose={() => setColumnModalVisible(false)}
          columns={allColumns}
          visibleColumns={visibleColumns}
          onApply={handleApplyColumns}
          resetColumns={handleResetColumns}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#353F54',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#353F54',
  },
  loadingText: {
    marginTop: 16,
    color: '#8a9fb5',
    fontSize: 16,
  },
  verticalScroll: {
    flex: 1,
  },
  verticalScrollContent: {
    paddingBottom: 60,
  },
  header: {
    height: 48,
    backgroundColor: '#2a3847',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  fullWidthTable: {
    width: SCREEN_WIDTH,
  },
  row: {
    minHeight: 44,
    backgroundColor: '#2a3847',
  },
  rowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cellText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 13,
  },
  sortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
