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
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { Table, Row } from 'react-native-reanimated-table';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '../../supabase/supabase';
import SortBottomSheet from '../../components/admin/SortBottomSheet';
import { useSort } from '../../hooks/useSort';
import ColumnSelectorModal from '../../components/admin/ColumnSelectorModal';
import StatusBadge from '../../components/admin/StatusBadge';

// Enable LayoutAnimation for Android
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
  const [isSortVisible, setSortVisible] = useState(false);
  const [isColumnModalVisible, setColumnModalVisible] = useState(false);

  const horizontalScrollRef = useRef(null);
  const previousColumnCount = useRef(0);

  const { sortKey, sortConfig, applySort, resetSort } = useSort(
    { column: 'created_at', ascending: false },
    'orders',
  );

  const allColumns = [
    { label: 'Order', key: 'id' },
    { label: 'Date', key: 'created_at', sortable: true },
    { label: 'Product', key: 'product' },
    { label: 'Qty', key: 'quantity', sortable: true },
    { label: 'Price', key: 'price' },
    { label: 'Total', key: 'total_price', sortable: true },
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

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);

      const { data, error } = await supabase.from('orders').select(`
          id,
          created_at,
          quantity,
          price,
          status,
          total_price,
          products ( id, name )
        `);

      if (!error && data) {
        setRows(data);
      } else if (error) {
        console.error('[Error fetching orders]:', error);
      }
      setLoading(false);
    };

    fetchOrders();
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
        case 'quantity':
          aValue = Number(a.quantity || 0);
          bValue = Number(b.quantity || 0);
          break;
        case 'total_price':
          aValue = Number(a.total_price || a.price * a.quantity || 0);
          bValue = Number(b.total_price || b.price * b.quantity || 0);
          break;
        case 'price':
          aValue = Number(a.price || 0);
          bValue = Number(b.price || 0);
          break;
        case 'status':
          aValue = (a.status || '').toLowerCase();
          bValue = (b.status || '').toLowerCase();
          break;
        case 'product':
          aValue = (a.products?.name || '').toLowerCase();
          bValue = (b.products?.name || '').toLowerCase();
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
    const to2 = n => Number(n ?? 0);

    const tableRows = sortedRows.map(r => ({
      id: (r.id || '').slice(0, 8),
      fullId: r.id,
      created_at: new Date(r.created_at).toLocaleDateString(),
      product: r?.products?.name ?? '—',
      quantity: String(r.quantity ?? 0),
      price: to2(r.price),
      total_price: to2(
        r.total_price ?? Number(r.price ?? 0) * Number(r.quantity ?? 0),
      ),
      status: r.status ?? 'pending',
    }));

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
        let newSortKey;
        switch (key) {
          case 'created_at':
            newSortKey = 'CREATED_ASC';
            break;
          case 'quantity':
            newSortKey = 'QTY_ASC';
            break;
          case 'total_price':
            newSortKey = 'TOTAL_ASC';
            break;
          default:
            return;
        }
        applySort(newSortKey);
      } else {
        if (key === 'created_at' && isAtDefault) {
          applySort('CREATED_ASC');
        } else if (sortConfig.ascending) {
          let newSortKey;
          switch (key) {
            case 'created_at':
              newSortKey = 'CREATED_DESC';
              break;
            case 'quantity':
              newSortKey = 'QTY_DESC';
              break;
            case 'total_price':
              newSortKey = 'TOTAL_DESC';
              break;
            default:
              return;
          }
          applySort(newSortKey);
        } else {
          resetSort();
        }
      }
    },
    [sortConfig.column, sortConfig.ascending, sortKey, applySort, resetSort],
  );

  // ✅ Add useCallback for sort icon render
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
        <ActivityIndicator size="large" color="#4fc3f7" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.verticalScroll}
        contentContainerStyle={styles.verticalScrollContent}
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
