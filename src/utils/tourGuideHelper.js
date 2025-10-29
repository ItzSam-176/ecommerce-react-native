// src/utils/tourGuideHelper.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOUR_KEYS = {
  PRODUCT_DISCOVERY: 'tour_product_discovery_completed',
};

export const hasCompletedTour = async tourKey => {
  try {
    const value = await AsyncStorage.getItem(tourKey);
    return value === 'true';
  } catch (error) {
    console.log('[ERROR] Reading tour status:', error);
    return false;
  }
};

export const setTourCompleted = async tourKey => {
  try {
    await AsyncStorage.setItem(tourKey, 'true');
    console.log('[INFO] Tour marked as completed:', tourKey);
  } catch (error) {
    console.log('[ERROR] Saving tour status:', error);
  }
};

export const resetTour = async tourKey => {
  try {
    await AsyncStorage.removeItem(tourKey);
    console.log('[INFO] Tour reset:', tourKey);
  } catch (error) {
    console.log('[ERROR] Resetting tour:', error);
  }
};

export { TOUR_KEYS };
