// src/screens/customer/UserDetailsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '../../supabase/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from '../../components/informative/CustomAlert';
import Input from '../../components/Form/Input';
import Loader from '../../components/shared/Loader';
import { useAuth } from '../../navigation/AuthProvider'; // ✅ ADD THIS
import { useLocation } from '../../hooks/useLocation';
import { useToastify } from '../../hooks/useToastify';
import LocationPickerModal from '../../components/customer/LocationPickerModal';

const UserDetailsScreen = ({ navigation }) => {
  const { user, loading: authLoading } = useAuth(); // ✅ USE THIS
  const {
    getCurrentLocation,
    loading: locationLoading,
    permissionAlert,
    setPermissionAlert,
  } = useLocation();

  const { showToast } = useToastify();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('Error');

  // Modal for adding/editing addresses
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null); // ✅ ADD THIS
  // Add state for latitude/longitude
  const [addressForm, setAddressForm] = useState({
    label: '',
    address: '',
    city: '',
    zip_code: '',
    country: '',
    state: '',
    latitude: null, // ✅ ADD THIS
    longitude: null, // ✅ ADD THIS
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Load data when user is available
  useEffect(() => {
    if (user?.id && !authLoading) {
      loadUserData();
    }
  }, [user?.id, authLoading]);

  const loadUserData = async () => {
    try {
      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone ? String(profile.phone) : '',
      });

      // Load addresses
      const { data: addressesData, error: addressesError } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (addressesError) throw addressesError;
      setAddresses(addressesData || []);
    } catch (error) {
      showErrorAlert('Error', 'Failed to load profile');
    }
  };

  const showError = (title, message) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setShowErrorAlert(true);
  };

  const handleSaveProfile = useCallback(async () => {
    if (!formData.name.trim()) {
      showError('Error', 'Name is required');
      return;
    }

    if (!formData.email.trim()) {
      showError('Error', 'Email is required');
      return;
    }

    try {
      setLoading(true);

      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone ? parseInt(formData.phone) : null,
      };

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;
      setShowSuccessAlert(true);
    } catch (error) {
      showError('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }, [formData, user.id]);

  // Address Management
  const openAddressModal = (address = null) => {
    if (address) {
      setEditingAddressId(address.id);
      setAddressForm({
        label: address.label,
        address: address.address,
        city: address.city,
        zip_code: address.zip_code,
        country: address.country,
        state: address.state || '',
        latitude: address.latitude, // ✅ ADD THIS
        longitude: address.longitude, // ✅ ADD THIS
      });
    } else {
      setEditingAddressId(null);
      setAddressForm({
        label: '',
        address: '',
        city: '',
        zip_code: '',
        country: '',
        state: '',
        latitude: null, // ✅ ADD THIS
        longitude: null, // ✅ ADD THIS
      });
    }
    setShowAddressModal(true);
  };

  // Update closeAddressModal
  const closeAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddressId(null);
    setAddressForm({
      label: '',
      address: '',
      city: '',
      zip_code: '',
      country: '',
      state: '',
      latitude: null, // ✅ ADD THIS
      longitude: null, // ✅ ADD THIS
    });
  };

  // Update handleSaveAddress to include coordinates
  const handleSaveAddress = async () => {
    if (!addressForm.label.trim()) {
      showError('Error', 'Label is required');
      return;
    }
    if (!addressForm.address.trim()) {
      showError('Error', 'Address is required');
      return;
    }
    if (!addressForm.city.trim()) {
      showError('Error', 'City is required');
      return;
    }
    if (!addressForm.state.trim()) {
      // ✅ ADD THIS
      showError('Error', 'State is required');
      return;
    }
    if (!addressForm.zip_code.trim()) {
      showError('Error', 'Zip code is required');
      return;
    }
    if (!addressForm.country.trim()) {
      showError('Error', 'Country is required');
      return;
    }

    try {
      setLoading(true);

      const saveData = {
        label: addressForm.label,
        address: addressForm.address,
        city: addressForm.city,
        zip_code: addressForm.zip_code,
        country: addressForm.country,
        state: addressForm.state,
        latitude: addressForm.latitude || null, // ✅ ADD THIS
        longitude: addressForm.longitude || null, // ✅ ADD THIS
      };

      if (editingAddressId) {
        const { error } = await supabase
          .from('delivery_addresses')
          .update(saveData)
          .eq('id', editingAddressId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('delivery_addresses').insert([
          {
            user_id: user.id,
            ...saveData,
            is_default: addresses.length === 0,
          },
        ]);

        if (error) throw error;
      }

      // Reload addresses
      const { data: updatedAddresses, error: fetchError } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAddresses(updatedAddresses || []);
      closeAddressModal();
      setShowSuccessAlert(true);
    } catch (error) {
      showError('Error', error.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  // Add this new function
  // In UserDetailsScreen
  const handleGetCurrentLocation = () => {
    setShowLocationPicker(true);
  };

  const handleDeleteAddress = async addressId => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('delivery_addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;

      setAddresses(addresses.filter(a => a.id !== addressId));
      setShowSuccessAlert(true);
    } catch (error) {
      showError('Error', 'Failed to delete address');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async addressId => {
    try {
      setLoading(true);

      // Set all addresses to not default
      await supabase
        .from('delivery_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set selected as default
      const { error } = await supabase
        .from('delivery_addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) throw error;

      // Reload addresses
      const { data: updatedAddresses } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      setAddresses(updatedAddresses || []);
    } catch (error) {
      showError('Error', 'Failed to set default address');
    } finally {
      setLoading(false);
    }
  };

  const renderAddressCard = ({ item }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <Text style={styles.addressLabel}>{item.label}</Text>
        {item.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>DEFAULT</Text>
          </View>
        )}
      </View>

      <Text style={styles.addressText}>{item.address}</Text>
      <Text style={styles.addressText}>
        {item.city}
        {item.state && `, ${item.state}`}
        {item.zip_code && `, ${item.zip_code}`}, {item.country}
      </Text>

      <View style={styles.addressActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openAddressModal(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        {!item.is_default && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetDefault(item.id)}
            >
              <Ionicons name="checkmark" size={16} color="#4fc3f7" />
              <Text style={styles.actionButtonText}>Set Default</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteAddress(item.id)}
            >
              <Ionicons name="trash" size={16} color="#ff4458" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loader visible size={120} speed={1} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Loader visible={loading} size={120} speed={1} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <Input
                value={formData.name}
                onChangeText={text => setFormData({ ...formData, name: text })}
                placeholder="Enter your full name"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <Input
                value={formData.email}
                onChangeText={text => setFormData({ ...formData, email: text })}
                placeholder="Enter your email"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <Input
                value={formData.phone}
                onChangeText={text => setFormData({ ...formData, phone: text })}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
              activeOpacity={0.8}
              disabled={loading}
            >
              <LinearGradient
                colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
                style={styles.buttonGradient}
              >
                <Ionicons name="checkmark-outline" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Delivery Addresses */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithButton}>
              <Text style={styles.sectionTitle}>Delivery Addresses</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => openAddressModal()}
              >
                <Ionicons name="add" size={20} color="#4fc3f7" />
              </TouchableOpacity>
            </View>

            {addresses.length > 0 ? (
              <FlatList
                data={addresses}
                renderItem={renderAddressCard}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={48} color="#8a9fb5" />
                <Text style={styles.emptyStateText}>
                  No addresses added yet
                </Text>
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={() => openAddressModal()}
                >
                  <Text style={styles.addAddressButtonText}>
                    Add Your First Address
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add/Edit Address Modal */}
      <Modal
        visible={showAddressModal}
        transparent
        animationType="slide"
        onRequestClose={closeAddressModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Loader visible={loading || locationLoading} size={120} speed={1} />
            <ScrollView
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingAddressId ? 'Edit Address' : 'Add New Address'}
                </Text>
              </View>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Label (e.g., Home, Work)</Text>
                <Input
                  value={addressForm?.label || ''}
                  onChangeText={text =>
                    setAddressForm({ ...addressForm, label: text })
                  }
                  placeholder="Enter label"
                />
              </View>
              {/* Add this after Country field in modal, BEFORE modal buttons */}
              <TouchableOpacity
                style={styles.getLocationButton}
                onPress={handleGetCurrentLocation}
                disabled={loading || locationLoading}
              >
                <LinearGradient
                  colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="location" size={18} color="#fff" />
                  <Text style={styles.getLocationButtonText}>
                    {locationLoading
                      ? 'Getting Location...'
                      : 'Use My Location'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Street Address</Text>
                <Input
                  value={addressForm.address}
                  onChangeText={text =>
                    setAddressForm({ ...addressForm, address: text })
                  }
                  placeholder="Enter street address"
                />
              </View>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>City</Text>
                <Input
                  value={addressForm.city}
                  onChangeText={text =>
                    setAddressForm({ ...addressForm, city: text })
                  }
                  placeholder="Enter city"
                />
              </View>
              {/* State */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>State</Text>
                <Input
                  value={addressForm.state || ''}
                  onChangeText={text =>
                    setAddressForm({ ...addressForm, state: text })
                  }
                  placeholder="Enter state"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Zip Code</Text>
                <Input
                  value={addressForm.zip_code}
                  onChangeText={text =>
                    setAddressForm({ ...addressForm, zip_code: text })
                  }
                  placeholder="Enter zip code"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Country</Text>
                <Input
                  value={addressForm.country}
                  onChangeText={text =>
                    setAddressForm({ ...addressForm, country: text })
                  }
                  placeholder="Enter country"
                />
              </View>
              <View style={styles.modalActionButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeAddressModal}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={[
                      'rgba(255, 255, 255, 0.15)',
                      'rgba(255, 255, 255, 0.05)',
                    ]}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveAddress}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.saveButtonText}>Save Address</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
            <LocationPickerModal
              visible={showLocationPicker}
              onClose={() => setShowLocationPicker(false)}
              onLocationSelected={location => {
                setAddressForm(prev => ({
                  ...prev,
                  address: location.address,
                  city: location.city,
                  state: location.state,
                  zip_code: location.zip_code,
                  country: location.country,
                  latitude: location.latitude,
                  longitude: location.longitude,
                }));
                showToast('Location selected!', '', 'success');
                setShowLocationPicker(false);
              }}
              initialLocation={selectedLocation || null}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Alerts */}
      <CustomAlert
        visible={showSuccessAlert}
        title="Success"
        message="Operation completed successfully!"
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

      <CustomAlert
        visible={showErrorAlert}
        title={errorTitle}
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

      {/* Permission Alert */}
      <CustomAlert
        visible={permissionAlert.visible}
        title={permissionAlert.title}
        message={permissionAlert.message}
        type={permissionAlert.type === 'permission_denied' ? 'error' : 'info'}
        icon={
          <Ionicons
            name={
              permissionAlert.type === 'permission_denied'
                ? 'close-circle-outline'
                : 'location-outline'
            }
            size={48}
            color={
              permissionAlert.type === 'permission_denied'
                ? '#ff4458'
                : '#4fc3f7'
            }
          />
        }
        buttons={[
          {
            text: 'OK',
            style: 'default',
            onPress: () =>
              setPermissionAlert({ ...permissionAlert, visible: false }),
          },
        ]}
        onBackdropPress={() =>
          setPermissionAlert({ ...permissionAlert, visible: false })
        }
        dismissible={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#353F54',
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4fc3f7',
    marginBottom: 16,
  },
  sectionHeaderWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8a9fb5',
    marginBottom: 8,
  },

  getLocationButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#4fc3f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  getLocationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8a9fb5',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a3847',
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressCard: {
    backgroundColor: '#2a3847',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.2)',
    padding: 16,
    marginBottom: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4fc3f7',
  },
  defaultBadge: {
    backgroundColor: '#4fc3f7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  addressText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(79, 195, 247, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4fc3f7',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 68, 88, 0.15)',
    borderColor: 'rgba(255, 68, 88, 0.3)',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff4458',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8a9fb5',
    marginTop: 12,
  },
  addAddressButton: {
    marginTop: 16,
    backgroundColor: 'rgba(79, 195, 247, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
  },
  addAddressButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4fc3f7',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#353F54',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHeader: {
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4fc3f7',
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#4fc3f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default UserDetailsScreen;
