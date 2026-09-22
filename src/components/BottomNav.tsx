import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

interface BottomNavProps {
  currentTab: 'discover' | 'my_shoutouts' | 'my_identity';
  onSelectTab: (tab: 'discover' | 'my_shoutouts' | 'my_identity') => void;
  pendingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  pendingCount = 0,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.outerContainer, { paddingBottom: bottomInset }]}>
      {/* Native Liquid Glass Backdrop */}
      <BlurView
        intensity={Platform.OS === 'ios' ? 80 : 95}
        tint={Platform.OS === 'ios' ? 'systemMaterialDark' : 'dark'}
        style={StyleSheet.absoluteFill}
      />

      {/* Glass Tint & Specular Rim Highlight */}
      <View style={styles.glassTintOverlay} pointerEvents="none" />
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.22)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.specularRim}
        pointerEvents="none"
      />

      <View style={styles.navContent}>
        {/* Discover Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onSelectTab('discover')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Discover tab"
        >
          <View
            style={[
              styles.iconWrapper,
              currentTab === 'discover' && styles.iconWrapperActive,
            ]}
          >
            <Ionicons
              name={currentTab === 'discover' ? 'compass' : 'compass-outline'}
              size={22}
              color={currentTab === 'discover' ? '#FF5736' : 'rgba(255, 255, 255, 0.45)'}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'discover' && styles.tabLabelActive,
            ]}
          >
            Discover
          </Text>
        </TouchableOpacity>

        {/* My Shoutouts Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onSelectTab('my_shoutouts')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="My Shoutouts tab"
        >
          <View
            style={[
              styles.iconWrapper,
              currentTab === 'my_shoutouts' && styles.iconWrapperActive,
            ]}
          >
            <Ionicons
              name={currentTab === 'my_shoutouts' ? 'flame' : 'flame-outline'}
              size={22}
              color={currentTab === 'my_shoutouts' ? '#FF5736' : 'rgba(255, 255, 255, 0.45)'}
            />
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'my_shoutouts' && styles.tabLabelActive,
            ]}
          >
            My Shoutouts
          </Text>
        </TouchableOpacity>

        {/* Global Identity Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onSelectTab('my_identity')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Global Identity tab"
        >
          <View
            style={[
              styles.iconWrapper,
              currentTab === 'my_identity' && styles.iconWrapperActive,
            ]}
          >
            <Ionicons
              name={currentTab === 'my_identity' ? 'finger-print' : 'finger-print-outline'}
              size={22}
              color={currentTab === 'my_identity' ? '#FF5736' : 'rgba(255, 255, 255, 0.45)'}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'my_identity' && styles.tabLabelActive,
            ]}
          >
            Identity
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.14)',
    zIndex: 40,
  },
  glassTintOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(14, 16, 22, 0.72)' : 'rgba(14, 16, 22, 0.92)',
  },
  specularRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  navContent: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 14,
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(255, 87, 54, 0.15)',
  },
  tabLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 3,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 4,
    backgroundColor: colors.primary,
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#0E1016',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
});
