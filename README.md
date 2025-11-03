# Xylophone Game

A colorful and interactive xylophone game built with React Native and Expo. Tap the colorful bars to play musical notes with haptic feedback!

## Features

- 8 colorful xylophone bars representing musical notes (C, D, E, F, G, A, B, C')
- Haptic feedback for each tap
- Visual animations when bars are pressed
- Note counter to track your playing
- Responsive design that works on all screen sizes
- Clean and modern UI

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

## Running the App

### On Mobile Device (Recommended)
1. Install the Expo Go app on your iOS or Android device
2. Scan the QR code shown in the terminal or browser
3. The app will open in Expo Go

### On iOS Simulator
```bash
npm run ios
```

### On Android Emulator
```bash
npm run android
```

### On Web Browser
```bash
npm run web
```

## How to Play

1. Simply tap any of the colored bars
2. Feel the haptic feedback as you play
3. Watch the counter increase with each note played
4. Create your own melodies!

## Technologies Used

- React Native
- Expo
- expo-haptics for tactile feedback
- expo-status-bar for status bar styling

## Building for Production

To create a production build:

```bash
# For Android
npx expo build:android

# For iOS
npx expo build:ios
```

Or use EAS Build for the modern Expo build service:

```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!
