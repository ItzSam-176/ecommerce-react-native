import { useState, useCallback } from 'react';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import GetLocation from 'react-native-get-location';
import { LOCATION_CONFIG } from '../config/locationConfig';

export const useLocation = () => {
  const [loading, setLoading] = useState(false);
  const [permissionAlert, setPermissionAlert] = useState({
    visible: false,
    title: '',
    message: '',
  });

  // -------------------------------
  // FETCH ADDRESS FROM COORDINATES
  // -------------------------------
  const fetchAddressFromCoordinates = useCallback(
    async (latitude, longitude) => {
      try {
        const nominatimResponse = await fetch(
          `${LOCATION_CONFIG.NOMINATIM_URL}?format=json&lat=${latitude}&lon=${longitude}`,
          {
            headers: { 'User-Agent': 'MyEcommerce/1.0' },
          },
        );

        if (nominatimResponse.ok) {
          const data = await nominatimResponse.json();
          const address = data.address || {};
          return {
            success: true,
            data: {
              address:
                `${address.house_number || ''} ${address.road || ''}`.trim() ||
                data.display_name?.split(',')[0] ||
                'Unknown',
              city: address.state_district || '',
              state: address.state || '',
              zip_code: address.postcode || '',
              country: address.country || '',
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
            },
          };
        }
        throw new Error('Nominatim failed');
      } catch (nominatimError) {
        console.log('[INFO] Nominatim failed, trying LocationIQ...');
        try {
          const locationiqResponse = await fetch(
            `${LOCATION_CONFIG.LOCATIONIQ_URL}?key=${LOCATION_CONFIG.LOCATIONIQ_KEY}&lat=${latitude}&lon=${longitude}&format=json`,
          );

          if (locationiqResponse.ok) {
            const data = await locationiqResponse.json();
            const address = data.address || {};
            return {
              success: true,
              data: {
                address: data.display_name?.split(',')[0] || 'Unknown',
                city: address.state_district || '',
                state: address.state || '',
                zip_code: address.postcode || '',
                country: address.country || '',
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
              },
            };
          }
          throw new Error('LocationIQ failed');
        } catch (locationiqError) {
          console.error('[ERROR] Both APIs failed:', locationiqError);
          return {
            success: false,
            error: 'Could not fetch address details. Please try again.',
          };
        }
      }
    },
    [],
  );

  // -------------------------------
  // PERMISSION HANDLER
  // -------------------------------
  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'We need your location to auto-fill your address',
          buttonPositive: 'Allow',
          buttonNegative: 'Cancel',
        },
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        setPermissionAlert({
          visible: true,
          title: 'Permission Denied',
          message:
            'Location permission is required. Please enable it in settings.',
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error('[ERROR] Permission request error:', error);
      setPermissionAlert({
        visible: true,
        title: 'Error',
        message: 'Failed to request location permission.',
      });
      return false;
    }
  }, []);

  // -------------------------------
  // GET COORDINATES USING get-location
  // -------------------------------
  const getLocationCoordinates = useCallback(async () => {
    try {
      const position = await GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      return {
        latitude: position.latitude,
        longitude: position.longitude,
      };
    } catch (error) {
      console.error('[ERROR] getLocationCoordinates failed:', error);
      throw {
        success: false,
        error:
          error?.message ||
          'Unable to get your location. Please enable location services.',
      };
    }
  }, []);

  // -------------------------------
  // COMBINED LOCATION FETCH + ADDRESS RESOLVE
  // -------------------------------
  const getCurrentLocation = useCallback(async () => {
    setLoading(true);

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLoading(false);
        return { success: false, error: 'Location permission denied' };
      }

      const coords = await getLocationCoordinates();
      const result = await fetchAddressFromCoordinates(
        coords.latitude,
        coords.longitude,
      );

      setLoading(false);
      return result;
    } catch (error) {
      console.error('[ERROR] getCurrentLocation:', error);
      setLoading(false);
      return {
        success: false,
        error: error?.error || 'Failed to get current location',
      };
    }
  }, [
    requestLocationPermission,
    getLocationCoordinates,
    fetchAddressFromCoordinates,
  ]);

  // -------------------------------
  // EXPORT
  // -------------------------------
  return {
    loading,
    getCurrentLocation,
    permissionAlert,
    setPermissionAlert,
    fetchAddressFromCoordinates,
    getLocationCoordinates,
    requestLocationPermission,
  };
};
