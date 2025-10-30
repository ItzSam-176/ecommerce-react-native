import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../screens/customer/Home';
import ProductDiscoveryScreen from '../screens/customer/ProductDiscoveryScreen';
import CustomHeader from '../components/shared/CustomHeader';
import WishlistScreen from '../screens/customer/WishlistScreen';
import { useAuth } from './AuthProvider';
import ProductDetailsScreen from '../screens/customer/ProductDetailsScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  const { signOut } = useAuth();
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={Home}
        options={({ navigation, route }) => ({
          header: () => (
            <CustomHeader
              navigation={navigation}
              route={route}
              title="Home"
              canGoBack={navigation.canGoBack()}
              screenName="Home"
              onLogout={() => signOut()}
              onSearchPress={() => {
                // ✅ Set params that Home will listen to
                navigation.setParams({
                  openSearchNow: true,
                });
              }}
              onCustomizePress={() => {
                navigation.setParams({ openColumnModalRequest: Date.now() });
              }}
            />
          ),
        })}
      />
      <Stack.Screen
        name="ProductDiscoveryScreen"
        component={ProductDiscoveryScreen}
        options={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Stack.Screen
        name="ProductDetailsScreen"
        component={ProductDetailsScreen}
        options={({ navigation, route }) => ({
          header: () => (
            <CustomHeader
              navigation={navigation}
              route={route}
              title={route.params?.productName || 'Product Details'}
              canGoBack={true}
              screenName="ProductDetailsScreen"
              onTogglePress={() => {
                // This will be handled by params
                navigation.setParams({ toggleSheetRequest: Date.now() });
              }}
            />
          ),
          tabBarStyle: { display: 'none' },
        })}
      />

      <Stack.Screen
        name="WishlistScreen"
        component={WishlistScreen}
        options={({ navigation, route }) => ({
          header: () => (
            <CustomHeader
              navigation={navigation}
              route={route}
              title="My Wishlist"
              canGoBack={true}
              screenName="Wishlist"
            />
          ),
          tabBarStyle: { display: 'none' },
        })}
      />
    </Stack.Navigator>
  );
}
