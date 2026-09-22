import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlobalIdentity, User } from '../types';

interface HeaderProps {
  user: User | null;
  identity: GlobalIdentity | null;
  onOpenIdentitySetup: () => void;
  onOpenAuth: () => void;
  onOpenDevSheet: () => void;
  onOpenOnboarding?: () => void;
  onOpenMyIdentity: () => void;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  identity,
  onOpenIdentitySetup,
  onOpenAuth,
  onOpenDevSheet,
  onOpenOnboarding,
  onOpenMyIdentity,
  onOpenSearch,
}) => {
  const firstName = user?.display_name?.trim()
    ? user.display_name.trim().split(' ')[0]
    : 'Alex';

  return (
    <View style={styles.container}>
      {/* Left Section: Greeting & Identity Chip (matching Figma Frame 58) */}
      <View style={styles.leftSection}>
        {/* User Greeting (matching Frame 20) */}
        <TouchableOpacity
          style={styles.greetingTouch}
          onPress={onOpenAuth}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`User greeting for ${firstName}`}
        >
          {identity?.avatar_url ? (
            <Image
              source={{ uri: identity.avatar_url }}
              style={styles.avatarImage}
            />
          ) : null}
          <Text style={styles.greetingText}>{`Hi ${firstName}`}</Text>
        </TouchableOpacity>

        {/* Identity Chip or Claim @ID Button (matching Frame 22) */}
        {identity ? (
          <TouchableOpacity
            style={styles.identityChip}
            onPress={onOpenMyIdentity}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Active identity ${identity.handle}`}
          >
            <View style={styles.verifiedDot} />
            <Text style={styles.identityHandle} numberOfLines={1}>
              {identity.handle}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.claimChip}
            onPress={onOpenIdentitySetup}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Claim Global Identity"
          >
            <Ionicons name="add" size={14} color="#FF4F2E" />
            <Text style={styles.claimText}>Claim ID</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Right Section: Dev Button, Search Icon & Notification Icon */}
      <View style={styles.rightSection}>
        {/* Quick return to onboarding if provided */}
        {onOpenOnboarding ? (
          <TouchableOpacity
            style={styles.iconCircleButton}
            onPress={onOpenOnboarding}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Replay onboarding flow"
          >
            <Ionicons name="sparkles" size={16} color="#FFC857" />
          </TouchableOpacity>
        ) : null}

        {/* Developer Simulation Controls Button (preserved as requested) */}
        <TouchableOpacity
          style={styles.devButton}
          onPress={onOpenDevSheet}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open Developer Simulation Controls"
        >
          <Ionicons name="flask-outline" size={14} color="#FFC857" />
          <Text style={styles.devText}>Dev</Text>
        </TouchableOpacity>

        {/* Search Icon next to Notification Icon */}
        <TouchableOpacity
          style={styles.iconCircleButton}
          onPress={onOpenSearch}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open Search"
        >
          <Ionicons name="search-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Notification Bell Icon (matching Frame 21) */}
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={onOpenAuth}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#0B0C10',
    zIndex: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greetingTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  greetingText: {
    fontFamily: Platform.select({
      ios: 'System',
      default: 'sans-serif',
    }),
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  identityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  identityHandle: {
    fontFamily: Platform.select({
      ios: 'System',
      default: 'sans-serif',
    }),
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  claimChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  claimText: {
    fontFamily: Platform.select({
      ios: 'System',
      default: 'sans-serif',
    }),
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 10,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 87, 0.25)',
  },
  devText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFC857',
    letterSpacing: 0.2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  // Search bar mode styles
  headerSearchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    borderRadius: 99,
    paddingHorizontal: 12,
    height: 38,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: -0.4,
    paddingVertical: 0,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  headerClearBtn: {
    padding: 4,
  },
  headerCancelBtn: {
    paddingLeft: 12,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  headerCancelText: {
    color: '#FF4F2E',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
});
