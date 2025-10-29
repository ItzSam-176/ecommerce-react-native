import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import HapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';

const StatusBadge = ({
  status,
  icon,
  color,
  backgroundColor,
  onStatusChange,
  orderId,
}) => {
  const getAvailableOptions = () => {
    const normalizedStatus = (status || '').toLowerCase();
    const allOptions = [
      {
        id: 'Pending',
        title: 'Pending',
        icon: 'alert-circle',
        color: '#92400E',
        backgroundColor: '#FEF3C7',
      },
      {
        id: 'Cancelled',
        title: 'Cancelled',
        icon: 'close-circle',
        color: '#991B1B',
        backgroundColor: '#FEE2E2',
      },
      {
        id: 'Delivered',
        title: 'Delivered',
        icon: 'checkmark-circle',
        color: '#065F46',
        backgroundColor: '#D1FAE5',
      },
    ];

    return allOptions.filter(
      option => option.id.toLowerCase() !== normalizedStatus,
    );
  };

  const triggerHapticFeedback = () => {
    console.log('[Triggering haptic feedback]');
    HapticFeedback.trigger(HapticFeedbackTypes.impactMedium, {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  };

  const handleMenuOpen = () => {
    console.log('[Menu opened]');
    triggerHapticFeedback();
  };

  const handleStatusSelect = selectedStatus => {
    console.log('[Status selected]:', selectedStatus);
    triggerHapticFeedback();

    if (onStatusChange && selectedStatus) {
      onStatusChange(orderId, selectedStatus);
    }
  };

  const availableOptions = getAvailableOptions();

  return (
    <Menu onOpen={handleMenuOpen}>
      <MenuTrigger
        triggerOnLongPress={true}
        customStyles={{
          triggerTouchable: { underlayColor: 'transparent' },
        }}
      >
        <View style={[styles.badge, { backgroundColor }]}>
          {icon && (
            <Ionicons name={icon} size={16} color={color} style={styles.icon} />
          )}
          <Text style={[styles.text, { color }]}>{status}</Text>
        </View>
      </MenuTrigger>

      <MenuOptions
        customStyles={{
          optionsContainer: {
            borderRadius: 8,
            padding: 4,
            marginTop: 32,
            marginLeft: 10,
            width: 120,
          },
        }}
      >
        {availableOptions.map(option => (
          <MenuOption
            key={option.id}
            onSelect={() => handleStatusSelect(option.id)}
            customStyles={{
              optionWrapper: {
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 6,
                marginVertical: 2,
                backgroundColor: option.backgroundColor,
              },
            }}
          >
            <View style={styles.menuItem}>
              <Ionicons
                name={option.icon}
                size={16}
                color={option.color}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuText, { color: option.color }]}>
                {option.title}
              </Text>
            </View>
          </MenuOption>
        ))}
      </MenuOptions>
    </Menu>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'center',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 8,
  },
  menuText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default StatusBadge;
