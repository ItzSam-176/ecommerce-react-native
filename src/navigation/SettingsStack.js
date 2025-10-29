// src/navigation/SettingsStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/customer/SettingsScreen';
import UserDetailsScreen from '../screens/customer/UserDetailsScreen';
import CustomHeader from '../components/shared/CustomHeader';
import { useAuth } from './AuthProvider';

const Stack = createNativeStackNavigator();

export default function SettingsStack() {
  const { signOut } = useAuth();

  return (
    <Stack.Navigator initialRouteName="SettingsScreen">
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={({ navigation, route }) => ({
          header: () => (
            <CustomHeader
              navigation={navigation}
              route={route}
              title="Settings"
              canGoBack={false}
              screenName="Settings"
              onLogout={() => signOut()}
            />
          ),
        })}
      />
      <Stack.Screen
        name="UserDetailsScreen"
        component={UserDetailsScreen}
        options={({ navigation, route }) => ({
          header: () => (
            <CustomHeader
              navigation={navigation}
              route={route}
              title="Profile"
              canGoBack={true}
              screenName="UserDetailsScreen"
              onEditPress={route.params?.onEditPress}
              isEditing={route.params?.isEditing}
              editLoading={route.params?.editLoading}
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}
