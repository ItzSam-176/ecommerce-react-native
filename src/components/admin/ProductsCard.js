import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getProductPrimaryImage } from '../../utils/productImageHelper';

export default function ProductCard({
  product,
  onEdit,
  onDelete,
  onRemove,
  onIncrement,
  onDecrement,
  onAddToCart,
  onAddToWishlist,
  variant = 'admin',
  quantity,
  loading = false,
  disableIncrement = false,
}) {
  const renderAdminActions = () => (
    <View style={styles.actions}>
      <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
        <Image
          source={require('../../assets/product_card/edit_product.png')}
          style={[styles.icon, { tintColor: '#007AFF' }]}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
        <Image
          source={require('../../assets/product_card/delete_products.png')}
          style={[styles.icon, { tintColor: '#FF3B30' }]}
        />
      </TouchableOpacity>
    </View>
  );

  const renderCartActions = () => (
    <View style={styles.cartActions}>
      {/* Quantity Controls */}
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={[styles.quantityBtn, quantity <= 1 && styles.disabledBtn]}
          onPress={quantity <= 1 ? null : onDecrement}
          disabled={quantity <= 1}
        >
          <Ionicons
            name="remove"
            size={16}
            color={quantity <= 1 ? '#ccc' : '#333'}
          />
        </TouchableOpacity>

        <Text style={styles.quantityText}>{quantity || 1}</Text>

        <TouchableOpacity
          style={[styles.quantityBtn, disableIncrement && styles.disabledBtn]}
          onPress={disableIncrement ? null : onIncrement}
          disabled={disableIncrement}
        >
          <Ionicons
            name="add"
            size={16}
            color={disableIncrement ? '#ccc' : '#333'}
          />
        </TouchableOpacity>
      </View>

      {/* Remove Button */}
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  const renderWishlistActions = () => (
    <View style={styles.wishlistActions}>
      <TouchableOpacity
        onPress={onAddToCart}
        style={styles.addToCartBtn}
        disabled={loading}
      >
        <Ionicons name="cart-outline" size={16} color="#fff" />
        <Text style={styles.addToCartText}>Add to Cart</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onRemove}
        style={styles.removeFromWishlistBtn}
        disabled={loading}
      >
        <Ionicons name="heart-dislike-outline" size={18} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  const formatCurrency = require('../../utils/formatCurrency').default;

  const getStockText = () => {
    switch (variant) {
      case 'cart':
        return `${formatCurrency(product.price)} × ${quantity} = ${formatCurrency(
          (product.price * quantity).toFixed(2),
        )}`;
      case 'wishlist':
        return `${formatCurrency(product.price)} | ${product.quantity || 0} available`;
      default:
        return `${formatCurrency(product.price)} | ${product.quantity} in stock`;
    }
  };

  const renderActions = () => {
    switch (variant) {
      case 'cart':
        return renderCartActions();
      case 'wishlist':
        return renderWishlistActions();
      default:
        return renderAdminActions();
    }
  };
  const productImage = getProductPrimaryImage(product);

  return (
    <View style={styles.card}>
      {/* ✅ REMOVED loading && styles.loadingCard */}
      {productImage && (
        <Image source={{ uri: productImage }} style={styles.image} />
      )}
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {product.description || 'No description'}
        </Text>
        <Text style={styles.stock}>{getStockText()}</Text>
      </View>
      {renderActions()}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#2a3847',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    shadowColor: '#4fc3f7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  image: {
    minWidth: 60,
    minHeight: 60,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: 'cover',
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
    color: '#fff',
  },
  desc: {
    fontSize: 13,
    color: '#8a9fb5',
    marginBottom: 4,
  },
  stock: {
    fontSize: 14,
    color: '#4fc3f7',
    fontWeight: '500',
  },
  actions: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconBtn: {
    padding: 4,
    marginVertical: 2,
    marginHorizontal: 6,
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },

  // Cart specific styles
  cartActions: {
    alignItems: 'center',
    minWidth: 80,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quantityBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4fc3f7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4fc3f7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.6,
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
    color: '#fff',
  },
  removeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 68, 88, 0.2)',
    borderWidth: 1,
    borderColor: '#ff4458',
  },

  // Wishlist specific styles
  wishlistActions: {
    alignItems: 'center',
    minWidth: 80,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4fc3f7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  removeFromWishlistBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 68, 88, 0.2)',
    borderWidth: 1,
    borderColor: '#ff4458',
  },
});
