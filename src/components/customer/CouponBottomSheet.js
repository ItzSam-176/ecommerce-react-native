import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function CouponBottomSheet({
  isVisible,
  onClose,
  allCoupons = [],
  selectedCoupon = null,
  onCouponSelect,
  onCouponRemove,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCouponId, setExpandedCouponId] = useState(null);
  const [disabledMessage, setDisabledMessage] = useState(null);
  const [messageOpacity] = useState(new Animated.Value(1));

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const filteredCoupons = allCoupons.filter(item => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      item.coupon.code.toLowerCase().includes(query) ||
      item.coupon.category.name.toLowerCase().includes(query)
    );
  });

  const handleSelectCoupon = useCallback(
    item => {
      if (item.isApplicable) {
        setExpandedCouponId(null);
        onCouponSelect(item);
        onClose();
      } else {
        setExpandedCouponId(item.value);
        setDisabledMessage(item.reason);
        messageOpacity.setValue(1);

        Animated.sequence([
          Animated.delay(5000),
          Animated.timing(messageOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setDisabledMessage(null);
          setExpandedCouponId(null);
        });
      }
    },
    [onCouponSelect, onClose, messageOpacity],
  );

  const handleRemoveCoupon = useCallback(() => {
    onCouponRemove();
    onClose();
  }, [onCouponRemove, onClose]);

  const renderCouponItem = ({ item }) => {
    const isSelected = selectedCoupon?.value === item.value;
    const isDisabled = !item.isApplicable;
    const isExpanded = expandedCouponId === item.value;
    const showReason = isExpanded && isDisabled && item.reason;

    return (
      <View style={styles.couponItemWrapper}>
        <TouchableOpacity
          onPress={() => handleSelectCoupon(item)}
          style={[
            styles.couponItem,
            isSelected && styles.couponItemSelected,
            isDisabled && styles.couponItemDisabled,
          ]}
          activeOpacity={isDisabled ? 0.5 : 0.7}
        >
          <View style={styles.couponItemContent}>
            <Text
              style={[
                styles.couponItemCode,
                isDisabled && styles.couponItemCodeDisabled,
              ]}
            >
              {item.coupon.code}
            </Text>
            <Text
              style={[
                styles.couponItemDetails,
                isDisabled && styles.couponItemDetailsDisabled,
              ]}
            >
              {item.coupon.category.name}
            </Text>
          </View>

          <View
            style={[
              styles.couponItemBadge,
              isDisabled && styles.couponItemBadgeDisabled,
            ]}
          >
            <Text
              style={[
                styles.couponItemSave,
                isDisabled && styles.couponItemSaveDisabled,
              ]}
            >
              Save
            </Text>
            <Text
              style={[
                styles.couponItemBadgeText,
                isDisabled && styles.couponItemBadgeTextDisabled,
              ]}
            >
              ₹{item.coupon.discount_amount}
            </Text>
          </View>
        </TouchableOpacity>

        {showReason && (
          <Animated.View
            style={[styles.reasonMessage, { opacity: messageOpacity }]}
          >
            <Ionicons name="alert-circle" size={16} color="#ff9800" />
            <Text style={styles.reasonText}>{item.reason}</Text>
          </Animated.View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#8a9fb5" />
      <Text style={styles.emptyText}>No coupons found</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery
          ? 'Try adjusting your search'
          : 'No coupons available for your cart items'}
      </Text>
    </View>
  );

  const applicableCount = filteredCoupons.filter(c => c.isApplicable).length;
  const disabledCount = filteredCoupons.filter(c => !c.isApplicable).length;

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modal}
      avoidKeyboard={true}
    >
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>Select Coupon</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#8a9fb5" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#8a9fb5"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search coupons..."
            placeholderTextColor="#8a9fb5"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearButton}
            >
              <Iconicons name="close-circle" size={20} color="#8a9fb5" />
            </TouchableOpacity>
          )}
        </View>

        {applicableCount > 0 && (
          <Text style={styles.sectionLabel}>Available ({applicableCount})</Text>
        )}

        {filteredCoupons.length > 0 ? (
          <FlatList
            data={filteredCoupons}
            renderItem={renderCouponItem}
            keyExtractor={item => item.value}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            style={styles.list}
            scrollEnabled={filteredCoupons.length > 6}
          />
        ) : (
          renderEmptyState()
        )}

        {selectedCoupon && (
          <View style={styles.footer}>
            <View style={styles.footerInfo}>
              <Ionicons name="checkmark-circle" size={20} color="#4fc3f7" />
              <Text style={styles.footerText}>
                {selectedCoupon.coupon.code} applied
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleRemoveCoupon}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  sheet: {
    backgroundColor: '#2a3847',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
    height: SCREEN_HEIGHT * 0.85,
    paddingBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#fff',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4fc3f7',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  disabledLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8a9fb5',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 16,
  },
  couponItemWrapper: {
    marginBottom: 8,
  },
  couponItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  couponItemSelected: {
    backgroundColor: 'rgba(79, 195, 247, 0.15)',
    borderColor: 'rgba(79, 195, 247, 0.4)',
  },
  couponItemDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  couponItemContent: {
    flex: 1,
    marginRight: 12,
  },
  couponItemCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4fc3f7',
    marginBottom: 4,
  },
  couponItemCodeDisabled: {
    color: '#6b7a8a',
  },
  couponItemDetails: {
    fontSize: 13,
    color: '#8a9fb5',
  },
  couponItemDetailsDisabled: {
    color: '#5a6470',
  },
  couponItemBadge: {
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  couponItemBadgeDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  couponItemSave: {
    fontSize: 10,
    color: '#8a9fb5',
    marginBottom: 2,
  },
  couponItemSaveDisabled: {
    color: '#5a6470',
  },
  couponItemBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4fc3f7',
  },
  couponItemBadgeTextDisabled: {
    color: '#6b7a8a',
  },
  selectedIcon: {
    marginLeft: 4,
  },
  disabledIcon: {
    marginLeft: 4,
  },
  reasonMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  reasonText: {
    fontSize: 12,
    color: '#ff9800',
    marginLeft: 8,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8a9fb5',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(79, 195, 247, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4fc3f7',
  },
  removeButton: {
    backgroundColor: 'rgba(255, 68, 88, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 88, 0.3)',
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff4458',
  },
});
