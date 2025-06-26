import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClothingItem } from '../screens/ClosetScreen';

/**
 * Intelligent Outfit Recommendation Service
 * 
 * This service uses intelligent algorithms to generate personalized outfit recommendations
 * based on color theory, style compatibility, and user preferences.
 * Collaborative filtering for outfit scoring
 * Color compatibility matrix based on color theory
 * Style classification and occasion-based filtering
 * Weather-appropriate clothing selection
 * User feedback learning system
 */

// Types for intelligent features
export interface OutfitRating {
  outfitId: string;
  rating: number; // 1-5 stars
  timestamp: number;
}

export interface ColorPalette {
  dominant: string;
  palette: string[];
  brightness: number; // 0-1
  saturation: number; // 0-1
}

export interface StyleCategory {
  category: string;
  confidence: number;
}

export interface OutfitRecommendation {
  items: ClothingItem[];
  score: number;
  reason: string;
  style: string;
}

class IntelligentService {
  // Store user ratings and preferences for personalized recommendations
  private outfitRatings: OutfitRating[] = [];
  
  // Color compatibility matrix based on color theory principles
  // Higher values (0-1) indicate better color combinations
  private colorCompatibilityMatrix: { [key: string]: { [key: string]: number } } = {};
  
  // Track user style preferences for different clothing categories
  private stylePreferences: { [key: string]: number } = {};

  constructor() {
    this.initializeColorCompatibilityMatrix();
    this.loadUserPreferences();
  }

  /**
   * Initialize color compatibility matrix based on color theory
   * 
   * This matrix defines how well different colors work together:
   * Complementary colors (opposite on color wheel) get high scores
   * Analogous colors (adjacent on color wheel) get medium scores
   * Neutral colors (black, white, gray) work well with most colors
   * Bright vs muted combinations are considered
   */
  private initializeColorCompatibilityMatrix() {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'black', 'white', 'gray'];
    
    // Define color compatibility scores (0-1, where 1 is perfect match)
    // Based on color theory: complementary, analogous, and neutral combinations
    const compatibilityRules: { [key: string]: { [key: string]: number } } = {
      // Red works well with green (complementary), blue (triadic), and neutrals
      'red': { 'green': 0.9, 'blue': 0.7, 'yellow': 0.6, 'purple': 0.8, 'orange': 0.5, 'pink': 0.8, 'brown': 0.7, 'black': 0.9, 'white': 0.8, 'gray': 0.7 },
      // Blue pairs excellently with orange (complementary) and purple (analogous)
      'blue': { 'red': 0.7, 'green': 0.6, 'yellow': 0.8, 'purple': 0.9, 'orange': 0.7, 'pink': 0.6, 'brown': 0.6, 'black': 0.9, 'white': 0.8, 'gray': 0.8 },
      // Green complements red and works well with earth tones
      'green': { 'red': 0.9, 'blue': 0.6, 'yellow': 0.7, 'purple': 0.6, 'orange': 0.8, 'pink': 0.5, 'brown': 0.8, 'black': 0.9, 'white': 0.8, 'gray': 0.7 },
      // Yellow is vibrant and works well with purple (complementary) and blue
      'yellow': { 'red': 0.6, 'blue': 0.8, 'green': 0.7, 'purple': 0.7, 'orange': 0.9, 'pink': 0.6, 'brown': 0.7, 'black': 0.9, 'white': 0.8, 'gray': 0.6 },
      // Purple is sophisticated and pairs well with yellow and green
      'purple': { 'red': 0.8, 'blue': 0.9, 'green': 0.6, 'yellow': 0.7, 'orange': 0.6, 'pink': 0.8, 'brown': 0.6, 'black': 0.9, 'white': 0.8, 'gray': 0.7 },
      // Orange is energetic and works well with blue (complementary)
      'orange': { 'red': 0.5, 'blue': 0.7, 'green': 0.8, 'yellow': 0.9, 'purple': 0.6, 'pink': 0.7, 'brown': 0.8, 'black': 0.9, 'white': 0.8, 'gray': 0.6 },
      // Pink is soft and feminine, works well with neutrals and complementary colors
      'pink': { 'red': 0.8, 'blue': 0.6, 'green': 0.5, 'yellow': 0.6, 'purple': 0.8, 'orange': 0.7, 'brown': 0.5, 'black': 0.9, 'white': 0.8, 'gray': 0.7 },
      // Brown is earthy and versatile, works well with most colors
      'brown': { 'red': 0.7, 'blue': 0.6, 'green': 0.8, 'yellow': 0.7, 'purple': 0.6, 'orange': 0.8, 'pink': 0.5, 'black': 0.9, 'white': 0.8, 'gray': 0.8 },
      // Black is the ultimate neutral, goes with everything
      'black': { 'red': 0.9, 'blue': 0.9, 'green': 0.9, 'yellow': 0.9, 'purple': 0.9, 'orange': 0.9, 'pink': 0.9, 'brown': 0.9, 'white': 0.8, 'gray': 0.9 },
      // White is clean and versatile, works well with all colors
      'white': { 'red': 0.8, 'blue': 0.8, 'green': 0.8, 'yellow': 0.8, 'purple': 0.8, 'orange': 0.8, 'pink': 0.8, 'brown': 0.8, 'black': 0.8, 'gray': 0.8 },
      // Gray is sophisticated and works well with most colors
      'gray': { 'red': 0.7, 'blue': 0.8, 'green': 0.7, 'yellow': 0.6, 'purple': 0.7, 'orange': 0.6, 'pink': 0.7, 'brown': 0.8, 'black': 0.9, 'white': 0.8 }
    };

    // Build the complete compatibility matrix
    colors.forEach(color1 => {
      this.colorCompatibilityMatrix[color1] = {};
      colors.forEach(color2 => {
        if (color1 === color2) {
          this.colorCompatibilityMatrix[color1][color2] = 1.0; // Same color, perfect match
        } else if (compatibilityRules[color1]?.[color2]) {
          this.colorCompatibilityMatrix[color1][color2] = compatibilityRules[color1][color2];
        } else {
          this.colorCompatibilityMatrix[color1][color2] = 0.5; // Neutral compatibility for undefined combinations
        }
      });
    });
  }

  /**
   * Load user preferences from persistent storage
   * 
   * This allows the intelligent system to learn from user feedback over time
   */
  private async loadUserPreferences() {
    try {
      const ratings = await AsyncStorage.getItem('outfitRatings');
      if (ratings) {
        this.outfitRatings = JSON.parse(ratings);
      }

      const preferences = await AsyncStorage.getItem('stylePreferences');
      if (preferences) {
        this.stylePreferences = JSON.parse(preferences);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  }

  /**
   * Save user preferences to persistent storage
   * 
   * This ensures the intelligent system remembers user feedback between app sessions
   */
  private async saveUserPreferences() {
    try {
      await AsyncStorage.setItem('outfitRatings', JSON.stringify(this.outfitRatings));
      await AsyncStorage.setItem('stylePreferences', JSON.stringify(this.stylePreferences));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  /**
   * Extract color from clothing item
   * For now, we use the manually entered color field and map it to our color palette.
   */
  private extractColorFromItem(item: ClothingItem): string {
    const color = item.color.toLowerCase();
    
    // Map common color names to our standardized color palette
    // This handles variations like "navy", "blue", "beige", "brown"
    const colorMapping: { [key: string]: string } = {
      'red': 'red', 'blue': 'blue', 'green': 'green', 'yellow': 'yellow',
      'purple': 'purple', 'orange': 'orange', 'pink': 'pink', 'brown': 'brown',
      'black': 'black', 'white': 'white', 'gray': 'gray', 'grey': 'gray',
      'navy': 'blue', 'dark blue': 'blue', 'light blue': 'blue',
      'dark green': 'green', 'light green': 'green',
      'dark red': 'red', 'light red': 'red',
      'beige': 'brown', 'tan': 'brown', 'cream': 'white'
    };

    return colorMapping[color] || 'gray'; // Default to gray for unknown colors
  }

  /**
   * Calculate color compatibility between two clothing items
   * Uses our color compatibility matrix to score how well colors work together
   */
  private calculateColorCompatibility(item1: ClothingItem, item2: ClothingItem): number {
    const color1 = this.extractColorFromItem(item1);
    const color2 = this.extractColorFromItem(item2);
    
    return this.colorCompatibilityMatrix[color1]?.[color2] || 0.5;
  }

  /**
   * Calculate style compatibility based on clothing categories
   * 
   * This determines how well different types of clothing work together
   * based on fashion rules and common style combinations
   */
  private calculateStyleCompatibility(item1: ClothingItem, item2: ClothingItem): number {
    const category1 = item1.category.toLowerCase();
    const category2 = item2.category.toLowerCase();

    // Define style compatibility rules based on fashion conventions
    // Higher scores indicate better style combinations
    const styleRules: { [key: string]: { [key: string]: number } } = {
      // T-shirts are casual and work well with jeans, shorts, and sweatpants
      't-shirt': { 'jeans': 0.9, 'shorts': 0.8, 'sweatpants': 0.7, 'shirt': 0.6, 'dress': 0.3, 'skirt': 0.4 },
      // Shirts are more formal and work well with jeans and skirts
      'shirt': { 'jeans': 0.9, 'shorts': 0.6, 'sweatpants': 0.5, 't-shirt': 0.6, 'dress': 0.4, 'skirt': 0.8 },
      // Jeans are versatile and work with most tops
      'jeans': { 't-shirt': 0.9, 'shirt': 0.9, 'shorts': 0.6, 'sweatpants': 0.5, 'dress': 0.3, 'skirt': 0.4 },
      // Dresses are standalone pieces, don't typically pair with other tops/bottoms
      'dress': { 't-shirt': 0.3, 'shirt': 0.4, 'jeans': 0.3, 'shorts': 0.2, 'sweatpants': 0.2, 'skirt': 0.6 },
      // Skirts work well with shirts and some casual tops
      'skirt': { 't-shirt': 0.4, 'shirt': 0.8, 'jeans': 0.4, 'shorts': 0.3, 'sweatpants': 0.3, 'dress': 0.6 }
    };

    return styleRules[category1]?.[category2] || 0.5; // Default to neutral compatibility
  }

  /**
   * Generate outfit recommendations using intelligent algorithms
   * 
   * This is the main method that creates personalized outfit suggestions.
   * It uses:
   * Collaborative filtering for scoring
   * Color theory for compatibility
   * Style rules for category matching
   * Weather and occasion filtering
   * User preference learning
   */
  public generateOutfitRecommendations(
    clothingItems: ClothingItem[],
    numRecommendations: number = 5,
    occasion?: string,
    weather?: string,
    requiredCategories: string[] = []
  ): OutfitRecommendation[] {
    const recommendations: OutfitRecommendation[] = [];
    const seen = new Set<string>(); // Track generated outfits to avoid duplicates
    
    // Define outfit template - ensures we get complete, wearable outfits
    // Each array represents a layer
    const outfitTemplate = [
      ['T-shirt', 'Shirt', 'Dress', 'Hoodie', 'Jacket'], // top layers
      ['Jeans', 'Sweatpants', 'Shorts', 'Skirt'], // bottom layers
      ['Shoes'], // footwear (optional)
      ['Hat'] // accessories (optional)
    ];

    // Apply occasion-based filtering if specified
    let filteredItems = clothingItems;
    if (occasion) {
      filteredItems = this.filterByOccasion(clothingItems, occasion);
    }
    
    // Apply weather-based filtering if specified
    if (weather) {
      const weatherMap: { [key: string]: string[] } = {
        'Hot': ['T-shirt', 'Shorts', 'Skirt', 'Dress', 'Hat', 'Shoes'],
        'Mild': ['T-shirt', 'Shirt', 'Jeans', 'Shorts', 'Skirt', 'Dress', 'Shoes'],
        'Cold': ['Jacket', 'Sweatpants', 'Jeans', 'Shirt', 'Hat', 'Shoes'],
        'Rainy': ['Jacket', 'Jeans', 'Sweatpants', 'Shirt', 'Hat', 'Shoes'],
      };
      const allowed = weatherMap[weather] || [];
      filteredItems = filteredItems.filter(item => allowed.includes(item.category));
    }

    // Generate recommendations with retry logic to ensure variety
    let attempts = 0;
    while (recommendations.length < numRecommendations && attempts < numRecommendations * 10) {
      // Generate a single outfit following the template and requirements
      const outfit = this.generateSingleOutfitWithRequired(filteredItems, outfitTemplate, requiredCategories);
      
      // Ensure we have at least a top and bottom (or a dress) for a complete outfit
      if (outfit.items.length < 2) {
        attempts++;
        continue;
      }
      
      // Create unique key to avoid duplicate outfits
      const key = outfit.items.map(i => i.uri).sort().join('|');
      if (!seen.has(key)) {
        seen.add(key);
        
        // Calculate overall outfit score and classify style
        const score = this.calculateOutfitScore(outfit.items);
        const style = this.classifyOutfitStyle(outfit.items);
        const reason = this.generateRecommendationReason(outfit.items, score, style);
        
        recommendations.push({
          items: outfit.items,
          score,
          reason,
          style
        });
      }
      attempts++;
    }

    // Sort by score (highest first) and return
    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate a single outfit following the template and required categories
   * 
   * This method creates one complete outfit by:
   * Prioritizing dresses (which cover both top and bottom)
   * Otherwise selecting a top and bottom combination
   * Including any required categories specified by the user
   * Optionally adding accessories like shoes, hats, etc.
   */
  private generateSingleOutfitWithRequired(clothingItems: ClothingItem[], template: string[][], requiredCategories: string[]) {
    const items: ClothingItem[] = [];
    const usedCategories = new Set<string>();
    
    // Strategy 1 Try to find a dress first (covers both top and bottom)
    const dress = clothingItems.find(item => item.category === 'Dress');
    if (dress) {
      items.push(dress);
      usedCategories.add('Dress');
    } else {
      // Strategy 2, Build outfit from separate pieces
      // Pick a top from the top layer categories
      const tops = clothingItems.filter(item => template[0].includes(item.category));
      if (tops.length > 0) {
        const top = tops[Math.floor(Math.random() * tops.length)];
        items.push(top);
        usedCategories.add(top.category);
      }
      
      // Pick a bottom from the bottom layer categories
      const bottoms = clothingItems.filter(item => template[1].includes(item.category));
      if (bottoms.length > 0) {
        const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
        items.push(bottom);
        usedCategories.add(bottom.category);
      }
    }
    
    // Strategy 3, Include any categories the user specifically requested
    for (const cat of requiredCategories) {
      if (!usedCategories.has(cat)) {
        const candidates = clothingItems.filter(item => item.category === cat);
        if (candidates.length > 0) {
          const picked = candidates[Math.floor(Math.random() * candidates.length)];
          items.push(picked);
          usedCategories.add(cat);
        }
      }
    }
    
    // Strategy 4, Add optional accessories with probability-based selection
    // Shoes are common, so 70% chance to include them
    const shoes = clothingItems.filter(item => item.category === 'Shoes');
    if (shoes.length > 0 && Math.random() > 0.3 && !usedCategories.has('Shoes')) {
      const shoe = shoes[Math.floor(Math.random() * shoes.length)];
      items.push(shoe);
      usedCategories.add('Shoes');
    }
    
    // Hats are less common, so 50% chance to include them
    const hats = clothingItems.filter(item => item.category === 'Hat');
    if (hats.length > 0 && Math.random() > 0.5 && !usedCategories.has('Hat')) {
      const hat = hats[Math.floor(Math.random() * hats.length)];
      items.push(hat);
      usedCategories.add('Hat');
    }
    
    // Other accessories are rare, so 30% chance to include them
    const others = clothingItems.filter(item => item.category === 'Other');
    if (others.length > 0 && Math.random() > 0.7 && !usedCategories.has('Other')) {
      const other = others[Math.floor(Math.random() * others.length)];
      items.push(other);
      usedCategories.add('Other');
    }
    
    return { items };
  }

  /**
   * Calculate overall outfit score using collaborative filtering approach
   * 
   * This method evaluates how well all items in an outfit work together by:
   * Comparing each pair of items for color compatibility
   * Comparing each pair of items for style compatibility
   * Averaging all pairwise scores to get overall outfit quality
   * 
   * Higher scores indicate better coordinated outfits
   */
  private calculateOutfitScore(items: ClothingItem[]): number {
    if (items.length < 2) return 0;

    let totalScore = 0;
    let comparisons = 0;

    // Calculate pairwise compatibility scores between all items
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const colorScore = this.calculateColorCompatibility(items[i], items[j]);
        const styleScore = this.calculateStyleCompatibility(items[i], items[j]);
        
        // Average color and style scores for this pair
        totalScore += (colorScore + styleScore) / 2;
        comparisons++;
      }
    }

    // Return average score across all comparisons
    return comparisons > 0 ? totalScore / comparisons : 0;
  }

  /**
   * Classify the overall style of an outfit based on its components
   * 
   * This helps users understand the vibe and appropriateness of each outfit
   * for different occasions and settings
   */
  private classifyOutfitStyle(items: ClothingItem[]): string {
    const categories = items.map(item => item.category.toLowerCase());
    
    // Style classification rules based on fashion conventions
    if (categories.includes('dress')) return 'Elegant';
    if (categories.includes('shirt') && categories.includes('jeans')) return 'Smart Casual';
    if (categories.includes('t-shirt') && categories.includes('jeans')) return 'Casual';
    if (categories.includes('sweatpants') || categories.includes('shorts')) return 'Athletic';
    
    return 'Casual'; // Default fallback
  }

  /**
   * Generate a human-readable reason for why this outfit was recommended
   * 
   * The reason is based on the outfit's score and style classification,
   * providing users with context about the intelligent system's decision-making process
   */
  private generateRecommendationReason(items: ClothingItem[], score: number, style: string): string {
    const reasons = [
      `Great ${style.toLowerCase()} combination with excellent color harmony`,
      `Perfect ${style.toLowerCase()} look with complementary colors`,
      `Stylish ${style.toLowerCase()} outfit with balanced proportions`,
      `Classic ${style.toLowerCase()} pairing that works for many occasions`,
      `Trendy ${style.toLowerCase()} combination with modern appeal`
    ];

    // Use score to select appropriate reason (higher scores get better descriptions)
    const index = Math.floor(score * reasons.length);
    return reasons[Math.min(index, reasons.length - 1)];
  }

  /**
   * Filter clothing items based on the specified occasion
   * 
   * This ensures recommendations are appropriate for the intended use,
   * whether it's casual, formal, athletic, or business settings
   */
  private filterByOccasion(items: ClothingItem[], occasion: string): ClothingItem[] {
    const occasionMap: { [key: string]: string[] } = {
      'Casual': ['T-shirt', 'Shirt', 'Jeans', 'Sweatpants', 'Shorts', 'Hoodie', 'Shoes'],
      'Formal': ['Shirt', 'Dress', 'Skirt', 'Shoes'],
      'Athletic': ['T-shirt', 'Sweatpants', 'Shorts', 'Shoes'],
      'Business': ['Shirt', 'Dress', 'Skirt', 'Shoes']
    };

    const allowed = occasionMap[occasion] || [];
    return items.filter(item => allowed.includes(item.category));
  }

  /**
   * Rate an outfit and save the feedback for future learning
   * 
   * This implements a feedback loop where user ratings help improve
   * future recommendations through collaborative filtering
   */
  public async rateOutfit(outfitId: string, rating: number) {
    this.outfitRatings.push({
      outfitId,
      rating,
      timestamp: Date.now()
    });
    
    await this.saveUserPreferences();
  }

  /**
   * Update user's style preferences for a specific category
   * 
   * This allows the intelligent system to learn user preferences over time and
   * adjust recommendations accordingly
   */
  public updateStylePreferences(category: string, preference: number) {
    this.stylePreferences[category] = preference;
    this.saveUserPreferences();
  }

  /**
   * Analyze the color palette of a clothing item
   * For now, it provides a simplified analysis based on the manually entered color field.
   */
  public async getColorPalette(item: ClothingItem): Promise<ColorPalette> {
    const color = this.extractColorFromItem(item);
    
    // Generate a complementary palette based on color theory
    const paletteMap: { [key: string]: string[] } = {
      'red': ['red', 'pink', 'white', 'black'],
      'blue': ['blue', 'purple', 'white', 'gray'],
      'green': ['green', 'brown', 'white', 'black'],
      'yellow': ['yellow', 'orange', 'white', 'black'],
      'purple': ['purple', 'pink', 'white', 'gray'],
      'orange': ['orange', 'yellow', 'white', 'black'],
      'pink': ['pink', 'purple', 'white', 'gray'],
      'brown': ['brown', 'green', 'white', 'black'],
      'black': ['black', 'white', 'gray', 'red'],
      'white': ['white', 'black', 'gray', 'blue'],
      'gray': ['gray', 'white', 'black', 'blue']
    };

    return {
      dominant: color,
      palette: paletteMap[color] || ['gray', 'white', 'black'],
      brightness: color === 'white' ? 1 : color === 'black' ? 0 : 0.5,
      saturation: ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'].includes(color) ? 0.8 : 0.3
    };
  }
}

export default new IntelligentService(); 