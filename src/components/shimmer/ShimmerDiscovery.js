import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 1;
const CARD_HEIGHT = height * 1;

export default function ShimmerDiscovery() {
  return (
    <View style={styles.container}>
      {/* Product container placeholder */}
      <View style={styles.productContainer}>
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
          style={styles.image}
        />

        {/* Bottom overlay - product text and action icons */}
        <View style={styles.overlay}>
          <View style={styles.infoBox}>
            <View style={styles.leftOverlay}>
              <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
                style={[styles.line, { width: '70%' }]}
              />
              <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
                style={[styles.line, { width: '40%' }]}
              />
              <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
                style={[styles.line, { width: '90%' }]}
              />
            </View>
            <View style={styles.rightOverlay}>
              <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
                style={styles.circle}
              />
              <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                shimmerColors={['#2a3847', '#3a4857', '#2a3847']}
                style={styles.circle}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#353F54',
  },
  productContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 55,
    left: 24,
    right: 24,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(42, 56, 71, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.25)',
    gap: 16,
    alignItems: 'center',
  },
  leftOverlay: {
    flex: 1,
  },
  line: {
    height: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  rightOverlay: {
    alignItems: 'center',
    gap: 20,
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});
