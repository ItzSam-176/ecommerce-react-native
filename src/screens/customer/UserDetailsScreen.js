// src/screens/customer/UserDetailsScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '../../supabase/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from '../../components/informative/CustomAlert';
import Input from '../../components/Form/Input';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import Loader from '../../components/shared/Loader';

const UserDetailsScreen = ({ navigation, route }) => {
  const [userProfile, setUserProfile] = useState(
    route?.params?.userProfile || {},
  );
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('Error');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
  });

  const hasLoadedOnce = useRef(false);

  // Load initial data only once
  useEffect(() => {
    if (!hasLoadedOnce.current && route?.params?.userProfile) {
      hasLoadedOnce.current = true;
    }
  }, []);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone ? String(userProfile.phone) : '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        zipCode: userProfile.zip_code ? String(userProfile.zip_code) : '',
        country: userProfile.country || '',
      });
    }
  }, [userProfile]);

  const showError = (title, message) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setShowErrorAlert(true);
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
        showError('Error', result.errorMessage || 'Failed to pick image');
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      await uploadImage(asset);
    } catch (error) {
      console.log('[ERROR] Image picker:', error);
      showError('Error', 'Failed to select image');
    }
  };

  const uploadImage = async asset => {
    try {
      setUploadingImage(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // DELETE OLD IMAGE FIRST
      if (userProfile?.image_url) {
        try {
          // Extract filename from URL
          // Example URL: https://xxx.supabase.co/storage/v1/object/public/product-images/avatars/user-id_123.jpg
          const urlParts = userProfile.image_url.split('/');
          const oldFileName = urlParts.slice(-2).join('/'); // Gets "avatars/user-id_123.jpg"

          const { error: deleteError } = await supabase.storage
            .from('product-images')
            .remove([oldFileName]);

          if (deleteError) {
            console.log('[WARNING] Failed to delete old image:', deleteError);
            // Don't throw error - continue with upload even if delete fails
          }
        } catch (deleteErr) {
          console.log('[WARNING] Error during delete:', deleteErr);
          // Continue with upload
        }
      }

      // Read file as base64
      const base64 = await RNFS.readFile(asset.uri, 'base64');
      const fileName = `avatars/${user.id}.jpg`; // Use consistent filename (just user ID, no timestamp)

      // Convert base64 to ArrayBuffer
      const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

      // Upload to Supabase Storage - use upsert to overwrite
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true, // This overwrites if file exists
        });

      if (uploadError) {
        console.log('[ERROR] Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get image URL');
      }

      // Add cache buster to force image refresh
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update user profile with new image URL
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

      setUserProfile(data);
      setShowSuccessAlert(true);

      if (route.params?.onUpdate) {
        route.params.onUpdate();
      }
    } catch (error) {
      console.log('[ERROR] Upload image:', error);
      showError('Error', `Failed to upload image: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = useCallback(async () => {
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showError('Error', 'User not authenticated');
        return;
      }

      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone ? parseInt(formData.phone) : null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        zip_code: formData.zipCode ? parseInt(formData.zipCode) : null,
        country: formData.country.trim() || null,
      };

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Update failed - no data returned');

      setUserProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone ? String(data.phone) : '',
        address: data.address || '',
        city: data.city || '',
        zipCode: data.zip_code ? String(data.zip_code) : '',
        country: data.country || '',
      });

      setIsEditing(false);
      setShowSuccessAlert(true);

      if (route.params?.onUpdate) {
        route.params.onUpdate();
      }
    } catch (error) {
      console.log('[ERROR] Failed to update profile:', error.message);
      showError(
        'Error',
        error.message || 'Failed to update profile. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [formData, route.params?.onUpdate]);

  const handleCancel = useCallback(() => {
    setFormData({
      name: userProfile.name || '',
      email: userProfile.email || '',
      phone: userProfile.phone ? String(userProfile.phone) : '',
      address: userProfile.address || '',
      city: userProfile.city || '',
      zipCode: userProfile.zip_code ? String(userProfile.zip_code) : '',
      country: userProfile.country || '',
    });
    setIsEditing(false);
  }, [userProfile]);

  useEffect(() => {
    navigation.setParams({
      onEditPress: isEditing ? handleSave : () => setIsEditing(true),
      isEditing: isEditing,
      editLoading: loading,
    });
  }, [isEditing, loading, handleSave, navigation]);

  const renderField = (
    label,
    value,
    key,
    placeholder,
    keyboardType = 'default',
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing ? (
        <Input
          value={value}
          onChangeText={text => setFormData({ ...formData, [key]: text })}
          placeholder={placeholder}
          keyboardType={keyboardType}
        />
      ) : (
        <View style={styles.valueContainer}>
          <Text style={styles.fieldValue}>{value || 'Not provided'}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Loader visible={uploadingImage || loading} size={120} speed={1} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Image Section */}
          <View style={styles.profileImageSection}>
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={handleImagePicker}
              disabled={uploadingImage}
              activeOpacity={0.8}
            >
              <View style={styles.avatarBorder}>
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
                      <Ionicons name="create-outline" size={20} color="#fff" />
                    </LinearGradient>
                  </View>
                </>
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Tap to change photo</Text>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            {renderField(
              'Full Name',
              formData.name,
              'name',
              'Enter your full name',
            )}
            {renderField(
              'Email Address',
              formData.email,
              'email',
              'Enter your email',
              'email-address',
            )}
            {renderField(
              'Phone Number',
              formData.phone,
              'phone',
              'Enter your phone number',
              'phone-pad',
            )}
          </View>

          {/* Address Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>

            {renderField(
              'Street Address',
              formData.address,
              'address',
              'Enter your street address',
            )}
            {renderField('City', formData.city, 'city', 'Enter your city')}
            {renderField(
              'Zip Code',
              formData.zipCode,
              'zipCode',
              'Enter your zip code',
              'numeric',
            )}
            {renderField(
              'Country',
              formData.country,
              'country',
              'Enter your country',
            )}
          </View>

          {/* Action Buttons (only show when editing) */}
          {isEditing && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                activeOpacity={0.8}
                disabled={loading}
              >
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.15)',
                    'rgba(255, 255, 255, 0.05)',
                  ]}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="close-outline" size={20} color="#8a9fb5" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#5fd4f7', '#4fc3f7', '#3aa5c7']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="checkmark-outline" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Alert */}
      <CustomAlert
        visible={showSuccessAlert}
        title="Success"
        message="Your profile has been updated successfully!"
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

      {/* Error Alert */}
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
  },
  profileImageSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  avatarWrap: {
    marginBottom: 12,
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
  editIconContainer: {
    position: 'absolute',
    bottom: -5,
    right: 3,
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
  changePhotoText: {
    fontSize: 14,
    color: '#8a9fb5',
    marginTop: 8,
  },
  section: {
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4fc3f7',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8a9fb5',
    marginBottom: 8,
  },
  valueContainer: {
    backgroundColor: '#2a3847',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  fieldValue: {
    fontSize: 16,
    color: '#fff',
  },
  actionButtonsContainer: {
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
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8a9fb5',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default UserDetailsScreen;
