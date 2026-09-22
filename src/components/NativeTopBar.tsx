import React from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface NativeTopBarProps {
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  showBorder?: boolean;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  backLabel?: string;
  applyTopInset?: boolean;
}

export const NativeTopBar: React.FC<NativeTopBarProps> = ({
  onBack,
  title,
  subtitle,
  rightAction,
  showBorder = false,
  backgroundColor = 'transparent',
  style,
  backLabel,
  applyTopInset = true,
}) => {
  const insets = useSafeAreaInsets();
  const barHeight = Platform.select({ ios: 44, default: 48 });

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingTop: applyTopInset ? insets.top : 0,
          backgroundColor,
          borderBottomWidth: showBorder ? StyleSheet.hairlineWidth : 0,
        },
        style,
      ]}
    >
      <View style={[styles.barContent, { height: barHeight }]}>
        {/* Left: Back Navigation Arrow */}
        <View style={styles.leftContainer}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
              accessibilityRole="button"
              accessibilityLabel={backLabel || 'Go back'}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              {backLabel ? <Text style={styles.backLabelText}>{backLabel}</Text> : null}
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Center: Title / Subtitle */}
        <View style={styles.centerContainer} pointerEvents="none">
          {title ? (
            <Text style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={styles.subtitleText} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Right: Action or symmetry spacer */}
        <View style={styles.rightContainer}>
          {rightAction || null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 50,
  },
  barContent: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftContainer: {
    minWidth: 44,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    height: 40,
    justifyContent: 'center',
  },
  backLabelText: {
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 2,
    fontWeight: '400',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 1,
    textAlign: 'center',
  },
  rightContainer: {
    minWidth: 44,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});
