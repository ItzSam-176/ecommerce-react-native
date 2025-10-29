// // src/screens/customer/SettingsScreen.js
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   StatusBar,
//   ActivityIndicator,
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import { supabase } from '../../supabase/supabase';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useAuth } from '../../navigation/AuthProvider';
// import {
//   getProductViewMode,
//   setProductViewMode,
// } from '../../utils/userPreferences';
// import CustomAlert from '../../components/informative/CustomAlert';

// const SettingsScreen = ({ navigation }) => {
//   const { signOut } = useAuth();

//   const [userProfile, setUserProfile] = useState(null);
//   const [loadingProfile, setLoadingProfile] = useState(true);

//   const [viewMode, setViewMode] = useState('modern');
//   const [loadingViewMode, setLoadingViewMode] = useState(true);
//   const [savingViewMode, setSavingViewMode] = useState(false);

//   const [showLogoutAlert, setShowLogoutAlert] = useState(false);
//   const [showErrorAlert, setShowErrorAlert] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');

//   // Track if initial load is done
//   const hasLoadedInitially = useRef(false);

//   // Load data only on initial mount
//   useEffect(() => {
//     if (!hasLoadedInitially.current) {
//       console.log('[SETTINGS] Initial load');
//       fetchUserProfile();
//       loadViewMode();
//       hasLoadedInitially.current = true;
//     }
//   }, []);

//   // Listen for focus events to check if we need to refresh
//   useEffect(() => {
//     const unsubscribe = navigation.addListener('focus', () => {
//       // Only refresh if we're coming back from UserDetailsScreen with updates
//       const state = navigation.getState();
//       const currentRoute = state.routes[state.index];

//       // Check if we just came back from UserDetailsScreen
//       if (currentRoute.params?.shouldRefresh) {
//         console.log('[SETTINGS] Refresh triggered by navigation param');
//         fetchUserProfile();
//         // Clear the param so it doesn't refresh again
//         navigation.setParams({ shouldRefresh: false });
//       }
//     });

//     return unsubscribe;
//   }, [navigation]);

//   const loadViewMode = async () => {
//     try {
//       setLoadingViewMode(true);
//       const mode = await getProductViewMode();
//       setViewMode(mode);
//     } catch (e) {
//       console.log('[ERROR] getProductViewMode:', e.message);
//     } finally {
//       setLoadingViewMode(false);
//     }
//   };

//   const fetchUserProfile = async () => {
//     try {
//       setLoadingProfile(true);
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();
//       if (user) {
//         const { data, error } = await supabase
//           .from('users')
//           .select('*')
//           .eq('id', user.id)
//           .single();
//         if (error) throw error;
//         console.log('[SETTINGS] Profile fetched:', data?.name);
//         setUserProfile(data);
//       }
//     } catch (err) {
//       console.log('[ERROR] fetchUserProfile:', err.message);
//       setErrorMessage('Failed to load profile');
//       setShowErrorAlert(true);
//     } finally {
//       setLoadingProfile(false);
//     }
//   };

//   const onLogoutPress = () => {
//     setShowLogoutAlert(true);
//   };

//   const handleLogoutConfirm = async () => {
//     setShowLogoutAlert(false);
//     try {
//       await signOut();
//     } catch (error) {
//       console.log('[ERROR] Logout failed:', error.message);
//       setErrorMessage('Failed to logout. Please try again.');
//       setShowErrorAlert(true);
//     }
//   };

//   const handleLogoutCancel = () => {
//     setShowLogoutAlert(false);
//   };

//   const navigateToDetails = useCallback(() => {
//     navigation.navigate('UserDetailsScreen', {
//       userProfile,
//       onUpdate: () => {
//         console.log('[SETTINGS] onUpdate callback triggered');
//         fetchUserProfile();
//       },
//     });
//   }, [userProfile, navigation]);

//   const toggleViewMode = async () => {
//     try {
//       setSavingViewMode(true);
//       const next = viewMode === 'modern' ? 'traditional' : 'modern';
//       await setProductViewMode(next);
//       setViewMode(next);
//     } catch (e) {
//       console.log('[ERROR] setProductViewMode:', e.message);
//       setErrorMessage('Failed to update product view mode');
//       setShowErrorAlert(true);
//     } finally {
//       setSavingViewMode(false);
//     }
//   };

//   if (loadingProfile && !hasLoadedInitially.current) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="light-content" backgroundColor="#353F54" />
//         <View style={styles.loadingWrap}>
//           <ActivityIndicator size="large" color="#4fc3f7" />
//           <Text style={styles.loadTxt}>Loading…</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container} edges={['bottom']}>
//       <StatusBar barStyle="light-content" backgroundColor="#353F54" />

//       {/* Profile */}
//       <View style={styles.profileBox}>
//         <View style={styles.avatarWrap}>
//           <View style={styles.avatarBorder}>
//             <Image
//               source={
//                 userProfile?.image_url
//                   ? { uri: userProfile.image_url }
//                   : require('../../assets/default-avatar.png')
//               }
//               style={styles.avatar}
//             />
//           </View>
//         </View>
//         <Text style={styles.name}>{userProfile?.name || 'User'}</Text>
//         <Text style={styles.email}>{userProfile?.email}</Text>
//         {userProfile?.phone && (
//           <Text style={styles.phone}>+{userProfile.phone}</Text>
//         )}
//       </View>

//       {/* Menu */}
//       <View style={styles.menuWrap}>
//         {/* User Details */}
//         <MenuCard
//           icon="person-outline"
//           label="User Details"
//           onPress={navigateToDetails}
//         />

//         {/* Toggle Product View Mode */}
//         <MenuCard
//           icon="contrast-outline"
//           label={
//             loadingViewMode || savingViewMode
//               ? 'Updating…'
//               : `Switch to ${
//                   viewMode === 'modern' ? 'Traditional' : 'Modern'
//                 } UI`
//           }
//           onPress={toggleViewMode}
//           disabled={loadingViewMode || savingViewMode}
//         />

//         {/* Logout */}
//         <MenuCard
//           icon="log-out-outline"
//           label="Logout"
//           onPress={onLogoutPress}
//         />
//       </View>

//       {/* Logout Confirmation Alert */}
//       <CustomAlert
//         visible={showLogoutAlert}
//         title="Logout"
//         message="Are you sure you want to logout?"
//         type="confirm"
//         icon={<Ionicons name="log-out" size={48} color="#4fc3f7" />}
//         buttons={[
//           {
//             text: 'Cancel',
//             style: 'cancel',
//             onPress: handleLogoutCancel,
//           },
//           {
//             text: 'Logout',
//             style: 'destructive',
//             onPress: handleLogoutConfirm,
//           },
//         ]}
//         onBackdropPress={handleLogoutCancel}
//         dismissible={true}
//       />

//       {/* Error Alert */}
//       <CustomAlert
//         visible={showErrorAlert}
//         title="Error"
//         message={errorMessage}
//         type="error"
//         icon={
//           <Ionicons name="close-circle-outline" size={48} color="#ff4458" />
//         }
//         buttons={[
//           {
//             text: 'OK',
//             style: 'default',
//             onPress: () => setShowErrorAlert(false),
//           },
//         ]}
//         onBackdropPress={() => setShowErrorAlert(false)}
//         dismissible={true}
//       />
//     </SafeAreaView>
//   );
// };

// const MenuCard = ({ icon, label, onPress, disabled }) => (
//   <TouchableOpacity
//     style={[styles.cardWrap, disabled && styles.cardDisabled]}
//     onPress={onPress}
//     activeOpacity={0.8}
//     disabled={disabled}
//   >
//     <View style={styles.cardContent}>
//       <Text style={styles.cardTxt}>{label}</Text>
//       <Ionicons name="chevron-forward" size={24} color="#4fc3f7" />
//     </View>
//   </TouchableOpacity>
// );

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#353F54',
//   },
//   loadingWrap: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadTxt: {
//     color: '#fff',
//     marginTop: 16,
//     fontSize: 16,
//   },
//   profileBox: {
//     alignItems: 'center',
//     paddingTop: 40,
//     paddingBottom: 60,
//   },
//   avatarWrap: {
//     marginBottom: 20,
//   },
//   avatarBorder: {
//     width: 130,
//     height: 130,
//     borderRadius: 65,
//     backgroundColor: 'rgba(255,255,255,0.1)',
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#4fc3f7',
//     shadowOffset: { width: 0, height: 0 },
//     shadowOpacity: 0.8,
//     shadowRadius: 15,
//     elevation: 8,
//   },
//   avatar: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     backgroundColor: '#2a3847',
//   },
//   name: {
//     fontSize: 24,
//     fontWeight: '600',
//     color: '#fff',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   email: {
//     fontSize: 16,
//     color: '#8a9fb5',
//     marginBottom: 4,
//     textAlign: 'center',
//   },
//   phone: {
//     fontSize: 14,
//     color: '#8a9fb5',
//     textAlign: 'center',
//   },
//   menuWrap: {
//     paddingHorizontal: 20,
//     gap: 16,
//   },
//   cardWrap: {
//     borderRadius: 16,
//     overflow: 'hidden',
//     paddingLeft: 5,
//     paddingBottom: 10,
//   },
//   cardDisabled: {
//     opacity: 0.6,
//   },
//   card: {
//     backgroundColor: '#2a3847',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.2)',
//     padding: 20,
//   },
//   cardContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   iconWrap: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(79,195,247,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 16,
//   },
//   cardTxt: {
//     flex: 1,
//     fontSize: 22,
//     fontWeight: '500',
//     color: '#fff',
//   },
// });

// export default SettingsScreen;


// src/screens/customer/SettingsScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SwitchToggle from 'react-native-switch-toggle';
import { supabase } from '../../supabase/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../navigation/AuthProvider';
import {
  getProductViewMode,
  setProductViewMode,
} from '../../utils/userPreferences';
import CustomAlert from '../../components/informative/CustomAlert';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';

const SettingsScreen = ({ navigation }) => {
  const { signOut } = useAuth();

  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [viewMode, setViewMode] = useState('modern');
  const [loadingViewMode, setLoadingViewMode] = useState(true);
  const [savingViewMode, setSavingViewMode] = useState(false);

  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  const hasLoadedInitially = useRef(false);

  useEffect(() => {
    if (!hasLoadedInitially.current) {
      console.log('[SETTINGS] Initial load');
      fetchUserProfile();
      loadViewMode();
      hasLoadedInitially.current = true;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const state = navigation.getState();
      const currentRoute = state.routes[state.index];

      if (currentRoute.params?.shouldRefresh) {
        console.log('[SETTINGS] Refresh triggered by navigation param');
        fetchUserProfile();
        navigation.setParams({ shouldRefresh: false });
      }
    });

    return unsubscribe;
  }, [navigation]);

  const loadViewMode = async () => {
    try {
      setLoadingViewMode(true);
      const mode = await getProductViewMode();
      setViewMode(mode);
    } catch (e) {
      console.log('[ERROR] getProductViewMode:', e.message);
    } finally {
      setLoadingViewMode(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoadingProfile(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        console.log('[SETTINGS] Profile fetched:', data?.name);
        setUserProfile(data);
      }
    } catch (err) {
      console.log('[ERROR] fetchUserProfile:', err.message);
      setErrorMessage('Failed to load profile');
      setShowErrorAlert(true);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 800,
        maxHeight: 800,
        includeBase64: false,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        setErrorMessage(result.errorMessage || 'Failed to pick image');
        setShowErrorAlert(true);
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      await uploadImage(asset);
    } catch (error) {
      console.log('[ERROR] Image picker:', error);
      setErrorMessage('Failed to select image');
      setShowErrorAlert(true);
    }
  };

  const uploadImage = async asset => {
    try {
      setUploadingImage(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('[DEBUG] Starting image upload for user:', user.id);

      // Delete old image first
      if (userProfile?.image_url) {
        try {
          const urlParts = userProfile.image_url.split('/');
          const oldFileName = urlParts.slice(-2).join('/');

          console.log('[DEBUG] Deleting old image:', oldFileName);

          const { error: deleteError } = await supabase.storage
            .from('product-images')
            .remove([oldFileName]);

          if (deleteError) {
            console.log('[WARNING] Failed to delete old image:', deleteError);
          } else {
            console.log('[DEBUG] Old image deleted successfully');
          }
        } catch (deleteErr) {
          console.log('[WARNING] Error during delete:', deleteErr);
        }
      }

      // Read file as base64
      const base64 = await RNFS.readFile(asset.uri, 'base64');
      const fileName = `avatars/${user.id}.jpg`;

      console.log('[DEBUG] Uploading file:', fileName);

      // Convert base64 to ArrayBuffer
      const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.log('[ERROR] Upload error:', uploadError);
        throw uploadError;
      }

      console.log('[DEBUG] Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get image URL');
      }

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      console.log('[DEBUG] Public URL:', publicUrl);

      // Update user profile
      const { data, error } = await supabase
        .from('users')
        .update({ image_url: publicUrl })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.log('[ERROR] Database update error:', error);
        throw error;
      }

      console.log('[DEBUG] Profile updated successfully');

      setUserProfile(data);
      setShowSuccessAlert(true);
    } catch (error) {
      console.log('[ERROR] Upload image:', error);
      setErrorMessage(`Failed to upload image: ${error.message}`);
      setShowErrorAlert(true);
    } finally {
      setUploadingImage(false);
    }
  };

  const onLogoutPress = () => {
    setShowLogoutAlert(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutAlert(false);
    try {
      await signOut();
    } catch (error) {
      console.log('[ERROR] Logout failed:', error.message);
      setErrorMessage('Failed to logout. Please try again.');
      setShowErrorAlert(true);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutAlert(false);
  };

  const navigateToDetails = useCallback(() => {
    navigation.navigate('UserDetailsScreen', {
      userProfile,
      onUpdate: () => {
        console.log('[SETTINGS] onUpdate callback triggered');
        fetchUserProfile();
      },
    });
  }, [userProfile, navigation]);

  const toggleViewMode = async () => {
    try {
      setSavingViewMode(true);
      const next = viewMode === 'modern' ? 'traditional' : 'modern';
      await setProductViewMode(next);
      setViewMode(next);
    } catch (e) {
      console.log('[ERROR] setProductViewMode:', e.message);
      setErrorMessage('Failed to update product view mode');
      setShowErrorAlert(true);
    } finally {
      setSavingViewMode(false);
    }
  };

  if (loadingProfile && !hasLoadedInitially.current) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#353F54" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4fc3f7" />
          <Text style={styles.loadTxt}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#353F54" />

      {/* Profile */}
      <View style={styles.profileBox}>
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={handleImagePicker}
          disabled={uploadingImage}
          activeOpacity={0.8}
        >
          <View style={styles.avatarBorder}>
            {uploadingImage ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#4fc3f7" />
              </View>
            ) : (
              <>
                <Image
                  source={
                    userProfile?.image_url
                      ? { uri: userProfile.image_url }
                      : require('../../assets/default-avatar.png')
                  }
                  style={styles.avatar}
                />
                <View style={styles.editIconContainer}>
                  <LinearGradient
                    colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
                    style={styles.editIcon}
                  >
                    <Ionicons name="pencil-outline" size={20} color="#fff" />
                  </LinearGradient>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{userProfile?.name || 'User'}</Text>
        <Text style={styles.email}>{userProfile?.email}</Text>
        {userProfile?.phone && (
          <Text style={styles.phone}>+{userProfile.phone}</Text>
        )}
      </View>

      {/* Menu */}
      <View style={styles.menuWrap}>
        {/* User Details */}
        <MenuCard
          icon="person-outline"
          label="User Details"
          onPress={navigateToDetails}
        />

        {/* Toggle Product View Mode with Switch */}
        <SwitchCard
          label="Traditional UI"
          value={viewMode === 'traditional'}
          onValueChange={toggleViewMode}
          disabled={loadingViewMode || savingViewMode}
          onInfoPress={() => setShowInfoTooltip(true)}
        />

        {/* Logout */}
        <MenuCard
          icon="log-out-outline"
          label="Logout"
          onPress={onLogoutPress}
        />
      </View>

      {/* Info Tooltip Modal */}
      <Modal
        visible={showInfoTooltip}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInfoTooltip(false)}
      >
        <TouchableOpacity
          style={styles.tooltipOverlay}
          activeOpacity={1}
          onPress={() => setShowInfoTooltip(false)}
        >
          <View style={styles.tooltipContainer}>
            <LinearGradient
              colors={['#2a3847', '#1f2937']}
              style={styles.tooltipContent}
            >
              <View style={styles.tooltipHeader}>
                <Ionicons name="information-circle" size={32} color="#4fc3f7" />
                <Text style={styles.tooltipTitle}>Product View Modes</Text>
              </View>

              <View style={styles.tooltipBody}>
                <View style={styles.tooltipSection}>
                  <Text style={styles.tooltipSectionTitle}>Modern UI</Text>
                  <Text style={styles.tooltipText}>
                    Swipeable card interface for quick browsing. Swipe
                    left/right to navigate between products, swipe up to add to
                    wishlist, and swipe down to add to cart instantly.
                  </Text>
                </View>

                <View style={styles.tooltipSection}>
                  <Text style={styles.tooltipSectionTitle}>Traditional UI</Text>
                  <Text style={styles.tooltipText}>
                    Classic tap-to-view interface. Tap on any product to open a
                    detailed view with multiple product images, full
                    description, specifications, and reviews—just like
                    traditional e-commerce apps.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.tooltipButton}
                onPress={() => setShowInfoTooltip(false)}
              >
                <LinearGradient
                  colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
                  style={styles.tooltipButtonGradient}
                >
                  <Text style={styles.tooltipButtonText}>Got it</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Success Alert */}
      <CustomAlert
        visible={showSuccessAlert}
        title="Success"
        message="Profile picture updated successfully!"
        type="success"
        icon={
          <Ionicons name="checkmark-circle-outline" size={48} color="#4fc3f7" />
        }
        buttons={[
          {
            text: 'OK',
            style: 'default',
            onPress: () => setShowSuccessAlert(false),
          },
        ]}
        onBackdropPress={() => setShowSuccessAlert(false)}
        dismissible={true}
      />

      {/* Logout Confirmation Alert */}
      <CustomAlert
        visible={showLogoutAlert}
        title="Logout"
        message="Are you sure you want to logout?"
        type="confirm"
        icon={<Ionicons name="log-out" size={48} color="#4fc3f7" />}
        buttons={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: handleLogoutCancel,
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: handleLogoutConfirm,
          },
        ]}
        onBackdropPress={handleLogoutCancel}
        dismissible={true}
      />

      {/* Error Alert */}
      <CustomAlert
        visible={showErrorAlert}
        title="Error"
        message={errorMessage}
        type="error"
        icon={
          <Ionicons name="close-circle-outline" size={48} color="#ff4458" />
        }
        buttons={[
          {
            text: 'OK',
            style: 'default',
            onPress: () => setShowErrorAlert(false),
          },
        ]}
        onBackdropPress={() => setShowErrorAlert(false)}
        dismissible={true}
      />
    </SafeAreaView>
  );
};

const MenuCard = ({ icon, label, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.cardWrap, disabled && styles.cardDisabled]}
    onPress={onPress}
    activeOpacity={0.8}
    disabled={disabled}
  >
    <View style={styles.cardContent}>
      <Text style={styles.cardTxt}>{label}</Text>
      <Ionicons name="chevron-forward" size={24} color="#4fc3f7" />
    </View>
  </TouchableOpacity>
);

const SwitchCard = ({ label, value, onValueChange, disabled, onInfoPress }) => (
  <View style={[styles.cardWrap, disabled && styles.cardDisabled]}>
    <View style={styles.cardContent}>
      <View style={styles.switchLabelContainer}>
        <Text style={styles.cardTxt}>{label}</Text>
        <TouchableOpacity
          style={styles.infoIcon}
          onPress={onInfoPress}
          activeOpacity={0.7}
        >
          <Ionicons name="information-circle-outline" size={20} color="#4fc3f7" />
        </TouchableOpacity>
      </View>
      <SwitchToggle
        switchOn={value}
        onPress={onValueChange}
        disabled={disabled}
        circleColorOff="#8a9fb5"
        circleColorOn="#fff"
        backgroundColorOn="#4fc3f7"
        backgroundColorOff="#3a4556"
        containerStyle={styles.switchContainer}
        circleStyle={styles.switchCircle}
        duration={200}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#353F54',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadTxt: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  profileBox: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 60,
  },
  avatarWrap: {
    marginBottom: 20,
  },
  avatarBorder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4fc3f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2a3847',
  },
  loadingOverlay: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(42, 56, 71, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    shadowColor: '#4fc3f7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  editIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#353F54',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#8a9fb5',
    marginBottom: 4,
    textAlign: 'center',
  },
  phone: {
    fontSize: 14,
    color: '#8a9fb5',
    textAlign: 'center',
  },
  menuWrap: {
    paddingHorizontal: 20,
    gap: 16,
  },
  cardWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    paddingLeft: 5,
    paddingBottom: 10,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTxt: {
    fontSize: 22,
    fontWeight: '500',
    color: '#fff',
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  infoIcon: {
    padding: 4,
  },
  switchContainer: {
    width: 45,
    height: 22,
    borderRadius: 20,
    marginLeft: 12,
    padding: 2,
  },
  switchCircle: {
    width: 20,
    height: 21,
    borderRadius: 13,
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tooltipContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4fc3f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  tooltipContent: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
    borderRadius: 16,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  tooltipTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  tooltipBody: {
    gap: 16,
    marginBottom: 24,
  },
  tooltipSection: {
    gap: 8,
  },
  tooltipSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4fc3f7',
  },
  tooltipText: {
    fontSize: 14,
    color: '#8a9fb5',
    lineHeight: 20,
  },
  tooltipButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  tooltipButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  tooltipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SettingsScreen;
