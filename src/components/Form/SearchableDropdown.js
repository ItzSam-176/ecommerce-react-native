// components/Form/SearchableDropdown.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../supabase/supabase';
import { useDebounce } from '../../hooks/useDebounce';

const SearchableDropdown = ({
  placeholder = 'Search...',
  onSelect,
  onCreate,
  containerStyle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearch) {
      searchCategories(debouncedSearch);
    } else {
      fetchAllCategories();
    }
  }, [debouncedSearch]);

  const fetchAllCategories = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('category')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      setOptions(data);
    } else {
      console.error('[Error fetching categories]', error);
    }

    setLoading(false);
  };

  const searchCategories = async query => {
    setLoading(true);

    const { data, error } = await supabase
      .from('category')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true });

    if (!error && data) {
      setOptions(data);
    } else {
      console.error('[Search error]', error);
    }

    setLoading(false);
  };

  const handleSelect = item => {
    if (item.isCreateNew) {
      handleCreate(item.name);
    } else {
      onSelect(item);
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  const handleCreate = async name => {
    if (onCreate) {
      const success = await onCreate(name);
      if (success) {
        setSearchQuery('');
        setIsOpen(false);
        fetchAllCategories();
      }
    }
  };

  const getDisplayOptions = () => {
    const hasExactMatch = options.some(
      opt => opt.name.toLowerCase() === searchQuery.toLowerCase(),
    );

    if (searchQuery && !hasExactMatch && !loading) {
      return [
        {
          id: 'create-new',
          name: searchQuery,
          isCreateNew: true,
        },
        ...options,
      ];
    }

    return options;
  };

  const renderOptions = () => {
    const displayOptions = getDisplayOptions();

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>[Searching...]</Text>
        </View>
      );
    }

    if (displayOptions.length === 0) {
      return <Text style={styles.emptyText}>[No categories found]</Text>;
    }

    return displayOptions.map((item, index) => {
      if (item.isCreateNew) {
        return (
          <TouchableOpacity
            key={`create-${index}`}
            style={[styles.option, styles.createOption]}
            onPress={() => handleSelect(item)}
          >
            <Text style={styles.createText}>+ Add "{item.name}"</Text>
          </TouchableOpacity>
        );
      }

      return (
        <TouchableOpacity
          key={item.id?.toString() || `item-${index}`}
          style={styles.option}
          onPress={() => handleSelect(item)}
        >
          <Text style={styles.optionText}>{item.name}</Text>
        </TouchableOpacity>
      );
    });
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 200);
        }}
      />

      {isOpen && (
        <View style={styles.dropdown}>
          <ScrollView
            style={styles.scrollView}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {renderOptions()}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1000,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  scrollView: {
    maxHeight: 200,
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  createOption: {
    backgroundColor: '#f0f8ff',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  createText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  emptyText: {
    padding: 20,
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
});

export default SearchableDropdown;
