import React from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeTopBar } from '../components/NativeTopBar';

interface HowItWorksScreenProps {
  onContinue: () => void;
  onBack?: () => void;
}

interface StepItem {
  number: string;
  title: string;
  description: string;
}

const STEPS: StepItem[] = [
  {
    number: '1',
    title: 'Pick a song',
    description: 'Choose an artist and song.',
  },
  {
    number: '2',
    title: 'Pick a person',
    description: 'You can shoutout yourself or a loved one',
  },
  {
    number: '3',
    title: 'Make it personal',
    description: 'Choose how your favorite artist delivers.',
  },
  {
    number: '4',
    title: 'Earn & build recognition',
    description: 'Accumulate shouts which are minted into tokens tied to your name (unique identity)',
  },
];

export const HowItWorksScreen: React.FC<HowItWorksScreenProps> = ({
  onContinue,
  onBack,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0C10" />

      {/* Native Top Bar with navigation arrow */}
      <NativeTopBar onBack={onBack} />

      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Main Content Section */}
          <View style={styles.content}>
            {/* Section Header */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>How it works</Text>
              <Text style={styles.subtitle}>It’s easy in 3 easy steps.</Text>
            </View>

            {/* 4 Step Cards matching Figma 13:1210 */}
            <View style={styles.cardsContainer}>
              {STEPS.map((step) => (
                <View key={step.number} style={styles.card}>
                  <View style={styles.numberWrapper}>
                    <Text style={styles.numberText}>{step.number}</Text>
                  </View>
                  <View style={styles.cardTextWrapper}>
                    <Text style={styles.cardTitle}>{step.title}</Text>
                    <Text style={styles.cardSubtitle}>{step.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom CTA Button */}
          <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <TouchableOpacity
              onPress={onContinue}
              activeOpacity={0.88}
              style={styles.buttonShadow}
            >
              <LinearGradient
                colors={['#FF5736', '#FF4322']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.continueButton}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  titleSection: {
    marginBottom: 32,
    gap: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    fontFamily: Platform.select({
      ios: 'Plus Jakarta Sans',
      default: 'sans-serif',
    }),
  },
  subtitle: {
    color: '#919191',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: 'Plus Jakarta Sans',
      default: 'sans-serif',
    }),
  },
  cardsContainer: {
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    padding: 16,
  },
  numberWrapper: {
    width: 28,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  numberText: {
    color: 'rgba(255, 255, 255, 0.40)',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
    fontFamily: Platform.select({
      ios: 'Plus Jakarta Sans',
      default: 'sans-serif',
    }),
  },
  cardTextWrapper: {
    flex: 1,
    gap: 8,
    justifyContent: 'flex-start',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: 'Plus Jakarta Sans',
      default: 'sans-serif',
    }),
  },
  cardSubtitle: {
    color: '#919191',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: 'Plus Jakarta Sans',
      default: 'sans-serif',
    }),
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  buttonShadow: {
    shadowColor: '#FF4F2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  continueButton: {
    height: 52,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
    fontFamily: Platform.select({
      ios: 'Plus Jakarta Sans',
      default: 'sans-serif',
    }),
  },
});

