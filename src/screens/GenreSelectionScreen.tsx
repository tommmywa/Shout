import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeTopBar } from '../components/NativeTopBar';

interface GenreSelectionScreenProps {
  onContinue: (selectedGenres: string[]) => void;
  onBack?: () => void;
}

const ALL_GENRES: string[] = [
  'Pop',
  'Hip-Hop',
  'Rock',
  'Dance',
  'Country',
  'Latin',
  'Electronic',
  'R&B',
  'Classical',
  'Jazz',
  'Afrobeats',
  'Amapiano',
  'Reggae',
  'Indie',
  'Alternative',
];

export const GenreSelectionScreen: React.FC<GenreSelectionScreenProps> = ({
  onContinue,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const isContinueEnabled = selectedGenres.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0C10" />

      {/* Native Top Bar with Back Arrow */}
      <NativeTopBar onBack={onBack} />

      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Circular Icon */}
          <View style={styles.iconSection}>
            <View style={styles.iconCircle}>
              <Ionicons name="musical-notes" size={36} color="rgba(255, 255, 255, 0.3)" />
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Pick your favorite music genre</Text>
            <Text style={styles.subtitle}>You can select as many as you want</Text>
          </View>

          {/* Genre Pills Grid */}
          <View style={styles.pillsWrapper}>
            {ALL_GENRES.map((genre) => {
              const isSelected = selectedGenres.includes(genre);

              return (
                <TouchableOpacity
                  key={genre}
                  onPress={() => toggleGenre(genre)}
                  activeOpacity={0.78}
                  style={styles.pillTouchTarget}
                >
                  <View
                    style={[
                      styles.pill,
                      isSelected ? styles.pillSelected : styles.pillUnselected,
                    ]}
                  >
                    <Text
                      style={
                        isSelected
                          ? styles.pillTextSelected
                          : styles.pillTextUnselected
                      }
                    >
                      {genre}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Counter */}
          <View style={styles.counterContainer}>
            {selectedGenres.length > 0 ? (
              <Text style={styles.counterText}>
                {`${selectedGenres.length} selected`}
              </Text>
            ) : null}
          </View>
        </ScrollView>

        {/* Bottom Continue Action */}
        <View style={[styles.bottomContainer, { paddingBottom: 20 }]}>
          <TouchableOpacity
            onPress={() => onContinue(selectedGenres)}
            disabled={!isContinueEnabled}
            activeOpacity={0.88}
            style={[
              styles.continueButton,
              isContinueEnabled ? styles.continueButtonActive : styles.continueButtonInactive,
            ]}
          >
            {isContinueEnabled ? (
              <LinearGradient
                colors={['#FF5736', '#FF4322']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientFill}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </LinearGradient>
            ) : (
              <Text style={[styles.continueButtonText, { color: 'rgba(255, 255, 255, 0.4)' }]}>
                Continue
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C10',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerBar: {
    paddingHorizontal: 20,
    height: 44,
    justifyContent: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  iconSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 26,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.57)',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  pillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 6,
  },
  pillTouchTarget: {
    marginBottom: 2,
  },
  pill: {
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pillUnselected: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillSelected: {
    borderColor: '#FFFFFF',
  },
  pillTextUnselected: {
    color: 'rgba(255, 255, 255, 0.57)',
    fontSize: 13,
    fontWeight: '400',
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  counterContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 20,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  continueButton: {
    width: '100%',
    height: 52,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  continueButtonActive: {
    shadowColor: '#FF4F2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  continueButtonInactive: {
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  gradientFill: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
});
