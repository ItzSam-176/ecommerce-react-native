import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

export default function ColumnSelectorModal({
  visible,
  onClose,
  columns,
  visibleColumns,
  onApply,
  resetColumns,
  maxVisibleItems = 5, // Default to 5 items visible
}) {
  const [localSelected, setLocalSelected] = useState([]);

  useEffect(() => {
    if (visible) setLocalSelected(visibleColumns || []);
  }, [visible, visibleColumns]);

  const toggleLocal = key => {
    setLocalSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return Array.from(next);
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.option}
      onPress={() => toggleLocal(item.key)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={localSelected.includes(item.key) ? 'checkbox' : 'square-outline'}
        size={24}
        color="#4fc3f7"
        style={styles.checkbox}
      />
      <Text style={styles.optionText}>{item.label}</Text>
    </TouchableOpacity>
  );

  // Calculate height based on number of items to show
  const itemHeight = 48; // paddingVertical(12*2) + fontSize(16) + margins
  const listHeight = Math.min(columns.length, maxVisibleItems) * itemHeight;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Categories</Text>
            <TouchableOpacity
              onPress={() => setLocalSelected([])}
              style={styles.resetButton}
            >
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listContainer}>
            <FlatList
              data={columns}
              renderItem={renderItem}
              keyExtractor={item => item.key}
              showsVerticalScrollIndicator={false}
              style={[styles.flatList, { maxHeight: listHeight }]}
              initialNumToRender={maxVisibleItems}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={true}
              indicatorStyle="white"

            />
          </View>

          <TouchableOpacity
            onPress={() => {
              onApply?.(localSelected);
              onClose();
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
              style={styles.closeButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.closeText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#2a3847',
    width: '85%',
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  resetText: {
    color: '#4fc3f7',
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    marginBottom: 12,
  },
  flatList: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  checkbox: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  scrollIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 4,
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
    borderRadius: 8,
  },
  scrollIndicatorText: {
    fontSize: 12,
    color: '#4fc3f7',
    marginLeft: 4,
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  },
  closeText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
