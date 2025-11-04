// src/navigation/CustomerTab.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import HomeStack from './HomeStack';
import CartStack from './CartStack';
import SettingsStack from './SettingsStack';
import CustomTabBar from '../components/customer/CustomTabBar';
import Test from '../screens/customer/Test';

const Tab = createBottomTabNavigator();

// List of screens where bottom tabs should be hidden
const HIDE_TAB_SCREENS = [
  'ProductDetailsScreen',
  'ProductDiscoveryScreen',
  'UserDetailsScreen',
  'SearchScreen',
  'WishlistScreen',
  'AddProductsScreen',
];

export default function CustomerTabs() {
  return (
    <Tab.Navigator
      tabBar={props => {
        // Get the currently focused route
        const route = props.state.routes[props.state.index];
        const routeName = getFocusedRouteNameFromRoute(route);
        const params = route.params || {};

        // Check if current screen should hide tabs or if hideTabBar param is true
        const shouldHide =
          HIDE_TAB_SCREENS.includes(routeName) || params.hideTabBar;

        // Pass visible prop to CustomTabBar
        return <CustomTabBar {...props} visible={!shouldHide} />;
      }}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStack}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="CartStack"
        component={CartStack}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="SettingStack"
        component={SettingsStack}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Test"
        component={Test}
        options={{
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}
