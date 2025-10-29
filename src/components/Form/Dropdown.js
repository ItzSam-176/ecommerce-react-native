import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Dropdown = ({ options, selected, onSelect, placeholder }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = item => {
    onSelect(item);
    setOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.inputContainer}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <Text style={[styles.text, !selected && { color: '#8a9fb5' }]}>
          {selected?.name || placeholder}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#4fc3f7"
        />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setOpen(false)}
          activeOpacity={1}
        >
          <View style={styles.dropdown}>
            <FlatList
              data={options}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default Dropdown;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a3847',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    elevation: 2,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'space-between',
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  text: {
    fontSize: 16,
    color: '#fff',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dropdown: {
    backgroundColor: '#2a3847',
    borderRadius: 10,
    elevation: 5,
    maxHeight: 250,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionText: {
    fontSize: 16,
    color: '#fff',
  },
});
