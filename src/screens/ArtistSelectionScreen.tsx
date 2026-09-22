import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeTopBar } from '../components/NativeTopBar';
import { colors } from '../theme/colors';

interface ArtistItem {
  id: string;
  name: string;
  avatar_url: string;
  tracks: number;
  followers: string;
}

interface ArtistSelectionScreenProps {
  onContinue: (followedArtistIds: string[]) => void;
  onBack?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;
const GRID_GAP = 8;
const CARD_WIDTH = Math.floor(
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GRID_GAP * 2) / 3
);

const CURATED_ARTISTS: ArtistItem[] = [
  {
    id: 'artist-mike',
    name: 'Mike_Music',
    avatar_url:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80',
    tracks: 16,
    followers: '11.2k',
  },
  {
    id: 'artist-aura',
    name: 'Aura Nova',
    avatar_url:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
    tracks: 22,
    followers: '18.4k',
  },
  {
    id: 'artist-kyro',
    name: 'Kyro Beats',
    avatar_url:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
    tracks: 29,
    followers: '24.9k',
  },
  {
    id: 'artist-kairos',
    name: 'KAIROS',
    avatar_url:
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&q=80',
    tracks: 14,
    followers: '9.8k',
  },
  {
    id: 'artist-amara',
    name: 'Amara Vance',
    avatar_url:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80',
    tracks: 19,
    followers: '32.1k',
  },
  {
    id: 'artist-tariq',
    name: 'Tariq Vega',
    avatar_url:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80',
    tracks: 31,
    followers: '45.0k',
  },
  {
    id: 'artist-luna',
    name: 'Luna Mirage',
    avatar_url:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&q=80',
    tracks: 12,
    followers: '8.5k',
  },
  {
    id: 'artist-neon',
    name: 'Neon District',
    avatar_url:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
    tracks: 27,
    followers: '19.6k',
  },
  {
    id: 'artist-vance',
    name: 'Vance Sterling',
    avatar_url:
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&q=80',
    tracks: 18,
    followers: '15.3k',
  },
  {
    id: 'artist-elena',
    name: 'Elena Ray',
    avatar_url:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80',
    tracks: 25,
    followers: '21.0k',
  },
  {
    id: 'artist-marcus',
    name: 'Marcus Thorne',
    avatar_url:
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&q=80',
    tracks: 15,
    followers: '13.7k',
  },
  {
    id: 'artist-sol',
    name: 'Luna Sol',
    avatar_url:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80',
    tracks: 33,
    followers: '38.2k',
  },
];

export const ArtistSelectionScreen: React.FC<ArtistSelectionScreenProps> = ({
  onContinue,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const [followedArtistIds, setFollowedArtistIds] = useState<string[]>([]);

  const toggleFollow = (artistId: string) => {
    setFollowedArtistIds((prev) =>
      prev.includes(artistId)
        ? prev.filter((id) => id !== artistId)
        : [...prev, artistId]
    );
  };

  const isContinueEnabled = followedArtistIds.length >= 3;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0C10" />

      {/* Native Top Bar with Back Arrow */}
      <NativeTopBar onBack={onBack} />

      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Circular Icon Frame matching Figma Group 1 */}
          <View style={styles.iconSection}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="people"
                size={36}
                color="rgba(255, 255, 255, 0.4)"
              />
            </View>
          </View>

          {/* Title & Subtitle Section matching Figma Frame 10 */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Follow at least 3 artists</Text>
            <Text style={styles.subtitle}>Scroll to see more</Text>
          </View>

          {/* 3-Column Artists Grid matching Figma Frame 88 */}
          <View style={styles.gridContainer}>
            {CURATED_ARTISTS.map((artist) => {
              const isFollowed = followedArtistIds.includes(artist.id);

              return (
                <View key={artist.id} style={styles.cardWrapper}>
                  <View style={styles.card}>
                    {/* Avatar with Angular Gradient Border Ring */}
                    <LinearGradient
                      colors={['#FF4F2E', '#FFC857', '#CEF7A0', '#7DF687']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.avatarGradientRing}
                    >
                      <Image
                        source={{ uri: artist.avatar_url }}
                        style={styles.avatarImage}
                      />
                    </LinearGradient>

                    {/* Artist Name & Stats */}
                    <View style={styles.infoSection}>
                      <Text style={styles.artistName} numberOfLines={1}>
                        {artist.name}
                      </Text>

                      <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                          <Ionicons
                            name="musical-notes"
                            size={10}
                            color="#8E8E93"
                          />
                          <Text style={styles.statText}>{artist.tracks}</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                          <Ionicons name="person" size={10} color="#8E8E93" />
                          <Text style={styles.statText}>{artist.followers}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Follow / Following Pill Button matching Figma node 2097:1707 */}
                    <TouchableOpacity
                      onPress={() => toggleFollow(artist.id)}
                      activeOpacity={0.75}
                      style={[
                        styles.followButton,
                        isFollowed
                          ? styles.followingButton
                          : styles.unfollowedButton,
                      ]}
                    >
                      <Feather
                        name={isFollowed ? 'user-check' : 'user-plus'}
                        size={11}
                        color="#FFFFFF"
                      />
                      <Text
                        style={[
                          styles.followButtonText,
                          isFollowed ? styles.followingButtonText : null,
                        ]}
                      >
                        {isFollowed ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Bottom spacing for sticky action */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Floating Bar matching Figma Frame 90 */}
        <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Followed Counter */}
          <Text
            style={[
              styles.counterText,
              isContinueEnabled ? styles.counterTextActive : null,
            ]}
          >
            {`${followedArtistIds.length}/3 followed`}
          </Text>

          {/* Continue CTA */}
          <TouchableOpacity
            onPress={() => onContinue(followedArtistIds)}
            disabled={!isContinueEnabled}
            activeOpacity={0.88}
            style={[
              styles.continueButton,
              isContinueEnabled
                ? styles.continueButtonActive
                : styles.continueButtonDisabled,
            ]}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C10',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: 'Plus Jakarta Sans',
      default: 'System',
    }),
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.select({
      ios: 'Plus Jakarta Sans',
      default: 'System',
    }),
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    justifyContent: 'flex-start',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#1C1C1C',
    borderRadius: 10,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    width: '100%',
  },
  avatarGradientRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2A2A2A',
  },
  infoSection: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  artistName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 8,
    backgroundColor: '#3A3A3C',
    marginHorizontal: 1,
  },
  followButton: {
    width: '100%',
    height: 30,
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  unfollowedButton: {
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  followingButton: {
    backgroundColor: '#292929',
    borderWidth: 0,
  },
  followButtonText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: Platform.select({
      ios: 'Plus Jakarta Sans',
      default: 'System',
    }),
  },
  followingButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(11, 12, 16, 0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  counterText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 14,
    fontWeight: '500',
    fontFamily: Platform.select({
      ios: 'Plus Jakarta Sans',
      default: 'System',
    }),
  },
  counterTextActive: {
    color: '#34C759',
    fontWeight: '600',
  },
  continueButton: {
    height: 52,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  continueButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(255, 79, 46, 0.35)',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({
      ios: 'Plus Jakarta Sans',
      default: 'System',
    }),
  },
});
