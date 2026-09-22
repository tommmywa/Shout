import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { TierConfig, TierId } from '../types';

interface TierCardProps {
  tier: TierConfig;
  selected: boolean;
  onSelect: (id: TierId) => void;
}

export const TierCard: React.FC<TierCardProps> = ({ tier, selected, onSelect }) => {
  const isAvailable = tier.available_in_mvp;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
        !isAvailable && styles.cardDisabled,
      ]}
      onPress={() => isAvailable && onSelect(tier.id)}
      disabled={!isAvailable}
      activeOpacity={0.8}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: !isAvailable }}
      accessibilityLabel={`${tier.name}, price $${tier.price_usd}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.badgePill, { backgroundColor: tier.badge_color + '22', borderColor: tier.badge_color }]}>
            <Text style={[styles.badgeText, { color: tier.badge_color }]}>{tier.name}</Text>
          </View>
          {!isAvailable && (
            <View style={styles.phase2Badge}>
              <Text style={styles.phase2Text}>Phase 2</Text>
            </View>
          )}
        </View>

        <View style={styles.priceGroup}>
          <Text style={styles.priceUsd}>${tier.price_usd}</Text>
          <Text style={styles.priceEth}>~{tier.price_eth} ETH</Text>
        </View>
      </View>

      <Text style={styles.description}>{tier.description}</Text>

      <View style={styles.divider} />

      <View style={styles.benefitsList}>
        {tier.benefits.map((benefit, idx) => (
          <View key={idx} style={styles.benefitItem}>
            <Ionicons
              name={isAvailable ? 'checkmark-circle' : 'lock-closed-outline'}
              size={14}
              color={isAvailable ? colors.success : colors.textMuted}
            />
            <Text
              style={[
                styles.benefitText,
                !isAvailable && styles.benefitTextDisabled,
              ]}
            >
              {benefit}
            </Text>
          </View>
        ))}
      </View>

      {isAvailable && (
        <View style={styles.selectRow}>
          <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
            {selected && <View style={styles.radioDot} />}
          </View>
          <Text style={[styles.selectText, selected && styles.selectTextActive]}>
            {selected ? 'Selected Tier' : 'Tap to Choose'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#14151B',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 14,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 79, 46, 0.08)',
  },
  cardDisabled: {
    opacity: 0.55,
    backgroundColor: '#0E1015',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  phase2Badge: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  phase2Text: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  priceGroup: {
    alignItems: 'flex-end',
  },
  priceUsd: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  priceEth: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorderSubtle,
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
    marginBottom: 14,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 12,
    color: colors.textPrimary,
    flex: 1,
  },
  benefitTextDisabled: {
    color: colors.textMuted,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  selectText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  selectTextActive: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
});
