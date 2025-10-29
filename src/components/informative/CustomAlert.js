// components/CustomAlert.js
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  BackHandler,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

const CustomAlert = ({
  visible = false,
  title = 'Alert',
  message = '',
  type = 'info',
  buttons = [],
  onBackdropPress = null,
  animationType = 'fade',
  dismissible = true,
  icon = null,
  customContent = null,
}) => {
  const scaleValue = React.useRef(new Animated.Value(0.3)).current;
  const opacityValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 150,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (visible && dismissible && onBackdropPress) {
          onBackdropPress();
          return true;
        }
        return false;
      },
    );

    return () => backHandler.remove();
  }, [visible, dismissible, onBackdropPress]);

  const getIconByType = () => {
    if (icon) return icon;

    const iconProps = { size: 48, style: styles.typeIcon };

    switch (type) {
      case 'success':
        return (
          <Ionicons name="checkmark-circle" color="#4fc3f7" {...iconProps} />
        );
      case 'error':
        return <Ionicons name="close-circle" color="#ff4458" {...iconProps} />;
      case 'warning':
        return <Ionicons name="warning" color="#ffa726" {...iconProps} />;
      case 'confirm':
        return <Ionicons name="help-circle" color="#4fc3f7" {...iconProps} />;
      case 'info':
      default:
        return (
          <Ionicons name="information-circle" color="#4fc3f7" {...iconProps} />
        );
    }
  };

  const getDefaultButtons = () => {
    if (buttons.length > 0) return buttons;

    switch (type) {
      case 'confirm':
        return [
          { text: 'Cancel', style: 'cancel', onPress: onBackdropPress },
          { text: 'OK', style: 'default', onPress: onBackdropPress },
        ];
      default:
        return [{ text: 'OK', style: 'default', onPress: onBackdropPress }];
    }
  };

  const renderButtons = () => {
    const alertButtons = getDefaultButtons();

    return (
      <View style={styles.buttonContainer}>
        {alertButtons.map((button, index) => {
          // Cancel button styling (only for multi-button alerts)
          if (button.style === 'cancel' && alertButtons.length > 1) {
            return (
              <TouchableOpacity
                key={index}
                style={[styles.button, styles.cancelButton]}
                onPress={button.onPress}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            );
          }

          // Destructive button styling
          if (button.style === 'destructive') {
            return (
              <TouchableOpacity
                key={index}
                onPress={button.onPress}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#ff5c6d', '#ff4458', '#e63946']}
                  style={[
                    styles.button,
                    alertButtons.length === 1 && { flex: 1 },
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.buttonText}>{button.text}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          // Default button styling (gradient)
          return (
            <TouchableOpacity
              key={index}
              onPress={button.onPress}
              activeOpacity={0.8}
              style={{ flex: 1, minHeight: 50 }}
            >
              <LinearGradient
                colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
                style={[
                  styles.button,
                  alertButtons.length === 1 && { flex: 1 },
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>{button.text}</Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={dismissible ? onBackdropPress : undefined}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity: opacityValue }]}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={dismissible ? onBackdropPress : undefined}
        >
          <Animated.View
            style={[
              styles.alertContainer,
              { transform: [{ scale: scaleValue }] },
            ]}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={styles.alert}>
                {/* Icon */}
                <View style={styles.iconContainer}>{getIconByType()}</View>

                {/* Title */}
                <Text style={styles.title}>{title}</Text>

                {/* Custom Content or Message */}
                {customContent ? (
                  customContent
                ) : message ? (
                  <Text style={styles.message}>{message}</Text>
                ) : null}

                {/* Buttons */}
                {renderButtons()}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 340,
  },
  alert: {
    backgroundColor: '#2a3847',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#4fc3f7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  iconContainer: {
    marginBottom: 16,
  },
  typeIcon: {
    textShadowColor: 'rgba(79, 195, 247, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#8a9fb5',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  },
  singleButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#4fc3f7',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowOpacity: 0,
    elevation: 0,
    borderBottomWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default CustomAlert;
