import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Platform, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Outfit Creator Screen
 * 
 * This screen allows users to create custom outfits by:
 * Selecting clothing items from different categories
 * Building outfits piece by piece with visual preview
 * Saving completed outfits with custom names
 * Managing a library of saved outfits
 * Viewing and deleting previously created outfits
 * 
 * The interface features a split-panel design with controls on the left
 * and a live preview on the right, adapting responsively to different screen sizes.
 */

// Available clothing categories for outfit building
const CATEGORY_OPTIONS = [
  'T-shirt', 'Shirt', 'Jeans', 'Sweatpants', 'Shorts',
  'Jacket', 'Dress', 'Skirt', 'Shoes', 'Hat', 'Other'
];
const MAX_SECTIONS = 4; // Maximum number of clothing sections per outfit

type Section = {
  category: string;
  index: number;
};

type ClothingItem = {
  uri: string;
  category: string;
  color: string;
};

type Props = {
  clothingItems: ClothingItem[];
};

/**
 * Reusable action button component with consistent styling
 * Used throughout the app for primary actions like save, edit, delete
 */
const ActionButton = ({ title, onPress, style, textStyle, disabled }: any) => (
  <TouchableOpacity 
    onPress={() => {
      console.log('ActionButton pressed:', title);
      onPress();
    }} 
    disabled={disabled}
    style={[styles.actionButton, style, disabled && styles.disabledButton]}
  >
    <Text style={[styles.actionButtonText, textStyle]}>{title}</Text>
  </TouchableOpacity>
);

/**
 * Section control component for managing outfit categories
 * 
 * Each section represents a clothing category (top, bottom, shoes, etc)
 * Users can change the category or remove the section entirely
 */
const SectionControl = ({ section, index, onCategoryChange, onRemove, canRemove }: any) => (
  <View style={styles.sectionControl}>
    <Picker
      selectedValue={section.category}
      onValueChange={(cat) => onCategoryChange(index, cat)}
      style={styles.categoryPicker}
    >
      {CATEGORY_OPTIONS.map(option => (
        <Picker.Item key={option} label={option} value={option} />
      ))}
    </Picker>
    <ActionButton
      title="Remove"
      onPress={() => onRemove(index)}
      disabled={!canRemove}
      style={styles.removeButton}
      textStyle={styles.smallButtonText}
    />
  </View>
);

/**
 * Individual outfit section component
 * 
 * Displays a clothing item with navigation arrows to cycle through
 * available items in that category. Shows a placeholder if no items exist.
 */
const OutfitSection = ({ section, items, onPrevious, onNext }: any) => {
  const currentIndex = Math.min(section.index, items.length - 1);
  
  return (
    <View style={styles.outfitSection}>
      <ActionButton title="◀" onPress={onPrevious} style={styles.arrowButton} textStyle={styles.arrowText} />
      
      {items.length > 0 ? (
        <Image source={{ uri: items[currentIndex].uri }} style={styles.outfitImage} resizeMode="contain" />
      ) : (
        <View style={styles.placeholder}>
          <Text>No items</Text>
        </View>
      )}
      
      <ActionButton title="▶" onPress={onNext} style={styles.arrowButton} textStyle={styles.arrowText} />
    </View>
  );
};

/**
 * Modal for naming and saving outfits
 * 
 * Allows users to give their created outfits custom names
 * before saving them to their personal outfit library
 */
const SaveOutfitModal = ({ visible, onClose, onSave, outfitName, setOutfitName }: any) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Name Your Outfit</Text>
        <TextInput
          placeholder="Outfit Name"
          value={outfitName}
          onChangeText={setOutfitName}
          style={styles.textInput}
        />
        <View style={styles.modalButtons}>
          <ActionButton title="Save" onPress={onSave} style={styles.saveButton} />
          <ActionButton title="Cancel" onPress={onClose} style={styles.cancelButton} />
        </View>
      </View>
    </View>
  </Modal>
);

/**
 * Modal for viewing saved outfits
 * 
 * Displays all items in a saved outfit with their categories
 * and images for easy reference
 */
const ViewOutfitModal = ({ visible, onClose, outfit }: any) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.viewModalContent}>
        <Text style={styles.viewModalTitle}>{outfit?.name}</Text>
        <ScrollView>
          {outfit?.items.map((item: any, idx: number) => (
            <View key={idx} style={styles.viewItemContainer}>
              <Text style={styles.viewItemCategory}>{item.category}</Text>
              {item.item ? (
                <Image
                  source={{ uri: item.item.uri }}
                  style={styles.viewItemImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.viewItemPlaceholder}>
                  <Text style={styles.viewItemPlaceholderText}>No item</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
        <ActionButton title="Close" onPress={onClose} style={styles.closeButton} />
      </View>
    </View>
  </Modal>
);

/**
 * Saved outfit card component
 * 
 * Displays a saved outfit in the sidebar with its name,
 * included categories, and action buttons for viewing/deleting
 */
const SavedOutfitCard = ({ outfit, index, onView, onDelete }: any) => {
  console.log('Rendering SavedOutfitCard for outfit:', outfit.name, 'at index:', index);
  
  return (
    <View style={styles.savedOutfitCard}>
      <Text style={styles.outfitName}>{outfit.name}</Text>
      <Text style={styles.outfitCategories}>
        {outfit.items.map((i: any) => i.category).join(', ')}
      </Text>
      <View style={styles.outfitCardButtons}>
        <TouchableOpacity 
          onPress={() => onView(outfit)}
          style={[styles.actionButton, styles.viewButton]}
        >
          <Text style={[styles.actionButtonText, styles.smallButtonText]}>View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => onDelete(index)}
          style={[styles.actionButton, styles.deleteButton]}
        >
          <Text style={[styles.actionButtonText, styles.smallButtonText]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Main Outfit Creator Screen Component
 * 
 * This is the primary interface for creating custom outfits. It features:
 * Split-panel design with controls and preview
 * Responsive layout that adapts to mobile and desktop
 * Dynamic section management for outfit building
 * Persistent storage of saved outfits
 * Visual outfit preview with item cycling
 */
const OutfitCreatorScreen = ({ clothingItems }: Props) => {
  // Outfit building state - tracks sections and their selected items
  const [sections, setSections] = useState<Section[]>([
    { category: 'T-shirt', index: 0 },
    { category: 'Jeans', index: 0 },
    { category: 'Shoes', index: 0 },
  ]);
  
  // Saved outfits management
  const [savedOutfits, setSavedOutfits] = useState<{ name: string; items: { category: string; item: ClothingItem | null }[] }[]>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [outfitName, setOutfitName] = useState('');
  const [viewOutfitModalVisible, setViewOutfitModalVisible] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<{ name: string; items: { category: string; item: ClothingItem | null }[] } | null>(null);

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

  /**
   * Load saved outfits from persistent storage
   * 
   * Retrieves the user's previously saved outfits when the component mounts
   */
  useEffect(() => {
    loadSavedOutfits();
  }, []);

  /**
   * Load saved outfits from AsyncStorage
   * 
   * This ensures the user's outfit library persists between app sessions
   */
  const loadSavedOutfits = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedOutfits');
      if (saved) {
        setSavedOutfits(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved outfits:', error);
    }
  };

  /**
   * Save outfits to persistent storage
   * 
   * Updates the stored outfit library whenever outfits are added or removed
   */
  const saveOutfitsToStorage = async (outfits: typeof savedOutfits) => {
    try {
      await AsyncStorage.setItem('savedOutfits', JSON.stringify(outfits));
    } catch (error) {
      console.error('Error saving outfits:', error);
    }
  };

  /**
   * Add a new section to the outfit
   * 
   * Allows users to build more complex outfits by adding additional
   * clothing categories (accessories, layers, etc)
   */
  const addSection = () => {
    if (sections.length < MAX_SECTIONS) {
      setSections([...sections, { category: CATEGORY_OPTIONS[0], index: 0 }]);
    }
  };

  /**
   * Remove a section from the outfit
   * 
   * Users can remove unwanted sections, but at least one section
   * must remain to maintain a valid outfit structure
   */
  const removeSection = (idx: number) => {
    if (sections.length > 1) {
      setSections(sections.filter((_, i) => i !== idx));
    }
  };

  /**
   * Update the category of a section
   * 
   * Changes what type of clothing item a section represents
   * and resets the item index to 0 for the new category
   */
  const updateSectionCategory = (idx: number, category: string) => {
    const newSections = [...sections];
    newSections[idx] = { category, index: 0 };
    setSections(newSections);
  };

  /**
   * Navigate through items in a section
   * 
   * Cycles through available clothing items in the specified category
   * with wraparound navigation (last item to first item)
   */
  const updateSectionIndex = (idx: number, direction: number) => {
    const items = clothingItems.filter(item => item.category === sections[idx].category);
    if (items.length === 0) return;
    
    const newSections = [...sections];
    const currentIndex = Math.min(sections[idx].index, items.length - 1);
    newSections[idx].index = (currentIndex + direction + items.length) % items.length;
    setSections(newSections);
  };

  /**
   * Save the current outfit to the user's library
   * 
   * Validates that an outfit name is provided, then:
   * Collects all selected items from each section
   * Creates a new outfit object with the name and items
   * Adds it to the saved outfits list
   * Persists the updated library to storage
   */
  const handleSaveOutfit = async () => {
    if (!outfitName.trim()) {
      Alert.alert('Please enter a name for your outfit.');
      return;
    }
    
    // Build outfit from current section selections
    const items = sections.map(section => {
      const itemsForCat = clothingItems.filter(item => item.category === section.category);
      const currentIndex = Math.min(section.index, itemsForCat.length - 1);
      return {
        category: section.category,
        item: itemsForCat.length > 0 ? itemsForCat[currentIndex] : null,
      };
    });
    
    const newOutfits = [...savedOutfits, { name: outfitName, items }];
    setSavedOutfits(newOutfits);
    await saveOutfitsToStorage(newOutfits);
    setSaveModalVisible(false);
    setOutfitName('');
  };

  /**
   * Delete a saved outfit from the library
   * 
   * Removes the outfit at the specified index and updates
   * both the state and persistent storage
   */
  const handleDeleteOutfit = async (index: number) => {
    console.log('Deleting outfit at index:', index);
    Alert.alert('Test', `Deleting outfit at index: ${index}`); // Temporary test
    const newOutfits = savedOutfits.filter((_, i) => i !== index);
    setSavedOutfits(newOutfits);
    await saveOutfitsToStorage(newOutfits);
  };

  /**
   * View a saved outfit in detail
   * 
   * Opens the view modal to display all items in the selected outfit
   */
  const handleViewOutfit = (outfit: typeof savedOutfits[0]) => {
    setSelectedOutfit(outfit);
    setViewOutfitModalVisible(true);
  };

  return (
    <View
      style={[
        styles.container,
        {
          flexDirection: isMobile ? 'column' : 'row',
          height: windowHeight,
          width: windowWidth,
        },
      ]}
    >
      {/* Controls Panel - Left side on desktop, top on mobile */}
      <ScrollView
        style={[
          styles.controlsPanel,
          isMobile
            ? { width: '100%', maxWidth: '100%', borderRightWidth: 0, borderBottomWidth: 1, borderBottomLeftRadius: 0, borderTopRightRadius: 24, borderBottomRightRadius: 0, borderTopLeftRadius: 24, height: windowHeight * 0.35, maxHeight: windowHeight * 0.5 }
            : { width: '25%', minWidth: 120, maxWidth: 200, borderRightWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 24, borderBottomLeftRadius: 24, borderTopRightRadius: 0, borderBottomRightRadius: 0, height: windowHeight },
        ]}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.controlsTitle}>Sections</Text>
        
        {/* Dynamic outfit sections */}
        {sections.map((section, idx) => (
          <SectionControl
            key={idx}
            section={section}
            index={idx}
            onCategoryChange={updateSectionCategory}
            onRemove={removeSection}
            canRemove={sections.length > 1}
          />
        ))}
        
        {/* Add section button */}
        <ActionButton
          title="Add Section"
          onPress={addSection}
          disabled={sections.length >= MAX_SECTIONS}
          style={styles.addSectionButton}
        />

        {/* Save outfit button */}
        <ActionButton
          title="Save Outfit"
          onPress={() => setSaveModalVisible(true)}
          style={styles.saveOutfitButton}
        />

        {/* Saved outfits library */}
        {savedOutfits.length > 0 && (
          <View style={styles.savedOutfitsContainer}>
            <Text style={styles.savedOutfitsTitle}>Saved Outfits</Text>
            {savedOutfits.map((outfit, idx) => (
              <SavedOutfitCard
                key={outfit.name}
                outfit={outfit}
                index={idx}
                onView={handleViewOutfit}
                onDelete={handleDeleteOutfit}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Preview Panel. Right side on desktop, bottom on mobile */}
      <View
        style={[
          styles.previewPanel,
          isMobile
            ? { width: '100%', borderTopRightRadius: 0, borderBottomLeftRadius: 0, borderTopLeftRadius: 0, borderBottomRightRadius: 24, flex: 1 }
            : { flex: 1, borderTopRightRadius: 24, borderBottomRightRadius: 24 },
        ]}
      >
        <Text style={styles.previewTitle}>Outfit Preview</Text>
        <ScrollView
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Display each outfit section with navigation */}
          {sections.map((section, idx) => {
            const items = clothingItems.filter(item => item.category === section.category);
            return (
              <OutfitSection
                key={idx}
                section={section}
                items={items}
                onPrevious={() => updateSectionIndex(idx, -1)}
                onNext={() => updateSectionIndex(idx, 1)}
              />
            );
          })}
        </ScrollView>
      </View>

      {/* Modals */}
      <SaveOutfitModal
        visible={saveModalVisible}
        onClose={() => setSaveModalVisible(false)}
        onSave={handleSaveOutfit}
        outfitName={outfitName}
        setOutfitName={setOutfitName}
      />

      <ViewOutfitModal
        visible={viewOutfitModalVisible}
        onClose={() => setViewOutfitModalVisible(false)}
        outfit={selectedOutfit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F7F7F7',
  },
  controlsPanel: {
    width: '25%',
    minWidth: 120,
    maxWidth: 200,
    padding: 18,
    backgroundColor: '#F2F2F2',
    borderRightWidth: 1,
    borderColor: '#E0E0E0',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    paddingBottom: 40,
  },
  controlsTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 16,
    color: '#222',
    letterSpacing: 1,
  },
  sectionControl: {
    marginBottom: 18,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  categoryPicker: {
    width: '100%',
    height: 38,
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    marginBottom: 6,
  },
  removeButton: {
    marginTop: 8,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    borderRadius: 8,
  },
  addSectionButton: {
    backgroundColor: '#E0E0E0',
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 18,
    alignItems: 'center',
  },
  saveOutfitButton: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 12,
    marginBottom: 18,
    alignItems: 'center',
  },
  previewPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 16,
    backgroundColor: '#F7F7F7',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  previewTitle: {
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 28,
    color: '#222',
    letterSpacing: 1,
  },
  outfitSection: {
    marginBottom: 28,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  arrowButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  arrowText: {
    fontSize: 28,
    color: '#222',
    fontWeight: '700',
  },
  outfitImage: {
    width: 120,
    height: 160,
    borderRadius: 14,
    backgroundColor: '#F7F7F7',
    marginHorizontal: 14,
  },
  placeholder: {
    width: 120,
    height: 160,
    borderRadius: 14,
    backgroundColor: '#F2F2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 14,
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
  viewModalContent: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 24,
    width: 360,
    maxHeight: 520,
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
  viewModalTitle: {
    fontSize: 18,
    marginBottom: 14,
    fontWeight: '700',
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
  textInputFocused: {
    borderColor: '#A3BFFF',
    shadowColor: '#A3BFFF',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
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
  closeButton: {
    backgroundColor: '#E0E0E0',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  viewItemContainer: {
    marginBottom: 18,
    alignItems: 'center',
  },
  viewItemCategory: {
    fontSize: 15,
    marginBottom: 7,
    color: '#222',
  },
  viewItemImage: {
    width: 100,
    height: 130,
    borderRadius: 10,
    backgroundColor: '#F7F7F7',
  },
  viewItemPlaceholder: {
    width: 100,
    height: 130,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewItemPlaceholderText: {
    fontSize: 13,
    color: '#999',
  },
  savedOutfitsContainer: {
    marginTop: 14,
  },
  savedOutfitsTitle: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 10,
    color: '#222',
    letterSpacing: 1,
  },
  savedOutfitCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  outfitName: {
    fontWeight: '700',
    fontSize: 13,
    color: '#222',
    marginBottom: 2,
  },
  outfitCategories: {
    fontSize: 11,
    color: '#555',
    marginBottom: 8,
  },
  outfitCardButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    backgroundColor: '#E0E0E0',
    marginRight: 0,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  smallButtonText: {
    fontSize: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonTextDark: {
    color: '#222',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default OutfitCreatorScreen;
