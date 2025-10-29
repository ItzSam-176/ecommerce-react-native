import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../screens/customer/Home';
import ProductDiscoveryScreen from '../screens/customer/ProductDiscoveryScreen';
import CustomHeader from '../components/shared/CustomHeader';
import WishlistScreen from '../screens/customer/WishlistScreen';
import { useAuth } from './AuthProvider';

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
                navigation.setParams({ toggleSearchRequest: Date.now() });
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
