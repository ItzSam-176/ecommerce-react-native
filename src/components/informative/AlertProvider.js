import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import CustomAlert from './CustomAlert';

const AlertContext = createContext({
  showAlert: (_title, _message, _type, _buttons, _dismissible) => {},
  showConfirm: (_title, _message, _onConfirm, _options) => {},
  hideAlert: () => {},
});

export const AlertProvider = ({ children }) => {
  const [state, setState] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
    dismissible: true,
  });

  const hideAlert = useCallback(() => {
    setState(prev => ({ ...prev, visible: false }));
  }, []);

  // Flexible API: showAlert('Title', 'Message', 'error', [...], true/false)
  // or showAlert({ title, message, type, buttons, dismissible })
  const showAlert = useCallback(
    (titleOrConfig, message, type = 'info', buttons, dismissible = true) => {
      if (typeof titleOrConfig === 'object' && titleOrConfig !== null) {
        const {
          title,
          message,
          type = 'info',
          buttons = [],
          dismissible = true,
        } = titleOrConfig;

        setState({
          visible: true,
          title: title ?? '',
          message: message ?? '',
          type,
          buttons: (buttons && buttons.length
            ? buttons
            : [{ text: 'OK', style: 'default', onPress: hideAlert }]
          ).map(b => ({
            ...b,
            onPress: () => {
              try {
                b.onPress && b.onPress();
              } finally {
                hideAlert();
              }
            },
          })),
          dismissible,
        });
        return;
      }

      setState({
        visible: true,
        title: titleOrConfig ?? '',
        message: message ?? '',
        type,
        buttons: (buttons && buttons.length
          ? buttons
          : [{ text: 'OK', style: 'default', onPress: hideAlert }]
        ).map(b => ({
          ...b,
          onPress: () => {
            try {
              b.onPress && b.onPress();
            } finally {
              hideAlert();
            }
          },
        })),
        dismissible,
      });
    },
    [hideAlert],
  );

  // Convenience confirm dialog
  const showConfirm = useCallback(
    (title, message, onConfirm, options = {}) => {
      const {
        confirmText = 'OK',
        cancelText = 'Cancel',
        destructive = false,
      } = options;
      showAlert({
        title,
        message,
        type: 'confirm',
        buttons: [
          { text: cancelText, style: 'cancel' },
          {
            text: confirmText,
            style: destructive ? 'destructive' : 'default',
            onPress: onConfirm,
          },
        ],
        dismissible: true,
      });
    },
    [showAlert],
  );

  const value = useMemo(
    () => ({ showAlert, showConfirm, hideAlert }),
    [showAlert, showConfirm, hideAlert],
  );

  return (
    <AlertContext.Provider value={value}>
      {children}
      <CustomAlert
        visible={state.visible}
        title={state.title}
        message={state.message}
        type={state.type}
        buttons={state.buttons}
        onBackdropPress={state.dismissible ? hideAlert : undefined}
        dismissible={state.dismissible}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
