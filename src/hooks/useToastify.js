// src/hooks/useToastify.js - FIXED VERSION
import { useCallback } from 'react';
import { Toast } from 'toastify-react-native';

export const useToastify = () => {
  const showToast = useCallback((title, message, type = 'info') => {
    const toastMessage = message ? `${title}: ${message}` : title;

    switch (type) {
      case 'success':
        Toast.success(toastMessage, 'bottom', undefined, undefined, false);
        break;

      case 'error':
        Toast.error(toastMessage, 'bottom', undefined, undefined, false);
        break;

      case 'warning':
        Toast.warn(toastMessage, 'bottom', undefined, undefined, false);
        break;

      case 'info':
      default:
        Toast.info(toastMessage, 'bottom', undefined, undefined, false);
        break;
    }
  }, []);

  return { showToast };
};
