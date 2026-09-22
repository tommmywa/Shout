import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { ShoutoutStatus } from '../types';

interface ShoutoutStatusTimelineProps {
  status: ShoutoutStatus;
  mintTx?: string;
  timestampSeconds?: number;
}

interface Milestone {
  key: string;
  label: string;
  description: string;
  isReached: (s: ShoutoutStatus) => boolean;
  isCurrent: (s: ShoutoutStatus) => boolean;
}

export const ShoutoutStatusTimeline: React.FC<ShoutoutStatusTimelineProps> = ({
  status,
  mintTx,
  timestampSeconds,
}) => {
  const milestones: Milestone[] = [
    {
      key: 'paid',
      label: 'Payment confirmed',
      description: 'Order paid & reserved securely in escrow',
      isReached: (s) =>
        ['paid', 'pending_artist_review', 'approved', 'published', 'mint_pending', 'minted'].includes(s),
      isCurrent: (s) => s === 'paid',
    },
    {
      key: 'pending_artist_review',
      label: 'Waiting for artist',
      description: 'Artist has received your shoutout and is scheduling recording',
      isReached: (s) =>
        ['pending_artist_review', 'approved', 'published', 'mint_pending', 'minted'].includes(s),
      isCurrent: (s) => s === 'pending_artist_review',
    },
    {
      key: 'approved',
      label: 'Artist approved',
      description: 'Artist accepted the shoutout! Recording in studio session',
      isReached: (s) => ['approved', 'published', 'mint_pending', 'minted'].includes(s),
      isCurrent: (s) => s === 'approved',
    },
    {
      key: 'published',
      label: 'Shoutout is live',
      description: timestampSeconds
        ? `Voiced in track audio at ${Math.floor(timestampSeconds / 60)}:${(timestampSeconds % 60).toString().padStart(2, '0')}`
        : 'Voiced and integrated into official song release',
      isReached: (s) => ['published', 'mint_pending', 'minted'].includes(s),
      isCurrent: (s) => s === 'published',
    },
    {
      key: 'mint_pending',
      label: 'Recognition being recorded',
      description: 'Mint transaction broadcasted to blockchain network escrow',
      isReached: (s) => ['mint_pending', 'minted'].includes(s),
      isCurrent: (s) => s === 'mint_pending',
    },
    {
      key: 'minted',
      label: 'Recognition added',
      description: mintTx
        ? `Soulbound proof confirmed on-chain (${mintTx.slice(0, 8)}...${mintTx.slice(-6)})`
        : 'Global Identity updated & Token reward delivered',
      isReached: (s) => s === 'minted',
      isCurrent: (s) => s === 'minted',
    },
  ];

  const isRejected = status === 'rejected' || status === 'refunded';

  return (
    <View style={styles.container}>
      {isRejected ? (
        <View style={styles.rejectedBanner}>
          <Ionicons name="alert-circle" size={24} color={colors.danger} />
          <View style={styles.rejectedInfo}>
            <Text style={styles.rejectedTitle}>
              {status === 'refunded' ? 'Payment Refunded' : 'Request Declined by Artist'}
            </Text>
            <Text style={styles.rejectedDesc}>
              The artist could not accommodate this shoutout in their release. A full refund has been initiated to your original payment method.
            </Text>
          </View>
        </View>
      ) : (
        milestones.map((milestone, index) => {
          const reached = milestone.isReached(status);
          const current = milestone.isCurrent(status);
          const isLast = index === milestones.length - 1;

          return (
            <View key={milestone.key} style={styles.stepRow}>
              {/* Timeline marker column */}
              <View style={styles.markerColumn}>
                <View
                  style={[
                    styles.nodeCircle,
                    reached && styles.nodeCircleReached,
                    current && styles.nodeCircleCurrent,
                  ]}
                >
                  {reached && !current ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : current ? (
                    <View style={styles.activeDot} />
                  ) : (
                    <View style={styles.pendingDot} />
                  )}
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.connectorLine,
                      reached && styles.connectorLineReached,
                    ]}
                  />
                )}
              </View>

              {/* Step info column */}
              <View style={styles.contentColumn}>
                <View style={styles.stepTitleRow}>
                  <Text
                    style={[
                      styles.stepLabel,
                      reached && styles.stepLabelReached,
                      current && styles.stepLabelCurrent,
                    ]}
                  >
                    {milestone.label}
                  </Text>
                  {current && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>IN PROGRESS</Text>
                    </View>
                  )}
                  {reached && !current && (
                    <Ionicons name="checkmark-done" size={16} color={colors.success} />
                  )}
                </View>
                <Text style={styles.stepDesc}>{milestone.description}</Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 18,
    marginVertical: 12,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 58,
  },
  markerColumn: {
    alignItems: 'center',
    width: 28,
  },
  nodeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textMuted,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeCircleReached: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  nodeCircleCurrent: {
    borderColor: colors.secondaryLight,
    backgroundColor: colors.backgroundElevated,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondaryLight,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.cardBorderSubtle,
    marginVertical: 2,
  },
  connectorLineReached: {
    backgroundColor: colors.primary,
  },
  contentColumn: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  stepLabelReached: {
    color: colors.textPrimary,
  },
  stepLabelCurrent: {
    color: colors.secondaryLight,
    fontWeight: '800',
  },
  activeBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.secondaryLight,
    letterSpacing: 0.5,
  },
  stepDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  rejectedBanner: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  rejectedInfo: {
    flex: 1,
  },
  rejectedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
    marginBottom: 4,
  },
  rejectedDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
