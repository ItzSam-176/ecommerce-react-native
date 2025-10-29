import React from 'react';
import { Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UsersScreen from '../screens/admin/UserScreen';
import ProductStack from './ProductStack';
import OrdersScreen from '../screens/admin/OrdersScreen';
import CustomHeader from '../components/shared/CustomHeader';
import { useAuth } from './AuthProvider';
import CustomTabBar from '../components/customer/CustomTabBar';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// List of screens where bottom tabs should be hidden
const HIDE_TAB_SCREENS = ['AddProductsScreen'];

function UsersStack() {
  const { signOut } = useAuth();
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        header: () => (
          <CustomHeader
            navigation={navigation}
            title={'Users'}
            canGoBack={navigation.canGoBack() && route.name !== 'UserScreen'} // ❌ hide back on root
            screenName={route.name}
            onLogout={() => {
              signOut();
            }}
          />
        ),
      })}
    >
      <Stack.Screen name="UserScreen" component={UsersScreen} />
    </Stack.Navigator>
  );
}
function OrdersStack() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        header: () => (
          <CustomHeader
            navigation={navigation}
            title={'Orders'}
            route={route}
            canGoBack={navigation.canGoBack() && route.name !== 'OrdersScreen'} // ❌ hide back on root
            screenName={route.name}
            onSortPress={() => {
              navigation.setParams({ showSort: true }); // trigger screen to open bottom sheet
            }}
            onCustomizePress={() => {
              // Set a params flag with a timestamp so the Home screen can
              // react to it. We avoid relying on route.params.openColumnModal
              // being a function — instead Home watches this value.
              navigation.setParams({ openColumnModalRequest: Date.now() });
            }}
          />
        ),
      })}
    >
      <Stack.Screen name="OrdersScreen" component={OrdersScreen} />
    </Stack.Navigator>
  );
}

export default function AdminDashboard() {
  return (
    <Tab.Navigator
      initialRouteName="Users"
      // tabBar={props => <CustomTabBar {...props} />}
      tabBar={props => {
        // Get the currently focused route
        const route = props.state.routes[props.state.index];
        const routeName = getFocusedRouteNameFromRoute(route);

        // Check if current screen should hide tabs
        const shouldHide = HIDE_TAB_SCREENS.includes(routeName);

        // Pass visible prop to CustomTabBar
        return <CustomTabBar {...props} visible={!shouldHide} />;
      }}
      screenOptions={{
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          minHeight: 60, // Set explicit height instead of minHeight
          paddingBottom: 8,
          paddingTop: 8, // Add top padding for better spacing
          position: 'absolute', // Make tab bar absolute
          bottom: -5,
          left: 0,
          right: 0,
        },
        headerShown: false, // hide tab header
      }}
    >
      <Tab.Screen
        name="Users"
        component={UsersStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/tabs/users.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? '#007AFF' : '#8e8e93',
              }}
              resizeMode="contain"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Products"
        component={ProductStack} // 👈 directly use ProductStack
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/tabs/products.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? '#007AFF' : '#8e8e93',
              }}
              resizeMode="contain"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Orders"
        component={OrdersStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/tabs/orders.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? '#007AFF' : '#8e8e93',
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
