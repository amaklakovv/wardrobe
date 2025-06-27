# Smart Wardrobe App
This is my take on a digital wardrobe management app. If you've ever wanted to organize your clothes digitally and get outfit suggestions, that's exactly what I did with this project

## What is the Smart Closet?
The Smart Closet lets you manage your wardrobe digitally, create outfits manually, and get intelligent outfit recommendations based on your clothing collection. You can upload photos of your clothes, organize them by category and color, and build outfits piece by piece.

## Why did I build this?
I wanted to learn/challenge myself with a modern mobile app that's both useful and showcases development skills. Wardrobe management is something everyone deals with, and I wanted to create a solution that combines React Native, TypeScript, and smart algorithms (all things I am learning and wanted to expand on) to make getting dressed easier. For now the app is front-end only.

## Features
- **Digital wardrobe management** — upload and organize your clothes with photos
- **Manual outfit creation** — build outfits piece by piece with visual preview
- **Smart recommendations** — get outfit suggestions based on your wardrobe
- **Responsive design** — works on mobile and web platforms
- **Persistent storage** — your wardrobe and outfits are saved locally
- **Category filtering** — organize by occasion, weather, and clothing type

## How to use it
1. **Clone this repo**
2. **Install dependencies**:
   ```sh
   cd closet-app
   npm install
   ```

3. **Start the development server**:
   ```sh
   npx expo start
   ```

4. **Run on your preferred platform**:
   - Press `w` for web browser
   - I'm still developing this project so using it on an actual mobile phone may not work yet

5. **Start using the app**:
   - Add clothing items with photos and details
   - Create outfits manually in the Outfit Creator
   - Get recommendations in the Recommendations section

## Tech Stack
- **Frontend:** React Native, Expo, TypeScript
- **Navigation:** React Navigation
- **Storage:** AsyncStorage (local only)
- **UI Components:** React Native Picker, Expo Image Picker

## What's next?
**Currently this project is still in development.** I'd like to add more features in the future, such as cloud sync, social sharing, or even deploy it as a web app with backend support.
