import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  ScrollView
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
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

// Preset songs with note sequences and lyrics
const SONGS = [
  {
    id: 'happy-birthday',
    name: 'Happy Birthday',
    icon: '🎂',
    notes: [
      { note: 'C', duration: 400 },
      { note: 'C', duration: 200 },
      { note: 'D', duration: 600 },
      { note: 'C', duration: 600 },
      { note: 'F', duration: 600 },
      { note: 'E', duration: 800 },
      { note: 'C', duration: 400 },
      { note: 'C', duration: 200 },
      { note: 'D', duration: 600 },
      { note: 'C', duration: 600 },
      { note: 'G', duration: 600 },
      { note: 'F', duration: 800 },
    ],
    lyrics: [
      'Happy Birthday to you',
      'Happy Birthday to you',
      'Happy Birthday dear friend',
      'Happy Birthday to you'
    ]
  },
  {
    id: 'twinkle',
    name: 'Twinkle Twinkle',
    icon: '⭐',
    notes: [
      { note: 'C', duration: 400 },
      { note: 'C', duration: 400 },
      { note: 'G', duration: 400 },
      { note: 'G', duration: 400 },
      { note: 'A', duration: 400 },
      { note: 'A', duration: 400 },
      { note: 'G', duration: 800 },
      { note: 'F', duration: 400 },
      { note: 'F', duration: 400 },
      { note: 'E', duration: 400 },
      { note: 'E', duration: 400 },
      { note: 'D', duration: 400 },
      { note: 'D', duration: 400 },
      { note: 'C', duration: 800 },
    ],
    lyrics: [
      'Twinkle twinkle little star',
      'How I wonder what you are',
      'Up above the world so high',
      'Like a diamond in the sky'
    ]
  },
  {
    id: 'jingle-bells',
    name: 'Jingle Bells',
    icon: '🔔',
    notes: [
      { note: 'E', duration: 400 },
      { note: 'E', duration: 400 },
      { note: 'E', duration: 600 },
      { note: 'E', duration: 400 },
      { note: 'E', duration: 400 },
      { note: 'E', duration: 600 },
      { note: 'E', duration: 400 },
      { note: 'G', duration: 400 },
      { note: 'C', duration: 400 },
      { note: 'D', duration: 400 },
      { note: 'E', duration: 800 },
    ],
    lyrics: [
      'Jingle bells, jingle bells',
      'Jingle all the way',
      'Oh what fun it is to ride',
      'In a one horse open sleigh'
    ]
  },
  {
    id: 'mary-lamb',
    name: 'Mary Had a Little Lamb',
    icon: '🐑',
    notes: [
      { note: 'E', duration: 400 },
      { note: 'D', duration: 400 },
      { note: 'C', duration: 400 },
      { note: 'D', duration: 400 },
      { note: 'E', duration: 400 },
      { note: 'E', duration: 400 },
      { note: 'E', duration: 600 },
      { note: 'D', duration: 400 },
      { note: 'D', duration: 400 },
      { note: 'D', duration: 600 },
      { note: 'E', duration: 400 },
      { note: 'G', duration: 400 },
      { note: 'G', duration: 600 },
    ],
    lyrics: [
      'Mary had a little lamb',
      'Little lamb, little lamb',
      'Mary had a little lamb',
      'Its fleece was white as snow'
    ]
  },
  {
    id: 'ode-to-joy',
    name: 'Ode to Joy',
    icon: '🎼',
    notes: [
      { note: 'E', duration: 400 },
      { note: 'E', duration: 400 },
      { note: 'F', duration: 400 },
      { note: 'G', duration: 400 },
      { note: 'G', duration: 400 },
      { note: 'F', duration: 400 },
      { note: 'E', duration: 400 },
      { note: 'D', duration: 400 },
      { note: 'C', duration: 400 },
      { note: 'C', duration: 400 },
      { note: 'D', duration: 400 },
      { note: 'E', duration: 400 },
      { note: 'E', duration: 600 },
      { note: 'D', duration: 200 },
      { note: 'D', duration: 800 },
    ],
    lyrics: [
      'Ode to Joy',
      'By Beethoven',
      'Symphony No. 9',
      'Classical Masterpiece'
    ]
  },
];

export default function App() {
  const [activeNote, setActiveNote] = useState(null);
  const [tapCount, setTapCount] = useState(0);
  const [sounds, setSounds] = useState({});
  const [playingSong, setPlayingSong] = useState(null);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const playbackTimeoutRef = useRef(null);

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
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
      }
    };
  }, []);

  // Auto-play song function
  const autoPlaySong = async (song) => {
    // Stop any currently playing song
    stopSong();

    setPlayingSong(song);
    setCurrentNoteIndex(0);
    setCurrentLyricIndex(0);

    // Play notes sequentially
    playSequence(song, 0);
  };

  const playSequence = async (song, index) => {
    if (index >= song.notes.length) {
      // Song finished
      setPlayingSong(null);
      setCurrentNoteIndex(-1);
      setCurrentLyricIndex(0);
      return;
    }

    const noteData = song.notes[index];
    const noteInfo = NOTES.find(n => n.note === noteData.note);

    if (noteInfo) {
      const noteIndex = NOTES.findIndex(n => n.note === noteData.note);

      // Play the note
      await playNote(noteInfo.note, noteIndex, noteInfo.frequency, noteData.duration);

      setCurrentNoteIndex(index);

      // Update lyric index based on progress
      const progress = (index / song.notes.length) * song.lyrics.length;
      setCurrentLyricIndex(Math.floor(progress));

      // Schedule next note
      playbackTimeoutRef.current = setTimeout(() => {
        playSequence(song, index + 1);
      }, noteData.duration + 100); // Small gap between notes
    }
  };

  const stopSong = () => {
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    setPlayingSong(null);
    setCurrentNoteIndex(-1);
    setCurrentLyricIndex(0);
    setActiveNote(null);
  };

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

  const playNote = async (note, index, frequency, customDuration = null) => {
    try {
      // Provide haptic feedback (skip on web as it's not supported)
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      setActiveNote(index);
      setTapCount(prev => prev + 1);

      // Play audio tone - use different approach for web vs native
      try {
        // Generate WAV audio data as Uint8Array directly
        const duration = customDuration ? customDuration / 1000 : 0.4; // Convert ms to seconds
        const audioData = generateToneWAV(frequency, duration);
        
        let audioUri;
        
        if (Platform.OS === 'web') {
          // For web: create a blob URL from the WAV data
          const blob = new Blob([audioData], { type: 'audio/wav' });
          audioUri = URL.createObjectURL(blob);
          
          console.log(`Playing note: ${note} at ${frequency}Hz on web`);
        } else {
          // For native: save to file system
          const fileName = `${FileSystem.cacheDirectory}note_${note}_${Date.now()}.wav`;
          const base64Audio = fromByteArray(audioData);
          
          await FileSystem.writeAsStringAsync(fileName, base64Audio, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          audioUri = fileName;
          console.log(`Playing note: ${note} at ${frequency}Hz from file: ${fileName}`);
        }
        
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
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
            // Clean up: delete temporary file (native) or revoke blob URL (web)
            if (Platform.OS === 'web' && audioUri.startsWith('blob:')) {
              URL.revokeObjectURL(audioUri);
            } else if (Platform.OS !== 'web' && audioUri.startsWith(FileSystem.cacheDirectory)) {
              await FileSystem.deleteAsync(audioUri, { idempotent: true }).catch(() => {});
            }
          }
        });
      } catch (audioError) {
        console.error('Audio error details:', audioError);
        console.error('Audio error message:', audioError.message);
        // Fallback: just use haptics if audio fails
      }

      // Reset active state after animation (only if not auto-playing)
      if (!playingSong) {
        setTimeout(() => setActiveNote(null), 200);
      }
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
        <Text style={styles.subtitle}>Tap bars or play a song!</Text>
        {tapCount > 0 && !playingSong && (
          <Text style={styles.counter}>Notes played: {tapCount}</Text>
        )}
      </View>

      {/* Preset Songs Section */}
      <View style={styles.songsSection}>
        <Text style={styles.songsSectionTitle}>Preset Songs</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.songsScrollView}
          contentContainerStyle={styles.songsScrollContent}
        >
          {SONGS.map((song) => (
            <TouchableOpacity
              key={song.id}
              style={[
                styles.songButton,
                playingSong?.id === song.id && styles.songButtonActive
              ]}
              onPress={() => autoPlaySong(song)}
            >
              <Text style={styles.songIcon}>{song.icon}</Text>
              <Text style={styles.songName}>{song.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {playingSong && (
          <TouchableOpacity style={styles.stopButton} onPress={stopSong}>
            <Text style={styles.stopButtonText}>⏹ Stop</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Song Info Panel - Shows during playback */}
      {playingSong && (
        <View style={styles.songInfoPanel}>
          <Text style={styles.songInfoTitle}>
            {playingSong.icon} {playingSong.name}
          </Text>
          <View style={styles.lyricsContainer}>
            {playingSong.lyrics.map((line, index) => (
              <Text
                key={index}
                style={[
                  styles.lyricLine,
                  index === currentLyricIndex && styles.lyricLineActive
                ]}
              >
                {line}
              </Text>
            ))}
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentNoteIndex + 1) / playingSong.notes.length) * 100}%`
                }
              ]}
            />
          </View>
        </View>
      )}

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
    justifyContent: 'flex-start',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    flexShrink: 0,
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
    minHeight: 0,
    width: '100%',
    marginVertical: 20,
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
    flexShrink: 0,
    paddingBottom: 10,
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
  songsSection: {
    width: '100%',
    marginBottom: 15,
    flexShrink: 0,
  },
  songsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  songsScrollView: {
    flexGrow: 0,
  },
  songsScrollContent: {
    paddingHorizontal: 5,
  },
  songButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  songButtonActive: {
    backgroundColor: '#EBF8FF',
    borderColor: '#4299E1',
  },
  songIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  songName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
  },
  stopButton: {
    backgroundColor: '#FC8181',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 10,
    alignSelf: 'center',
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  songInfoPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4299E1',
  },
  songInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 10,
  },
  lyricsContainer: {
    marginBottom: 10,
  },
  lyricLine: {
    fontSize: 13,
    color: '#718096',
    marginVertical: 2,
    lineHeight: 18,
  },
  lyricLineActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4299E1',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4299E1',
    borderRadius: 3,
  },
});
