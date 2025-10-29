import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const CustomButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  if (disabled) {
    return (
      <TouchableOpacity
        style={[styles.button, styles.disabled, style]}
        onPress={onPress}
        disabled={true}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, styles.disabledText, textStyle]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      style={style}
    >
      <LinearGradient
        colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
        style={styles.button}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.text, textStyle]}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: 1,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  },
  disabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowOpacity: 0,
    elevation: 0,
    borderBottomWidth: 0,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledText: {
    color: '#8a9fb5',
  },
});
