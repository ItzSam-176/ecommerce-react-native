// src/components/LocationPickerModal.js
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useLocation } from '../../hooks/useLocation';
import Loader from '../../components/shared/Loader';
import IconButton from '../../components/shared/IconButton';

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

  const mapRef = useRef(null);

  // internal position states
  const [region, setRegion] = useState({
    latitude: initialLocation?.latitude || 20.5937,
    longitude: initialLocation?.longitude || 78.9629,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [gettingInitialLocation, setGettingInitialLocation] = useState(false);

  // ✅ useRef instead of useState for region to avoid re-renders
  const regionRef = useRef(region);

  const [tracksView, setTracksView] = useState(true);

  // Initialize location on modal open
  useEffect(() => {
    if (visible && !initialLocation) initializeCurrentLocation();
  }, [visible]);

  // Handle permission alerts from hook
  useEffect(() => {
    if (permissionAlert.visible) {
      Alert.alert(permissionAlert.title, permissionAlert.message);
      setPermissionAlert({ visible: false, title: '', message: '' });
    }
  }, [permissionAlert]);

  useEffect(() => {
    if (selectedLocation) {
      // allow one render, then freeze the view for performance
      setTracksView(true);
      const timer = setTimeout(() => setTracksView(false), 500);
      return () => clearTimeout(timer);
    }
  }, [selectedLocation?.latitude, selectedLocation?.longitude]);

  const initializeCurrentLocation = async () => {
    setGettingInitialLocation(true);
    try {
      const result = await getCurrentLocation();
      if (result.success) {
        const { data } = result;
        setSelectedLocation(data);

        const newRegion = {
          latitude: data.latitude,
          longitude: data.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };

        regionRef.current = newRegion; // keep ref updated
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 800);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to get current location.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get your current location.');
    } finally {
      setGettingInitialLocation(false);
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

  const handleGoToCurrentLocation = async () => {
    setGettingInitialLocation(true);
    try {
      const result = await getCurrentLocation();
      if (result.success) {
        const { data } = result;
        setSelectedLocation(data);

        const newRegion = {
          latitude: data.latitude,
          longitude: data.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };

        regionRef.current = newRegion;
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 800);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to get location.');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to get your current location.');
    } finally {
      setGettingInitialLocation(false);
    }
  };

  const markerElement = useMemo(() => {
    if (!selectedLocation) return null;
    return (
      <Marker
        coordinate={{
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        }}
        tracksViewChanges={tracksView}
      >
        <Ionicons name="location" size={32} color="red" />
      </Marker>
    );
  }, [selectedLocation?.latitude, selectedLocation?.longitude, tracksView]);

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
          {/* use your IconButton for close */}
          <IconButton
            onPress={onClose}
            iconName="close"
            size={22}
            containerStyle={{ width: 44, height: 44, borderRadius: 12 }}
          />

          <Text style={styles.headerTitle}>Select Location</Text>

          {/* use your IconButton for locate */}
          <IconButton
            onPress={handleGoToCurrentLocation}
            iconName="locate-outline"
            size={22}
            containerStyle={{ width: 44, height: 44, borderRadius: 12 }}
          />
        </View>

        {/* Map */}
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={regionRef.current} // ✅ use initialRegion instead of region
            onPress={handleMapPress}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            onRegionChangeComplete={r => {
              regionRef.current = r;
            }}
          >
            {markerElement}
          </MapView>

          {gettingInitialLocation && (
            <View style={styles.loadingOverlay}>
              <Loader
                size={120}
                speed={1}
              />
            </View>
          )}
        </View>

        {/* Bottom Info as floating card */}
        {selectedLocation && (
          <View style={styles.bottomInfo}>
            <Text style={styles.infoTitle}>
              {selectedLocation.address || '[No address found]'}
            </Text>
            {selectedLocation.city ? (
              <Text style={styles.infoSubtitle}>
                {selectedLocation.city}
                {selectedLocation.state ? `, ${selectedLocation.state}` : ''}
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => {
                onLocationSelected(selectedLocation);
                onClose();
              }}
            >
              <Text style={styles.confirmText}>Confirm Location</Text>
            </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(53, 63, 84, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    backgroundColor: '#2a3847',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },

  infoTitle: {
    color: '#4fc3f7',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },

  infoSubtitle: {
    color: '#8a9fb5',
    fontSize: 15,
    marginBottom: 12,
  },

  confirmBtn: {
    backgroundColor: '#4fc3f7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },

  confirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default LocationPickerModal;
