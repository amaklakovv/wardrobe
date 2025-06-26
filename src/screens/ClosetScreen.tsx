import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, Image, FlatList, Dimensions, Modal, TextInput, TouchableOpacity, Platform, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Closet Management Screen
 * 
 * This is the main wardrobe management interface where users can:
 * Add new clothing items with photos and metadata
 * Edit existing items (change category, color, or image)
 * Delete items from their wardrobe
 * Navigate to outfit creation and intelligent recommendations
 * View their entire clothing collection in a responsive grid
 * 
 * The screen features responsive design that adapts to different screen sizes
 * and provides an intuitive interface for managing a digital wardrobe.
 */

export type ClothingItem = {
  uri: string;
  category: string;
  color: string;
};

// Available clothing categories for organization
const CATEGORY_OPTIONS = [
  'T-shirt',
  'Shirt',
  'Jeans',
  'Sweatpants',
  'Shorts',
  'Jacket',
  'Hoodie',
  'Dress',
  'Skirt',
  'Shoes',
  'Hat',
  'Other'
];

type ClosetScreenProps = {
  navigation: any;
  clothingItems: ClothingItem[];
  setClothingItems: React.Dispatch<React.SetStateAction<ClothingItem[]>>;
};

/**
 * Reusable button component with consistent styling
 * Used throughout the app for primary actions like save, edit, delete
 */
const ActionButton = ({ title, onPress, style, textStyle }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.actionButton, style]}>
    <Text style={[styles.actionButtonText, textStyle]}>{title}</Text>
  </TouchableOpacity>
);

/**
 * Individual clothing item card component
 * Displays the item image, category, color, and action buttons
 * Used in the grid layout to show each piece of clothing
 */
const ClothingItemCard = ({ item, index, onEdit, onDelete }: any) => (
  <View style={styles.itemContainerCarousel}>
    <View style={styles.itemContent}>
      <Image source={{ uri: item.uri }} style={styles.itemImageCarousel} resizeMode="contain" />
      <Text style={styles.itemText}>{item.category} - {item.color}</Text>
      <View style={styles.buttonRow}>
        <ActionButton title="Edit" onPress={() => onEdit(item, index)} style={styles.editButton} textStyle={styles.smallButtonText} />
        <ActionButton title="Delete" onPress={() => onDelete(index)} style={styles.deleteButton} textStyle={styles.smallButtonText} />
      </View>
    </View>
  </View>
);

/**
 * Modal for adding or editing clothing items
 * 
 * This modal handles both creating new items and editing existing ones.
 * It includes:
 * Category selection via dropdown
 * Color input field
 * Image preview
 * Option to change image for existing items
 * Save/cancel actions
 */
const AddClothingModal = ({ visible, onClose, onSave, newImageUri, setNewImageUri, category, setCategory, color, setColor, editingIndex }: any) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Add Clothing Details</Text>
        
        <Text style={styles.inputLabel}>Category</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={category} onValueChange={setCategory} style={styles.picker}>
            <Picker.Item label="Select a category..." value="" />
            {CATEGORY_OPTIONS.map(option => (
              <Picker.Item key={option} label={option} value={option} />
            ))}
          </Picker>
        </View>
        
        <TextInput
          placeholder="Clothing Colour"
          value={color}
          onChangeText={setColor}
          style={styles.textInput}
        />
        
        {/* Show "Change Image" button only when editing existing items */}
        {editingIndex !== null && (
          <ActionButton
            title="Change Image"
            onPress={async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                setNewImageUri(result.assets[0].uri);
              }
            }}
            style={[styles.saveButton, styles.changeImageButton]}
          />
        )}
        
        {/* Show image preview if an image is selected */}
        {newImageUri && (
          <Image
            source={{ uri: newImageUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        )}
        
        <View style={styles.modalButtons}>
          <ActionButton title="Save" onPress={onSave} style={styles.saveButton} textStyle={styles.saveButtonText} />
          <ActionButton title="Cancel" onPress={onClose} style={styles.cancelButton} />
        </View>
      </View>
    </View>
  </Modal>
);

/**
 * Main Closet Screen Component
 * 
 * This is the primary interface for wardrobe management. It features:
 * Responsive design that adapts to mobile and desktop
 * Grid layout for clothing items
 * Navigation to other app features
 * Persistent storage of wardrobe data
 */
const ClosetScreen = ({ navigation, clothingItems, setClothingItems }: ClosetScreenProps) => {
  // Modal state management
  const [modalVisible, setModalVisible] = useState(false);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Responsive design state - track window dimensions for layout adaptation
  const [windowWidth, setWindowWidth] = useState(
    Platform.OS === 'web' ? window.innerWidth : Dimensions.get('window').width
  );
  const [windowHeight, setWindowHeight] = useState(
    Platform.OS === 'web' ? window.innerHeight : Dimensions.get('window').height
  );

  /**
   * Set up responsive design listeners
   * 
   * This effect handles window resize events on web and dimension changes
   * on mobile devices to ensure the layout adapts properly
   */
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
        setWindowHeight(window.innerHeight);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } else {
      const handleChange = ({ window }: { window: any }) => {
        setWindowWidth(window.width);
        setWindowHeight(window.height);
      };
      const sub = Dimensions.addEventListener('change', handleChange);
      return () => {
        if (sub && typeof sub.remove === 'function') sub.remove();
      };
    }
  }, []);

  // Responsive layout logic. Switch between mobile and desktop layouts
  const isMobile = windowWidth < 700;
  const listContainerStyle = isMobile
    ? { width: windowWidth, paddingHorizontal: 0 }
    : { width: windowWidth, maxWidth: 900, alignSelf: 'center' as const, paddingHorizontal: 0 };

  /**
   * Save wardrobe data to persistent storage
   * 
   * This ensures the user's clothing collection persists between app sessions
   */
  const saveClosetToStorage = async (items: ClothingItem[]) => {
    try {
      await AsyncStorage.setItem('closetItems', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving closet:', error);
    }
  };

  /**
   * Handle adding new clothing items
   * 
   * This function:
   * Requests camera roll permissions
   * Opens the image picker
   * Shows the add/edit modal with the selected image
   */
  const handleAddClothing = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permissions are required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewImageUri(result.assets[0].uri);
      setModalVisible(true);
    }
  };

  /**
   * Save clothing item (either new or edited)
   * 
   * Validates that all required fields are filled, then either:
   * Adds a new item to the wardrobe, or
   * Updates an existing item if editing
   */
  const handleSaveItem = async () => {
    if (newImageUri && category && color) {
      let newItems: ClothingItem[];
      if (editingIndex !== null) {
        // Edit existing item. Replace the item at the specified index
        newItems = [...clothingItems];
        newItems[editingIndex] = { uri: newImageUri, category, color };
      } else {
        // Add new item. Append to the end of the array
        newItems = [...clothingItems, { uri: newImageUri, category, color }];
      }
      setClothingItems(newItems);
      await saveClosetToStorage(newItems);
      resetModal();
    } else {
      Alert.alert('Please fill all fields');
    }
  };

  /**
   * Delete a clothing item from the wardrobe
   * 
   * Removes the item at the specified index and updates both
   * the state and persistent storage
   */
  const handleDeleteItem = async (index: number) => {
    const newItems = clothingItems.filter((_, i) => i !== index);
    setClothingItems(newItems);
    await saveClosetToStorage(newItems);
  };

  /**
   * Edit an existing clothing item
   * 
   * Populates the modal with the item's current data
   * and sets the editing index for proper save behavior
   */
  const handleEditItem = (item: ClothingItem, index: number) => {
    setNewImageUri(item.uri);
    setCategory(item.category);
    setColor(item.color);
    setEditingIndex(index);
    setModalVisible(true);
  };

  /**
   * Reset modal state to initial values
   * 
   * Called after saving or canceling to prepare for the next use
   */
  const resetModal = () => {
    setModalVisible(false);
    setNewImageUri(null);
    setCategory('');
    setColor('');
    setEditingIndex(null);
  };

  return (
    <View style={[styles.container, { flex: 1, width: '100%', minHeight: 0 }]}> 
      {/* Main content area with responsive centering */}
      <View style={{ flex: 1, minHeight: 0, width: isMobile ? '100%' : undefined, maxWidth: isMobile ? '100%' : 900, alignSelf: 'center', display: 'flex', alignItems: 'center' }}>
        <Text style={[styles.title, { alignSelf: 'center' }]}>Welcome to your Closet!</Text>
        
        {/* Navigation buttons. Responsive layout */}
        <View style={[styles.buttonContainer, isMobile ? { flexDirection: 'column', gap: 12, alignItems: 'center', width: '100%' } : { flexDirection: 'row', gap: 12, alignItems: 'center', alignSelf: 'center' }]}> 
          <ActionButton
            title="Add Clothing Item"
            onPress={handleAddClothing}
            style={styles.primaryButton}
            textStyle={styles.primaryButtonText}
          />
          <ActionButton
            title="Create Outfit"
            onPress={() => navigation.navigate('OutfitCreator')}
            style={styles.primaryButton}
            textStyle={styles.primaryButtonText}
          />
          <ActionButton
            title="Recommendations"
            onPress={() => navigation.navigate('AIRecommendations')}
            style={styles.primaryButton}
            textStyle={styles.primaryButtonText}
          />
        </View>
        
        {/* Add/Edit Clothing Modal */}
        <AddClothingModal
          visible={modalVisible}
          onClose={resetModal}
          onSave={handleSaveItem}
          newImageUri={newImageUri}
          setNewImageUri={setNewImageUri}
          category={category}
          setCategory={setCategory}
          color={color}
          setColor={setColor}
          editingIndex={editingIndex}
        />
        
        {/* Clothing Items Grid */}
        <View style={{ flex: 1, minHeight: 0, width: '100%' }}>
          <ScrollView
            contentContainerStyle={{
              flexDirection: 'column',
              alignItems: 'center',
              paddingBottom: 40,
              paddingTop: 10,
              width: '100%',
            }}
            style={{ flex: 1, width: '100%' }}
            showsVerticalScrollIndicator={true}
          >
            {(() => {
              // Group clothing items into rows of two for responsive grid layout
              const rows = [];
              for (let i = 0; i < clothingItems.length; i += 2) {
                rows.push(clothingItems.slice(i, i + 2));
              }
              
              return rows.map((row, rowIndex) => (
                <View key={rowIndex} style={{ flexDirection: 'row', width: '100%', justifyContent: isMobile ? 'center' : 'flex-start', marginBottom: 8 }}>
                  {row.map((item, colIndex) => (
                    <View
                      key={colIndex}
                      style={[
                        styles.listItemCard,
                        {
                          flex: 1,
                          marginHorizontal: 8,
                          maxWidth: isMobile ? windowWidth / 2 - 24 : 400,
                        },
                      ]}
                    >
                      <Image source={{ uri: item.uri }} style={styles.listItemImage} resizeMode="contain" />
                      <View style={styles.listItemInfo}>
                        <Text style={styles.listItemText}>{item.category} - {item.color}</Text>
                        <View style={styles.buttonRow}>
                          <ActionButton title="Edit" onPress={() => handleEditItem(item, rowIndex * 2 + colIndex)} style={styles.editButton} textStyle={styles.smallButtonText} />
                          <ActionButton title="Delete" onPress={() => handleDeleteItem(rowIndex * 2 + colIndex)} style={styles.deleteButton} textStyle={styles.smallButtonText} />
                        </View>
                      </View>
                    </View>
                  ))}
                  {/* Fill empty space in last row if odd number of items */}
                  {row.length === 1 && <View style={{ flex: 1, marginHorizontal: 8, maxWidth: isMobile ? windowWidth / 2 - 24 : 400 }} />}
                </View>
              ));
            })()}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 18,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: '700',
    color: '#222',
    letterSpacing: 1,
  },
  buttonContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    gap: 12,
  },
  listContainer: {
    marginTop: 20,
    paddingBottom: 40,
    paddingRight: 10,
  },
  columnContainer: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  itemContainerCarousel: {
    width: 110,
    height: 180,
    margin: 12,
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    padding: 10,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  itemContent: {
    alignItems: 'center',
  },
  itemImageCarousel: {
    width: 90,
    height: 130,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#222',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  actionButtonText: {
    color: '#222',
    fontSize: 13,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#E0E0E0',
  },
  deleteButton: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  smallButtonText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 24,
    width: 340,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 14,
    fontWeight: '700',
    color: '#222',
  },
  inputLabel: {
    marginBottom: 5,
    color: '#222',
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#F7F7F7',
  },
  picker: {
    height: 40,
    width: '100%',
    color: '#222',
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 18,
    backgroundColor: '#F7F7F7',
    color: '#222',
    fontSize: 15,
  },
  changeImageButton: {
    marginBottom: 10,
    backgroundColor: '#E0E0E0',
  },
  previewImage: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#222',
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
    padding: 12,
    borderRadius: 10,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    flex: 1,
    alignItems: 'center',
    marginLeft: 8,
    padding: 12,
    borderRadius: 10,
  },
  primaryButton: {
    backgroundColor: '#222',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginHorizontal: 4,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  listItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    minHeight: 100,
    maxWidth: 600,
  },
  listItemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginRight: 18,
  },
  listItemInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  listItemText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
    marginBottom: 10,
  },
});

export default ClosetScreen;