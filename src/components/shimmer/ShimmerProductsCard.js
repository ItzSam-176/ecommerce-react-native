// components/shimmer/ShimmerProductsCard.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

// Admin Product Shimmer (default)
function ShimmerAdminProduct() {
  return (
    <View style={styles.adminCard}>
      <ShimmerPlaceholder
        LinearGradient={LinearGradient}
        shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
        shimmerStyle={{ backgroundColor: '#2a3847' }}
        style={styles.adminImage}
      />
      <View style={styles.adminDetails}>
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
          shimmerStyle={{ backgroundColor: '#2a3847' }}
          style={styles.line}
        />
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
          shimmerStyle={{ backgroundColor: '#2a3847' }}
          style={[styles.line, { width: '60%' }]}
        />
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
          shimmerStyle={{ backgroundColor: '#2a3847' }}
          style={[styles.line, { width: '40%' }]}
        />
      </View>
    </View>
  );
}

// Wishlist Shimmer
function ShimmerWishlist() {
  return (
    <View style={styles.wishlistCard}>
      <View style={styles.wishlistTop}>
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
          shimmerStyle={{ backgroundColor: '#2a3847' }}
          style={styles.wishlistImage}
        />
        <View style={styles.wishlistDetails}>
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
            shimmerStyle={{ backgroundColor: '#2a3847' }}
            style={[styles.line, { width: '90%' }]}
          />
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
            shimmerStyle={{ backgroundColor: '#2a3847' }}
            style={[styles.line, { width: '40%', marginTop: 4 }]}
          />
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
            shimmerStyle={{ backgroundColor: '#2a3847' }}
            style={[styles.line, { width: '70%', marginTop: 4 }]}
          />
        </View>
      </View>
      <View style={styles.wishlistButtons}>
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
          shimmerStyle={{ backgroundColor: '#2a3847' }}
          style={styles.wishlistButton}
        />
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
          shimmerStyle={{ backgroundColor: '#2a3847' }}
          style={styles.wishlistIconButton}
        />
      </View>
    </View>
  );
}

// Cart Shimmer
function ShimmerCart() {
  return (
    <View style={styles.cartCard}>
      <ShimmerPlaceholder
        LinearGradient={LinearGradient}
        shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
        shimmerStyle={{ backgroundColor: '#2a3847' }}
        style={styles.cartImage}
      />
      <View style={styles.cartDetails}>
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
          shimmerStyle={{ backgroundColor: '#2a3847' }}
          style={[styles.line, { width: '90%' }]}
        />
        <View style={styles.cartPriceRow}>
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
            shimmerStyle={{ backgroundColor: '#2a3847' }}
            style={[styles.line, { width: '30%' }]}
          />
          <View style={styles.cartQuantityControls}>
            <ShimmerPlaceholder
              LinearGradient={LinearGradient}
              shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
              shimmerStyle={{ backgroundColor: '#2a3847' }}
              style={styles.quantityButton}
            />
            <ShimmerPlaceholder
              LinearGradient={LinearGradient}
              shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
              shimmerStyle={{ backgroundColor: '#2a3847' }}
              style={styles.quantityText}
            />
            <ShimmerPlaceholder
              LinearGradient={LinearGradient}
              shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
              shimmerStyle={{ backgroundColor: '#2a3847' }}
              style={styles.quantityButton}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

// Export wrapper component that renders multiple cards based on variant
export default function ShimmerProductsCard({
  count = 5,
  variant = 'default',
}) {
  const renderShimmer = () => {
    switch (variant) {
      case 'wishlist':
        return <ShimmerWishlist />;
      case 'cart':
        return <ShimmerCart />;
      default:
        return <ShimmerAdminProduct />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={`shimmer-${variant}-${index}`}>
          {renderShimmer()}
        </React.Fragment>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  // Admin Product Styles (default)
  adminCard: {
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  adminImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#2a3847',
  },
  adminDetails: {
    flex: 1,
    justifyContent: 'center',
  },

  // Wishlist Styles
  wishlistCard: {
    backgroundColor: 'rgba(42, 56, 71, 0.8)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.2)',
  },
  wishlistTop: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  wishlistImage: {
    width: 110,
    height: 110,
    borderRadius: 12,
    backgroundColor: '#2a3847',
  },
  wishlistDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'flex-start',
  },
  wishlistButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(79, 195, 247, 0.2)',
  },
  wishlistButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#2a3847',
  },
  wishlistIconButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#2a3847',
  },

  // Cart Styles
  cartCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(42, 56, 71, 0.8)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.2)',
  },
  cartImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#2a3847',
  },
  cartDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  cartPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#2a3847',
  },
  quantityText: {
    width: 30,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#2a3847',
  },

  // Shared line style
  line: {
    height: 14,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#2a3847',
  },
});
