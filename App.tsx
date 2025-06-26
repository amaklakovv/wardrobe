import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ClosetScreen from './src/screens/ClosetScreen';
import OutfitCreatorScreen from './src/screens/OutfitCreatorScreen';
import AIRecommendationsScreen from './src/screens/AIRecommendationsScreen';
import type { ClothingItem } from './src/screens/ClosetScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Smart Closet - Digital Wardrobe Management
 * 
 * This React Native application helps users manage their wardrobe and get
 * intelligent outfit recommendations. The app features:
 * 
 * Core Features:
 * Digital wardrobe management with photo uploads
 * Manual outfit creation with visual preview
 * Outfit recommendations using intelligent algorithms
 * Persistent storage of wardrobe and outfit data
 * Responsive design for mobile and web platforms
 * 
 * Technical Features:
 * React Navigation for screen management
 * AsyncStorage for data persistence
 * TypeScript for type safety
 * Responsive design with platform-specific adaptations
 * 
 * Navigation Structure:
 * Closet: Main wardrobe management screen
 * OutfitCreator: Manual outfit building interface
 * AIRecommendations: Intelligent suggestion system
 */

const Stack = createStackNavigator();

/**
 * Main App Component
 * 
 * This is the root component that:
 * Sets up navigation between screens
 * Manages global wardrobe state
 * Handles data persistence
 * Provides wardrobe data to all child screens
 */
export default function App() {
  // Global wardrobe state - shared across all screens
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);

  /**
   * Load clothing items from persistent storage on app startup
   * 
   * This effect runs once when the app mounts to restore the user's
   * wardrobe from AsyncStorage, ensuring data persists between sessions
   */
  useEffect(() => {
    const loadClothing = async () => {
      try {
        const saved = await AsyncStorage.getItem('closetItems');
        if (saved) {
          setClothingItems(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading closet items:', error);
      }
    };
    loadClothing();
  }, []);

  /**
   * Save clothing items to persistent storage whenever they change
   * 
   * This effect automatically saves the wardrobe whenever items are
   * added, edited, or deleted, ensuring no data is lost
   */
  useEffect(() => {
    const saveClothing = async () => {
      try {
        await AsyncStorage.setItem('closetItems', JSON.stringify(clothingItems));
      } catch (error) {
        console.error('Error saving closet items:', error);
      }
    };
    saveClothing();
  }, [clothingItems]);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Main wardrobe management screen - entry point */}
        <Stack.Screen name="Closet">
          {props => <ClosetScreen {...props} clothingItems={clothingItems} setClothingItems={setClothingItems} />}
        </Stack.Screen>
        
        {/* Manual outfit creation interface */}
        <Stack.Screen name="OutfitCreator">
          {props => <OutfitCreatorScreen {...props} clothingItems={clothingItems} />}
        </Stack.Screen>
        
        {/* Intelligent recommendation system */}
        <Stack.Screen name="AIRecommendations">
          {props => <AIRecommendationsScreen {...props} clothingItems={clothingItems} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}