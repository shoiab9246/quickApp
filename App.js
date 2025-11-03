import React, { useState, useEffect } from 'react';
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
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { fromByteArray } from 'base64-js';

// Musical note frequencies (in Hz) for a C major scale
const NOTES = [
  { note: 'C', color: '#FF6B6B', label: 'C', frequency: 261.63 },
  { note: 'D', color: '#FFA06B', label: 'D', frequency: 293.66 },
  { note: 'E', color: '#FFD93D', label: 'E', frequency: 329.63 },
  { note: 'F', color: '#6BCF7F', label: 'F', frequency: 349.23 },
  { note: 'G', color: '#6BB5FF', label: 'G', frequency: 392.00 },
  { note: 'A', color: '#9B6BFF', label: 'A', frequency: 440.00 },
  { note: 'B', color: '#FF6BD5', label: 'B', frequency: 493.88 },
  { note: 'C2', color: '#FF4757', label: "C'", frequency: 523.25 },
];

export default function App() {
  const [activeNote, setActiveNote] = useState(null);
  const [tapCount, setTapCount] = useState(0);
  const [sounds, setSounds] = useState({});

  // Initialize audio mode on component mount
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    
    // Cleanup on unmount
    return () => {
      Object.values(sounds).forEach(sound => {
        if (sound) {
          sound.unloadAsync().catch(() => {});
        }
      });
    };
  }, []);

  // Generate WAV audio data as Uint8Array for a given frequency
  const generateToneWAV = (frequency, duration = 0.4) => {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const audioBuffer = new Uint8Array(44 + numSamples * 2);
    
    // WAV header helper functions
    const writeString = (offset, string) => {
      for (let j = 0; j < string.length; j++) {
        audioBuffer[offset + j] = string.charCodeAt(j);
      }
    };
    
    const writeUint32 = (offset, value) => {
      audioBuffer[offset] = value & 0xff;
      audioBuffer[offset + 1] = (value >> 8) & 0xff;
      audioBuffer[offset + 2] = (value >> 16) & 0xff;
      audioBuffer[offset + 3] = (value >> 24) & 0xff;
    };
    
    const writeUint16 = (offset, value) => {
      audioBuffer[offset] = value & 0xff;
      audioBuffer[offset + 1] = (value >> 8) & 0xff;
    };
    
    const writeInt16 = (offset, value) => {
      audioBuffer[offset] = value & 0xff;
      audioBuffer[offset + 1] = (value >> 8) & 0xff;
    };
    
    // Write WAV header
    writeString(0, 'RIFF');
    writeUint32(4, 36 + numSamples * 2);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    writeUint32(16, 16);
    writeUint16(20, 1); // audio format (PCM)
    writeUint16(22, 1); // number of channels
    writeUint32(24, sampleRate);
    writeUint32(28, sampleRate * 2);
    writeUint16(32, 2); // block align
    writeUint16(34, 16); // bits per sample
    writeString(36, 'data');
    writeUint32(40, numSamples * 2);
    
    // Generate sine wave samples
    for (let sampleIdx = 0; sampleIdx < numSamples; sampleIdx++) {
      const t = sampleIdx / sampleRate;
      // Apply envelope for smoother sound (fade in/out)
      const fadeIn = Math.min(1, t * 20);
      const fadeOut = Math.min(1, (duration - t) * 20);
      const envelope = fadeIn * fadeOut;
      const sample = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
      writeInt16(44 + sampleIdx * 2, intSample);
    }
    
    // Return the audio buffer directly (will be converted to base64 when writing to file)
    return audioBuffer;
  };

  const playNote = async (note, index, frequency) => {
    try {
      // Provide haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      setActiveNote(index);
      setTapCount(prev => prev + 1);

      // Play audio tone by saving to file first (more reliable than data URIs)
      try {
        // Generate WAV audio data as Uint8Array directly
        const audioData = generateToneWAV(frequency);
        const fileName = `${FileSystem.cacheDirectory}note_${note}_${Date.now()}.wav`;
        
        // Convert Uint8Array to base64 string for file writing
        const base64Audio = fromByteArray(audioData);
        
        // Write base64 data as binary file
        // Use string 'base64' directly as FileSystem.EncodingType might not be available
        try {
          await FileSystem.writeAsStringAsync(fileName, base64Audio, {
            encoding: 'base64',
          });
        } catch (writeError) {
          // Fallback: try without encoding option (might write as text, which won't work)
          console.log('Write error, trying alternative:', writeError);
          // Alternative approach: we might need to write binary data differently
          throw writeError;
        }
        
        console.log(`Playing note: ${note} at ${frequency}Hz from file: ${fileName}`);
        
        const { sound } = await Audio.Sound.createAsync(
          { uri: fileName },
          { 
            shouldPlay: true,
            volume: 1.0,
            isMuted: false,
          }
        );
        
        console.log('Sound created and playing');
        
        // Clean up after playing
        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.error) {
            console.log('Playback error:', status.error);
          }
          if (status.didJustFinish) {
            await sound.unloadAsync().catch(err => console.log('Unload error:', err));
            // Delete temporary file
            await FileSystem.deleteAsync(fileName, { idempotent: true }).catch(() => {});
          }
        });
      } catch (audioError) {
        console.error('Audio error details:', audioError);
        console.error('Audio error message:', audioError.message);
        // Fallback: just use haptics if audio fails
      }

      // Reset active state after animation
      setTimeout(() => setActiveNote(null), 200);
    } catch (error) {
      console.error('General error:', error);
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
              onPress={() => playNote(item.note, index, item.frequency)}
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
