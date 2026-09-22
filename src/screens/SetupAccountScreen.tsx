import React, { useRef, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthService } from '../services/auth';
import { NativeTopBar } from '../components/NativeTopBar';

interface SetupAccountScreenProps {
  onSuccess: () => void;
  onSendCode?: (email: string) => void;
  onBack?: () => void;
  onOpenSignIn?: () => void;
}

export const SetupAccountScreen: React.FC<SetupAccountScreenProps> = ({
  onSuccess,
  onSendCode,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const auth = AuthService.getInstance();
  const passwordInputRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = email.trim().length > 0 && password.length >= 4;

  const handleSubmit = async () => {
    Keyboard.dismiss();

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Pre-create user and proceed to verification screen
      await auth.signup(email.trim(), email.split('@')[0]);
      if (onSendCode) {
        onSendCode(email.trim());
      } else {
        onSuccess();
      }
    } catch (e: any) {
      setError(e.message || 'Authentication failed. Please try again.');
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
              {/* Header Text */}
                <View style={styles.titleSection}>
                  <Text style={styles.title}>Setup your account</Text>
                  <Text style={styles.subtitle}>
                    Create an account quickly. We’ll send a verification code for you to create an account
                  </Text>
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
                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        focusedField === 'email' && styles.inputWrapperFocused,
                      ]}
                    >
                      <TextInput
                        style={[
                          styles.textInput,
                          email.trim().length > 0 ? styles.textInputFilled : styles.textInputActive,
                        ]}
                        placeholder="Your mail address"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        value={email}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        onChangeText={(val) => {
                          setEmail(val);
                          if (error) setError(null);
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        returnKeyType="next"
                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        focusedField === 'password' && styles.inputWrapperFocused,
                      ]}
                    >
                      <TextInput
                        ref={passwordInputRef}
                        style={[
                          styles.textInput,
                          { paddingRight: 44 },
                          password.length > 0 ? styles.textInputFilled : styles.textInputActive,
                        ]}
                        placeholder="Enter password"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        value={password}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        onChangeText={(val) => {
                          setPassword(val);
                          if (error) setError(null);
                        }}
                        secureTextEntry={!showPassword && password.length > 0}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={() => {
                          if (isFormValid) handleSubmit();
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={password.length > 0 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Bottom Actions - Dedicated container with guaranteed top separation */}
              <View style={styles.bottomContainer}>
                {/* Primary Action Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={!isFormValid || loading}
                  activeOpacity={0.88}
                  style={[
                    styles.submitButton,
                    isFormValid ? styles.submitButtonActive : styles.submitButtonInactive,
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
                      <Text style={styles.submitButtonText}>Send code</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={[styles.submitButtonText, { color: 'rgba(255, 255, 255, 0.4)' }]}>
                      Send code
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
  titleSection: {
    marginBottom: 28,
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
    paddingVertical: 0,
    fontFamily: Platform.select({ ios: undefined, default: 'sans-serif' }),
    fontWeight: '400',
  },
  textInputFilled: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  textInputActive: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    height: 50,
    justifyContent: 'center',
  },
  bottomContainer: {
    width: '100%',
    marginTop: 36,
    alignItems: 'center',
  },
  submitButton: {
    width: '100%',
    height: 52,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  submitButtonActive: {
    shadowColor: '#FF4F2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  submitButtonInactive: {
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
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
});
