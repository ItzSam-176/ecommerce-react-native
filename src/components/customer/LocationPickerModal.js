// src/components/LocationPickerModal.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LOCATION_CONFIG } from '../../config/locationConfig';
import { useLocation } from '../../hooks/useLocation';

const LocationPickerModal = ({
  visible = false,
  onClose = () => {},
  onLocationSelected = () => {},
  initialLocation = null,
}) => {
  const {
    loading: locationLoading,
    getCurrentLocation,
    permissionAlert,
    setPermissionAlert,
    fetchAddressFromCoordinates,
  } = useLocation();
  // ✅ Use hook's fetchAddressFromCoordinates instead

  const [region, setRegion] = useState({
    latitude: initialLocation?.latitude || 20.5937,
    longitude: initialLocation?.longitude || 78.9629,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);

  const mapRef = useRef(null);

  // ✅ INIT: Fetch current location when modal opens
  useEffect(() => {
    if (visible && !initialLocation) {
      initializeCurrentLocation();
    }
  }, [visible]);

  // ✅ Handle permission alerts from hook
  useEffect(() => {
    if (permissionAlert.visible) {
      Alert.alert(permissionAlert.title, permissionAlert.message);
      setPermissionAlert({ visible: false, title: '', message: '' });
    }
  }, [permissionAlert]);

  const initializeCurrentLocation = async () => {
    setLoadingAddress(true);
    try {
      const result = await getCurrentLocation();
      if (result.success) {
        const { data } = result;
        setSelectedLocation(data);
        const newRegion = {
          latitude: data.latitude,
          longitude: data.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        };
        setRegion(newRegion);
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      } else {
        console.error('[ERROR] getCurrentLocation failed:', result.error);
      }
    } catch (error) {
      console.error('[ERROR] initializeCurrentLocation:', error);
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleMapPress = async e => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLoadingAddress(true);
    try {
      const result = await fetchAddressFromCoordinates(latitude, longitude);
      if (result.success) {
        setSelectedLocation(result.data);
      } else {
        console.error('[ERROR] Address fetch failed:', result.error);
        setSelectedLocation({
          latitude,
          longitude,
          address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          city: '',
          state: '',
          zip_code: '',
          country: '',
        });
      }
    } finally {
      setLoadingAddress(false);
    }
  };

  // Search for locations
  const handleSearch = async query => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    try {
      const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
      const minLat = latitude - latitudeDelta / 2;
      const maxLat = latitude + latitudeDelta / 2;
      const minLon = longitude - longitudeDelta / 2;
      const maxLon = longitude + longitudeDelta / 2;

      const viewbox = `${minLon},${maxLat},${maxLon},${minLat}`;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=8&viewbox=${viewbox}&bounded=1`,
        {
          headers: {
            'User-Agent': 'MyEcommerce/1.0',
          },
        },
      );

      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('[ERROR] Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  // Select search result
  const handleSelectResult = async result => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setLoadingAddress(true);

    try {
      const addressResult = await fetchAddressFromCoordinates(lat, lon);
      if (addressResult.success) {
        setSelectedLocation(addressResult.data);
      } else {
        setSelectedLocation({
          latitude: lat,
          longitude: lon,
          address: result.display_name.split(',')[0],
          city: '',
          state: '',
          zip_code: '',
          country: '',
        });
      }
    } finally {
      const newRegion = {
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      setRegion(newRegion);
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
      setLoadingAddress(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#4fc3f7" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#8a9fb5" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search location..."
              value={searchQuery}
              onChangeText={text => {
                setSearchQuery(text);
                handleSearch(text);
              }}
              placeholderTextColor="#8a9fb5"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowResults(false);
                }}
              >
                <Ionicons name="close" size={20} color="#8a9fb5" />
              </TouchableOpacity>
            )}
          </View>

          {showResults && searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <FlatList
                data={searchResults}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.resultItem}
                    onPress={() => handleSelectResult(item)}
                  >
                    <Ionicons name="location" size={16} color="#4fc3f7" />
                    <View style={styles.resultText}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {item.display_name.split(',')[0]}
                      </Text>
                      <Text style={styles.resultSub} numberOfLines={1}>
                        {item.display_name.split(',').slice(1, 3).join(',')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={item => item.osm_id.toString()}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>

        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onPress={handleMapPress}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
            >
              <Ionicons name="location" size={32} color="#4fc3f7" />
            </Marker>
          )}
        </MapView>

        {selectedLocation && (
          <View style={styles.bottomInfo}>
            {loadingAddress || locationLoading ? (
              <ActivityIndicator size="large" color="#4fc3f7" />
            ) : (
              <>
                <Text style={styles.infoTitle}>{selectedLocation.address}</Text>
                {selectedLocation.city && (
                  <Text style={styles.infoSubtitle}>
                    {selectedLocation.city}
                    {selectedLocation.state && `, ${selectedLocation.state}`}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => {
                    onLocationSelected(selectedLocation);
                    onClose();
                  }}
                >
                  <Text style={styles.confirmText}>Confirm Location</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#353F54',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79, 195, 247, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#353F54',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a3847',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
    color: '#fff',
    fontSize: 14,
  },
  resultsContainer: {
    marginTop: 8,
    backgroundColor: '#2a3847',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
    maxHeight: 300,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79, 195, 247, 0.2)',
    gap: 10,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  resultSub: {
    color: '#8a9fb5',
    fontSize: 12,
    marginTop: 2,
  },
  map: {
    flex: 1,
  },
  bottomInfo: {
    backgroundColor: '#2a3847',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(79, 195, 247, 0.2)',
  },
  infoTitle: {
    color: '#4fc3f7',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoSubtitle: {
    color: '#8a9fb5',
    fontSize: 12,
    marginBottom: 12,
  },
  confirmBtn: {
    backgroundColor: '#4fc3f7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default LocationPickerModal;
