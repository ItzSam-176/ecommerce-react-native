import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import HapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';

const ProductsMenu = ({ products = [], itemCount = 0 }) => {
  const triggerHapticFeedback = () => {
    HapticFeedback.trigger(HapticFeedbackTypes.impactMedium, {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  };

  const handleMenuOpen = () => {
    triggerHapticFeedback();
  };

  // Add validation and logging
  console.log('ProductsMenu props:', { products, itemCount });

  // Ensure products is always an array
  const productsList = Array.isArray(products) ? products : [];

  // If no products, show empty state
  if (productsList.length === 0) {
    return (
      <View style={[styles.badge, styles.emptyBadge]}>
        <Ionicons
          name="cart-outline"
          size={16}
          color="#6B7280"
          style={styles.icon}
        />
        <Text style={[styles.text, { color: '#6B7280' }]}>0 items</Text>
      </View>
    );
  }

  return (
    <Menu onOpen={handleMenuOpen}>
      <MenuTrigger
        triggerOnLongPress={true}
        customStyles={{
          triggerTouchable: { underlayColor: 'transparent' },
        }}
      >
        <View style={styles.badge}>
          <Ionicons
            name="cube-outline"
            size={16}
            color="#4fc3f7"
            style={styles.icon}
          />
          <Text style={styles.text}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </MenuTrigger>

      <MenuOptions
        customStyles={{
          optionsContainer: {
            borderRadius: 8,
            padding: 8,
            marginTop: 32,
            marginLeft: 10,
            maxWidth: 250,
            backgroundColor: '#2a3847',
            borderWidth: 1,
            borderColor: 'rgba(79, 195, 247, 0.3)',
          },
        }}
      >
        <View style={styles.menuHeader}>
          <Text style={styles.menuHeaderText}>Ordered Products</Text>
        </View>
        {productsList.map((product, index) => (
          <MenuOption
            key={`product-${index}`}
            disabled={true}
            customStyles={{
              optionWrapper: {
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 6,
                marginVertical: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            <View style={styles.menuItem}>
              <View style={styles.bulletContainer}>
                <View style={styles.bullet} />
              </View>
              <Text style={styles.menuText} numberOfLines={2}>
                {product.name || 'Unknown Product'}
              </Text>
              {product.quantity && (
                <Text style={styles.quantityText}>×{product.quantity}</Text>
              )}
            </View>
          </MenuOption>
        ))}
      </MenuOptions>
    </Menu>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(79, 195, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
  },
  emptyBadge: {
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4fc3f7',
  },
  menuHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 4,
  },
  menuHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8a9fb5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletContainer: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4fc3f7',
  },
  menuText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
    lineHeight: 18,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4fc3f7',
    marginLeft: 4,
  },
});

export default ProductsMenu;
