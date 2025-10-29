//src/components/customer/ProductCard.js
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AnimatedHeart } from '../shared/AnimatedHeart';

const COLORS = {
  cardBg: 'rgba(26, 35, 50, 0.7)',
  cardBorder: 'rgba(255, 255, 255, 0.2)',
  textPrimary: '#fff',
  textSecondary: '#8a9fb5',
  price: '#4fc3f7',
  shadow: 'rgba(0,0,0,0.3)',
  heart: '#4fc3f7',
  heartBg: 'rgba(79, 195, 247, 0.15)',
};

export default function ProductCard({
  id,
  name,
  description,
  price,
  imageUri,
  currencySymbol = '$',
  isFavorite = false,
  disabledAdd = false,
  loadingAdd = false,
  inCart = false,
  cartQuantity = 0,
  onPress,
  onToggleFavorite,
  onAddToCart,
  style,
}) {
  const heartRef = useRef(null);
  const [optimisticFavorite, setOptimisticFavorite] = useState(null);
  const displayFavorite =
    optimisticFavorite !== null ? optimisticFavorite : isFavorite;

  const handleHeartPress = () => {
    const wasInWishlist = isFavorite;

    if (!wasInWishlist) {
      setOptimisticFavorite(true);
      setTimeout(() => {
        if (heartRef.current) {
          heartRef.current.animate();
        }
      }, 0);
    } else {
      setOptimisticFavorite(false);
    }

    if (onToggleFavorite) {
      onToggleFavorite();
    }

    setTimeout(() => {
      setOptimisticFavorite(null);
    }, 1000);
  };

  return (
    <View style={[styles.cardWrap, style]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        disabled={!onPress}
        style={styles.cardContainer}
      >
        <View style={styles.card}>
          <View style={styles.imageWrap}>
            {imageUri ? (
              <Image
                source={{
                  uri: imageUri,
                }}
                style={[styles.image, { backgroundColor: 'transparent' }]}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={28} color="#aaa" />
              </View>
            )}

            <TouchableOpacity
              style={styles.heartBtn}
              onPress={handleHeartPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <AnimatedHeart
                ref={heartRef}
                isFavorite={displayFavorite}
                size={24}
                color={COLORS.heart}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>
              {name || 'Product'}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {description || 'Item Description'}
            </Text>
            <Text style={styles.price} numberOfLines={1}>
              {currencySymbol} {Number(price ?? 0)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  cardContainer: {
    width: 160,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 15,
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
  },
  title: {
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.price,
  },
});
