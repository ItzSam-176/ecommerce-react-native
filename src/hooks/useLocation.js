// src/hooks/useLocation.js
import { useState, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { LOCATION_CONFIG } from '../config/locationConfig';

export const useLocation = () => {
  const [loading, setLoading] = useState(false);
  const [permissionAlert, setPermissionAlert] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const fetchAddressFromCoordinates = useCallback(
    async (latitude, longitude) => {
      try {
        const nominatimResponse = await fetch(
          `${LOCATION_CONFIG.NOMINATIM_URL}?format=json&lat=${latitude}&lon=${longitude}`,
          {
            headers: {
              'User-Agent': 'MyEcommerce/1.0',
            },
          },
        );

        if (nominatimResponse.ok) {
          const data = await nominatimResponse.json();
          const address = data.address;

          console.log('[DEBUG] Nominatim address components:', address);

          return {
            success: true,
            data: {
              address:
                `${address.house_number || ''} ${address.road || ''}`.trim() ||
                data.display_name.split(',')[0],
              city: address.state_district || '',
              state: address.state || '',
              zip_code: address.postcode || '',
              country: address.country || '',
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
            },
          };
        } else {
          throw new Error('Nominatim failed');
        }
      } catch (nominatimError) {
        console.log('[INFO] Nominatim failed, trying LocationIQ...');

        try {
          const locationiqResponse = await fetch(
            `${LOCATION_CONFIG.LOCATIONIQ_URL}?key=${LOCATION_CONFIG.LOCATIONIQ_KEY}&lat=${latitude}&lon=${longitude}&format=json`,
          );

          if (locationiqResponse.ok) {
            const data = await locationiqResponse.json();
            const address = data.address;
            console.log('[DEBUG] LocationIQ address components:', address);

            return {
              success: true,
              data: {
                address: data.display_name.split(',')[0],
                city: address.state_district || '',
                state: address.state || '',
                zip_code: address.postcode || '',
                country: address.country || '',
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
              },
            };
          } else {
            throw new Error('LocationIQ failed');
          }
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

  // ✅ PERMISSION REQUEST FUNCTION
  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (!hasPermission) {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'We need your location to auto-fill your address',
              buttonPositive: 'Allow',
              buttonNegative: 'Cancel',
              buttonNeutral: 'Ask Later',
            },
          );

          if (result !== PermissionsAndroid.RESULTS.GRANTED) {
            setPermissionAlert({
              visible: true,
              title: 'Permission Denied',
              message:
                'Location permission is required. Please enable it in settings.',
              type: 'permission_denied',
            });
            return false;
          }
        }
      } catch (error) {
        console.error('[ERROR] Permission request error:', error);
        setPermissionAlert({
          visible: true,
          title: 'Error',
          message: 'Failed to request location permission.',
          type: 'permission_error',
        });
        return false;
      }
    }
    return true;
  }, []);

  // ✅ GET COORDINATES FUNCTION (THIS WAS MISSING!)
  const getLocationCoordinates = useCallback(() => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        error => {
          console.error('[ERROR] Geolocation error:', error);
          reject({
            success: false,
            error:
              'Could not get your location. Please enable location services.',
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  }, []);

  // ✅ MAIN FUNCTION
  const getCurrentLocation = useCallback(async () => {
    setLoading(true);

    try {
      // Request permission
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLoading(false);
        return {
          success: false,
          error: 'Location permission denied',
        };
      }

      // Get coordinates
      const { latitude, longitude } = await getLocationCoordinates();

      // Fetch address
      const result = await fetchAddressFromCoordinates(latitude, longitude);
      setLoading(false);
      return result;
    } catch (error) {
      console.error('[ERROR] getCurrentLocation:', error);
      setLoading(false);
      return error;
    }
  }, [
    requestLocationPermission,
    getLocationCoordinates,
    fetchAddressFromCoordinates,
  ]);

  return {
    loading,
    getCurrentLocation,
    permissionAlert,
    setPermissionAlert,
  };
};
