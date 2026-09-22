import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { NativeTopBar } from '../components/NativeTopBar';

interface VerifyCodeScreenProps {
  email?: string;
  onSuccess: () => void;
  onBack?: () => void;
  onResendCode?: () => void;
}

export const VerifyCodeScreen: React.FC<VerifyCodeScreenProps> = ({
  email = 'ogundipeayodeji00@gmail.com',
  onSuccess,
  onBack,
  onResendCode,
}) => {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isIncorrect, setIsIncorrect] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Horizontal shake animation for incorrect code simulation
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const isCodeValid = code.trim().length === 6;

  const handleVerify = async () => {
    Keyboard.dismiss();
    if (!isCodeValid || loading) return;

    if (code.trim() !== '123456') {
      setIsIncorrect(true);
      triggerShake();
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Only '123456' is accepted as the correct code
    if (code.trim() !== '123456') {
      setIsIncorrect(true);
      triggerShake();
      setLoading(false);
      return;
    }

    setIsIncorrect(false);
    setLoading(false);
    onSuccess();
  };

  const handleResend = () => {
    if (onResendCode) {
      onResendCode();
    }
    setResendStatus('A new code has been sent!');
    setTimeout(() => setResendStatus(null), 3000);
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
                  <Text style={styles.title}>We’ve sent you a code</Text>
                  <Text style={styles.subtitle}>
                    Please enter the code we sent to{'\n'}
                    <Text style={styles.emailHighlight}>{email || 'your email address'}</Text>
                  </Text>
                </View>

                {/* Resend Notification */}
                {resendStatus && (
                  <View style={styles.resendBox}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#4ADE80" />
                    <Text style={styles.resendText}>{resendStatus}</Text>
                  </View>
                )}

                {/* Input Section */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Code</Text>
                  <Animated.View
                    style={[
                      styles.inputWrapper,
                      isFocused && styles.inputWrapperFocused,
                      isIncorrect && styles.inputWrapperError,
                      { transform: [{ translateX: shakeAnim }] },
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.textInput,
                        code.trim().length > 0 ? styles.textInputFilled : styles.textInputActive,
                      ]}
                      placeholder="Enter code"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      value={code}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      onChangeText={(val) => {
                        setCode(val);
                        if (isIncorrect) setIsIncorrect(false);
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleVerify}
                    />
                  </Animated.View>

                  {isIncorrect && (
                    <Text style={styles.incorrectCodeText}>
                      That’s not the correct code, try again.
                    </Text>
                  )}
                </View>

                {/* Resend Link */}
                <TouchableOpacity
                  onPress={handleResend}
                  activeOpacity={0.7}
                  style={styles.resendRow}
                >
                  <Text style={styles.resendRegular}>
                    Didn’t receive the code?{' '}
                    <Text style={styles.resendBold}>Send a new one</Text>
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Bottom Verify Action - Dedicated container with guaranteed separation */}
              <View style={styles.bottomContainer}>
                <TouchableOpacity
                  onPress={handleVerify}
                  disabled={!isCodeValid || loading}
                  activeOpacity={0.88}
                  style={[
                    styles.verifyButton,
                    isCodeValid ? styles.verifyButtonActive : styles.verifyButtonInactive,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : isCodeValid ? (
                    <LinearGradient
                      colors={['#FF5736', '#FF4322']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gradientFill}
                    >
                      <Text style={styles.verifyButtonText}>Verify</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={[styles.verifyButtonText, { color: 'rgba(255, 255, 255, 0.4)' }]}>
                      Verify
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
  emailHighlight: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resendBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  resendText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '500',
  },
  inputGroup: {
    gap: 8,
    marginBottom: 18,
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
  inputWrapperError: {
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  incorrectCodeText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '400',
    marginTop: 6,
    marginLeft: 6,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  textInput: {
    fontSize: 14,
    paddingVertical: 0,
    fontFamily: Platform.select({ ios: undefined, default: 'sans-serif' }),
    fontWeight: '400',
  },
  textInputFilled: {
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 3,
  },
  textInputActive: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
  resendRow: {
    paddingVertical: 8,
  },
  resendRegular: {
    color: 'rgba(255, 255, 255, 0.57)',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  resendBold: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomContainer: {
    width: '100%',
    marginTop: 36,
    alignItems: 'center',
  },
  verifyButton: {
    width: '100%',
    height: 52,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  verifyButtonActive: {
    shadowColor: '#FF4F2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  verifyButtonInactive: {
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
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
});
