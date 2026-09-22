import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { IdentityService } from '../services/identity';
import { GlobalIdentity, User } from '../types';
import { HandleAvailabilityBadge } from '../components/HandleAvailabilityBadge';
import { NativeTopBar } from '../components/NativeTopBar';

interface IdentitySetupScreenProps {
  user: User;
  onBack: () => void;
  onIdentityCreated: (handle: string) => void;
  returnSongTitle?: string;
}

export const IdentitySetupScreen: React.FC<IdentitySetupScreenProps> = ({
  user,
  onBack,
  onIdentityCreated,
  returnSongTitle,
}) => {
  const identityService = IdentityService.getInstance();

  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle');
  const [availabilityReason, setAvailabilityReason] = useState<string | undefined>();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focusedField, setFocusedField] = useState<'displayName' | 'handle' | 'bio' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success celebration state
  const [createdIdentity, setCreatedIdentity] = useState<GlobalIdentity | null>(null);

  // Debounced availability check
  useEffect(() => {
    if (!handle.trim()) {
      setAvailabilityStatus('idle');
      setAvailabilityReason(undefined);
      setSuggestions([]);
      return;
    }

    setAvailabilityStatus('checking');
    const timer = setTimeout(async () => {
      const res = await identityService.checkAvailability(handle);
      if (res.available) {
        setAvailabilityStatus('available');
        setAvailabilityReason(undefined);
        setSuggestions([]);
      } else {
        const formatCheck = identityService.validateHandleFormat(handle);
        if (!formatCheck.isValid) {
          setAvailabilityStatus('invalid');
          setAvailabilityReason(formatCheck.error);
          setSuggestions([]);
        } else {
          setAvailabilityStatus('taken');
          setAvailabilityReason(res.reason);
          setSuggestions(res.suggestions || []);
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [handle]);

  const handleClaim = async () => {
    if (!displayName.trim() || displayName.trim().length < 2) {
      setError('Please provide a valid display name (at least 2 characters).');
      return;
    }
    if (availabilityStatus !== 'available') {
      setError('Please choose an available unique handle.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const created = await identityService.claimIdentity(
        user.id,
        displayName.trim(),
        handle.trim(),
        bio.trim()
      );
      setCreatedIdentity(created);
    } catch (e: any) {
      setError(e.message || 'Failed to claim identity.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestedHandle: string) => {
    setHandle(suggestedHandle);
  };

  // Render Celebratory Success State
  if (createdIdentity) {
    return (
      <View style={styles.container}>
        <NativeTopBar title="Identity Created" applyTopInset={false} showBorder={true} />

        <ScrollView contentContainerStyle={styles.successContent}>
          <View style={styles.successBadge}>
            <Ionicons name="checkmark-circle" size={54} color={colors.success} />
          </View>

          <Text style={styles.successHeading}>Global Identity Minted!</Text>
          <Text style={styles.successSub}>
            Your identity has been established across ShoutOut. All future artist recognitions and token rewards will attach to this global name.
          </Text>

          <View style={styles.successCard}>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Global Handle</Text>
              <Text style={styles.successHandle}>{createdIdentity.handle}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Display Name</Text>
              <Text style={styles.successValue}>{createdIdentity.display_name}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Soulbound NFT ID</Text>
              <Text style={styles.successAddress}>{createdIdentity.identity_nft_address}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Owner Wallet</Text>
              <Text style={styles.successAddress}>
                {createdIdentity.owner_wallet_address.slice(0, 8)}...{createdIdentity.owner_wallet_address.slice(-6)}
              </Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Token Status</Text>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>INITIALIZED</Text>
              </View>
            </View>
          </View>

          {returnSongTitle && (
            <View style={styles.contextPill}>
              <Ionicons name="arrow-forward-circle" size={18} color={colors.secondaryLight} />
              <Text style={styles.contextPillText}>
                Ready to continue your shoutout on <Text style={{ fontWeight: '800' }}>{returnSongTitle}</Text>
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => onIdentityCreated(createdIdentity.handle)}
          >
            <Text style={styles.continueBtnText}>
              {returnSongTitle ? 'Continue to Shoutout Purchase' : 'Explore Music'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <NativeTopBar
        onBack={onBack}
        backLabel="Back"
        title="Create Global Identity"
        applyTopInset={false}
        showBorder={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Value Proposition Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconBox}>
            <Ionicons name="finger-print" size={24} color={colors.primaryLight} />
          </View>
          <View style={styles.infoTextBox}>
            <Text style={styles.infoTitle}>One Global Identity Per Person</Text>
            <Text style={styles.infoDesc}>
              Your Global Identity is the single name artists recognize across ShoutOut. A shoutout permanently binds to this identity, accumulating recognition and personal token value across all songs.
            </Text>
          </View>
        </View>

        {returnSongTitle && (
          <View style={styles.contextPill}>
            <Ionicons name="return-down-forward" size={14} color={colors.secondaryLight} />
            <Text style={styles.contextPillText}>
              Setting up identity to purchase a shoutout on: <Text style={{ fontWeight: '700' }}>{returnSongTitle}</Text>
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Input Form */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <Text style={styles.sublabel}>The name artists will read when personalizing your shoutout</Text>
            <TextInput
              style={[styles.input, focusedField === 'displayName' && styles.inputFocused]}
              placeholder="e.g. Sara Sterling"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={displayName}
              onChangeText={setDisplayName}
              onFocus={() => setFocusedField('displayName')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Unique Handle</Text>
            <Text style={styles.sublabel}>Your globally unique identifier across all Web3 music releases</Text>
            <View style={[styles.handleInputContainer, focusedField === 'handle' && styles.inputFocused]}>
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={styles.handleInput}
                placeholder="sara_vibes"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={handle.startsWith('@') ? handle.slice(1) : handle}
                onChangeText={(val) => setHandle('@' + val.replace(/[^a-zA-Z0-9_]/g, ''))}
                onFocus={() => setFocusedField('handle')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <HandleAvailabilityBadge
              status={availabilityStatus}
              reason={availabilityReason}
              handle={handle}
              suggestions={suggestions}
              onSelectSuggestion={handleSelectSuggestion}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio / Fan Note (Optional)</Text>
            <TextInput
              style={[styles.input, styles.bioInput, focusedField === 'bio' && styles.inputFocused]}
              placeholder="e.g. Underground electronic supporter & vinyl collector"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={bio}
              onChangeText={setBio}
              onFocus={() => setFocusedField('bio')}
              onBlur={() => setFocusedField(null)}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Web3 Architecture Transparency */}
          <View style={styles.web3DetailsBox}>
            <View style={styles.web3DetailRow}>
              <Ionicons name="shield-checkmark" size={14} color={colors.secondaryLight} />
              <Text style={styles.web3DetailText}>Minting Soulbound Identity NFT</Text>
            </View>
            <View style={styles.web3DetailRow}>
              <Ionicons name="link" size={14} color={colors.secondaryLight} />
              <Text style={styles.web3DetailText}>
                Linking to wallet: {user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-6)}
              </Text>
            </View>
            <View style={styles.web3DetailRow}>
              <Ionicons name="cube" size={14} color={colors.secondaryLight} />
              <Text style={styles.web3DetailText}>Deploying personal Identity Token contract</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.claimBtn,
              (availabilityStatus !== 'available' || loading) && styles.claimBtnDisabled,
            ]}
            onPress={handleClaim}
            disabled={availabilityStatus !== 'available' || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                <Text style={styles.claimBtnText}>
                  Claim {handle || '@handle'} & Continue
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorderSubtle,
    backgroundColor: colors.backgroundElevated,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 14,
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextBox: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    marginBottom: 14,
  },
  contextPillText: {
    fontSize: 12,
    color: colors.secondaryLight,
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    flex: 1,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 18,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  sublabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1C1C1C',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    height: 46,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
    fontFamily: Platform.select({ ios: undefined, default: 'sans-serif' }),
  },
  inputFocused: {
    borderColor: '#FFFFFF',
  },
  handleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    height: 46,
  },
  atSymbol: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 2,
  },
  handleInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
    fontFamily: Platform.select({ ios: undefined, default: 'sans-serif' }),
  },
  bioInput: {
    height: 70,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  web3DetailsBox: {
    backgroundColor: '#1C1C1C',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    gap: 8,
    marginBottom: 20,
  },
  web3DetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  web3DetailText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#FF4F2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  claimBtnDisabled: {
    opacity: 0.45,
  },
  claimBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Success Celebration Styles
  successContent: {
    padding: 24,
    alignItems: 'center',
  },
  successBadge: {
    marginTop: 20,
    marginBottom: 16,
  },
  successHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  successCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  successLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  successHandle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  successValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  successAddress: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.secondaryLight,
  },
  activePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
  },
  continueBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
