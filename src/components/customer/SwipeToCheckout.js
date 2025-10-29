import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const SWIPE_THRESHOLD = 0.7;

export default function SwipeToCheckout({
  onSwipeSuccess,
  disabled = false,
  isProcessing = false, // Add new prop
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const buttonSize = 56;
  const maxSwipeDistanceRef = useRef(0);
  const [maxSwipeDistance, setMaxSwipeDistance] = useState(0);

  useEffect(() => {
    if (containerWidth > buttonSize + 8) {
      const distance = containerWidth - buttonSize - 8;
      maxSwipeDistanceRef.current = distance;
      setMaxSwipeDistance(distance);
    }
  }, [containerWidth]);

  const isDisabled = disabled || isProcessing;

  const panResponderRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isDisabled,
      onMoveShouldSetPanResponder: () => !isDisabled,
      onPanResponderMove: (_, gestureState) => {
        if (isDisabled) return;
        const maxDist = maxSwipeDistanceRef.current;
        if (maxDist <= 0) return;
        const newValue = Math.max(0, Math.min(gestureState.dx, maxDist));
        translateX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const maxDist = maxSwipeDistanceRef.current;
        if (maxDist <= 0) return;
        const swipePercentage = gestureState.dx / maxDist;

        if (swipePercentage >= SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: maxDist,
            useNativeDriver: false,
            speed: 50,
            bounciness: 0,
          }).start(() => {
            if (onSwipeSuccess) {
              onSwipeSuccess();
            }
            setTimeout(() => {
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: false,
              }).start();
            }, 300);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            speed: 20,
            bounciness: 10,
          }).start();
        }
      },
    }),
  );

  const handleLayout = event => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const textOpacity =
    maxSwipeDistance > 0
      ? translateX.interpolate({
          inputRange: [0, maxSwipeDistance * 0.3, maxSwipeDistance * 0.6],
          outputRange: [1, 0.5, 0],
          extrapolate: 'clamp',
        })
      : new Animated.Value(1);

  // Get text based on state
  const getText = () => {
    if (isProcessing) return 'Processing...';
    if (disabled) return 'Remove Unavailable Items';
    return 'Checkout';
  };

  return (
    <View style={styles.wrapper}>
      <View
        style={[styles.container, isDisabled && styles.disabledContainer]}
        onLayout={handleLayout}
      >
        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Text style={[styles.text, isDisabled && styles.disabledText]}>
            {getText()}
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.buttonContainer,
            {
              transform: [{ translateX }],
            },
          ]}
          {...panResponderRef.current.panHandlers}
        >
          <LinearGradient
            colors={
              isDisabled
                ? ['#999', '#888', '#777']
                : ['#5fd4f7', '#4fc3f7', '#3aa5c7']
            }
            style={styles.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="arrow-forward" size={28} color="#fff" />
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    height: 64,
    width: '60%',
    backgroundColor: 'rgba(42, 56, 71, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  disabledContainer: {
    backgroundColor: 'rgba(42, 56, 71, 0.5)',
    borderColor: 'rgba(153, 153, 153, 0.3)',
  },
  textContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ccc',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  disabledText: {
    color: '#999',
    fontSize: 14,
  },
  buttonContainer: {
    position: 'absolute',
    left: 4,
    width: 56,
    height: 56,
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 12,
    marginTop: 3,
  },
  button: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  },
});
