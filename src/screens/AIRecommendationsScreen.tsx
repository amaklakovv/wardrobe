import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal, Alert, Platform, Dimensions, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import IntelligentService, { OutfitRecommendation } from '../services/AIService';
import { ClothingItem } from './ClosetScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Intelligent Recommendations Screen
 * 
 * This screen showcases the app's intelligent outfit recommendation system.
 * Users can:
 * Get personalized outfit suggestions based on their wardrobe
 * Filter recommendations by occasion and weather
 * Provide feedback on recommendations (like/dislike)
 * Save recommended outfits to their library
 * View wardrobe insights and analytics
 * Select required clothing categories for recommendations
 * 
 * Uses intelligent algorithms including collaborative filtering,
 * color theory, and style compatibility to generate suggestions.
 */

type Props = {
  clothingItems: ClothingItem[];
  navigation: any;
};

// Filter options for personalized recommendations
const OCCASION_OPTIONS = ['All', 'Casual', 'Formal', 'Athletic', 'Business'];
const WEATHER_OPTIONS = ['Any', 'Hot', 'Mild', 'Cold', 'Rainy'];

// Available clothing categories for requirement selection
const CATEGORY_OPTIONS = [
  'T-shirt', 'Shirt', 'Jeans', 'Sweatpants', 'Shorts',
  'Jacket', 'Hoodie', 'Dress', 'Skirt', 'Shoes', 'Hat', 'Other'
];

/**
 * Individual recommendation card component
 * 
 * Displays a complete outfit recommendation with:
 * Confidence score with color-coded badge
 * Style classification tag
 * Visual grid of clothing items
 * Generated reasoning
 * Action buttons for saving and feedback
 */
const RecommendationCard = ({ recommendation, onSave, onLike, onDislike, feedback }: any) => {
  /**
   * Get color for score badge based on confidence level
   * Green is high confidence (80%+)
   * Orange is medium confidence (60-79%)
   * Red is low confidence (<60%)
   */
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#4CAF50';
    if (score >= 0.6) return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={styles.recommendationCard}>
      <View style={styles.cardHeader}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Score</Text>
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(recommendation.score) }]}>
            <Text style={styles.scoreText}>{Math.round(recommendation.score * 100)}%</Text>
          </View>
        </View>
        <View style={styles.styleTag}>
          <Text style={styles.styleTagText}>{recommendation.style}</Text>
        </View>
      </View>

      {/* Visual outfit grid showing all items */}
      <View style={styles.outfitGrid}>
        {recommendation.items.map((item: ClothingItem, index: number) => (
          <View key={index} style={styles.outfitItem}>
            <Image source={{ uri: item.uri }} style={styles.outfitImage} resizeMode="contain" />
            <Text style={styles.itemLabel}>{item.category}</Text>
            <Text style={styles.colorLabel}>{item.color}</Text>
          </View>
        ))}
      </View>

      {/* Generated explanation for the recommendation */}
      <Text style={styles.reasonText}>{recommendation.reason}</Text>

      {/* Action buttons for user interaction */}
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={() => onSave(recommendation)}
        >
          <Text style={styles.saveButtonText}>Save Outfit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.likeButton, feedback === 'like' && styles.liked]}
          onPress={() => onLike(recommendation)}
        >
          <Text style={styles.likeText}>👍</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dislikeButton, feedback === 'dislike' && styles.disliked]}
          onPress={() => onDislike(recommendation)}
        >
          <Text style={styles.dislikeText}>👎</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Insights Panel Component
 * 
 * Provides users with analytics about their wardrobe including:
 * Total number of items
 * Most common categories and colors
 * Wardrobe diversity metrics
 * Generated improvement suggestions
 * 
 * This helps users understand their style preferences and get
 * recommendations for building a more versatile wardrobe.
 */
const InsightsPanel = ({ clothingItems }: { clothingItems: ClothingItem[] }) => {
  const [insights, setInsights] = useState<any>(null);

  /**
   * Generate wardrobe insights when clothing items change
   */
  useEffect(() => {
    generateInsights();
  }, [clothingItems]);

  /**
   * Analyze wardrobe data to generate insights
   * 
   * This function processes the user's clothing collection to:
   * Count items by category and color
   * Identify most common items
   * Calculate wardrobe diversity
   * Generate personalized recommendations
   */
  const generateInsights = () => {
    const categoryCounts: { [key: string]: number } = {};
    const colorCounts: { [key: string]: number } = {};

    // Count items by category and color
    clothingItems.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      colorCounts[item.color] = (colorCounts[item.color] || 0) + 1;
    });

    // Find most common category and color
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
    const topColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0];

    setInsights({
      totalItems: clothingItems.length,
      topCategory: topCategory ? `${topCategory[0]} (${topCategory[1]})` : 'None',
      topColor: topColor ? `${topColor[0]} (${topColor[1]})` : 'None',
      diversity: Object.keys(categoryCounts).length,
      recommendations: generateRecommendations(categoryCounts, colorCounts)
    });
  };

  /**
   * Generate personalized wardrobe recommendations
   * 
   * Based on the analysis of the user's wardrobe, suggests improvements
   * to create a more balanced and versatile clothing collection
   */
  const generateRecommendations = (categories: any, colors: any) => {
    const recs = [];
    
    // Suggest adding more variety if wardrobe is limited
    if (Object.keys(categories).length < 5) {
      recs.push('Consider adding more variety to your wardrobe');
    }
    
    // Suggest more colors for versatility
    if (Object.keys(colors).length < 4) {
      recs.push('Try incorporating more colors for versatile outfits');
    }
    
    // Encourage more items for better recommendations
    if (clothingItems.length < 10) {
      recs.push('Add more items to get better recommendations');
    }
    
    return recs.length > 0 ? recs : ['Your wardrobe looks well-balanced!'];
  };

  if (!insights) return null;

  return (
    <View style={styles.insightsPanel}>
      <Text style={styles.insightsTitle}>Wardrobe Insights</Text>
      
      {/* Wardrobe statistics */}
      <View style={styles.insightRow}>
        <Text style={styles.insightLabel}>Total Items:</Text>
        <Text style={styles.insightValue}>{insights.totalItems}</Text>
      </View>
      
      <View style={styles.insightRow}>
        <Text style={styles.insightLabel}>Top Category:</Text>
        <Text style={styles.insightValue}>{insights.topCategory}</Text>
      </View>
      
      <View style={styles.insightRow}>
        <Text style={styles.insightLabel}>Top Color:</Text>
        <Text style={styles.insightValue}>{insights.topColor}</Text>
      </View>
      
      <View style={styles.insightRow}>
        <Text style={styles.insightLabel}>Categories:</Text>
        <Text style={styles.insightValue}>{insights.diversity}</Text>
      </View>

      {/* Recommendations for wardrobe improvement */}
      <Text style={styles.recommendationsTitle}>Recommendations:</Text>
      {insights.recommendations.map((rec: string, index: number) => (
        <Text key={index} style={styles.recommendationText}>• {rec}</Text>
      ))}
    </View>
  );
};

/**
 * Reusable action button component with consistent styling
 * Used throughout the app for primary actions like save, edit, delete
 */
const ActionButton = ({ title, onPress, style, textStyle, disabled }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    disabled={disabled}
    style={[styles.actionButton, style, disabled && styles.disabledButton]}
  >
    <Text style={[styles.actionButtonText, textStyle]}>{title}</Text>
  </TouchableOpacity>
);

/**
 * Modal for naming and saving recommended outfits
 * 
 * Allows users to give custom names to outfits they want to save
 * from the recommendations, integrating them into their personal library
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
 * Main Intelligent Recommendations Screen Component
 * 
 * This is the primary interface for intelligent outfit suggestions. It features:
 * Intelligent outfit recommendations based on wardrobe analysis
 * Filtering by occasion and weather conditions
 * User feedback system for continuous learning
 * Wardrobe insights and analytics
 * Responsive design for mobile and desktop
 * Integration with the outfit saving system
 */
const AIRecommendationsScreen = ({ clothingItems, navigation }: Props) => {
  // Intelligent recommendation state
  const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>([]);
  const [selectedOccasion, setSelectedOccasion] = useState('All');
  const [selectedWeather, setSelectedWeather] = useState('Any');
  const [isLoading, setIsLoading] = useState(false);
  
  // Outfit saving state
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [outfitName, setOutfitName] = useState('');
  const [outfitToSave, setOutfitToSave] = useState<OutfitRecommendation | null>(null);
  
  // User feedback state. Tracks like/dislike for each outfit
  const [feedbackMap, setFeedbackMap] = useState<{ [key: string]: 'like' | 'dislike' }>({});
  
  // Required categories state. Allows users to specify must-have items
  const [requiredCategories, setRequiredCategories] = useState<string[]>([]);

  // Responsive design setup
  const isWeb = Platform.OS === 'web';
  const windowHeight = isWeb ? window.innerHeight : Dimensions.get('window').height;
  const windowWidth = isWeb ? window.innerWidth : Dimensions.get('window').width;

  /**
   * Generate new recommendations when filters or wardrobe changes
   * 
   * This effect triggers intelligent recommendation generation whenever:
   * The user's wardrobe changes
   * Filter selections are modified
   * Required categories are updated
   */
  useEffect(() => {
    generateRecommendations();
  }, [clothingItems, selectedOccasion, selectedWeather]);

  /**
   * Load user feedback from persistent storage
   * 
   * Retrieves previously saved like/dislike feedback to maintain
   * user preferences across app sessions
   */
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('outfitFeedback');
      if (saved) {
        const raw = JSON.parse(saved);
        const casted: { [key: string]: 'like' | 'dislike' } = {};
        Object.keys(raw).forEach(k => {
          if (raw[k] === 'like' || raw[k] === 'dislike') casted[k] = raw[k];
        });
        setFeedbackMap(casted);
      }
    })();
  }, []);

  /**
   * Toggle required category selection
   * 
   * Allows users to specify which clothing categories must be included
   * in their intelligent recommendations (e.g., must include shoes, must include a jacket)
   */
  const toggleCategory = (cat: string) => {
    setRequiredCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  /**
   * Generate intelligent outfit recommendations
   * 
   * This is the main function that triggers the intelligent service to create
   * personalized outfit suggestions based on current filters and requirements
   */
  const generateRecommendations = () => {
    if (clothingItems.length < 2) return;
    
    setIsLoading(true);
    
    // Simulate intelligent processing time for better UX
    setTimeout(() => {
      const occasion = selectedOccasion === 'All' ? undefined : selectedOccasion;
      const weather = selectedWeather === 'Any' ? undefined : selectedWeather;
      const newRecommendations = IntelligentService.generateOutfitRecommendations(
        clothingItems, 
        6, 
        occasion,
        weather,
        requiredCategories
      );
      setRecommendations(newRecommendations);
      setIsLoading(false);
    }, 1000);
  };

  /**
   * Handle saving an intelligent-recommended outfit
   * 
   * Opens the save modal to allow users to name and save
   * outfits they like from the intelligent recommendations
   */
  const handleSaveOutfit = (recommendation: OutfitRecommendation) => {
    setOutfitToSave(recommendation);
    setSaveModalVisible(true);
  };

  /**
   * Complete the outfit saving process
   * 
   * Validates the outfit name and saves the outfit to the user's
   * personal library, integrating it with the rest of the app
   */
  const handleModalSave = async () => {
    if (!outfitName.trim() || !outfitToSave) {
      Alert.alert('Please enter a name for your outfit.');
      return;
    }
    // Convert intelligent recommendation format to outfit library format
    const items = outfitToSave.items.map(item => ({ category: item.category, item }));
    await saveOutfitsToStorage({ name: outfitName, items });
    setSaveModalVisible(false);
    setOutfitName('');
    setOutfitToSave(null);
    Alert.alert('Outfit saved!');
  };

  /**
   * Handle user like feedback on a recommendation
   * 
   * Saves positive feedback to help improve future recommendations
   * through the intelligent learning system
   */
  const handleLike = async (recommendation: OutfitRecommendation) => {
    const key = recommendation.items.map(i => i.uri).sort().join('|');
    const updated = { ...feedbackMap, [key]: 'like' as 'like' };
    setFeedbackMap(updated);
    await AsyncStorage.setItem('outfitFeedback', JSON.stringify(updated));
  };

  /**
   * Handle user dislike feedback on a recommendation
   * 
   * Saves negative feedback to help avoid similar recommendations
   * in the future through the intelligent learning system
   */
  const handleDislike = async (recommendation: OutfitRecommendation) => {
    const key = recommendation.items.map(i => i.uri).sort().join('|');
    const updated = { ...feedbackMap, [key]: 'dislike' as 'dislike' };
    setFeedbackMap(updated);
    await AsyncStorage.setItem('outfitFeedback', JSON.stringify(updated));
  };

  /**
   * Save outfit to persistent storage
   * 
   * Helper function to integrate intelligent-recommended outfits into
   * the user's saved outfit library
   */
  const saveOutfitsToStorage = async (newOutfit: { name: string; items: { category: string; item: ClothingItem | null }[] }) => {
    try {
      const saved = await AsyncStorage.getItem('savedOutfits');
      const savedOutfits = saved ? JSON.parse(saved) : [];
      const updated = [...savedOutfits, newOutfit];
      await AsyncStorage.setItem('savedOutfits', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving outfits:', error);
    }
  };

  // Show empty state if not enough items for recommendations
  if (clothingItems.length < 2) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Need More Items</Text>
        <Text style={styles.emptyText}>
          Add at least 2 clothing items to your closet to get intelligent outfit recommendations.
        </Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('Closet')}
        >
          <Text style={styles.addButtonText}>Add Items</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={
        isWeb
          ? { height: windowHeight, width: windowWidth, backgroundColor: '#F7F7F7' }
          : { flex: 1, backgroundColor: '#F7F7F7' }
      }
    >
      <View style={styles.container}>
        {/* Header section with title and description */}
        <View style={styles.header}>
          <Text style={styles.title}>Intelligent Outfit Recommendations</Text>
          <Text style={styles.subtitle}>
            Powered by intelligent algorithms
          </Text>
        </View>

        {/* Required categories selection */}
        <View style={{ padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
          <Text style={{ fontWeight: '700', fontSize: 15, marginBottom: 8, color: '#222' }}>Must include:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {CATEGORY_OPTIONS.map(cat => {
              const checked = requiredCategories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 }}
                  onPress={() => toggleCategory(cat)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                >
                  <View style={{
                    width: 20,
                    height: 20,
                    borderWidth: 2,
                    borderColor: checked ? '#222' : '#aaa',
                    backgroundColor: checked ? '#222' : '#fff',
                    borderRadius: 4,
                    marginRight: 4,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {checked && <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>✓</Text>}
                  </View>
                  <Text style={{ marginLeft: 2 }}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
            (A top and bottom, or a dress, will always be included)
          </Text>
        </View>

        {/* Filter controls for occasion and weather */}
        <View style={styles.controls}>
          <View style={styles.occasionPicker}>
            <Text style={styles.pickerLabel}>Occasion:</Text>
            <Picker
              selectedValue={selectedOccasion}
              onValueChange={setSelectedOccasion}
              style={styles.picker}
            >
              {OCCASION_OPTIONS.map(option => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>
          <View style={styles.occasionPicker}>
            <Text style={styles.pickerLabel}>Weather:</Text>
            <Picker
              selectedValue={selectedWeather}
              onValueChange={setSelectedWeather}
              style={styles.picker}
            >
              {WEATHER_OPTIONS.map(option => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={generateRecommendations}
            disabled={isLoading}
          >
            <Text style={styles.refreshButtonText}>
              {isLoading ? 'Generating...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main content area with insights and recommendations */}
        <ScrollView style={styles.scrollContainer}>
          {/* Wardrobe Insights Panel */}
          <InsightsPanel clothingItems={clothingItems} />
          
          <Text style={styles.recommendationsTitle}>Recommended Outfits</Text>
          
          {/* Loading state or recommendations list */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Analyzing your wardrobe...</Text>
            </View>
          ) : (
            recommendations.map((recommendation, index) => {
              const key = recommendation.items.map(i => i.uri).sort().join('|');
              return (
                <RecommendationCard
                  key={index}
                  recommendation={recommendation}
                  onSave={handleSaveOutfit}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  feedback={feedbackMap[key]}
                />
              );
            })
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
      
      {/* Save Outfit Modal */}
      <SaveOutfitModal
        visible={saveModalVisible}
        onClose={() => setSaveModalVisible(false)}
        onSave={handleModalSave}
        outfitName={outfitName}
        setOutfitName={setOutfitName}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    padding: 20,
    backgroundColor: '#222',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#ccc',
  },
  controls: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  occasionPicker: {
    flex: 1,
    marginRight: 15,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 5,
  },
  picker: {
    height: 40,
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
  },
  refreshButton: {
    backgroundColor: '#222',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  insightsPanel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 15,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  insightLabel: {
    fontSize: 14,
    color: '#666',
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 15,
    marginLeft: 20,
    marginTop: 10,
  },
  recommendationText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    marginTop: 0,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  styleTag: {
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  styleTagText: {
    color: '#3730a3',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  outfitGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  outfitItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  outfitImage: {
    width: 80,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },
  colorLabel: {
    fontSize: 11,
    color: '#666',
  },
  reasonText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#222',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    minWidth: 280,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  starButton: {
    marginHorizontal: 8,
  },
  star: {
    fontSize: 32,
    color: '#E0E0E0',
  },
  starFilled: {
    color: '#FFD700',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F7F7F7',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  addButton: {
    backgroundColor: '#222',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 20,
  },
  textInput: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  likeButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#e0ffe0',
  },
  dislikeButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ffe0e0',
  },
  liked: {
    backgroundColor: '#a7f3d0',
  },
  disliked: {
    backgroundColor: '#fecaca',
  },
  likeText: {
    fontSize: 18,
  },
  dislikeText: {
    fontSize: 18,
  },
});

export default AIRecommendationsScreen; 