import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { supabase } from '../../supabase/supabase';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import { decode } from 'base64-arraybuffer';
import slugify from 'slugify';
import Input from '../../components/Form/Input';
import CustomButton from '../../components/Form/CustomButton';
import FilePicker from '../../components/Form/FilePicker';
import { useToastify } from '../../hooks/useToastify';
import { useAuth } from '../../navigation/AuthProvider';
import { MultiSelect } from 'react-native-element-dropdown';
import { useDebounce } from '../../hooks/useDebounce';
import CategoryChips from '../../components/shared/CategoryChips';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

export default function AddProductsScreen({ navigation, route }) {
  const { showToast } = useToastify();
  const product = route.params?.product;

  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [quantity, setQuantity] = useState(product?.quantity?.toString() || '');
  const [description, setDescription] = useState(product?.description || '');
  const [image, setImage] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const { user } = useAuth();

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const [dropdownInFocus, setDropdownInFocus] = useState(false);

  useEffect(() => {
    if (product?.image_url)
      setImage({ uri: product.image_url, isLocal: false });
    if (product) fetchProductCategories();
    fetchAllCategories();
  }, [product]);

  useEffect(() => {
    if (user) setAdminId(user.id);
  }, [user]);

  useEffect(() => {
    if (debouncedSearch) {
      searchCategories(debouncedSearch);
    } else if (!debouncedSearch && isSearching) {
      fetchAllCategories();
      setIsSearching(false);
    }
  }, [debouncedSearch]);

  const fetchAllCategories = async () => {
    console.log('[Fetching all categories]');
    const { data, error } = await supabase
      .from('category')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      setCategories(data);
      console.log(`[Loaded ${data.length} categories]`);
    } else {
      console.error('[Error fetching categories]:', error);
    }
  };

  const searchCategories = async query => {
    console.log(`[Searching categories for: ${query}]`);
    setIsSearching(true);

    const { data, error } = await supabase
      .from('category')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true });

    if (!error && data) {
      console.log(`[Found ${data.length} matching categories]`);

      const hasExactMatch = data.some(
        cat => cat.name.toLowerCase() === query.toLowerCase(),
      );

      if (!hasExactMatch && query.trim()) {
        const withCreateOption = [
          {
            id: 'create-new',
            name: `+ Add "${query}"`,
            isCreateNew: true,
            originalName: query,
          },
          ...data,
        ];
        setCategories(withCreateOption);
      } else {
        setCategories(data);
      }
    } else {
      console.error('[Search error]:', error);
    }
  };

  const fetchProductCategories = async () => {
    console.log('[Fetching product categories for product]:', product.id);

    const { data, error } = await supabase
      .from('product_categories')
      .select(
        `
        category_id,
        category:category_id (
          id,
          name
        )
      `,
      )
      .eq('product_id', product.id);

    console.log('[Raw product categories data]:', data);

    if (!error && data?.length) {
      const mappedCategories = data
        .map(d => {
          const categoryId = d.category?.id || d.category_id;
          const categoryName = d.category?.name || 'Unknown Category';

          return {
            id: categoryId,
            name: categoryName,
          };
        })
        .filter(cat => cat.id);

      console.log('[Mapped categories]:', mappedCategories);
      setSelectedCategories(mappedCategories);
    } else if (error) {
      console.error('[Error fetching product categories]:', error);
    }
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
      includeBase64: true,
    });

    if (!result.didCancel && result.assets?.length > 0) {
      const imagePicked = result.assets[0];
      setImage({
        uri: imagePicked.uri,
        preview: `data:${imagePicked.type};base64,${imagePicked.base64}`,
        base64: imagePicked.base64,
        name: imagePicked.fileName || imagePicked.uri.split('/').pop(),
        type: imagePicked.type,
        isLocal: true,
      });
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const uploadImage = async (image, folderName) => {
    if (!image?.uri) return null;
    try {
      const filePath =
        Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri;
      const exists = await RNFS.exists(filePath);
      if (!exists) throw new Error('Image file not found');

      const fileStats = await RNFS.stat(filePath);
      const quality = fileStats.size > 1000000 ? 60 : 80;

      const resized = await ImageResizer.createResizedImage(
        Platform.OS === 'ios' ? `file://${filePath}` : filePath,
        1280,
        720,
        'PNG',
        quality,
        0,
      );

      const base64Data = await RNFS.readFile(
        Platform.OS === 'ios'
          ? resized.uri.replace('file://', '')
          : resized.uri,
        'base64',
      );
      await RNFS.unlink(resized.uri).catch(() => null);

      const fileBuffer = decode(base64Data);
      const fileName = `${Date.now()}_${image.fileName || 'product.jpg'}`;
      const storagePath = `${folderName}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(storagePath, fileBuffer, { contentType: image.type });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('product-images')
        .getPublicUrl(storagePath);

      console.log('[Public URL generated]:', publicData.publicUrl);

      return { storagePath, publicUrl: publicData.publicUrl };
    } catch (err) {
      console.error('[Image upload error]:', err);
      return null;
    }
  };

  const validateForm = () => {
    if (
      !name.trim() ||
      !price.trim() ||
      !quantity.trim() ||
      !description.trim()
    ) {
      showToast('All fields are required', '', 'error');
      return false;
    }
    if (selectedCategories.length === 0) {
      showToast('Select at least one category', '', 'error');
      return false;
    }
    if (!product && (!image || !image.isLocal)) {
      showToast('Select an image', '', 'error');
      return false;
    }
    return true;
  };

  const saveProduct = async () => {
    if (!validateForm()) return;
    if (!adminId) return showToast('Admin not loaded yet', '', 'error');

    let productId;
    let folderName;

    try {
      if (product) {
        productId = product.id;
        folderName =
          product.image_folder ||
          `${slugify(name, { lower: true, strict: true })}_${productId}`;
        let imagePath = image?.isLocal
          ? await uploadImage(image, folderName)
          : null;

        const { error } = await supabase
          .from('products')
          .update({
            name,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            description,
            image_url: imagePath?.publicUrl || product.image_url,
            image_folder: folderName,
          })
          .eq('id', productId);
        if (error) {
          console.error('[Update error]:', error);
          return Alert.alert('Error', error.message);
        }

        await supabase
          .from('product_categories')
          .delete()
          .eq('product_id', productId);
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([
            {
              name,
              price: parseFloat(price),
              quantity: parseInt(quantity),
              description,
              created_by: adminId,
              image_url: null,
              image_folder: null,
            },
          ])
          .select()
          .single();

        if (error) {
          console.error('[Insert error]:', error);
          return Alert.alert('Error', error.message);
        }

        productId = data.id;
        folderName = `${slugify(name, {
          lower: true,
          strict: true,
        })}_${productId}`;

        const imagePath = await uploadImage(image, folderName);
        if (!imagePath) {
          console.error('[Image upload failed]');
          return showToast('Image upload failed', '', 'error');
        }

        await supabase
          .from('products')
          .update({
            image_url: imagePath.publicUrl,
            image_folder: folderName,
          })
          .eq('id', productId);
      }

      for (const cat of selectedCategories) {
        await supabase
          .from('product_categories')
          .insert([{ product_id: productId, category_id: cat.id }]);
      }

      showToast(product ? 'Product updated!' : 'Product added!', '', 'success');
      navigation.navigate('ProductsScreen', { productChanged: true });
    } catch (error) {
      console.error('[Save product error]:', error);
      showToast('Something went wrong', '', 'error');
    }
  };

  const handleCategoryCreate = async categoryName => {
    if (!adminId) {
      showToast('Admin not loaded yet', '', 'error');
      return null;
    }

    console.log('[Creating new category]:', categoryName);

    const { data, error } = await supabase
      .from('category')
      .insert([{ name: categoryName.trim(), created_by: adminId }])
      .select()
      .single();

    if (error) {
      console.error('[Category creation error]:', error);
      showToast(error.message, '', 'error');
      return null;
    }

    console.log('[Category created successfully]:', data);
    showToast(`Added: ${data.name}`, '', 'success');
    await fetchAllCategories();
    return data;
  };

  const handleCategoryChange = async items => {
    const selectedIds = items;

    if (selectedIds.includes('create-new')) {
      const createNewItem = categories.find(c => c.id === 'create-new');
      if (createNewItem) {
        const newCategory = await handleCategoryCreate(
          createNewItem.originalName,
        );
        if (newCategory) {
          const updatedIds = selectedIds
            .filter(id => id !== 'create-new')
            .concat(newCategory.id);

          const newlySelected = categories
            .filter(cat => updatedIds.includes(cat.id))
            .concat(newCategory);

          setSelectedCategories(newlySelected);
        }
      }
    } else {
      const newlySelected = categories.filter(cat =>
        selectedIds.includes(cat.id),
      );
      setSelectedCategories(newlySelected);
    }
  };

  const handleDropdownFocus = () => {
    console.log('[Dropdown opened - resetting search]');
    setSearchQuery('');
    setIsSearching(false);
    fetchAllCategories();
    setDropdownInFocus(true);
  };

  const handleDropdownBlur = () => {
    console.log('[Dropdown closed - resetting search]');
    setSearchQuery('');
    setIsSearching(false);
    fetchAllCategories();
    setDropdownInFocus(false);
  };

  const handleClearSearch = () => {
    console.log('[Search cleared manually]');
    setSearchQuery('');
    setIsSearching(false);
    fetchAllCategories();
  };

  const handleRemoveCategory = cat => {
    const updatedCategories = selectedCategories.filter(c => c.id !== cat.id);
    setSelectedCategories(updatedCategories);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Input placeholder="Name" value={name} onChangeText={setName} />
      <Input
        placeholder="Price"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />
      <Input
        placeholder="Quantity"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
      />
      <Input
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />

      <MultiSelect
        style={styles.dropdown}
        containerStyle={styles.dropdownContainer}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        data={categories}
        search
        maxHeight={250}
        labelField="name"
        valueField="id"
        placeholder="Search or add category..."
        value={selectedCategories.map(c => c.id)}
        onChange={handleCategoryChange}
        onFocus={handleDropdownFocus}
        onBlur={handleDropdownBlur}
        showsVerticalScrollIndicator={false}
        visibleSelectedItem={false}
        activeColor="rgba(79, 195, 247, 0.3)"
        renderInputSearch={onSearch => (
          <View>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={text => {
                  setSearchQuery(text);
                  onSearch(text);
                }}
                placeholder="Type to search..."
                placeholderTextColor="#8a9fb5"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    handleClearSearch();
                    onSearch('');
                  }}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {selectedCategories.length > 0 && (
              <View style={styles.insideChipsContainer}>
                {selectedCategories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.insideChip}
                    onPress={() => handleRemoveCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.insideChipText}>{cat.name}</Text>
                    <Ionicons name="close" size={14} color="#666" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        renderItem={item => (
          <View style={[styles.item, item.isCreateNew && styles.createItem]}>
            <Text
              style={[styles.itemText, item.isCreateNew && styles.createText]}
            >
              {item.name}
            </Text>
          </View>
        )}
      />

      <CategoryChips
        categories={selectedCategories}
        onRemove={handleRemoveCategory}
        variant="form"
        containerStyle={{ marginTop: 0, marginBottom: 0 }}
        fullChipClickable={true}
      />

      <FilePicker
        fileName={image?.name}
        onPick={pickImage}
        placeholder="Upload product image"
      />

      {/* Image Preview */}
      {image && (
        <View style={styles.imagePreviewContainer}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.imagePreviewWrapper}
          >
            <Image
              source={{ uri: image.preview || image.uri }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={removeImage}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ff5c6d', '#ff4458', '#e63946']}
                style={styles.removeImageGradient}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
          <Text style={styles.imagePreviewLabel}>Product Image Preview</Text>
        </View>
      )}

      <CustomButton
        title={product ? 'Update Product' : 'Add Product'}
        onPress={saveProduct}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#353F54',
    flex: 1,
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    elevation: 2,
    paddingHorizontal: 12,
    marginBottom: 4,
    backgroundColor: '#2a3847',
  },
  dropdownContainer: {
    borderRadius: 8,
    backgroundColor: '#2a3847',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#8a9fb5',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#2a3847',
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#fff',
    padding: 8,
  },
  clearButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 18,
    color: '#4fc3f7',
    fontWeight: 'bold',
  },
  insideChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    backgroundColor: '#2a3847',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  insideChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    borderColor: '#4fc3f7',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  insideChipText: {
    fontSize: 12,
    color: '#4fc3f7',
    fontWeight: '500',
    marginRight: 6,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#2a3847',
  },
  itemText: {
    fontSize: 16,
    color: '#fff',
  },
  createItem: {
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    borderBottomWidth: 2,
    borderBottomColor: '#4fc3f7',
  },
  createText: {
    color: '#4fc3f7',
    fontWeight: '600',
  },
  imagePreviewContainer: {
    marginBottom: 16,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  imagePreviewWrapper: {
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#2a3847',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    shadowColor: '#ff4458',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  removeImageGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#353F54',
  },
  imagePreviewLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#8a9fb5',
    fontWeight: '500',
  },
});
