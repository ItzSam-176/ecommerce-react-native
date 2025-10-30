import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AdminDashboard from './src/navigation/AdminDashboard';
import { AlertProvider } from './src/components/informative/AlertProvider';
import { AuthProvider, useAuth } from './src/navigation/AuthProvider';
import AuthStack from './src/navigation/AuthStack';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { ActivityIndicator, View, Platform, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CustomerTab from './src/navigation/CustomerTab';
import ToastManager from 'toastify-react-native';
import { MenuProvider } from 'react-native-popup-menu';
import IconButton from './src/components/shared/IconButton';

function RootNavigator() {
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        const NavigationBar = require('react-native-navigation-bar-color');
        NavigationBar.default.setNavigationBarColor('#353F54', false, true);
      } catch (error) {
        console.log('[Navigation bar color not set]:', error.message);
      }
    }
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#353F54',
        }}
      >
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) return <AuthStack />;
  return role === 'admin' ? <AdminDashboard /> : <CustomerTab />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MenuProvider>
          <AuthProvider>
            <AlertProvider>
              <NavigationContainer>
                <StatusBar barStyle="light-content" backgroundColor="#353F54" />
                <RootNavigator />
              </NavigationContainer>
            </AlertProvider>
            <ToastManager
              showProgressBar={false}
              bottomOffset={53}
              minHeight={60}
              closeIconSize={22}
              theme={'dark'}
            />
          </AuthProvider>
        </MenuProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
