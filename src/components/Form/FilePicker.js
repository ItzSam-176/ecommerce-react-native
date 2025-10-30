import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const FilePicker = ({
  fileName,
  onPick,
  placeholder = 'No file chosen',
  disabled = false, // ✅ New prop
}) => {
  return (
    <View
      style={[
        styles.container,
        disabled && styles.disabledContainer, // ✅ Disabled style
      ]}
    >
      <Text
        style={[
          styles.fileName,
          disabled && styles.disabledText, // ✅ Disabled text
        ]}
        numberOfLines={1}
      >
        {fileName || placeholder}
      </Text>
      <TouchableOpacity
        onPress={disabled ? undefined : onPick} // ✅ No-op if disabled
        activeOpacity={disabled ? 1 : 0.8}
        disabled={disabled} // ✅ Disable touch
      >
        <LinearGradient
          colors={
            disabled
              ? ['#666', '#555', '#444'] // ✅ Gray gradient when disabled
              : ['#5fd4f7', '#4fc3f7', '#3aa5c7']
          }
          style={styles.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.buttonText}>Upload</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default FilePicker;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#2a3847',
  },
  disabledContainer: {
    opacity: 0.9, // ✅ Dim when disabled
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  fileName: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 14,
    color: '#fff',
    backgroundColor: '#2a3847',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    minHeight: 50,
  },
  disabledText: {
    color: '#999', // ✅ Gray text when disabled
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    minHeight: 51,
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
