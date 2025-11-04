// src/components/LocationPickerModal.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useLocation } from '../../hooks/useLocation'; // ✅ USE YOUR HOOK
import { LOCATION_CONFIG } from '../config/locationConfig';

const LocationPickerModal = ({
  visible = false, // ✅ DEFAULT TO FALSE
  onClose = () => {}, // ✅ DEFAULT EMPTY FUNCTION
  onLocationSelected = () => {}, // ✅ DEFAULT EMPTY FUNCTION
  initialLocation = null, // ✅ DEFAULT TO NULL
}) => {
  const { getCurrentLocation, loading: locationLoading } = useLocation(); // ✅ USE HOOK

  const [region, setRegion] = useState({
    latitude: initialLocation?.latitude || 20.5937,
    longitude: initialLocation?.longitude || 78.9629,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);

  const mapRef = useRef(null);

  // Get current location on open
  useEffect(() => {
    if (visible && !initialLocation) {
      handleGetCurrentLocation();
    }
  }, [visible]);

  // ✅ USE YOUR HOOK - Clean & simple
  const handleGetCurrentLocation = async () => {
    const result = await getCurrentLocation();

    if (result.success) {
      const { latitude, longitude } = result.data;

      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

      setRegion(newRegion);

      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }

      setSelectedLocation(result.data);
    } else {
      console.error('[ERROR] Failed to get location:', result.error);
    }
  };

  // Search locations
  const handleSearch = async query => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=8`,
        {
          headers: {
            'User-Agent': 'MyEcommerce/1.0',
          },
        },
      );

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('[ERROR] Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Select from search results
  const handleSelectSearchResult = result => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    const newRegion = {
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };

    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
    fetchAddressForCoordinates(lat, lon);

    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Fetch address from coordinates
  const fetchAddressForCoordinates = async (lat, lon) => {
    try {
      const response = await fetch(
        `${LOCATION_CONFIG.NOMINATIM_URL}?format=json&lat=${lat}&lon=${lon}`,
        {
          headers: {
            'User-Agent': 'MyEcommerce/1.0',
          },
        },
      );

      const data = await response.json();
      const address = data.address;

      const state =
        address.state ||
        address.province ||
        address.region ||
        address.county ||
        '';

      const city =
        address.city ||
        address.town ||
        address.village ||
        address.county ||
        address.district ||
        address.region ||
        address.locality ||
        '';

      setSelectedLocation({
        latitude: lat,
        longitude: lon,
        address:
          `${address.house_number || ''} ${address.road || ''}`.trim() ||
          data.display_name.split(',')[0],
        city: city,
        state: state,
        zip_code: address.postcode || '',
        country: address.country || '',
      });
    } catch (error) {
      console.error('[ERROR] Fetch address error:', error);
    }
  };

  // Map tap to update location
  const handleMapPress = e => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedLocation({
      latitude,
      longitude,
      loading: true,
    });
    fetchAddressForCoordinates(latitude, longitude);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#4fc3f7" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
          <TouchableOpacity
            onPress={handleGetCurrentLocation}
            disabled={locationLoading}
          >
            <Ionicons
              name="locate"
              size={24}
              color={locationLoading ? '#8a9fb5' : '#4fc3f7'}
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
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
                setShowSearchResults(true);
              }}
              placeholderTextColor="#8a9fb5"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSearchResults(false);
                }}
              >
                <Ionicons name="close" size={20} color="#8a9fb5" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <FlatList
                data={searchResults}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={() => handleSelectSearchResult(item)}
                  >
                    <Ionicons name="location" size={16} color="#4fc3f7" />
                    <View style={styles.resultTextContainer}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {item.display_name.split(',')[0]}
                      </Text>
                      <Text style={styles.resultSubtitle} numberOfLines={1}>
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

        {/* Map */}
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
              <View style={styles.markerContainer}>
                <Ionicons name="location" size={32} color="#4fc3f7" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Center Marker */}
        <View style={styles.centerMarker}>
          <Ionicons name="location" size={32} color="#ff4458" />
        </View>

        {/* Location Info & Confirm */}
        {selectedLocation && !selectedLocation.loading && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>{selectedLocation.address}</Text>
            <Text style={styles.locationDetails}>
              {selectedLocation.city}
              {selectedLocation.state && `, ${selectedLocation.state}`}
            </Text>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                onLocationSelected(selectedLocation);
                onClose();
              }}
            >
              <LinearGradient
                colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
                style={styles.buttonGradient}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.confirmButtonText}>Confirm Location</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {(selectedLocation?.loading || locationLoading) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4fc3f7" />
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
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  searchResultsContainer: {
    marginTop: 8,
    backgroundColor: '#2a3847',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79, 195, 247, 0.2)',
    gap: 10,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  resultSubtitle: {
    color: '#8a9fb5',
    fontSize: 12,
    marginTop: 2,
  },
  map: {
    flex: 1,
  },
  centerMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -32,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2a3847',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(79, 195, 247, 0.3)',
  },
  locationTitle: {
    color: '#4fc3f7',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationDetails: {
    color: '#8a9fb5',
    fontSize: 14,
    marginBottom: 16,
  },
  confirmButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});

export default LocationPickerModal;
