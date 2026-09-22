import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthService } from '../services/auth';
import { NativeTopBar } from '../components/NativeTopBar';

interface ProfileSetupScreenProps {
  onSuccess: () => void;
  onBack?: () => void;
}

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({
  onSuccess,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const auth = AuthService.getInstance();

  const [firstName, setFirstName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = firstName.trim().length >= 2;

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!isFormValid || loading) return;

    setError(null);
    setLoading(true);

    try {
      // Save display name to user account
      await auth.updateUser({
        display_name: firstName.trim(),
      });
      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0C10" />

      {/* Native Top Bar with Back Arrow */}
      <NativeTopBar onBack={onBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: 8,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topSection}>
              {/* Avatar Circle Placeholder */}
              <View style={styles.avatarSection}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={38} color="rgba(255, 255, 255, 0.25)" />
                </View>
              </View>

              {/* Title Section */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>What should we call you?</Text>
                <Text style={styles.subtitle}>Provide your name to personalize your experience.</Text>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Inputs Container */}
              <View style={styles.inputsContainer}>
                {/* First Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>First name</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      isFocused && styles.inputWrapperFocused,
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.textInput,
                        firstName.trim().length > 0 ? styles.textInputFilled : styles.textInputActive,
                      ]}
                      placeholder="Your first name"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      value={firstName}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      onChangeText={(val) => {
                        setFirstName(val);
                        if (error) setError(null);
                      }}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        if (isFormValid) handleSave();
                      }}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Bottom Save Action - Dedicated container with guaranteed separation */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!isFormValid || loading}
                activeOpacity={0.88}
                style={[
                  styles.saveButton,
                  isFormValid ? styles.saveButtonActive : styles.saveButtonInactive,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : isFormValid ? (
                  <LinearGradient
                    colors={['#FF5736', '#FF4322']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientFill}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </LinearGradient>
                ) : (
                  <Text style={[styles.saveButtonText, { color: 'rgba(255, 255, 255, 0.4)' }]}>
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C10',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  topSection: {
    width: '100%',
  },
  headerBar: {
    height: 44,
    justifyContent: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.57)',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 6,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  inputsContainer: {
    gap: 18,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  inputWrapper: {
    backgroundColor: '#1C1C1C',
    borderRadius: 99,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputWrapperFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 1,
  },
  textInput: {
    fontSize: 14,
    color: '#FFFFFF',
    paddingVertical: 0,
    fontFamily: Platform.select({ ios: undefined, default: 'sans-serif' }),
    fontWeight: '400',
    flex: 1,
    height: '100%',
  },
  textInputFilled: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
  textInputActive: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
  bottomContainer: {
    width: '100%',
    marginTop: 36,
    alignItems: 'center',
  },
  saveButton: {
    width: '100%',
    height: 52,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  saveButtonActive: {
    shadowColor: '#FF4F2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  saveButtonInactive: {
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
});
