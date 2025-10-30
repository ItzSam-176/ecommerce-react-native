// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Alert,
//   Platform,
//   ScrollView,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   FlatList,
// } from 'react-native';
// import { supabase } from '../../supabase/supabase';
// import { launchImageLibrary } from 'react-native-image-picker';
// import RNFS from 'react-native-fs';
// import ImageResizer from 'react-native-image-resizer';
// import { decode } from 'base64-arraybuffer';
// import slugify from 'slugify';
// import Input from '../../components/Form/Input';
// import CustomButton from '../../components/Form/CustomButton';
// import FilePicker from '../../components/Form/FilePicker';
// import { useToastify } from '../../hooks/useToastify';
// import { useAuth } from '../../navigation/AuthProvider';
// import { MultiSelect } from 'react-native-element-dropdown';
// import { useDebounce } from '../../hooks/useDebounce';
// import CategoryChips from '../../components/shared/CategoryChips';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import LinearGradient from 'react-native-linear-gradient';

// export default function AddProductsScreen({ navigation, route }) {
//   const { showToast } = useToastify();
//   const product = route.params?.product;

//   const [name, setName] = useState(product?.name || '');
//   const [price, setPrice] = useState(product?.price?.toString() || '');
//   const [quantity, setQuantity] = useState(product?.quantity?.toString() || '');
//   const [description, setDescription] = useState(product?.description || '');
//   const [images, setImages] = useState([]); // Changed from single image to array
//   const [adminId, setAdminId] = useState(null);
//   const { user } = useAuth();

//   const [selectedCategories, setSelectedCategories] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isSearching, setIsSearching] = useState(false);

//   const debouncedSearch = useDebounce(searchQuery, 300);
//   const [dropdownInFocus, setDropdownInFocus] = useState(false);

//   useEffect(() => {
//     if (product) {
//       fetchProductCategories();
//       fetchProductImages(); // Fetch existing images
//     }
//     fetchAllCategories();
//   }, [product]);

//   useEffect(() => {
//     if (user) setAdminId(user.id);
//   }, [user]);

//   useEffect(() => {
//     if (debouncedSearch) {
//       searchCategories(debouncedSearch);
//     } else if (!debouncedSearch && isSearching) {
//       fetchAllCategories();
//       setIsSearching(false);
//     }
//   }, [debouncedSearch]);

//   const fetchProductImages = async () => {
//     if (!product?.id) return;

//     console.log('[Fetching product images for]:', product.id);

//     const { data, error } = await supabase
//       .from('product_images')
//       .select('*')
//       .eq('product_id', product.id)
//       .order('display_order', { ascending: true });

//     if (error) {
//       console.error('[Error fetching product images]:', error);
//       return;
//     }

//     if (data && data.length > 0) {
//       const existingImages = data.map((img, index) => ({
//         id: img.id,
//         uri: img.image_url,
//         storagePath: img.storage_path,
//         isLocal: false,
//         displayOrder: img.display_order || index,
//       }));
//       setImages(existingImages);
//       console.log('[Loaded existing images]:', existingImages.length);
//     }
//   };

//   const fetchAllCategories = async () => {
//     console.log('[Fetching all categories]');
//     const { data, error } = await supabase
//       .from('category')
//       .select('*')
//       .order('name', { ascending: true });

//     if (!error && data) {
//       setCategories(data);
//       console.log(`[Loaded ${data.length} categories]`);
//     } else {
//       console.error('[Error fetching categories]:', error);
//     }
//   };

//   const searchCategories = async query => {
//     console.log(`[Searching categories for: ${query}]`);
//     setIsSearching(true);

//     const { data, error } = await supabase
//       .from('category')
//       .select('*')
//       .ilike('name', `%${query}%`)
//       .order('name', { ascending: true });

//     if (!error && data) {
//       console.log(`[Found ${data.length} matching categories]`);

//       const hasExactMatch = data.some(
//         cat => cat.name.toLowerCase() === query.toLowerCase(),
//       );

//       if (!hasExactMatch && query.trim()) {
//         const withCreateOption = [
//           {
//             id: 'create-new',
//             name: `+ Add "${query}"`,
//             isCreateNew: true,
//             originalName: query,
//           },
//           ...data,
//         ];
//         setCategories(withCreateOption);
//       } else {
//         setCategories(data);
//       }
//     } else {
//       console.error('[Search error]:', error);
//     }
//   };

//   const fetchProductCategories = async () => {
//     console.log('[Fetching product categories for product]:', product.id);

//     const { data, error } = await supabase
//       .from('product_categories')
//       .select(
//         `
//         category_id,
//         category:category_id (
//           id,
//           name
//         )
//       `,
//       )
//       .eq('product_id', product.id);

//     console.log('[Raw product categories data]:', data);

//     if (!error && data?.length) {
//       const mappedCategories = data
//         .map(d => {
//           const categoryId = d.category?.id || d.category_id;
//           const categoryName = d.category?.name || 'Unknown Category';

//           return {
//             id: categoryId,
//             name: categoryName,
//           };
//         })
//         .filter(cat => cat.id);

//       console.log('[Mapped categories]:', mappedCategories);
//       setSelectedCategories(mappedCategories);
//     } else if (error) {
//       console.error('[Error fetching product categories]:', error);
//     }
//   };

//   const pickImages = async () => {
//     try {
//       const result = await launchImageLibrary({
//         mediaType: 'photo',
//         quality: 0.7,
//         includeBase64: true,
//         selectionLimit: 5,
//       });

//       console.log('[Image picker result]:', result);

//       if (result.didCancel) {
//         console.log('[User cancelled image picker]');
//         return;
//       }

//       if (result.errorCode) {
//         console.error('[Image picker error]:', result.errorMessage);
//         showToast('Failed to pick images', '', 'error');
//         return;
//       }

//       if (
//         !result.assets ||
//         !Array.isArray(result.assets) ||
//         result.assets.length === 0
//       ) {
//         console.log('[No assets selected]');
//         return;
//       }

//       const newImages = result.assets.map((asset, index) => ({
//         uri: asset.uri,
//         preview: `data:${asset.type};base64,${asset.base64}`,
//         base64: asset.base64,
//         name: asset.fileName || asset.uri.split('/').pop(),
//         type: asset.type,
//         isLocal: true,
//         displayOrder: images.length + index,
//       }));

//       console.log('[New images to add]:', newImages.length);

//       setImages(prev => [...(prev || []), ...newImages]);
//     } catch (error) {
//       console.error('[Pick images error]:', error);
//       showToast('Error selecting images', '', 'error');
//     }
//   };

//   const removeImage = index => {
//     setImages(prev => prev.filter((_, i) => i !== index));
//   };

//   const uploadImage = async (image, folderName, displayOrder) => {
//     if (!image?.uri) return null;
//     try {
//       const filePath =
//         Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri;
//       const exists = await RNFS.exists(filePath);
//       if (!exists) throw new Error('Image file not found');

//       const fileStats = await RNFS.stat(filePath);
//       const quality = fileStats.size > 1000000 ? 60 : 80;

//       const resized = await ImageResizer.createResizedImage(
//         Platform.OS === 'ios' ? `file://${filePath}` : filePath,
//         1280,
//         720,
//         'PNG',
//         quality,
//         0,
//       );

//       const base64Data = await RNFS.readFile(
//         Platform.OS === 'ios'
//           ? resized.uri.replace('file://', '')
//           : resized.uri,
//         'base64',
//       );
//       await RNFS.unlink(resized.uri).catch(() => null);

//       const fileBuffer = decode(base64Data);
//       const fileName = `${Date.now()}_${displayOrder}_${
//         image.name || 'product.jpg'
//       }`;
//       const storagePath = `${folderName}/${fileName}`;

//       const { error: uploadError } = await supabase.storage
//         .from('product-images')
//         .upload(storagePath, fileBuffer, { contentType: image.type });
//       if (uploadError) throw uploadError;

//       const { data: publicData } = supabase.storage
//         .from('product-images')
//         .getPublicUrl(storagePath);

//       console.log('[Public URL generated]:', publicData.publicUrl);

//       return { storagePath, publicUrl: publicData.publicUrl };
//     } catch (err) {
//       console.error('[Image upload error]:', err);
//       return null;
//     }
//   };

//   const deleteImageFromStorage = async storagePath => {
//     try {
//       console.log('[Deleting image from storage]:', storagePath);
//       const { error } = await supabase.storage
//         .from('product-images')
//         .remove([storagePath]);

//       if (error) {
//         console.error('[Storage deletion error]:', error);
//       } else {
//         console.log('[Image deleted successfully]');
//       }
//     } catch (err) {
//       console.error('[Delete image error]:', err);
//     }
//   };

//   const validateForm = () => {
//     if (
//       !name.trim() ||
//       !price.trim() ||
//       !quantity.trim() ||
//       !description.trim()
//     ) {
//       showToast('All fields are required', '', 'error');
//       return false;
//     }
//     if (selectedCategories.length === 0) {
//       showToast('Select at least one category', '', 'error');
//       return false;
//     }
//     if (images.length === 0) {
//       showToast('Select at least one image', '', 'error');
//       return false;
//     }
//     return true;
//   };

//   const saveProduct = async () => {
//     if (!validateForm()) return;
//     if (!adminId) return showToast('Admin not loaded yet', '', 'error');

//     let productId;
//     let folderName;

//     try {
//       if (product) {
//         // UPDATE EXISTING PRODUCT
//         productId = product.id;
//         folderName =
//           product.image_folder ||
//           `${slugify(name, { lower: true, strict: true })}_${productId}`;

//         console.log('[Cleaning up product images]');

//         // Step 1: Get ALL files currently in the bucket folder
//         const { data: bucketFiles, error: listError } = await supabase.storage
//           .from('product-images')
//           .list(folderName);

//         if (listError) {
//           console.error('[Error listing bucket files]:', listError);
//         } else {
//           console.log('[Files in bucket folder]:', bucketFiles?.length || 0);
//         }

//         // Step 2: Get existing images from database
//         const { data: existingImages } = await supabase
//           .from('product_images')
//           .select('*')
//           .eq('product_id', productId);

//         console.log('[Existing images in DB]:', existingImages?.length || 0);

//         // Step 3: Determine which images are still selected (non-local with ID)
//         const currentImageIds = images
//           .filter(img => !img.isLocal && img.id)
//           .map(img => img.id);

//         console.log('[Currently selected image IDs]:', currentImageIds);

//         // Step 4: Find images to delete from database
//         const imagesToDeleteFromDB = existingImages?.filter(
//           img => !currentImageIds.includes(img.id),
//         );

//         console.log(
//           '[Images to delete from DB]:',
//           imagesToDeleteFromDB?.length || 0,
//         );

//         // Step 5: Delete removed images from database first
//         if (imagesToDeleteFromDB && imagesToDeleteFromDB.length > 0) {
//           for (const img of imagesToDeleteFromDB) {
//             console.log('[Deleting from DB]:', img.storage_path);
//             await supabase.from('product_images').delete().eq('id', img.id);
//           }
//         }

//         // Step 6: Get storage paths of images we want to KEEP
//         const imagesToKeep = images
//           .filter(img => !img.isLocal && img.storagePath)
//           .map(img => img.storagePath);

//         console.log('[Images to keep]:', imagesToKeep);

//         // Step 7: Delete all files from bucket that are NOT in imagesToKeep
//         if (bucketFiles && bucketFiles.length > 0) {
//           const filesToDelete = bucketFiles
//             .map(file => `${folderName}/${file.name}`)
//             .filter(filePath => !imagesToKeep.includes(filePath));

//           console.log('[Files to delete from bucket]:', filesToDelete);

//           if (filesToDelete.length > 0) {
//             const { error: deleteError } = await supabase.storage
//               .from('product-images')
//               .remove(filesToDelete);

//             if (deleteError) {
//               console.error('[Bucket deletion error]:', deleteError);
//             } else {
//               console.log('[Deleted files from bucket]:', filesToDelete.length);
//             }
//           }
//         }

//         // Step 8: Upload new local images
//         const localImages = images.filter(img => img.isLocal);
//         console.log('[Uploading new images]:', localImages.length);

//         for (let i = 0; i < localImages.length; i++) {
//           const img = localImages[i];
//           const uploadResult = await uploadImage(img, folderName, i);

//           if (uploadResult) {
//             await supabase.from('product_images').insert({
//               product_id: productId,
//               image_url: uploadResult.publicUrl,
//               storage_path: uploadResult.storagePath,
//               display_order: img.displayOrder || i,
//             });
//           }
//         }

//         // Step 9: Update product details
//         const { error } = await supabase
//           .from('products')
//           .update({
//             name,
//             price: parseFloat(price),
//             quantity: parseInt(quantity),
//             description,
//             image_folder: folderName,
//           })
//           .eq('id', productId);

//         if (error) {
//           console.error('[Update error]:', error);
//           return Alert.alert('Error', error.message);
//         }

//         await supabase
//           .from('product_categories')
//           .delete()
//           .eq('product_id', productId);
//       } else {
//         // CREATE NEW PRODUCT (no changes needed here)
//         const { data, error } = await supabase
//           .from('products')
//           .insert([
//             {
//               name,
//               price: parseFloat(price),
//               quantity: parseInt(quantity),
//               description,
//               created_by: adminId,
//               image_folder: null,
//             },
//           ])
//           .select()
//           .single();

//         if (error) {
//           console.error('[Insert error]:', error);
//           return Alert.alert('Error', error.message);
//         }

//         productId = data.id;
//         folderName = `${slugify(name, {
//           lower: true,
//           strict: true,
//         })}_${productId}`;

//         console.log('[Uploading images]:', images.length);

//         for (let i = 0; i < images.length; i++) {
//           const img = images[i];
//           const uploadResult = await uploadImage(img, folderName, i);

//           if (uploadResult) {
//             await supabase.from('product_images').insert({
//               product_id: productId,
//               image_url: uploadResult.publicUrl,
//               storage_path: uploadResult.storagePath,
//               display_order: i,
//             });
//           }
//         }

//         await supabase
//           .from('products')
//           .update({
//             image_folder: folderName,
//           })
//           .eq('id', productId);
//       }

//       // Insert categories
//       for (const cat of selectedCategories) {
//         await supabase
//           .from('product_categories')
//           .insert([{ product_id: productId, category_id: cat.id }]);
//       }

//       showToast(product ? 'Product updated!' : 'Product added!', '', 'success');
//       navigation.navigate('ProductsScreen', { productChanged: true });
//     } catch (error) {
//       console.error('[Save product error]:', error);
//       showToast('Something went wrong', '', 'error');
//     }
//   };

//   const handleCategoryCreate = async categoryName => {
//     if (!adminId) {
//       showToast('Admin not loaded yet', '', 'error');
//       return null;
//     }

//     console.log('[Creating new category]:', categoryName);

//     const { data, error } = await supabase
//       .from('category')
//       .insert([{ name: categoryName.trim(), created_by: adminId }])
//       .select()
//       .single();

//     if (error) {
//       console.error('[Category creation error]:', error);
//       showToast(error.message, '', 'error');
//       return null;
//     }

//     console.log('[Category created successfully]:', data);
//     showToast(`Added: ${data.name}`, '', 'success');
//     await fetchAllCategories();
//     return data;
//   };

//   const handleCategoryChange = async items => {
//     const selectedIds = items;

//     if (selectedIds.includes('create-new')) {
//       const createNewItem = categories.find(c => c.id === 'create-new');
//       if (createNewItem) {
//         const newCategory = await handleCategoryCreate(
//           createNewItem.originalName,
//         );
//         if (newCategory) {
//           const updatedIds = selectedIds
//             .filter(id => id !== 'create-new')
//             .concat(newCategory.id);

//           const newlySelected = categories
//             .filter(cat => updatedIds.includes(cat.id))
//             .concat(newCategory);

//           setSelectedCategories(newlySelected);
//         }
//       }
//     } else {
//       const newlySelected = categories.filter(cat =>
//         selectedIds.includes(cat.id),
//       );
//       setSelectedCategories(newlySelected);
//     }
//   };

//   const handleDropdownFocus = () => {
//     console.log('[Dropdown opened - resetting search]');
//     setSearchQuery('');
//     setIsSearching(false);
//     fetchAllCategories();
//     setDropdownInFocus(true);
//   };

//   const handleDropdownBlur = () => {
//     console.log('[Dropdown closed - resetting search]');
//     setSearchQuery('');
//     setIsSearching(false);
//     fetchAllCategories();
//     setDropdownInFocus(false);
//   };

//   const handleClearSearch = () => {
//     console.log('[Search cleared manually]');
//     setSearchQuery('');
//     setIsSearching(false);
//     fetchAllCategories();
//   };

//   const handleRemoveCategory = cat => {
//     const updatedCategories = selectedCategories.filter(c => c.id !== cat.id);
//     setSelectedCategories(updatedCategories);
//   };

//   const renderImageItem = ({ item, index }) => (
//     <View style={styles.imageItem}>
//       <LinearGradient
//         colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
//         style={styles.imageItemWrapper}
//       >
//         <Image
//           source={{ uri: item.preview || item.uri }}
//           style={styles.imageItemPreview}
//           resizeMode="cover"
//         />
//         <TouchableOpacity
//           style={styles.removeImageButton}
//           onPress={() => removeImage(index)}
//           activeOpacity={0.8}
//         >
//           <LinearGradient
//             colors={['#ff5c6d', '#ff4458', '#e63946']}
//             style={styles.removeImageGradient}
//           >
//             <Ionicons name="close" size={14} color="#fff" />
//           </LinearGradient>
//         </TouchableOpacity>
//         <View style={styles.imageOrderBadge}>
//           <Text style={styles.imageOrderText}>{index + 1}</Text>
//         </View>
//       </LinearGradient>
//     </View>
//   );

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <Input placeholder="Name" value={name} onChangeText={setName} />
//       <Input
//         placeholder="Price"
//         value={price}
//         onChangeText={setPrice}
//         keyboardType="numeric"
//       />
//       <Input
//         placeholder="Quantity"
//         value={quantity}
//         onChangeText={setQuantity}
//         keyboardType="numeric"
//       />
//       <Input
//         placeholder="Description"
//         value={description}
//         onChangeText={setDescription}
//       />

//       <MultiSelect
//         style={styles.dropdown}
//         containerStyle={styles.dropdownContainer}
//         placeholderStyle={styles.placeholderStyle}
//         selectedTextStyle={styles.selectedTextStyle}
//         data={categories}
//         search
//         maxHeight={250}
//         labelField="name"
//         valueField="id"
//         placeholder="Search or add category..."
//         value={selectedCategories.map(c => c.id)}
//         onChange={handleCategoryChange}
//         onFocus={handleDropdownFocus}
//         onBlur={handleDropdownBlur}
//         showsVerticalScrollIndicator={false}
//         visibleSelectedItem={false}
//         activeColor="rgba(79, 195, 247, 0.3)"
//         renderInputSearch={onSearch => (
//           <View>
//             <View style={styles.searchContainer}>
//               <TextInput
//                 style={styles.searchInput}
//                 value={searchQuery}
//                 onChangeText={text => {
//                   setSearchQuery(text);
//                   onSearch(text);
//                 }}
//                 placeholder="Type to search..."
//                 placeholderTextColor="#8a9fb5"
//                 autoCorrect={false}
//               />
//               {searchQuery.length > 0 && (
//                 <TouchableOpacity
//                   onPress={() => {
//                     handleClearSearch();
//                     onSearch('');
//                   }}
//                   style={styles.clearButton}
//                 >
//                   <Text style={styles.clearButtonText}>✕</Text>
//                 </TouchableOpacity>
//               )}
//             </View>

//             {selectedCategories.length > 0 && (
//               <View style={styles.insideChipsContainer}>
//                 {selectedCategories.map(cat => (
//                   <TouchableOpacity
//                     key={cat.id}
//                     style={styles.insideChip}
//                     onPress={() => handleRemoveCategory(cat)}
//                     activeOpacity={0.7}
//                   >
//                     <Text style={styles.insideChipText}>{cat.name}</Text>
//                     <Ionicons name="close" size={14} color="#666" />
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             )}
//           </View>
//         )}
//         renderItem={item => (
//           <View style={[styles.item, item.isCreateNew && styles.createItem]}>
//             <Text
//               style={[styles.itemText, item.isCreateNew && styles.createText]}
//             >
//               {item.name}
//             </Text>
//           </View>
//         )}
//       />

//       <CategoryChips
//         categories={selectedCategories}
//         onRemove={handleRemoveCategory}
//         variant="form"
//         containerStyle={{ marginTop: 0, marginBottom: 0 }}
//         fullChipClickable={true}
//       />

//       <FilePicker
//         fileName={
//           images.length > 0 ? `${images.length} image(s) selected` : null
//         }
//         onPick={pickImages}
//         placeholder="Upload product images (max 5)"
//       />

//       {/* Multiple Images Preview */}
//       {images.length > 0 && (
//         <View style={styles.imagesPreviewContainer}>
//           <Text style={styles.imagesSectionTitle}>
//             Product Images ({images.length})
//           </Text>
//           <FlatList
//             data={images}
//             renderItem={renderImageItem}
//             keyExtractor={(item, index) => `${item.uri}-${index}`}
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={styles.imagesList}
//           />
//         </View>
//       )}

//       <CustomButton
//         title={product ? 'Update Product' : 'Add Product'}
//         onPress={saveProduct}
//       />
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     padding: 16,
//     backgroundColor: '#353F54',
//     flex: 1,
//   },
//   dropdown: {
//     height: 50,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.2)',
//     borderRadius: 10,
//     elevation: 2,
//     paddingHorizontal: 12,
//     marginBottom: 4,
//     backgroundColor: '#2a3847',
//   },
//   dropdownContainer: {
//     borderRadius: 8,
//     backgroundColor: '#2a3847',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   placeholderStyle: {
//     fontSize: 16,
//     color: '#8a9fb5',
//   },
//   selectedTextStyle: {
//     fontSize: 16,
//     color: '#fff',
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255, 255, 255, 0.1)',
//     backgroundColor: '#2a3847',
//   },
//   searchInput: {
//     flex: 1,
//     height: 40,
//     fontSize: 16,
//     color: '#fff',
//     padding: 8,
//   },
//   clearButton: {
//     padding: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   clearButtonText: {
//     fontSize: 18,
//     color: '#4fc3f7',
//     fontWeight: 'bold',
//   },
//   insideChipsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     padding: 8,
//     backgroundColor: '#2a3847',
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   insideChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(79, 195, 247, 0.2)',
//     borderColor: '#4fc3f7',
//     borderWidth: 1,
//     borderRadius: 12,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     marginRight: 6,
//     marginBottom: 6,
//   },
//   insideChipText: {
//     fontSize: 12,
//     color: '#4fc3f7',
//     fontWeight: '500',
//     marginRight: 6,
//   },
//   item: {
//     padding: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255, 255, 255, 0.1)',
//     backgroundColor: '#2a3847',
//   },
//   itemText: {
//     fontSize: 16,
//     color: '#fff',
//   },
//   createItem: {
//     backgroundColor: 'rgba(79, 195, 247, 0.2)',
//     borderBottomWidth: 2,
//     borderBottomColor: '#4fc3f7',
//   },
//   createText: {
//     color: '#4fc3f7',
//     fontWeight: '600',
//   },
//   imagesPreviewContainer: {
//     marginBottom: 16,
//   },
//   imagesSectionTitle: {
//     fontSize: 14,
//     color: '#8a9fb5',
//     fontWeight: '600',
//     marginBottom: 12,
//   },
//   imagesList: {
//     gap: 12,
//   },
//   imageItem: {
//     marginRight: 12,
//   },
//   imageItemWrapper: {
//     borderRadius: 12,
//     padding: 4,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.2)',
//     position: 'relative',
//   },
//   imageItemPreview: {
//     width: 150,
//     height: 150,
//     borderRadius: 8,
//     backgroundColor: '#2a3847',
//   },
//   removeImageButton: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//     shadowColor: '#ff4458',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.5,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   removeImageGradient: {
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#353F54',
//   },
//   imageOrderBadge: {
//     position: 'absolute',
//     bottom: 8,
//     left: 8,
//     backgroundColor: 'rgba(79, 195, 247, 0.9)',
//     borderRadius: 12,
//     width: 24,
//     height: 24,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#353F54',
//   },
//   imageOrderText: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#fff',
//   },
// });

// src/screens/admin/AddProductsScreen.js
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
  FlatList,
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
import DraggableFlatList, {
  ScaleDecorator,
} from 'react-native-draggable-flatlist';

export default function AddProductsScreen({ navigation, route }) {
  const { showToast } = useToastify();
  const product = route.params?.product;

  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [quantity, setQuantity] = useState(product?.quantity?.toString() || '');
  const [description, setDescription] = useState(product?.description || '');
  const [images, setImages] = useState([]);
  const [adminId, setAdminId] = useState(null);
  const { user } = useAuth();

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const [dropdownInFocus, setDropdownInFocus] = useState(false);

  const [isReorderMode, setIsReorderMode] = useState(false);

  useEffect(() => {
    if (product) {
      fetchProductCategories();
      fetchProductImages();
    }
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

  const fetchProductImages = async () => {
    if (!product?.id) return;

    console.log('[Fetching product images for]:', product.id);

    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[Error fetching product images]:', error);
      return;
    }

    if (data && data.length > 0) {
      const existingImages = data.map((img, index) => ({
        id: img.id,
        uri: img.image_url,
        storagePath: img.storage_path,
        isLocal: false,
        displayOrder: img.display_order || index,
      }));
      setImages(existingImages);
      console.log('[Loaded existing images]:', existingImages.length);
    }
  };

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

  const pickImages = async () => {
    const MAX_IMAGES = 5;
    const currentCount = images.length;

    // Check if already at max
    if (currentCount >= MAX_IMAGES) {
      showToast(
        `Maximum ${MAX_IMAGES} images allowed`,
        'Remove some images first',
        'warning',
      );
      return;
    }

    // Calculate how many more images can be added
    const remainingSlots = MAX_IMAGES - currentCount;

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.7,
        includeBase64: true,
        selectionLimit: remainingSlots, // ✅ Dynamic limit
      });

      console.log('[Image picker result]:', result);

      if (result.didCancel) {
        console.log('[User cancelled image picker]');
        return;
      }

      if (result.errorCode) {
        console.error('[Image picker error]:', result.errorMessage);
        showToast('Failed to pick images', '', 'error');
        return;
      }

      if (
        !result.assets ||
        !Array.isArray(result.assets) ||
        result.assets.length === 0
      ) {
        console.log('[No assets selected]');
        return;
      }

      // Double-check limit before adding
      const imagesToAdd = result.assets.slice(0, remainingSlots);

      const newImages = imagesToAdd.map((asset, index) => ({
        uri: asset.uri,
        preview: `data:${asset.type};base64,${asset.base64}`,
        base64: asset.base64,
        name: asset.fileName || asset.uri.split('/').pop(),
        type: asset.type,
        isLocal: true,
        displayOrder: images.length + index,
      }));

      console.log('[New images to add]:', newImages.length);

      setImages(prev => [...(prev || []), ...newImages]);

      // Show info if we hit the limit
      if (images.length + newImages.length >= MAX_IMAGES) {
        showToast(`Maximum ${MAX_IMAGES} images reached`, '', 'info');
      }
    } catch (error) {
      console.error('[Pick images error]:', error);
      showToast('Error selecting images', '', 'error');
    }
  };

  const removeImage = index => {
    const updatedImages = images
      .filter((_, i) => i !== index)
      .map((img, newIndex) => ({
        ...img,
        displayOrder: newIndex,
      }));
    setImages(updatedImages);
    console.log('[Image removed - reordered remaining]');
  };

  const handleReorderImages = ({ data }) => {
    const reorderedImages = data.map((img, index) => ({
      ...img,
      displayOrder: index,
    }));
    setImages(reorderedImages);
    console.log(
      '[Images reordered]:',
      reorderedImages.map(i => i.displayOrder),
    );
  };

  const uploadImage = async (image, folderName, displayOrder) => {
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
      const fileName = `${Date.now()}_${displayOrder}_${
        image.name || 'product.jpg'
      }`;
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

  const deleteImageFromStorage = async storagePath => {
    try {
      console.log('[Deleting image from storage]:', storagePath);
      const { error } = await supabase.storage
        .from('product-images')
        .remove([storagePath]);

      if (error) {
        console.error('[Storage deletion error]:', error);
      } else {
        console.log('[Image deleted successfully]');
      }
    } catch (err) {
      console.error('[Delete image error]:', err);
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
    if (images.length === 0) {
      showToast('Select at least one image', '', 'error');
      return false;
    }
    return true;
  };

  // Find and replace the saveProduct function (starting around line 279)

  const saveProduct = async () => {
    if (!validateForm()) return;
    if (!adminId) return showToast('Admin not loaded yet', '', 'error');

    let productId;
    let folderName;

    try {
      if (product) {
        // UPDATE EXISTING PRODUCT
        productId = product.id;

        // Generate folder name from product name and ID
        folderName = `${slugify(name, {
          lower: true,
          strict: true,
        })}_${productId}`;

        console.log('[Cleaning up product images]');

        const { data: bucketFiles, error: listError } = await supabase.storage
          .from('product-images')
          .list(folderName);

        if (listError) {
          console.error('[Error listing bucket files]:', listError);
        } else {
          console.log('[Files in bucket folder]:', bucketFiles?.length || 0);
        }

        const { data: existingImages } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId);

        console.log('[Existing images in DB]:', existingImages?.length || 0);

        const currentImageIds = images
          .filter(img => !img.isLocal && img.id)
          .map(img => img.id);

        console.log('[Currently selected image IDs]:', currentImageIds);

        const imagesToDeleteFromDB = existingImages?.filter(
          img => !currentImageIds.includes(img.id),
        );

        console.log(
          '[Images to delete from DB]:',
          imagesToDeleteFromDB?.length || 0,
        );

        if (imagesToDeleteFromDB && imagesToDeleteFromDB.length > 0) {
          for (const img of imagesToDeleteFromDB) {
            console.log('[Deleting from DB]:', img.storage_path);
            await supabase.from('product_images').delete().eq('id', img.id);
          }
        }

        const imagesToKeep = images
          .filter(img => !img.isLocal && img.storagePath)
          .map(img => img.storagePath);

        console.log('[Images to keep]:', imagesToKeep);

        if (bucketFiles && bucketFiles.length > 0) {
          const filesToDelete = bucketFiles
            .map(file => `${folderName}/${file.name}`)
            .filter(filePath => !imagesToKeep.includes(filePath));

          console.log('[Files to delete from bucket]:', filesToDelete);

          if (filesToDelete.length > 0) {
            const { error: deleteError } = await supabase.storage
              .from('product-images')
              .remove(filesToDelete);

            if (deleteError) {
              console.error('[Bucket deletion error]:', deleteError);
            } else {
              console.log('[Deleted files from bucket]:', filesToDelete.length);
            }
          }
        }

        // Upload new local images with proper display_order
        const localImages = images.filter(img => img.isLocal);
        console.log('[Uploading new images]:', localImages.length);

        for (let i = 0; i < localImages.length; i++) {
          const img = localImages[i];
          const uploadResult = await uploadImage(
            img,
            folderName,
            img.displayOrder,
          );

          if (uploadResult) {
            await supabase.from('product_images').insert({
              product_id: productId,
              image_url: uploadResult.publicUrl,
              storage_path: uploadResult.storagePath,
              display_order: img.displayOrder,
            });
          }
        }

        // Update display_order for existing images
        const existingImagesToUpdate = images.filter(
          img => !img.isLocal && img.id,
        );
        for (const img of existingImagesToUpdate) {
          await supabase
            .from('product_images')
            .update({ display_order: img.displayOrder })
            .eq('id', img.id);
        }

        // ✅ FIXED: Removed image_folder from update
        const { error } = await supabase
          .from('products')
          .update({
            name,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            description,
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
        // CREATE NEW PRODUCT
        const { data, error } = await supabase
          .from('products')
          .insert([
            {
              name,
              price: parseFloat(price),
              quantity: parseInt(quantity),
              description,
              created_by: adminId,
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

        console.log('[Uploading images]:', images.length);

        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const uploadResult = await uploadImage(
            img,
            folderName,
            img.displayOrder,
          );

          if (uploadResult) {
            await supabase.from('product_images').insert({
              product_id: productId,
              image_url: uploadResult.publicUrl,
              storage_path: uploadResult.storagePath,
              display_order: img.displayOrder,
            });
          }
        }

        // ✅ FIXED: No need to update image_folder
      }

      // Insert categories
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

  // Reorder Mode Item - No X button, shows drag indicator
  // Reorder Mode Item - No X button, no hamburger icon
  const renderReorderItem = ({ item, index, drag, isActive, getIndex }) => {
    const currentIndex = getIndex();

    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          activeOpacity={1}
          style={[styles.imageItem, isActive && styles.imageItemDragging]}
        >
          <LinearGradient
            colors={
              isActive
                ? ['rgba(79, 195, 247, 0.3)', 'rgba(79, 195, 247, 0.15)']
                : ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']
            }
            style={styles.imageItemWrapper}
          >
            <Image
              source={{ uri: item.preview || item.uri }}
              style={styles.imageItemPreview}
              resizeMode="cover"
            />

            {/* Primary Image Badge */}
            {currentIndex === 0 && (
              <View style={styles.primaryBadge}>
                <Ionicons name="star" size={12} color="#fff" />
                <Text style={styles.primaryBadgeText}>Primary</Text>
              </View>
            )}

            {/* ❌ REMOVED: Drag Handle */}

            {/* Order Badge */}
            <View style={styles.imageOrderBadge}>
              <Text style={styles.imageOrderText}>
                {currentIndex !== undefined ? currentIndex + 1 : '?'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  // Normal Mode Item - Shows X button, no dragging
  const renderNormalItem = ({ item, index }) => {
    return (
      <View style={styles.imageItem}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.imageItemWrapper}
        >
          <Image
            source={{ uri: item.preview || item.uri }}
            style={styles.imageItemPreview}
            resizeMode="cover"
          />

          {/* Primary Image Badge */}
          {index === 0 && (
            <View style={styles.primaryBadge}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.primaryBadgeText}>Primary</Text>
            </View>
          )}

          {/* Remove Button - Only in normal mode */}
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => {
              console.log('[Removing image at index]:', index);
              removeImage(index);
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff5c6d', '#ff4458', '#e63946']}
              style={styles.removeImageGradient}
            >
              <Ionicons name="close" size={14} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Order Badge */}
          <View style={styles.imageOrderBadge}>
            <Text style={styles.imageOrderText}>{index + 1}</Text>
          </View>
        </LinearGradient>
      </View>
    );
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
        fileName={
          images.length > 0 ? `${images.length}/5 image(s) selected` : null
        }
        onPick={pickImages}
        placeholder={
          images.length >= 5
            ? 'Maximum 5 images selected'
            : 'Upload product images (max 5)'
        }
        disabled={images.length >= 5} // ✅ Disable when at max
      />

      {/* Multiple Images Preview with Drag-to-Reorder */}
      {images.length > 0 && (
        <View style={styles.imagesPreviewContainer}>
          <View style={styles.imagesSectionHeader}>
            <Text style={styles.imagesSectionTitle}>
              Product Images ({images.length})
            </Text>

            {/* Mode Toggle Button */}
            <TouchableOpacity
              onPress={() => setIsReorderMode(!isReorderMode)}
              style={styles.reorderToggle}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isReorderMode ? 'checkmark-circle' : 'swap-horizontal'}
                size={16}
                color="#4fc3f7"
              />
              <Text style={styles.reorderToggleText}>
                {isReorderMode ? 'Done Reordering' : 'Reorder'}
              </Text>
            </TouchableOpacity>
          </View>

          {isReorderMode ? (
            // Reorder Mode - DraggableFlatList
            <DraggableFlatList
              data={images}
              renderItem={renderReorderItem}
              keyExtractor={(item, index) => `${item.uri}-${index}`}
              onDragEnd={handleReorderImages}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagesList}
            />
          ) : (
            // Normal Mode - Regular FlatList with X button
            <FlatList
              data={images}
              renderItem={renderNormalItem}
              keyExtractor={(item, index) => `${item.uri}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagesList}
            />
          )}
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
  imagesPreviewContainer: {
    marginBottom: 16,
  },
  imagesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imagesSectionTitle: {
    fontSize: 14,
    color: '#8a9fb5',
    fontWeight: '600',
  },
  imagesSectionHint: {
    fontSize: 12,
    color: '#4fc3f7',
    fontWeight: '500',
  },
  imagesList: {
    gap: 12,
  },
  imageItem: {
    marginRight: 12,
    position: 'relative', // ✅ Add this
  },
  reorderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4fc3f7',
  },
  reorderToggleText: {
    fontSize: 12,
    color: '#4fc3f7',
    fontWeight: '600',
  },

  imageItemDragging: {
    opacity: 0.7,
    transform: [{ scale: 1.05 }],
  },
  imageItemWrapper: {
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  imageItemPreview: {
    width: 150,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#2a3847',
  },
  primaryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    borderWidth: 2,
    borderColor: '#353F54',
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  dragHandle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 4,
    opacity: 0.8,
  },
  // ✅ NEW STYLE: Absolute positioned remove button
  removeImageButtonAbsolute: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 100, // Very high to be on top
    shadowColor: '#ff4458',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 15, // Higher elevation for Android
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
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#353F54',
  },
  imageOrderBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(79, 195, 247, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#353F54',
  },
  imageOrderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
