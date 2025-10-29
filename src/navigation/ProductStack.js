import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProductsScreen from '../screens/admin/ProductsScreen';
import AddProductsScreen from '../screens/admin/AddProductsScreen';
import CustomHeader from '../components/shared/CustomHeader';

const Stack = createNativeStackNavigator();

export default function ProductStack() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        header: () => {
          // FIXED: Dynamic title based on screen and params
          let title = 'Products';
          if (route.name === 'AddProductsScreen') {
            const product = route.params?.product;
            title = product ? 'Edit Product' : 'Add Product';
          }

          return (
            <CustomHeader
              navigation={navigation}
              title={title} // FIXED: Dynamic title
              route={route}
              canGoBack={
                navigation.canGoBack() && route.name !== 'ProductsScreen'
              }
              screenName={route.name}
              onSortPress={() => {
                navigation.setParams({ showSort: true });
              }}
            />
          );
        },
      })}
    >
      <Stack.Screen name="ProductsScreen" component={ProductsScreen} />
      <Stack.Screen name="AddProductsScreen" component={AddProductsScreen} />
    </Stack.Navigator>
  );
}
