// // src/components/navigation/CustomTabBar.js
// import React, { useEffect, useRef } from 'react';
// import {
//   View,
//   TouchableOpacity,
//   StyleSheet,
//   Platform,
//   Animated,
// } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// export default function CustomTabBar({ state, descriptors, navigation }) {
//   return (
//     <View style={styles.tabBar}>
//       {state.routes.map((route, index) => {
//         const { options } = descriptors[route.key];
//         const isFocused = state.index === index;

//         const onPress = () => {
//           const event = navigation.emit({
//             type: 'tabPress',
//             target: route.key,
//             canPreventDefault: true,
//           });

//           if (!isFocused && !event.defaultPrevented) {
//             navigation.navigate(route.name);
//           }
//         };

//         const getIconName = () => {
//           if (route.name === 'HomeStack') return 'home-outline';
//           if (route.name === 'WishlistScreen') return 'heart-outline';
//           if (route.name === 'CartStack') return 'cart-outline';
//           return 'help-outline';
//         };

//         return (
//           <TabButton
//             key={route.key}
//             isFocused={isFocused}
//             onPress={onPress}
//             iconName={getIconName()}
//           />
//         );
//       })}
//     </View>
//   );
// }

// function TabButton({ isFocused, onPress, iconName }) {
//   const animatedValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
//   const bgOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.spring(animatedValue, {
//         toValue: isFocused ? 1 : 0,
//         friction: 6,
//         tension: 120,
//         useNativeDriver: true,
//       }),
//       Animated.timing(bgOpacity, {
//         toValue: isFocused ? 1 : 0,
//         duration: 200,
//         useNativeDriver: false,
//       }),
//     ]).start();
//   }, [isFocused]);

//   const scale = animatedValue.interpolate({
//     inputRange: [0, 1],
//     outputRange: [1, 1.2],
//   });

//   const translateY = animatedValue.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0, -30],
//   });

//   const backgroundColor = bgOpacity.interpolate({
//     inputRange: [0, 1],
//     outputRange: ['rgba(42, 56, 71, 0)', '#007AFF'],
//   });

//   return (
//     <TouchableOpacity
//       onPress={onPress}
//       style={styles.tabButton}
//       activeOpacity={0.7}
//     >
//       <Animated.View
//         style={[
//           styles.iconContainer,
//           {
//             transform: [{ scale }, { translateY }],
//             backgroundColor,
//           },
//         ]}
//       >
//         <Ionicons
//           name={iconName}
//           size={24}
//           color={isFocused ? '#fff' : '#8a9fb5'}
//         />
//       </Animated.View>
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   tabBar: {
//     flexDirection: 'row',
//     backgroundColor: '#2a3847',
//     height: Platform.OS === 'ios' ? 85 : 60,
//     paddingBottom: Platform.OS === 'ios' ? 25 : 8,
//     paddingTop: 8,
//     paddingHorizontal: 20,
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     borderTopWidth: 0,
//     elevation: 0,
//   },
//   tabButton: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   iconContainer: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#007AFF',
//     shadowOpacity: 0.4,
//     shadowOffset: { width: 0, height: 4 },
//     shadowRadius: 12,
//     elevation: 8,
//   },
// });

// // src/components/navigation/CustomTabBar.js
// import React, { useEffect, useRef } from 'react';
// import {
//   View,
//   TouchableOpacity,
//   StyleSheet,
//   Platform,
//   Animated,
// } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// export default function CustomTabBar({ state, descriptors, navigation }) {
//   return (
//     <View style={styles.tabBar}>
//       {state.routes.map((route, index) => {
//         const { options } = descriptors[route.key];
//         const isFocused = state.index === index;

//         const onPress = () => {
//           const event = navigation.emit({
//             type: 'tabPress',
//             target: route.key,
//             canPreventDefault: true,
//           });

//           if (!isFocused && !event.defaultPrevented) {
//             navigation.navigate(route.name);
//           }
//         };

//         const getIconName = () => {
//           if (route.name === 'HomeStack') return 'home-outline';
//           if (route.name === 'WishlistScreen') return 'heart-outline';
//           if (route.name === 'CartStack') return 'cart-outline';
//           return 'help-outline';
//         };

//         return (
//           <TabButton
//             key={route.key}
//             isFocused={isFocused}
//             onPress={onPress}
//             iconName={getIconName()}
//           />
//         );
//       })}
//     </View>
//   );
// }

// function TabButton({ isFocused, onPress, iconName }) {
//   const scaleAnim = useRef(new Animated.Value(isFocused ? 1.2 : 1)).current;
//   const translateYAnim = useRef(
//     new Animated.Value(isFocused ? -30 : 0),
//   ).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.spring(translateYAnim, {
//         toValue: isFocused ? -30 : 0,
//         friction: 6,
//         tension: 120,
//         useNativeDriver: true,
//       }),
//       Animated.spring(scaleAnim, {
//         toValue: isFocused ? 1.2 : 1,
//         friction: 6,
//         tension: 120,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, [isFocused]);

//   return (
//     <TouchableOpacity
//       onPress={onPress}
//       style={styles.tabButton}
//       activeOpacity={0.7}
//     >
//       <Animated.View
//         style={[
//           styles.iconContainer,
//           isFocused && styles.activeIconContainer,
//           {
//             transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
//           },
//         ]}
//       >
//         <Ionicons
//           name={iconName}
//           size={24}
//           color={isFocused ? '#fff' : '#8a9fb5'}
//         />
//       </Animated.View>
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   tabBar: {
//     flexDirection: 'row',
//     backgroundColor: '#2a3847',
//     height: Platform.OS === 'ios' ? 85 : 60,
//     paddingBottom: Platform.OS === 'ios' ? 25 : 8,
//     paddingTop: 8,
//     paddingHorizontal: 20,
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     borderTopWidth: 0,
//     elevation: 0,
//   },
//   tabButton: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   iconContainer: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   activeIconContainer: {
//     backgroundColor: '#007AFF',
//     shadowColor: '#007AFF',
//     shadowOpacity: 0.4,
//     shadowOffset: { width: 0, height: 4 },
//     shadowRadius: 12,
//     elevation: 8,
//   },
// });

// // src/components/navigation/CustomTabBar.js
// import React, { useEffect, useRef } from 'react';
// import {
//   View,
//   TouchableOpacity,
//   StyleSheet,
//   Platform,
//   Animated,
// } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import LinearGradient from 'react-native-linear-gradient';

// export default function CustomTabBar({ state, descriptors, navigation }) {
//   return (
//     <View style={styles.tabBar}>
//       {state.routes.map((route, index) => {
//         const { options } = descriptors[route.key];
//         const isFocused = state.index === index;

//         const onPress = () => {
//           const event = navigation.emit({
//             type: 'tabPress',
//             target: route.key,
//             canPreventDefault: true,
//           });

//           if (!isFocused && !event.defaultPrevented) {
//             navigation.navigate(route.name);
//           }
//         };

//         const getIconName = () => {
//           if (route.name === 'HomeStack') return 'home-outline';
//           if (route.name === 'WishlistScreen') return 'heart-outline';
//           if (route.name === 'CartStack') return 'cart-outline';
//           return 'help-outline';
//         };

//         return (
//           <TabButton
//             key={route.key}
//             isFocused={isFocused}
//             onPress={onPress}
//             iconName={getIconName()}
//           />
//         );
//       })}
//     </View>
//   );
// }

// function TabButton({ isFocused, onPress, iconName }) {
//   const scaleAnim = useRef(new Animated.Value(isFocused ? 1.2 : 1)).current;
//   const translateYAnim = useRef(
//     new Animated.Value(isFocused ? -30 : 0),
//   ).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.spring(translateYAnim, {
//         toValue: isFocused ? -20 : 0,
//         friction: 6,
//         tension: 120,
//         useNativeDriver: true,
//       }),
//       Animated.spring(scaleAnim, {
//         toValue: isFocused ? 1.2 : 1,
//         friction: 6,
//         tension: 120,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, [isFocused]);

//   return (
//     <TouchableOpacity
//       onPress={onPress}
//       style={styles.tabButton}
//       activeOpacity={0.7}
//     >
//       <Animated.View
//         style={{
//           transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
//         }}
//       >
//         <View style={[styles.iconContainer]}>
//           <LinearGradient
//             colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
//             style={[
//               styles.iconContainer,
//               isFocused && styles.activeIconContainer,
//             ]}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 1 }}
//           >
//             <Ionicons
//               name={iconName}
//               size={24}
//               color={isFocused ? '#fff' : '#8a9fb5'}
//             />
//           </LinearGradient>
//         </View>
//       </Animated.View>
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   tabBar: {
//     flexDirection: 'row',
//     backgroundColor: '#2a3847',
//     height: Platform.OS === 'ios' ? 85 : 60,
//     paddingBottom: Platform.OS === 'ios' ? 25 : 8,
//     paddingTop: 8,
//     paddingHorizontal: 20,
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     borderTopWidth: 0,
//     elevation: 0,
//   },
//   tabButton: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   iconContainer: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   activeIconContainer: {
//     backgroundColor: '#007AFF',
//     shadowColor: '#007AFF',
//     shadowOpacity: 0.4,
//     shadowOffset: { width: 0, height: 4 },
//     shadowRadius: 12,
//     elevation: 8,
//     borderRadius: 60,
//   },
// });


// src/components/shared/CustomTabBar.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

export default function CustomTabBar({ state, descriptors, navigation, visible = true }) {
  // Don't render if not visible
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Handle both customer and admin icons
        const getIcon = () => {
          // Customer icons (Ionicons)
          if (route.name === 'HomeStack')
            return { type: 'icon', name: 'home-outline' };
          if (route.name === 'CartStack')
            return { type: 'icon', name: 'cart-outline' };
          if (route.name === 'SettingStack')
            return {
              type: 'image',
              source: require('../../assets/tabs/settings.png'),
            };

          // Admin icons (Images)
          if (route.name === 'Users')
            return {
              type: 'image',
              source: require('../../assets/tabs/users.png'),
            };
          if (route.name === 'Products')
            return {
              type: 'image',
              source: require('../../assets/tabs/products.png'),
            };
          if (route.name === 'Orders')
            return {
              type: 'image',
              source: require('../../assets/tabs/orders.png'),
            };

          return { type: 'icon', name: 'help-outline' };
        };

        return (
          <TabButton
            key={route.key}
            isFocused={isFocused}
            onPress={onPress}
            icon={getIcon()}
          />
        );
      })}
    </View>
  );
}

function TabButton({ isFocused, onPress, icon }) {
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1.2 : 1)).current;
  const translateYAnim = useRef(
    new Animated.Value(isFocused ? -30 : 0),
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateYAnim, {
        toValue: isFocused ? -20 : 0,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1.2 : 1,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabButton}
      activeOpacity={0.7}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
        }}
      >
        <View style={[styles.iconContainer]}>
          <LinearGradient
            colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
            style={[
              styles.iconContainer,
              isFocused && styles.activeIconContainer,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {icon.type === 'icon' ? (
              <Ionicons
                name={icon.name}
                size={24}
                color={isFocused ? '#fff' : '#8a9fb5'}
              />
            ) : (
              <Image
                source={icon.source}
                style={{
                  width: 24,
                  height: 24,
                  tintColor: isFocused ? '#fff' : '#8a9fb5',
                }}
                resizeMode="contain"
              />
            )}
          </LinearGradient>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#2a3847',
    height: Platform.OS === 'ios' ? 85 : 60,
    paddingBottom: Platform.OS === 'ios' ? 25 : 8,
    paddingTop: 8,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 0,
    elevation: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    shadowColor: '#4fc3f7',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    borderRadius: 60,
  },
});
