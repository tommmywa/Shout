import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import { GlobalIdentity, Shoutout, ShoutoutOrder, Song, TierId, User } from '../types';
import { ShoutoutService } from '../services/shoutouts';
import { TierCard } from '../components/TierCard';

interface PurchaseFlowModalProps {
  visible: boolean;
  onClose: () => void;
  song: Song;
  user: User;
  identity: GlobalIdentity;
  onOrderCompleted: (order: ShoutoutOrder, shoutoutId: string) => void;
  onDiscoverMore?: () => void;
}

type PurchaseStep = 'choose_tier' | 'details' | 'review' | 'payment' | 'confirmation';

export const PurchaseFlowModal: React.FC<PurchaseFlowModalProps> = ({
  visible,
  onClose,
  song,
  user,
  identity,
  onOrderCompleted,
  onDiscoverMore,
}) => {
  const shoutoutService = ShoutoutService.getInstance();
  const tiers = shoutoutService.getTiers();

  const [step, setStep] = useState<PurchaseStep>('choose_tier');
  const [selectedTierId, setSelectedTierId] = useState<TierId>('bronze');
  const [shoutoutText, setShoutoutText] = useState(`Big love to ${identity.display_name}!`);
  const [pronunciationGuide, setPronunciationGuide] = useState('');
  const [socialTag, setSocialTag] = useState(identity.handle);
  const [focusedInput, setFocusedInput] = useState<'shoutout' | 'pronounce' | 'social' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'apple_pay' | 'web3_wallet'>('credit_card');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [hasPendingDuplicate, setHasPendingDuplicate] = useState(false);

  // Commerce state
  const [createdOrder, setCreatedOrder] = useState<ShoutoutOrder | null>(null);
  const [completedShoutout, setCompletedShoutout] = useState<Shoutout | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const selectedTier = shoutoutService.getTier(selectedTierId)!;

  // Check for duplicate pending requests
  useEffect(() => {
    shoutoutService
      .hasDuplicatePendingOrder(identity.id, song.id, selectedTierId)
      .then(setHasPendingDuplicate);
  }, [selectedTierId, song.id, identity.id]);

  const handleCreateOrderAndProceedToReview = async () => {
    try {
      setIsProcessing(true);
      setPaymentError(null);
      const order = await shoutoutService.createOrder({
        userId: user.id,
        identityId: identity.id,
        songId: song.id,
        tier: selectedTierId,
        shoutoutText: shoutoutText.trim(),
        pronunciationGuide: pronunciationGuide.trim(),
        socialTag: selectedTierId === 'silver' ? socialTag.trim() : undefined,
        existingOrderId: createdOrder?.id,
      });
      setCreatedOrder(order);
      setStep('review');
    } catch (e: any) {
      setPaymentError(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecutePayment = async () => {
    if (!createdOrder) return;
    setIsProcessing(true);
    setPaymentError(null);

    // Simulate realistic escrow gateway processing
    setTimeout(async () => {
      try {
        const result = await shoutoutService.processPayment(
          createdOrder.id,
          createdOrder.idempotency_key,
          paymentMethod,
          simulateFailure
        );

        if (result.success && result.shoutout) {
          setCreatedOrder(result.order);
          setCompletedShoutout(result.shoutout);
          setStep('confirmation');
        } else {
          setPaymentError(result.error || 'Payment could not be confirmed.');
        }
      } catch (e: any) {
        setPaymentError(e.message || 'Payment failed.');
      } finally {
        setIsProcessing(false);
      }
    }, 1100);
  };

  const renderStepContent = () => {
    switch (step) {
      case 'choose_tier':
        return (
          <View>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>1. Choose Recognition Tier</Text>
              <Text style={styles.stepSubtitle}>
                Select how {song.artist_name} will feature your identity in &quot;{song.title}&quot;.
              </Text>
            </View>

            {hasPendingDuplicate && (
              <View style={styles.duplicateWarningBox}>
                <Ionicons name="information-circle" size={16} color={colors.warning} />
                <Text style={styles.duplicateWarningText}>
                  Note: You already have a pending {selectedTier.name} request for this song.
                </Text>
              </View>
            )}

            {tiers.map((tier) => (
              <TierCard
                key={tier.id}
                tier={tier}
                selected={selectedTierId === tier.id}
                onSelect={(id) => setSelectedTierId(id)}
              />
            ))}

            <TouchableOpacity
              style={styles.primaryNextBtn}
              onPress={() => setStep('details')}
            >
              <Text style={styles.primaryNextText}>Continue to Shoutout Details</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        );

      case 'details':
        return (
          <View>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>2. Personalize Shoutout</Text>
              <Text style={styles.stepSubtitle}>
                Tell {song.artist_name} what name to vocalize in &quot;{song.title}&quot;.
              </Text>
            </View>

            {paymentError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorTitle}>Submission Error</Text>
                  <Text style={styles.errorDesc}>{paymentError}</Text>
                </View>
              </View>
            )}

            <View style={styles.identitySummaryPill}>
              <Ionicons name="shield-checkmark" size={20} color={colors.secondaryLight} />
              <View style={{ flex: 1 }}>
                <Text style={styles.identitySummaryTitle}>One Global Identity For All Releases</Text>
                <Text style={styles.identitySummaryHandle}>
                  {identity.display_name} ({identity.handle})
                </Text>
                <Text style={styles.identitySummarySub}>
                  This shoutout is permanently linked to your unified profile across all artists.
                </Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Custom Shoutout Text / Dedication</Text>
                <Text
                  style={[
                    styles.charCountText,
                    shoutoutText.length > 100 && { color: colors.warning },
                  ]}
                >
                  {shoutoutText.length}/120
                </Text>
              </View>
              <TextInput
                style={[styles.textInput, focusedInput === 'shoutout' && styles.textInputFocused]}
                value={shoutoutText}
                onChangeText={(val) => setShoutoutText(val.slice(0, 120))}
                onFocus={() => setFocusedInput('shoutout')}
                onBlur={() => setFocusedInput(null)}
                placeholder="e.g. Big love to Sara K in the building!"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                maxLength={120}
                accessibilityLabel="Custom shoutout wording"
                accessibilityHint="Enter the dedication text you want the artist to say"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Pronunciation Guide (Recommended)</Text>
              <TextInput
                style={[styles.textInput, focusedInput === 'pronounce' && styles.textInputFocused]}
                value={pronunciationGuide}
                onChangeText={setPronunciationGuide}
                onFocus={() => setFocusedInput('pronounce')}
                onBlur={() => setFocusedInput(null)}
                placeholder="e.g. SAY-rah KAY (rhymes with day)"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                accessibilityLabel="Pronunciation guide"
                accessibilityHint="Phonetic spelling to help the artist pronounce your name correctly"
              />
              <Text style={styles.fieldHelper}>
                Helps the artist pronounce unfamiliar names or nicknames accurately in the recording booth.
              </Text>
            </View>

            {selectedTierId === 'silver' && (
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Social Media Tag (Included in Silver)</Text>
                <TextInput
                  style={[styles.textInput, focusedInput === 'social' && styles.textInputFocused]}
                  value={socialTag}
                  onChangeText={setSocialTag}
                  onFocus={() => setFocusedInput('social')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="@your_handle"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  autoCapitalize="none"
                  accessibilityLabel="Social media tag"
                  accessibilityHint="Your social media handle included in the track notes"
                />
              </View>
            )}

            <View style={styles.stepNavRow}>
              <TouchableOpacity
                style={styles.backStepBtn}
                onPress={() => setStep('choose_tier')}
                accessibilityRole="button"
                accessibilityLabel="Back to tier selection"
              >
                <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
                <Text style={styles.backStepText}>Tiers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryNextBtn, { flex: 1 }]}
                onPress={handleCreateOrderAndProceedToReview}
                disabled={isProcessing}
                accessibilityRole="button"
                accessibilityLabel="Continue to review order"
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryNextText}>Review Order</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'review':
        return (
          <View>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>3. Review Order Summary</Text>
              <Text style={styles.stepSubtitle}>
                Server-confirmed pricing & escrow reservation details.
              </Text>
            </View>

            <View style={styles.receiptCard}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Track</Text>
                <Text style={styles.receiptValue}>{song.title}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Artist</Text>
                <Text style={styles.receiptValue}>{song.artist_name}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Recognition Tier</Text>
                <Text style={styles.receiptValue}>{selectedTier.name}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Target Identity</Text>
                <Text style={styles.receiptValue}>{identity.handle}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Shoutout Wording</Text>
                <Text style={[styles.receiptValue, { fontStyle: 'italic' }]}>
                  &quot;{shoutoutText}&quot;
                </Text>
              </View>
              {selectedTierId === 'silver' && socialTag && (
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Social Tag</Text>
                  <Text style={styles.receiptValue}>{socialTag}</Text>
                </View>
              )}

              <View style={styles.receiptDivider} />

              {/* Itemized Inclusions to eliminate payment ambiguity */}
              <View style={styles.inclusionsBox}>
                <View style={styles.inclusionRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.inclusionText}>Artist studio vocal slot dedicated to your name</Text>
                </View>
                <View style={styles.inclusionRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.inclusionText}>Permanent inclusion in official track master</Text>
                </View>
                <View style={styles.inclusionRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.inclusionText}>Soulbound on-chain recognition proof</Text>
                </View>
                <View style={styles.inclusionRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.inclusionText}>
                    +{selectedTierId === 'silver' ? '200' : '100'} personal identity tokens
                  </Text>
                </View>
                <View style={styles.inclusionRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.inclusionText}>$0.00 platform gas & processing surcharge</Text>
                </View>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptRow}>
                <Text style={styles.totalLabel}>Total Escrow Amount (USD)</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.totalValue}>${selectedTier.price_usd}.00</Text>
                  <Text style={styles.totalSub}>~{selectedTier.price_eth} ETH equivalent</Text>
                </View>
              </View>
            </View>

            {/* Mandatory Approval Disclaimer from 02-fan-user-flow.md */}
            <View style={styles.disclaimerBox}>
              <Ionicons name="time-outline" size={20} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.disclaimerTitle}>Studio Approval Policy</Text>
                <Text style={styles.disclaimerText}>
                  Your shoutout is submitted to {song.artist_name}. It becomes active after the artist approves and records it. In the rare event of artist rejection, your payment is 100% refunded.
                </Text>
              </View>
            </View>

            <View style={styles.stepNavRow}>
              <TouchableOpacity
                style={styles.backStepBtn}
                onPress={() => setStep('details')}
                accessibilityRole="button"
                accessibilityLabel="Back to shoutout details"
              >
                <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
                <Text style={styles.backStepText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryNextBtn, { flex: 1 }]}
                onPress={() => setStep('payment')}
                accessibilityRole="button"
                accessibilityLabel="Proceed to payment"
              >
                <Text style={styles.primaryNextText}>Proceed to Payment</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'payment':
        return (
          <View>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>4. Complete Payment</Text>
              <Text style={styles.stepSubtitle}>
                Select your payment method. Funds are held in escrow until approved.
              </Text>
            </View>

            {/* Actionable Error Recovery Banner */}
            {paymentError && (
              <View style={styles.errorBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="alert-circle" size={20} color={colors.danger} />
                  <Text style={styles.errorTitle}>Payment Not Completed</Text>
                </View>
                <Text style={styles.errorDesc}>{paymentError}</Text>
                <View style={styles.errorActionsRow}>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={handleExecutePayment}
                    accessibilityRole="button"
                    accessibilityLabel="Retry payment attempt"
                  >
                    <Ionicons name="refresh" size={14} color="#FFFFFF" />
                    <Text style={styles.retryBtnText}>Retry Payment</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.switchMethodBtn}
                    onPress={() => {
                      const next = paymentMethod === 'credit_card' ? 'apple_pay' : 'credit_card';
                      setPaymentMethod(next);
                      setPaymentError(null);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Switch payment method"
                  >
                    <Ionicons name="swap-horizontal" size={14} color={colors.secondaryLight} />
                    <Text style={styles.switchMethodBtnText}>
                      Try {paymentMethod === 'credit_card' ? 'Apple Pay' : 'Card'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Payment Method Selector */}
            <View style={styles.methodList}>
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  paymentMethod === 'credit_card' && styles.methodCardActive,
                ]}
                onPress={() => setPaymentMethod('credit_card')}
                accessibilityRole="radio"
                accessibilityState={{ selected: paymentMethod === 'credit_card' }}
                accessibilityLabel="Credit or debit card payment"
              >
                <Ionicons name="card" size={20} color={colors.textPrimary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>Credit / Debit Card</Text>
                  <Text style={styles.methodSub}>Instant fiat escrow processing</Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    paymentMethod === 'credit_card' && styles.radioCircleActive,
                  ]}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodCard,
                  paymentMethod === 'apple_pay' && styles.methodCardActive,
                ]}
                onPress={() => setPaymentMethod('apple_pay')}
                accessibilityRole="radio"
                accessibilityState={{ selected: paymentMethod === 'apple_pay' }}
                accessibilityLabel="Apple Pay one touch biometric checkout"
              >
                <Ionicons name="logo-apple" size={20} color={colors.textPrimary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>Apple Pay</Text>
                  <Text style={styles.methodSub}>One-touch biometric checkout</Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    paymentMethod === 'apple_pay' && styles.radioCircleActive,
                  ]}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodCard,
                  paymentMethod === 'web3_wallet' && styles.methodCardActive,
                ]}
                onPress={() => setPaymentMethod('web3_wallet')}
                accessibilityRole="radio"
                accessibilityState={{ selected: paymentMethod === 'web3_wallet' }}
                accessibilityLabel="Web3 smart escrow payment with cryptocurrency"
              >
                <Ionicons name="wallet" size={20} color={colors.secondaryLight} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>Web3 Smart Escrow</Text>
                  <Text style={styles.methodSub}>
                    Pay ~{selectedTier.price_eth} ETH from {user.wallet_address.slice(0, 8)}...
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    paymentMethod === 'web3_wallet' && styles.radioCircleActive,
                  ]}
                />
              </TouchableOpacity>
            </View>

            {/* Escrow Protection Guarantee Banner */}
            <View style={styles.escrowSecurityBanner}>
              <View style={styles.escrowSecurityHeader}>
                <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                <Text style={styles.escrowSecurityTitle}>100% Escrow Protection Guaranteed</Text>
              </View>
              <Text style={styles.escrowSecurityDesc}>
                Your funds remain safely locked in escrow and are only transferred after {song.artist_name} approves and records your name. If declined, you are immediately refunded in full.
              </Text>
              <View style={styles.encryptionRow}>
                <Ionicons name="lock-closed" size={12} color={colors.textMuted} />
                <Text style={styles.encryptionText}>256-Bit SSL Encrypted Escrow Gateway · Zero Gas Surcharge</Text>
              </View>
            </View>

            {/* Test helper checkbox to simulate failure */}
            <TouchableOpacity
              style={styles.testSimRow}
              onPress={() => setSimulateFailure(!simulateFailure)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: simulateFailure }}
              accessibilityLabel="Developer simulation: simulate card decline failure"
            >
              <Ionicons
                name={simulateFailure ? 'checkbox' : 'square-outline'}
                size={16}
                color={colors.warning}
              />
              <Text style={styles.testSimText}>
                Dev test: Simulate card decline failure
              </Text>
            </TouchableOpacity>

            <View style={styles.stepNavRow}>
              <TouchableOpacity
                style={styles.backStepBtn}
                onPress={() => setStep('review')}
                disabled={isProcessing}
              >
                <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
                <Text style={styles.backStepText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryPayBtn, isProcessing && styles.primaryPayBtnDisabled]}
                onPress={handleExecutePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.primaryPayText}>Authorizing Escrow...</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryPayText}>
                      Pay ${selectedTier.price_usd}.00 & Submit
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'confirmation':
        return (
          <View style={styles.confirmationWrapper}>
            <View style={styles.confirmBadge}>
              <Ionicons name="checkmark-circle" size={54} color={colors.success} />
            </View>

            <Text style={styles.confirmHeading}>Your shoutout request is in.</Text>
            <Text style={styles.confirmSubtitle}>
              Your payment of ${selectedTier.price_usd}.00 has been confirmed and placed in escrow.
            </Text>

            <View style={styles.confirmCard}>
              <View style={styles.confirmItem}>
                <Ionicons name="shield-checkmark" size={18} color={colors.success} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.confirmItemTitle}>Payment Confirmed</Text>
                  <Text style={styles.confirmItemDesc}>
                    Escrow ID: {createdOrder?.payment_provider_reference || 'PAY-CONFIRMED'}
                  </Text>
                </View>
              </View>

              <View style={styles.confirmItem}>
                <Ionicons name="hourglass" size={18} color={colors.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.confirmItemTitle}>Waiting for Artist Review</Text>
                  <Text style={styles.confirmItemDesc}>
                    {song.artist_name} has received your request and will schedule recording.
                  </Text>
                </View>
              </View>

              <View style={styles.confirmItem}>
                <Ionicons name="musical-note" size={18} color={colors.secondaryLight} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.confirmItemTitle}>Shoutout is Not Live Yet</Text>
                  <Text style={styles.confirmItemDesc}>
                    It will become audible in the master release once recorded and published.
                  </Text>
                </View>
              </View>

              <View style={styles.confirmItem}>
                <Ionicons name="cube-outline" size={18} color={colors.primaryLight} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.confirmItemTitle}>Token Mint Pending Confirmation</Text>
                  <Text style={styles.confirmItemDesc}>
                    Soulbound proof & token reward will be minted when the release goes live.
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewRequestBtn}
              onPress={() => {
                if (createdOrder && completedShoutout) {
                  onOrderCompleted(createdOrder, completedShoutout.id);
                }
                onClose();
              }}
            >
              <Text style={styles.viewRequestText}>View Request & Lifecycle Tracker</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.confirmActionsRow}>
              <TouchableOpacity style={styles.secondaryActionBtn} onPress={onClose}>
                <Ionicons name="arrow-back" size={14} color={colors.textSecondary} />
                <Text style={styles.secondaryActionText}>Back to Song</Text>
              </TouchableOpacity>

              {onDiscoverMore && (
                <TouchableOpacity
                  style={styles.secondaryActionBtn}
                  onPress={() => {
                    onClose();
                    onDiscoverMore();
                  }}
                >
                  <Ionicons name="compass-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.secondaryActionText}>Discover More</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <View style={styles.sheetTopBar}>
            <View style={styles.stepperIndicator}>
              {(['choose_tier', 'details', 'review', 'payment', 'confirmation'] as PurchaseStep[]).map(
                (s, i) => (
                  <View
                    key={s}
                    style={[
                      styles.stepperDot,
                      step === s && styles.stepperDotActive,
                      i <
                        ['choose_tier', 'details', 'review', 'payment', 'confirmation'].indexOf(
                          step
                        ) && styles.stepperDotDone,
                    ]}
                  />
                )
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.sheetBody}
          >
            {renderStepContent()}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 13, 0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: colors.cardBorder,
    maxHeight: '92%',
  },
  sheetTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorderSubtle,
  },
  stepperIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperDot: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cardBorder,
  },
  stepperDotActive: {
    backgroundColor: colors.secondaryLight,
    width: 24,
  },
  stepperDotDone: {
    backgroundColor: colors.primary,
  },
  closeBtn: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    padding: 20,
  },
  stepHeader: {
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  stepSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  duplicateWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginBottom: 12,
  },
  duplicateWarningText: {
    fontSize: 11,
    color: colors.warning,
    flex: 1,
  },
  primaryNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  primaryNextText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  identitySummaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 16,
  },
  identitySummaryTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondaryLight,
    textTransform: 'uppercase',
  },
  identitySummaryHandle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  identitySummarySub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 15,
  },
  formGroup: {
    marginBottom: 14,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  charCountText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  fieldHelper: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 15,
  },
  textInput: {
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
  textInputFocused: {
    borderColor: '#FFFFFF',
  },
  stepNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  backStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  backStepText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  receiptCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  receiptLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    maxWidth: '65%',
    textAlign: 'right',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: 10,
  },
  inclusionsBox: {
    gap: 6,
    marginVertical: 4,
    paddingHorizontal: 2,
  },
  inclusionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inclusionText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.secondaryLight,
  },
  totalSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  disclaimerBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
    marginBottom: 2,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  errorDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  errorActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  switchMethodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  switchMethodBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryLight,
  },
  escrowSecurityBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  escrowSecurityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  escrowSecurityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  escrowSecurityDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  encryptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  encryptionText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  methodList: {
    gap: 10,
    marginBottom: 14,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  methodCardActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 79, 46, 0.08)',
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  methodSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.textMuted,
  },
  radioCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  testSimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },
  testSimText: {
    fontSize: 12,
    color: colors.warning,
  },
  primaryPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryPayBtnDisabled: {
    opacity: 0.6,
  },
  primaryPayText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Confirmation step styles
  confirmationWrapper: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  confirmBadge: {
    marginBottom: 12,
  },
  confirmHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  confirmSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  confirmCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    gap: 14,
    marginBottom: 20,
  },
  confirmItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  confirmItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  confirmItemDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  viewRequestBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  viewRequestText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  confirmActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
