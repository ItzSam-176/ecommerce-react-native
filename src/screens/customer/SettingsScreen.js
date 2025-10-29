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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '../../supabase/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../navigation/AuthProvider';
import {
  getProductViewMode,
  setProductViewMode,
} from '../../utils/userPreferences';
import CustomAlert from '../../components/informative/CustomAlert';

const SettingsScreen = ({ navigation }) => {
  const { signOut } = useAuth();

  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [viewMode, setViewMode] = useState('modern');
  const [loadingViewMode, setLoadingViewMode] = useState(true);
  const [savingViewMode, setSavingViewMode] = useState(false);

  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Track if initial load is done
  const hasLoadedInitially = useRef(false);

  // Load data only on initial mount
  useEffect(() => {
    if (!hasLoadedInitially.current) {
      console.log('[SETTINGS] Initial load');
      fetchUserProfile();
      loadViewMode();
      hasLoadedInitially.current = true;
    }
  }, []);

  // Listen for focus events to check if we need to refresh
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Only refresh if we're coming back from UserDetailsScreen with updates
      const state = navigation.getState();
      const currentRoute = state.routes[state.index];

      // Check if we just came back from UserDetailsScreen
      if (currentRoute.params?.shouldRefresh) {
        console.log('[SETTINGS] Refresh triggered by navigation param');
        fetchUserProfile();
        // Clear the param so it doesn't refresh again
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
        <View style={styles.avatarWrap}>
          <View style={styles.avatarBorder}>
            <Image
              source={
                userProfile?.image_url
                  ? { uri: userProfile.image_url }
                  : require('../../assets/default-avatar.png')
              }
              style={styles.avatar}
            />
          </View>
        </View>
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

        {/* Toggle Product View Mode */}
        <MenuCard
          icon="contrast-outline"
          label={
            loadingViewMode || savingViewMode
              ? 'Updating…'
              : `Switch to ${
                  viewMode === 'modern' ? 'Traditional' : 'Modern'
                } UI`
          }
          onPress={toggleViewMode}
          disabled={loadingViewMode || savingViewMode}
        />

        {/* Logout */}
        <MenuCard
          icon="log-out-outline"
          label="Logout"
          onPress={onLogoutPress}
        />
      </View>

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
    <LinearGradient
      colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
      style={styles.card}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={24} color="#4fc3f7" />
        </View>
        <Text style={styles.cardTxt}>{label}</Text>
        <Ionicons name="chevron-forward" size={24} color="#4fc3f7" />
      </View>
    </LinearGradient>
  </TouchableOpacity>
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
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2a3847',
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
    shadowColor: '#4fc3f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  card: {
    backgroundColor: '#2a3847',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79,195,247,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTxt: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
  },
});

export default SettingsScreen;
