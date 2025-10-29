import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function SortBottomSheet({
  isVisible,
  onClose,
  onSelect,
  variant = '',
}) {
  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose} style={styles.modal}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.sheetTitle}>Sort By</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#8a9fb5" />
          </TouchableOpacity>
        </View>

        {variant === 'orders' ? (
          <>
            <TouchableOpacity
              onPress={() => onSelect('TOTAL_ASC')}
              style={styles.optionButton}
              activeOpacity={0.7}
            >
              <Text style={styles.option}>Total (Low → High)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSelect('TOTAL_DESC')}
              style={styles.optionButton}
              activeOpacity={0.7}
            >
              <Text style={styles.option}>Total (High → Low)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSelect('QTY_ASC')}
              style={styles.optionButton}
              activeOpacity={0.7}
            >
              <Text style={styles.option}>Quantity (Low → High)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSelect('QTY_DESC')}
              style={styles.optionButton}
              activeOpacity={0.7}
            >
              <Text style={styles.option}>Quantity (High → Low)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSelect('CREATED_DESC')}
              style={styles.optionButton}
              activeOpacity={0.7}
            >
              <Text style={styles.option}>Newest First</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSelect('CREATED_ASC')}
              style={styles.optionButton}
              activeOpacity={0.7}
            >
              <Text style={styles.option}>Oldest First</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => onSelect('NAME_ASC')}
              style={styles.optionButton}
              activeOpacity={0.7}
            >
              <Text style={styles.option}>Name (A → Z)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSelect('NAME_DESC')}
              style={styles.optionButton}
              activeOpacity={0.7}
            >
              <Text style={styles.option}>Name (Z → A)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSelect('PRICE_ASC')}
              style={styles.optionButton}
              activeOpacity={0.7}
            >
              <Text style={styles.option}>Price (Low → High)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSelect('PRICE_DESC')}
              style={styles.optionButton}
              activeOpacity={0.7}
            >
              <Text style={styles.option}>Price (High → Low)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSelect('CREATED_DESC')}
              style={styles.optionButton}
              activeOpacity={0.7}
            >
              <Text style={styles.option}>Newest First</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSelect('CREATED_ASC')}
              style={styles.optionButton}
              activeOpacity={0.7}
            >
              <Text style={styles.option}>Oldest First</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  sheet: {
    backgroundColor: '#2a3847',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  optionButton: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  option: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});
