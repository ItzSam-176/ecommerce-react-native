// components/shared/CategoryChips.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

export default function CategoryChips({
  categories = [],
  onRemove,
  containerStyle = {},
  chipStyle = {},
  textStyle = {},
  removeButtonStyle = {},
  removeIcon = 'close-circle',
  removeIconSize = 16,
  removeIconColor = '#fff',
  variant = 'default',
  fullChipClickable = true,
}) {
  if (!categories.length) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'product-detail':
        return {
          container: styles.productDetailContainer,
          chip: styles.productDetailChip,
          text: styles.productDetailLabel,
        };
      case 'form':
        return {
          container: styles.formContainer,
          chip: styles.formChip,
          text: styles.formLabel,
        };
      case 'compact':
        return {
          container: styles.compactContainer,
          chip: styles.compactChip,
          text: styles.compactLabel,
        };
      default:
        return {
          container: styles.container,
          chip: styles.chip,
          text: styles.label,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const renderChip = cat => {
    const chipContent = (
      <>
        <Text style={[variantStyles.text, textStyle]}>{cat.name}</Text>
        {onRemove && (
          <Ionicons
            name={removeIcon}
            size={removeIconSize}
            color={removeIconColor}
            style={styles.removeIcon}
          />
        )}
      </>
    );

    if (onRemove && fullChipClickable) {
      return (
        <TouchableOpacity
          key={cat.id}
          onPress={() => onRemove(cat)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
            style={[variantStyles.chip, chipStyle]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {chipContent}
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    if (!onRemove) {
      return (
        <LinearGradient
          key={cat.id}
          colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
          style={[variantStyles.chip, chipStyle]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[variantStyles.text, textStyle]}>{cat.name}</Text>
        </LinearGradient>
      );
    }

    return (
      <LinearGradient
        key={cat.id}
        colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
        style={[variantStyles.chip, chipStyle]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[variantStyles.text, textStyle]}>{cat.name}</Text>
        <TouchableOpacity
          onPress={() => onRemove(cat)}
          style={[styles.removeButton, removeButtonStyle]}
        >
          <Ionicons
            name={removeIcon}
            size={removeIconSize}
            color={removeIconColor}
          />
        </TouchableOpacity>
      </LinearGradient>
    );
  };

  return (
    <View style={[variantStyles.container, containerStyle]}>
      {categories.map(renderChip)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 0,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 0,
  },
  label: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  removeIcon: {
    marginLeft: 6,
  },
  productDetailContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  productDetailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  productDetailLabel: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  formContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    marginTop: 5,
  },
  formChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  formLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '400',
  },
  compactContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  compactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 4,
    marginBottom: 4,
  },
  compactLabel: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  removeButton: {
    marginLeft: 6,
    padding: 2,
  },
});
