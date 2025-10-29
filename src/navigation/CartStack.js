import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CartScreen from '../screens/customer/CartScreen';
import CustomHeader from '../components/shared/CustomHeader';

const Stack = createNativeStackNavigator();

export default function CartStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={({ navigation, route }) => ({
          header: () => (
            <CustomHeader
              navigation={navigation}
              route={route}
              title="My Shopping Cart"
              canGoBack={false}
              screenName="Cart"
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}
