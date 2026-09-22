import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { HowItWorksScreen } from './HowItWorksScreen';
import { SetupAccountScreen } from './SetupAccountScreen';
import { VerifyCodeScreen } from './VerifyCodeScreen';
import { ProfileSetupScreen } from './ProfileSetupScreen';
import { GenreSelectionScreen } from './GenreSelectionScreen';
import { ArtistSelectionScreen } from './ArtistSelectionScreen';
import { OnboardingSuccessScreen } from './OnboardingSuccessScreen';

interface OnboardingScreenProps {
  onGetStarted: () => void;
  onAlreadyHaveAccount: () => void;
  onSkip?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Proportional metrics matching Figma node 1:1121 & 1:1132
const KEYCHAIN_SCALE = Math.min(SCREEN_WIDTH / 402, 1.15);
const KEYCHAIN_WIDTH = 438 * KEYCHAIN_SCALE;
const KEYCHAIN_HEIGHT = 458 * KEYCHAIN_SCALE;
const KEYCHAIN_TOP = -34 * KEYCHAIN_SCALE;

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onGetStarted,
  onAlreadyHaveAccount,
  onSkip,
}) => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState<
    | 'welcome'
    | 'how_it_works'
    | 'setup_account'
    | 'verify_code'
    | 'profile_setup'
    | 'genre_selection'
    | 'artist_selection'
    | 'onboarding_success'
  >('welcome');
  const [pendingEmail, setPendingEmail] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  if (currentStep === 'how_it_works') {
    return (
      <HowItWorksScreen
        onContinue={() => setCurrentStep('setup_account')}
        onBack={() => setCurrentStep('welcome')}
      />
    );
  }

  if (currentStep === 'setup_account') {
    return (
      <SetupAccountScreen
        onSuccess={onGetStarted}
        onSendCode={(email) => {
          setPendingEmail(email);
          setCurrentStep('verify_code');
        }}
        onBack={() => setCurrentStep('how_it_works')}
        onOpenSignIn={onAlreadyHaveAccount}
      />
    );
  }

  if (currentStep === 'verify_code') {
    return (
      <VerifyCodeScreen
        email={pendingEmail}
        onSuccess={() => setCurrentStep('profile_setup')}
        onBack={() => setCurrentStep('setup_account')}
      />
    );
  }

  if (currentStep === 'profile_setup') {
    return (
      <ProfileSetupScreen
        onSuccess={() => setCurrentStep('genre_selection')}
        onBack={() => setCurrentStep('verify_code')}
      />
    );
  }

  if (currentStep === 'genre_selection') {
    return (
      <GenreSelectionScreen
        onContinue={(genres) => {
          setSelectedGenres(genres);
          setCurrentStep('artist_selection');
        }}
        onBack={() => setCurrentStep('profile_setup')}
      />
    );
  }

  if (currentStep === 'artist_selection') {
    return (
      <ArtistSelectionScreen
        onContinue={(_artists) => {
          setCurrentStep('onboarding_success');
        }}
        onBack={() => setCurrentStep('genre_selection')}
      />
    );
  }

  if (currentStep === 'onboarding_success') {
    return (
      <OnboardingSuccessScreen
        onContinue={onGetStarted}
        onBack={() => setCurrentStep('artist_selection')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0C10" />

      {/* Top Ambient Glow Background */}
      <View style={styles.glowContainer} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255, 100, 40, 0.45)', 'rgba(255, 180, 50, 0.20)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.radialGlow}
        />
        <View style={styles.amberSpotlight} />
      </View>

      {/* Hero Graphic: 3D Keychain anchored to the top screen bezel */}
      <View style={styles.heroContainer} pointerEvents="none">
        <Image
          source={require('../../assets/onboarding-keychain.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />
      </View>

      {/* Top Right Skip Button */}
      {onSkip ? (
        <TouchableOpacity
          onPress={onSkip}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[styles.skipButton, { top: insets.top + 8 }]}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      ) : null}

      {/* Bottom Content Card */}
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.bottomSafeArea}>
        <View style={[styles.contentCard, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Headline & Subtitle */}
          <View style={styles.textBlock}>
            <Text style={styles.title}>
              Your Name,{'\n'}Immortalized in Music
            </Text>
            <Text style={styles.subtitle}>
              Have your favorite artist shout out your name in one of their songs.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            {/* Primary CTA: Get Started */}
            <TouchableOpacity
              onPress={() => setCurrentStep('how_it_works')}
              activeOpacity={0.88}
              style={styles.primaryButtonShadow}
            >
              <LinearGradient
                colors={['#FF5736', '#FF4322']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary CTA: I already have an account */}
            <TouchableOpacity
              onPress={onAlreadyHaveAccount}
              activeOpacity={0.88}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>I already have an account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C10',
    overflow: 'hidden',
  },
  glowContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
  },
  radialGlow: {
    position: 'absolute',
    top: 0,
    width: SCREEN_WIDTH * 1.3,
    height: SCREEN_HEIGHT * 0.55,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.65,
    borderBottomRightRadius: SCREEN_WIDTH * 0.65,
  },
  amberSpotlight: {
    position: 'absolute',
    top: 20,
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: (SCREEN_WIDTH * 0.8) / 2,
    backgroundColor: 'rgba(255, 180, 50, 0.22)',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#FFC857',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.85,
          shadowRadius: 55,
        }
      : {}),
  },
  heroContainer: {
    position: 'absolute',
    top: KEYCHAIN_TOP,
    left: (SCREEN_WIDTH - KEYCHAIN_WIDTH) / 2,
    width: KEYCHAIN_WIDTH,
    height: KEYCHAIN_HEIGHT,
    zIndex: 5,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  skipButton: {
    position: 'absolute',
    right: 24,
    zIndex: 30,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  bottomSafeArea: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  contentCard: {
    paddingHorizontal: 24,
    justifyContent: 'flex-end',
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 35,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.4,
    fontFamily: Platform.select({ ios: undefined, default: 'sans-serif' }),
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    fontFamily: Platform.select({ ios: undefined, default: 'sans-serif' }),
  },
  buttonGroup: {
    gap: 14,
  },
  primaryButtonShadow: {
    shadowColor: '#FF4F2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryButton: {
    height: 52,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0B0C10',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
