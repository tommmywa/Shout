import React, { useEffect } from 'react';
import {
  BackHandler,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeTopBar } from '../components/NativeTopBar';

interface ClaimIdScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export const ClaimIdScreen: React.FC<ClaimIdScreenProps> = ({
  onBack,
  onContinue,
}) => {
  const insets = useSafeAreaInsets();

  // Intercept hardware back button on Android
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => subscription.remove();
  }, [onBack]);

  return (
    <View style={styles.container}>
      {/* Background Ambient Cosmic Glow behind crystal hero (Figma 2106:3276 / 13:1695) */}
      <View style={styles.ambientGlowContainer} pointerEvents="none">
        <LinearGradient
          colors={[
            'rgba(180, 24, 237, 0.28)',
            'rgba(120, 16, 170, 0.18)',
            'rgba(50, 8, 70, 0.08)',
            'transparent',
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.ambientGlow}
        />
      </View>

      {/* Top Bar with Close Button in right action (Figma 2106:3276 / 13:1695) */}
      <NativeTopBar
        applyTopInset={false}
        rightAction={
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color="#000000" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 16, 28) },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.centerSection}>
          {/* Floating 3D Crystal @ Symbol (Figma 2106:3306 / 13:1695) */}
          <View style={styles.heroCrystalContainer}>
            <Image
              source={require('../../assets/images/hero_at_crystal.png')}
              style={styles.crystalAtImage}
              resizeMode="contain"
            />
          </View>

          {/* Heading and Subtitle (Figma Frame 97) */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Build Recognition</Text>
            <Text style={styles.subtitle}>
              Claim your unique ID and get social status up and running
            </Text>
          </View>

          {/* Explanatory Info Card (Figma Frame 101) */}
          <View style={styles.infoCard}>
            <View style={styles.alertIconBadge}>
              <Ionicons name="alert" size={13} color="#FFFFFF" />
            </View>
            <Text style={styles.infoText}>
              A unique ID is the single name artists recognize across ShoutOut. A shoutout permanently binds to this identity, accumulating recognition and personal token value across all songs. Claiming your ID will mint an NFT in your account which will be linked to your wallet.
            </Text>
          </View>
        </View>

        {/* Primary CTA Button (Figma Frame 1 / Continue Pill) */}
        <View style={styles.bottomActionContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Continue to claim identity"
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C10',
  },
  ambientGlowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 480,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ambientGlow: {
    width: 520,
    height: 480,
    borderBottomLeftRadius: 260,
    borderBottomRightRadius: 260,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  centerSection: {
    alignItems: 'center',
    width: '100%',
  },
  heroCrystalContainer: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  crystalAtImage: {
    width: 180,
    height: 180,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14.5,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.72)',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 300,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#16171C',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  alertIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF4F2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  bottomActionContainer: {
    width: '100%',
    marginTop: 32,
  },
  continueButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FF4F2E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4F2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

