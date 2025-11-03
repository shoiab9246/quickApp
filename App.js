import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated
} from 'react-native';
import * as Haptics from 'expo-haptics';

const NOTES = [
  { note: 'C', color: '#FF6B6B', label: 'C', sound: 'note1' },
  { note: 'D', color: '#FFA06B', label: 'D', sound: 'note2' },
  { note: 'E', color: '#FFD93D', label: 'E', sound: 'note3' },
  { note: 'F', color: '#6BCF7F', label: 'F', sound: 'note4' },
  { note: 'G', color: '#6BB5FF', label: 'G', sound: 'note5' },
  { note: 'A', color: '#9B6BFF', label: 'A', sound: 'note6' },
  { note: 'B', color: '#FF6BD5', label: 'B', sound: 'note7' },
  { note: 'C2', color: '#FF4757', label: "C'", sound: 'note8' },
];

export default function App() {
  const [activeNote, setActiveNote] = useState(null);
  const [tapCount, setTapCount] = useState(0);

  const playNote = async (note, index) => {
    try {
      // Provide haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      setActiveNote(index);
      setTapCount(prev => prev + 1);

      // Reset active state after animation
      setTimeout(() => setActiveNote(null), 200);
    } catch (error) {
      console.log('Error with haptics:', error);
      setActiveNote(index);
      setTimeout(() => setActiveNote(null), 200);
    }
  };

  const windowWidth = Dimensions.get('window').width;
  const baseWidth = Math.min(windowWidth * 0.75, 320);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>🎵 Xylophone 🎵</Text>
        <Text style={styles.subtitle}>Tap the colorful bars to play!</Text>
        {tapCount > 0 && (
          <Text style={styles.counter}>Notes played: {tapCount}</Text>
        )}
      </View>

      <View style={styles.xylophoneContainer}>
        {NOTES.map((item, index) => {
          const isActive = activeNote === index;
          // Each bar gets progressively smaller to look like a real xylophone
          const currentBarWidth = baseWidth - (index * 25);
          const barHeight = 55;

          return (
            <TouchableOpacity
              key={item.note}
              activeOpacity={0.7}
              onPress={() => playNote(item.note, index)}
              style={[
                styles.bar,
                {
                  backgroundColor: item.color,
                  width: currentBarWidth,
                  height: barHeight,
                  opacity: isActive ? 0.7 : 1,
                  transform: [{ scale: isActive ? 0.96 : 1 }],
                },
              ]}
            >
              <View style={styles.barInner}>
                <Text style={styles.noteLabel}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with Expo 🎹</Text>
        <Text style={styles.footerSubtext}>Feel the vibration as you play</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 12,
  },
  counter: {
    fontSize: 14,
    color: '#4299E1',
    fontWeight: '600',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
  },
  xylophoneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  bar: {
    borderRadius: 12,
    marginVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  barInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteLabel: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#CBD5E0',
    marginTop: 4,
  },
});
