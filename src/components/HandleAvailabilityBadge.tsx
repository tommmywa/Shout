import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface HandleAvailabilityBadgeProps {
  status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
  reason?: string;
  handle?: string;
  suggestions?: string[];
  onSelectSuggestion?: (suggestion: string) => void;
}

export const HandleAvailabilityBadge: React.FC<HandleAvailabilityBadgeProps> = ({
  status,
  reason,
  handle,
  suggestions = [],
  onSelectSuggestion,
}) => {
  if (status === 'idle') {
    return (
      <View style={styles.container}>
        <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
        <Text style={styles.idleText}>Choose a unique global name identifier</Text>
      </View>
    );
  }

  if (status === 'checking') {
    return (
      <View style={[styles.container, styles.checkingContainer]}>
        <ActivityIndicator size="small" color={colors.secondaryLight} />
        <Text style={styles.checkingText}>Checking availability...</Text>
      </View>
    );
  }

  if (status === 'available') {
    return (
      <View style={[styles.container, styles.availableContainer]}>
        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
        <Text style={styles.availableText}>{handle} is available to claim!</Text>
      </View>
    );
  }

  if (status === 'taken') {
    return (
      <View style={styles.takenWrapper}>
        <View style={[styles.container, styles.takenContainer]}>
          <Ionicons name="close-circle" size={16} color={colors.danger} />
          <Text style={styles.takenText}>{reason || 'This handle is already claimed.'}</Text>
        </View>

        {suggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            <Text style={styles.suggestionsHeader}>Available alternatives (tap to select):</Text>
            <View style={styles.suggestionsList}>
              {suggestions.map((sug) => (
                <TouchableOpacity
                  key={sug}
                  style={styles.suggestionPill}
                  onPress={() => onSelectSuggestion && onSelectSuggestion(sug)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Claim suggested handle ${sug}`}
                  accessibilityHint="Fills this handle into the input field"
                >
                  <Ionicons name="sparkles" size={13} color={colors.secondaryLight} />
                  <Text style={styles.suggestionPillText}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.invalidContainer]}>
      <Ionicons name="alert-circle" size={16} color={colors.warning} />
      <Text style={styles.invalidText}>{reason || 'Invalid handle format.'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  takenWrapper: {
    marginTop: 4,
  },
  idleText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  checkingContainer: {
    paddingVertical: 2,
  },
  checkingText: {
    fontSize: 12,
    color: colors.secondaryLight,
  },
  availableContainer: {
    paddingVertical: 2,
  },
  availableText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  takenContainer: {
    paddingVertical: 2,
  },
  takenText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '500',
  },
  invalidContainer: {
    paddingVertical: 2,
  },
  invalidText: {
    fontSize: 12,
    color: colors.warning,
  },
  suggestionsBox: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  suggestionsHeader: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: 22,
  },
  suggestionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondaryLight,
  },
});
