// components/shared/AnimatedHeart.js
import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

export const AnimatedHeart = forwardRef(
  (
    { isFavorite, size = 30, color = '#4fc3f7', outlineColor = '#fff' },
    ref,
  ) => {
    const scale = useSharedValue(1);

    // [Info]: Expose animate method to parent via ref
    useImperativeHandle(ref, () => ({
      animate: () => {
        scale.value = 1;
        scale.value = withTiming(
          1.5,
          {
            duration: 150,
            easing: Easing.out(Easing.cubic),
          },
          finished => {
            if (finished) {
              scale.value = withTiming(1, {
                duration: 150,
                easing: Easing.in(Easing.cubic),
              });
            }
          },
        );
      },
    }));

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedIcon
        name={'heart-outline'}
        size={size}
        color={isFavorite ? color : outlineColor}
        style={[styles.icon, animatedStyle]}
      />
    );
  },
);

const styles = StyleSheet.create({
  icon: {
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
