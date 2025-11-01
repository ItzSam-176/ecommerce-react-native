// src/components/customer/CustomCouponDropdown.js
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Keyboard,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function CustomCouponDropdown({
  allCoupons, // ✅ CHANGED: Now receives all coupons
  selectedCoupon,
  onSelectCoupon,
  placeholder = 'Select coupon...',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const keyboardDidHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  // Combine applicable + disabled
  const allCouponsWithStatus = [
    ...allCoupons.applicable,
    ...allCoupons.disabled,
  ];

  const filteredCoupons = useMemo(() => {
    if (!searchQuery) return allCouponsWithStatus;
    const query = searchQuery.toLowerCase().trim();
    return allCouponsWithStatus.filter(
      coupon =>
        coupon.coupon.code.toLowerCase().includes(query) ||
        coupon.coupon.category.name.toLowerCase().includes(query)
    );
  }, [searchQuery, allCouponsWithStatus]);

  const handleSelectCoupon = useCallback(
    coupon => {
      if (coupon.isApplicable) {
        onSelectCoupon(coupon);
        setIsOpen(false);
        setSearchQuery('');
      } else {
        // ✅ SHOW REASON IF NOT APPLICABLE
        Alert.alert(
          'Coupon Not Available',
          coupon.reason || 'This coupon is not applicable',
        );
      }
    },
    [onSelectCoupon],
  );

  const renderCouponItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.couponItem,
        !item.isApplicable && styles.couponItemDisabled, // ✅ GRAY OUT
        selectedCoupon?.value === item.value && styles.couponItemSelected,
      ]}
      onPress={() => handleSelectCoupon(item)}
      activeOpacity={item.isApplicable ? 0.7 : 0.5}
    >
      <View style={styles.couponItemContent}>
        <Text
          style={[
            styles.couponCode,
            !item.isApplicable && styles.couponCodeDisabled,
          ]}
        >
          {item.coupon.code}
        </Text>
        <Text
          style={[
            styles.couponCategory,
            !item.isApplicable && styles.couponCategoryDisabled,
          ]}
        >
          {item.coupon.category.name}
        </Text>
        {/* ✅ SHOW REASON IF DISABLED */}
        {!item.isApplicable && (
          <Text style={styles.couponReason}>{item.reason}</Text>
        )}
      </View>
      <View
        style={[
          styles.couponItemBadge,
          !item.isApplicable && styles.couponItemBadgeDisabled,
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            !item.isApplicable && styles.badgeTextDisabled,
          ]}
        >
          Save
        </Text>
        <Text
          style={[
            styles.badgeAmount,
            !item.isApplicable && styles.badgeAmountDisabled,
          ]}
        >
          ₹{item.coupon.discount_amount}
        </Text>
      </View>
      {item.isApplicable && selectedCoupon?.value === item.value && (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color="#4fc3f7"
          style={styles.checkIcon}
        />
      )}
      {/* ✅ LOCK ICON FOR DISABLED */}
      {!item.isApplicable && (
        <Ionicons
          name="lock-closed"
          size={16}
          color="#8a9fb5"
          style={styles.lockIcon}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>
          {selectedCoupon ? selectedCoupon.coupon.code : placeholder}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#4fc3f7"
        />
      </TouchableOpacity>

      {isOpen && allCouponsWithStatus.length > 0 && (
        <View style={styles.dropdownListWrapper}>
          <View style={styles.dropdownList}>
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={16}
                color="#8a9fb5"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search coupons..."
                placeholderTextColor="#8a9fb5"
                value={searchQuery}
                onChangeText={(text) => setSearchQuery(text)}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#8a9fb5" />
                </TouchableOpacity>
              )}
            </View>

            {filteredCoupons.length > 0 ? (
              <View style={styles.listContainer}>
                <FlatList
                  data={filteredCoupons}
                  renderItem={renderCouponItem}
                  keyExtractor={item => item.value}
                  scrollEnabled={true}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  scrollEventThrottle={16}
                  contentContainerStyle={styles.flatListContent}
                  style={styles.flatList}
                />
              </View>
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No coupons found</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {isOpen && allCouponsWithStatus.length === 0 && (
        <View style={styles.dropdownListWrapper}>
          <View style={styles.dropdownList}>
            <View style={styles.noResultsContainer}>
              <Ionicons name="alert-circle-outline" size={24} color="#8a9fb5" />
              <Text style={styles.noResultsText}>No coupons available</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 56, 71, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
  },
  buttonText: {
    fontSize: 14,
    color: '#4fc3f7',
    fontWeight: '500',
  },
  dropdownListWrapper: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 0,
    transform: [{translateY: 0}],
  },
  dropdownList: {
    backgroundColor: 'rgba(42, 56, 71, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
    overflow: 'hidden',
    maxHeight: 300,
  },
  listContainer: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 10,
    flexGrow: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    color: '#fff',
    fontSize: 14,
  },
  // flatListContainer: {
  //   flex: 1,
  // },
  couponItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  // ✅ DISABLED STYLE
  couponItemDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  couponItemSelected: {
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
  },
  couponItemContent: {
    flex: 1,
  },
  couponCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4fc3f7',
    marginBottom: 2,
  },
  couponCodeDisabled: {
    color: '#8a9fb5',
  },
  couponCategory: {
    fontSize: 11,
    color: '#8a9fb5',
    marginBottom: 2,
  },
  couponCategoryDisabled: {
    color: '#5a7088',
  },
  // ✅ REASON TEXT
  couponReason: {
    fontSize: 10,
    color: '#ff9800',
    fontStyle: 'italic',
    marginTop: 2,
  },
  couponItemBadge: {
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 8,
  },
  couponItemBadgeDisabled: {
    backgroundColor: 'rgba(138, 159, 181, 0.1)',
  },
  badgeText: {
    fontSize: 9,
    color: '#8a9fb5',
  },
  badgeTextDisabled: {
    color: '#5a7088',
  },
  badgeAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4fc3f7',
    marginTop: 1,
  },
  badgeAmountDisabled: {
    color: '#5a7088',
  },
  checkIcon: {
    marginLeft: 8,
  },
  lockIcon: {
    marginLeft: 8,
  },
  noResultsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#8a9fb5',
    fontSize: 12,
    marginTop: 8,
  },
});
