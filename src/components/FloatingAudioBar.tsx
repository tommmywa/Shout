import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { AudioPlaybackState } from '../services/audio';

interface FloatingAudioBarProps {
  playbackState: AudioPlaybackState;
  onTogglePlay: () => void;
  onOpenFullPlayer: () => void;
}

export const FloatingAudioBar: React.FC<FloatingAudioBarProps> = ({
  playbackState,
  onTogglePlay,
  onOpenFullPlayer,
}) => {
  const { currentSong, isPlaying, position, duration } = playbackState;

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Liquid Glass Backdrop */}
      <BlurView
        intensity={Platform.OS === 'ios' ? 80 : 95}
        tint={Platform.OS === 'ios' ? 'systemMaterialDark' : 'dark'}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.tintOverlay} pointerEvents="none" />

      {/* Progress bar track */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      <View style={styles.contentRow}>
        <TouchableOpacity
          style={styles.metaTouch}
          onPress={onOpenFullPlayer}
          activeOpacity={0.8}
          accessibilityLabel={`Now playing ${currentSong.title} by ${currentSong.artist_name}. Tap to open player`}
        >
          <Image source={{ uri: currentSong.cover_art_url }} style={styles.coverArt} />
          <View style={styles.metaInfo}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {currentSong.title}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {currentSong.artist_name}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.controlsRow}>
          {currentSong.shoutout_count > 0 && (
            <View style={styles.shoutoutBadge}>
              <Ionicons name="sparkles" size={10} color={colors.secondaryLight} />
              <Text style={styles.shoutoutBadgeText}>{currentSong.shoutout_count}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.playButton}
            onPress={onTogglePlay}
            accessibilityLabel={isPlaying ? 'Pause song' : 'Play song'}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.expandButton}
            onPress={onOpenFullPlayer}
            accessibilityLabel="Expand player"
          >
            <Ionicons name="chevron-up" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.14)',
    zIndex: 9,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(18, 20, 28, 0.72)' : 'rgba(18, 20, 28, 0.92)',
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
  },
  progressBarFill: {
    height: 3,
    backgroundColor: colors.primary,
  },
  contentRow: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  metaTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    marginRight: 8,
  },
  coverArt: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#1C1C1C',
  },
  metaInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  artistName: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shoutoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 200, 87, 0.15)',
  },
  shoutoutBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFC857',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4F2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  expandButton: {
    padding: 4,
  },
});
