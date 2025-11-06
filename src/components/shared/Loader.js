// src/components/Loader.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

export default function Loader({ visible = true, size = 100, speed = 1 }) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* [Dim overlay layer] */}
      <View style={styles.dimLayer} />

      {/* [Loader on top with no background] */}
      <View style={styles.loaderContainer}>
        <LottieView
          source={require('../../assets/animation/loader.json')}
          autoPlay
          loop
          speed={speed}
          style={{ width: size, height: size }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  dimLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // [Screen dims here]
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // [Loader has no background]
  },
});
