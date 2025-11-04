// src/config/locationConfig.js
import { LOCATIONIQ_KEY } from '@env';

export const LOCATION_CONFIG = {
  NOMINATIM_URL: 'https://nominatim.openstreetmap.org/reverse',
  LOCATIONIQ_URL: 'https://us1.locationiq.com/v1/reverse.php',
  LOCATIONIQ_KEY: LOCATIONIQ_KEY, // ✅ From .env
};
