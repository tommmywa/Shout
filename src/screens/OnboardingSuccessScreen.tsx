import React from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeTopBar } from '../components/NativeTopBar';
import { ConfettiBurst } from '../components/ConfettiBurst';
import { colors } from '../theme/colors';

interface OnboardingSuccessScreenProps {
  onContinue: () => void;
  onBack?: () => void;
}

export const OnboardingSuccessScreen: React.FC<OnboardingSuccessScreenProps> = ({
  onContinue,
  onBack,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0C10" />

      {/* Top Bar matching Figma node 2009:1708 */}
      <NativeTopBar onBack={onBack} />

      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.content}>
          {/* Main Card Section matching Figma Frame 17 */}
          <View style={styles.centerContainer}>
            {/* Top Icon and Text Stack matching Frame 16 */}
            <View style={styles.headerStack}>
              {/* Circular Checkmark Badge matching Group 1 (52x52) */}
              <View style={styles.iconBadge}>
                <Feather name="check" size={24} color="#FFFFFF" />
              </View>

              {/* Title & Subtitle matching Frame 10 */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>You’re all set</Text>
                <Text style={styles.subtitle}>
                  Your account has been created. Go and create your unique display name.
                </Text>
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              onPress={onContinue}
              activeOpacity={0.88}
              style={styles.continueButton}
              accessibilityRole="button"
              accessibilityLabel="Let's go"
            >
              <Text style={styles.continueButtonText}>Let's go</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Confetti Animation Bursting Across the Screen */}
      <ConfettiBurst />
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
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  centerContainer: {
    width: '100%',
    maxWidth: 370,
    alignItems: 'center',
  },
  headerStack: {
    alignItems: 'center',
    marginBottom: 44,
    width: '100%',
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  titleSection: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: 'Plus Jakarta Sans',
      default: 'System',
    }),
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
    fontFamily: Platform.select({
      ios: 'Plus Jakarta Sans',
      default: 'System',
    }),
  },
  continueButton: {
    width: '100%',
    height: 52,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({
      ios: 'Plus Jakarta Sans',
      default: 'System',
    }),
  },
});
