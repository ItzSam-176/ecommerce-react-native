// src/components/tour/AnimatedFinger.js
import React, { useEffect } from 'react';
import { Text, Dimensions,Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const AnimatedFinger = ({ direction, visible }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    console.log('AnimatedFinger - visible:', visible, 'direction:', direction);
    if (!visible) {
      opacity.value = withTiming(0, { duration: 200 });
      translateX.value = 0;
      translateY.value = 0;
      return;
    }

    opacity.value = withTiming(1, { duration: 300 });

    const distance = 100;
    const duration = 1200;

    switch (direction) {
      case 'left':
        translateX.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(-distance, { duration, easing: Easing.inOut(Easing.ease) }),
            withTiming(-distance, { duration: 200 })
          ),
          -1,
          false
        );
        break;

      case 'right':
        translateX.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(distance, { duration, easing: Easing.inOut(Easing.ease) }),
            withTiming(distance, { duration: 200 })
          ),
          -1,
          false
        );
        break;

      case 'up':
        translateY.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(-distance, { duration, easing: Easing.inOut(Easing.ease) }),
            withTiming(-distance, { duration: 200 })
          ),
          -1,
          false
        );
        break;

      case 'down':
        translateY.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(distance, { duration, easing: Easing.inOut(Easing.ease) }),
            withTiming(distance, { duration: 200 })
          ),
          -1,
          false
        );
        break;
    }
  }, [visible, direction]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: height / 2 - 50, // Center vertically
          left: width / 2 - 50, // Center horizontally
          zIndex: 99999,
          elevation: 99999,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <Image
        source={require('../../assets/finger.png')}
        style={{ width: 100, height: 100, tintColor: '#5fd4f7' }}
      />
    </Animated.View>
  );
};

export default AnimatedFinger;
