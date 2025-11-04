// src/screens/Test.js
import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';

import { useLocation } from '../../hooks/useLocation';

const DEFAULT_COORD = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 15,
  longitudeDelta: 15,
};

const Test = () => {
  const { fetchAddressFromCoordinates } = useLocation();

  const mapRef = useRef(null);

  const [region, setRegion] = useState(DEFAULT_COORD);
  const [markerCoord, setMarkerCoord] = useState({
    latitude: DEFAULT_COORD.latitude,
    longitude: DEFAULT_COORD.longitude,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [logs, setLogs] = useState([]);
  const [gettingLocation, setGettingLocation] = useState(true); // initial location fetch

  const addLog = message => {
    console.log(message);
    setLogs(prev => [...prev, message]);
  };

  // Request permission (Android) and get current location
  const requestLocationPermissionAndFetch = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location permission',
            message: 'We need your location to place the marker on map',
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
          },
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          addLog('[WARN] Location permission denied');
          Alert.alert(
            'Permission denied',
            'Please enable location permission from settings to use this feature.',
          );
          setGettingLocation(false);
          return;
        }
      }

      Geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          addLog('[INIT] Current position acquired');
          setRegion(r => ({
            ...r,
            latitude,
            longitude,
          }));
          setMarkerCoord({ latitude, longitude });

          if (mapRef.current?.animateToRegion) {
            mapRef.current.animateToRegion(
              {
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              500,
            );
          }

          fetchAddress(latitude, longitude);
          setGettingLocation(false);
        },
        err => {
          addLog(`[ERROR] Failed to get current position: ${err.message}`);
          Alert.alert('Location Error', err.message);
          setGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        },
      );
    } catch (e) {
      addLog(`[EXCEPTION] ${e.message}`);
      setGettingLocation(false);
    }
  };

  useEffect(() => {
    addLog('[INIT] Test component mounted');
    addLog('[INFO] Attempting to get current location...');
    requestLocationPermissionAndFetch();

    return () => {
      Geolocation.stopObserving(); // ensure no leaks on unmount
      addLog('[CLEANUP] Geolocation stopped observing');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called when user taps on map
  const handleMapPress = e => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    addLog('[MAP_PRESS] Location selected');
    addLog(`[MAP_PRESS] Latitude: ${latitude.toFixed(6)}`);
    addLog(`[MAP_PRESS] Longitude: ${longitude.toFixed(6)}`);

    setMarkerCoord({ latitude, longitude });

    // move map smoothly (optional)
    if (mapRef.current && mapRef.current.animateToRegion) {
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: Math.min(region.latitudeDelta, 0.01),
          longitudeDelta: Math.min(region.longitudeDelta, 0.01),
        },
        300,
      );
    }

    // fetch address for tapped point
    fetchAddress(latitude, longitude);
  };

  const fetchAddress = async (lat, lon) => {
    setLoadingAddress(true);
    addLog('[FETCH_ADDRESS] Requesting address...');

    try {
      const result = await fetchAddressFromCoordinates(lat, lon);

      if (result && result.success) {
        setSelectedLocation(result.data);
        addLog('[SUCCESS] Address fetched');
        addLog(`[SUCCESS] Address: ${result.data.address || 'N/A'}`);
        if (result.data.city) addLog(`[SUCCESS] City: ${result.data.city}`);
        if (result.data.state) addLog(`[SUCCESS] State: ${result.data.state}`);
        if (result.data.country)
          addLog(`[SUCCESS] Country: ${result.data.country}`);
      } else {
        const errMsg = result && result.error ? result.error : 'Unknown error';
        addLog(`[ERROR] ${errMsg}`);
        Alert.alert('Address error', errMsg);
      }
    } catch (error) {
      addLog(`[EXCEPTION] ${error.message}`);
      Alert.alert('Fetch error', error.message);
    } finally {
      setLoadingAddress(false);
    }
  };

  // update region state when user stops moving the map
  const onRegionChangeComplete = newRegion => {
    setRegion(newRegion);
  };

  const confirmCurrentLocation = () => {
    addLog('[CONFIRM] Using current center location');
    addLog(`[CONFIRM] Latitude: ${region.latitude.toFixed(6)}`);
    addLog(`[CONFIRM] Longitude: ${region.longitude.toFixed(6)}`);

    setMarkerCoord({
      latitude: region.latitude,
      longitude: region.longitude,
    });

    fetchAddress(region.latitude, region.longitude);
  };

  const resetMap = () => {
    addLog('[RESET] Clearing all data');
    setLogs([]);
    setSelectedLocation(null);
    setMarkerCoord({
      latitude: DEFAULT_COORD.latitude,
      longitude: DEFAULT_COORD.longitude,
    });
    setRegion(DEFAULT_COORD);

    if (mapRef.current && mapRef.current.animateToRegion) {
      mapRef.current.animateToRegion(DEFAULT_COORD, 400);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onPress={handleMapPress}
        onRegionChangeComplete={onRegionChangeComplete}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      >
        <Marker coordinate={markerCoord}>
          <View style={styles.markerContainer}>
            <Ionicons name="location" size={32} color="#4fc3f7" />
          </View>
        </Marker>
      </MapView>

      <View style={styles.logContainer}>
        <View style={styles.logHeader}>
          <Text style={styles.logTitle}>Location Info</Text>
          <TouchableOpacity onPress={resetMap} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            onPress={confirmCurrentLocation}
            style={[styles.actionBtn, { marginRight: 8 }]}
            disabled={loadingAddress || gettingLocation}
          >
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Confirm</Text>
          </TouchableOpacity>

          <Text style={styles.coordinatesText}>
            {markerCoord.latitude.toFixed(6)},{' '}
            {markerCoord.longitude.toFixed(6)}
          </Text>
        </View>

        {selectedLocation && (
          <View style={styles.selectedLocationBox}>
            <Text style={styles.selectedLocationTitle}>
              {selectedLocation.address || '[no address]'}
            </Text>
            {selectedLocation.city && (
              <Text style={styles.selectedLocationSubtitle}>
                {selectedLocation.city}
                {selectedLocation.state ? `, ${selectedLocation.state}` : ''}
              </Text>
            )}
          </View>
        )}

        <ScrollView style={styles.logBox}>
          {logs.length === 0 ? (
            <Text style={styles.logText}>
              [READY] Tap or drag to select location
            </Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logText}>
                {log}
              </Text>
            ))
          )}
        </ScrollView>

        {(loadingAddress || gettingLocation) && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#4fc3f7" />
            <Text style={styles.loadingText}>
              {gettingLocation ? 'Locating you...' : 'Fetching address...'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#353F54',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    borderRadius: 50,
    padding: 8,
    borderWidth: 2,
    borderColor: '#4fc3f7',
  },
  logContainer: {
    height: 300,
    backgroundColor: '#2a3847',
    borderTopWidth: 1,
    borderTopColor: 'rgba(79, 195, 247, 0.3)',
    padding: 10,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logTitle: {
    color: '#4fc3f7',
    fontWeight: '600',
    fontSize: 14,
  },
  clearBtn: {
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  clearBtnText: {
    color: '#ff6b6b',
    fontWeight: '600',
    fontSize: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  actionBtn: {
    backgroundColor: '#4fc3f7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  coordinatesText: {
    color: '#8a9fb5',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  selectedLocationBox: {
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  selectedLocationTitle: {
    color: '#4fc3f7',
    fontWeight: '600',
    fontSize: 12,
    marginBottom: 2,
  },
  selectedLocationSubtitle: {
    color: '#8a9fb5',
    fontSize: 11,
  },
  logBox: {
    flex: 1,
    backgroundColor: '#1a2332',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.2)',
    padding: 8,
    marginBottom: 8,
  },
  logText: {
    color: '#4fc3f7',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  loadingBox: {
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
    borderRadius: 4,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
  },
  loadingText: {
    color: '#4fc3f7',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default Test;
