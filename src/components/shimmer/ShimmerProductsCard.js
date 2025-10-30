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
        shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
        shimmerStyle={{ backgroundColor: '#4a5568' }}
        style={styles.adminImage}
      />
      <View style={styles.adminDetails}>
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
          shimmerStyle={{ backgroundColor: '#4a5568' }}
          style={styles.line}
        />
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
          shimmerStyle={{ backgroundColor: '#4a5568' }}
          style={[styles.line, { width: '60%' }]}
        />
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
          shimmerStyle={{ backgroundColor: '#4a5568' }}
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
          shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
          shimmerStyle={{ backgroundColor: '#4a5568' }}
          style={styles.wishlistImage}
        />
        <View style={styles.wishlistDetails}>
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
            shimmerStyle={{ backgroundColor: '#4a5568' }}
            style={[styles.line, { width: '90%' }]}
          />
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
            shimmerStyle={{ backgroundColor: '#4a5568' }}
            style={[styles.line, { width: '40%', marginTop: 4 }]}
          />
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
            shimmerStyle={{ backgroundColor: '#4a5568' }}
            style={[styles.line, { width: '70%', marginTop: 4 }]}
          />
        </View>
      </View>
      <View style={styles.wishlistButtons}>
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
          shimmerStyle={{ backgroundColor: '#4a5568' }}
          style={styles.wishlistButton}
        />
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
          shimmerStyle={{ backgroundColor: '#4a5568' }}
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
        shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
        shimmerStyle={{ backgroundColor: '#4a5568' }}
        style={styles.cartImage}
      />
      <View style={styles.cartDetails}>
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
          shimmerStyle={{ backgroundColor: '#4a5568' }}
          style={[styles.line, { width: '90%' }]}
        />
        <View style={styles.cartPriceRow}>
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
            shimmerStyle={{ backgroundColor: '#4a5568' }}
            style={[styles.line, { width: '30%' }]}
          />
          <View style={styles.cartQuantityControls}>
            <ShimmerPlaceholder
              LinearGradient={LinearGradient}
              shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
              shimmerStyle={{ backgroundColor: '#4a5568' }}
              style={styles.quantityButton}
            />
            <ShimmerPlaceholder
              LinearGradient={LinearGradient}
              shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
              shimmerStyle={{ backgroundColor: '#4a5568' }}
              style={styles.quantityText}
            />
            <ShimmerPlaceholder
              LinearGradient={LinearGradient}
              shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
              shimmerStyle={{ backgroundColor: '#4a5568' }}
              style={styles.quantityButton}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

// Home Grid Shimmer (NEW)
function ShimmerHomeGrid() {
  return (
    <View style={styles.homeCard}>
      <View style={styles.homeImageWrap}>
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
          shimmerStyle={{ backgroundColor: '#4a5568' }}
          style={styles.homeImage}
        />
      </View>
      <View style={styles.homeContent}>
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
          shimmerStyle={{ backgroundColor: '#4a5568' }}
          style={[styles.line, { width: '80%', marginBottom: 4 }]}
        />
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
          shimmerStyle={{ backgroundColor: '#4a5568' }}
          style={[styles.line, { width: '90%', marginBottom: 8 }]}
        />
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#4a5568', '#6b7280', '#4a5568']}
          shimmerStyle={{ backgroundColor: '#4a5568' }}
          style={[styles.line, { width: '40%' }]}
        />
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
      case 'home':
        return <ShimmerHomeGrid />;
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
    backgroundColor: '#4a5568',
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
    backgroundColor: '#4a5568',
  },
  adminDetails: {
    flex: 1,
    justifyContent: 'center',
  },

  // Wishlist Styles
  wishlistCard: {
    backgroundColor: 'rgba(74, 85, 104, 0.8)',
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
    backgroundColor: '#4a5568',
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
    backgroundColor: '#4a5568',
  },
  wishlistIconButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#4a5568',
  },

  // Cart Styles
  cartCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(74, 85, 104, 0.8)',
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
    backgroundColor: '#4a5568',
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
    backgroundColor: '#4a5568',
  },
  quantityText: {
    width: 30,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#4a5568',
  },

  // Home Grid Styles (NEW)
  homeCard: {
    width: 160,
    backgroundColor: 'rgba(26, 35, 50, 0.7)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginHorizontal: 8,
    marginVertical: 8,
  },
  homeImageWrap: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  homeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#4a5568',
  },
  homeContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
  },

  // Shared line style
  line: {
    height: 14,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#4a5568',
  },
});
