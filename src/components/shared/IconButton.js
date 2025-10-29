// src/components/shared/IconButton.js
import React from 'react';
import { TouchableOpacity, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function IconButton({
  onPress,
  iconName,
  isImage,
  imageSource,
  size = 22,
  iconColor = '#fff',
  containerStyle = {},
  gradientColors = ['#5fd4f7', '#4fc3f7', '#3aa5c7'],
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={gradientColors}
        style={[styles.iconButton, containerStyle]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {isImage ? (
          <Image source={imageSource} style={styles.imageIcon} />
        ) : (
          <Ionicons name={iconName} size={size} color={iconColor} />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  },
  imageIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
});
