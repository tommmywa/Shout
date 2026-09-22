import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Song } from '../types';

interface SongCardProps {
  song: Song;
  isPlaying: boolean;
  onPress: () => void;
  onPlayPress: () => void;
  onRequestShoutout?: () => void;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  isPlaying,
  onPress,
  onPlayPress,
  onRequestShoutout,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${song.title} by ${song.artist_name}`}
    >
      <View style={styles.coverWrapper}>
        <Image source={{ uri: song.cover_art_url }} style={styles.coverImage} />
        <TouchableOpacity
          style={[styles.playOverlayButton, isPlaying && styles.playOverlayActive]}
          onPress={onPlayPress}
          accessibilityLabel={isPlaying ? 'Pause song' : 'Play song'}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {song.shoutouts_available && (
          <View style={styles.availTag}>
            <Text style={styles.availTagText}>OPEN SLOTS</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.metaRow}>
          <Text style={styles.genreBadge}>{song.genre}</Text>
          {song.shoutout_count > 0 && (
            <View style={styles.countBadge}>
              <Ionicons name="sparkles" size={10} color={colors.secondaryLight} />
              <Text style={styles.countText}>
                {song.shoutout_count} {song.shoutout_count === 1 ? 'Shoutout' : 'Shoutouts'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {song.artist_name}
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.listenButton}
            onPress={onPlayPress}
          >
            <Ionicons name={isPlaying ? 'volume-high' : 'play-circle-outline'} size={14} color={colors.textSecondary} />
            <Text style={styles.listenText}>{isPlaying ? 'Playing' : 'Listen'}</Text>
          </TouchableOpacity>

          {song.shoutouts_available ? (
            <TouchableOpacity
              style={styles.shoutoutButton}
              onPress={onRequestShoutout || onPress}
            >
              <Ionicons name="megaphone" size={12} color="#FFFFFF" />
              <Text style={styles.shoutoutButtonText}>Get Shoutout</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.filledBadge}>
              <Text style={styles.filledText}>Sold Out</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#14151B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  coverWrapper: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1C1C1C',
  },
  playOverlayButton: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(11, 12, 16, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  playOverlayActive: {
    backgroundColor: colors.primary,
  },
  availTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  availTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  genreBadge: {
    fontSize: 10,
    color: colors.primaryLight,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 200, 87, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  countText: {
    fontSize: 9,
    color: '#FFC857',
    fontWeight: '700',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  artist: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listenText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  shoutoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#FF4F2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  shoutoutButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filledBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  filledText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.danger,
  },
});
