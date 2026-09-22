import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Artist, Shoutout, Song } from '../types';
import { SongService } from '../services/songs';
import { AudioPlaybackState } from '../services/audio';
import { NativeTopBar } from '../components/NativeTopBar';

interface SongDetailScreenProps {
  songId: string;
  onBack: () => void;
  onRequestShoutout: (song: Song) => void;
  onPlaySong: (song: Song) => void;
  playbackState: AudioPlaybackState;
  onSelectIdentity?: (handle: string) => void;
}

export const SongDetailScreen: React.FC<SongDetailScreenProps> = ({
  songId,
  onBack,
  onRequestShoutout,
  onPlaySong,
  playbackState,
  onSelectIdentity,
}) => {
  const songService = SongService.getInstance();
  const [song, setSong] = useState<Song | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSong();
  }, [songId]);

  const loadSong = async () => {
    setLoading(true);
    const s = await songService.getSongById(songId);
    if (s) {
      setSong(s);
      const [a, sh] = await Promise.all([
        songService.getArtistById(s.artist_id),
        songService.getShoutoutsForSong(s.id),
      ]);
      setArtist(a);
      setShoutouts(sh);
    }
    setLoading(false);
  };

  if (loading || !song) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading song details & studio slots...</Text>
      </View>
    );
  }

  const isCurrentPlaying = playbackState.currentSong?.id === song.id;
  const isPlaying = isCurrentPlaying && playbackState.isPlaying;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <NativeTopBar
        onBack={onBack}
        backLabel="Discover"
        title={song.title}
        applyTopInset={false}
        showBorder={true}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cover Art Hero */}
        <View style={styles.artWrapper}>
          <Image source={{ uri: song.cover_art_url }} style={styles.artImage} />
          <View style={styles.genrePill}>
            <Text style={styles.genrePillText}>{song.genre}</Text>
          </View>
        </View>

        {/* Title and Controls */}
        <View style={styles.titleSection}>
          <Text style={styles.songTitle}>{song.title}</Text>
          <Text style={styles.artistName}>{song.artist_name}</Text>

          <View style={styles.audioRow}>
            <TouchableOpacity
              style={[styles.playBtn, isPlaying && styles.playBtnActive]}
              onPress={() => onPlaySong(song)}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.playBtnText}>
                {isPlaying ? 'Playing Audio' : 'Preview Track'}
              </Text>
            </TouchableOpacity>

            <View style={styles.metaPills}>
              <View style={styles.metaPill}>
                <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                <Text style={styles.metaPillText}>{formatTime(song.duration)}</Text>
              </View>
              {song.bpm && (
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>{song.bpm} BPM</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Free vs Paid distinction banner */}
        <View style={styles.distinctionCard}>
          <Ionicons name="information-circle" size={20} color={colors.secondaryLight} />
          <View style={styles.distinctionContent}>
            <Text style={styles.distinctionTitle}>Studio Recognition Model</Text>
            <Text style={styles.distinctionText}>
              Listening to this track is completely free. Purchasing a shoutout reserves a dedicated slot for the artist to voice your name into the track and deliver your Soulbound identity token.
            </Text>
          </View>
        </View>

        {/* Primary CTA */}
        {song.shoutouts_available ? (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => onRequestShoutout(song)}
            activeOpacity={0.85}
          >
            <Ionicons name="megaphone" size={18} color="#FFFFFF" />
            <Text style={styles.ctaButtonText}>Get a Shoutout on this Song</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.soldOutBanner}>
            <Ionicons name="lock-closed" size={16} color={colors.danger} />
            <Text style={styles.soldOutText}>All Shoutout Slots Filled for this Release</Text>
          </View>
        )}

        {/* Artist Profile Card */}
        {artist && (
          <View style={styles.artistCard}>
            <View style={styles.artistHeader}>
              <Image source={{ uri: artist.avatar_url }} style={styles.artistAvatar} />
              <View style={styles.artistMeta}>
                <View style={styles.artistNameRow}>
                  <Text style={styles.artistTitle}>{artist.name}</Text>
                  {artist.verified && (
                    <Ionicons name="checkmark-circle" size={16} color={colors.secondaryLight} />
                  )}
                </View>
                <Text style={styles.artistHandle}>{artist.handle}</Text>
              </View>
            </View>
            <Text style={styles.artistBio}>{artist.bio}</Text>
          </View>
        )}

        {/* Existing Fan Recognition Feed */}
        <View style={styles.recognitionSection}>
          <View style={styles.recognitionHeader}>
            <Text style={styles.recognitionTitle}>Recognized Fans ({shoutouts.length})</Text>
            <Text style={styles.recognitionSubtitle}>Voiced in track</Text>
          </View>

          {shoutouts.length === 0 ? (
            <View style={styles.emptyShoutoutCard}>
              <Ionicons name="sparkles-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyShoutoutTitle}>No shoutouts recorded yet</Text>
              <Text style={styles.emptyShoutoutDesc}>
                Be the inaugural global identity immortalized in this track!
              </Text>
            </View>
          ) : (
            shoutouts.map((sh) => (
              <View key={sh.id} style={styles.shoutoutItem}>
                <View style={styles.shoutoutTop}>
                  <View style={styles.timestampBadge}>
                    <Ionicons name="time" size={11} color={colors.secondaryLight} />
                    <Text style={styles.timestampText}>
                      {formatTime(sh.timestamp || 30)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.tierTag,
                      {
                        backgroundColor:
                          sh.tier === 'silver' ? 'rgba(192, 192, 192, 0.2)' : 'rgba(205, 127, 50, 0.2)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tierTagText,
                        { color: sh.tier === 'silver' ? colors.silver : colors.bronze },
                      ]}
                    >
                      {sh.tier.toUpperCase()}
                    </Text>
                  </View>
                  {sh.social_tag && (
                    <TouchableOpacity
                      onPress={() => onSelectIdentity && onSelectIdentity(sh.social_tag!)}
                    >
                      <Text style={styles.socialTagText}>{sh.social_tag}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.shoutoutQuote}>&quot;{sh.shoutout_text}&quot;</Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  navBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorderSubtle,
    backgroundColor: colors.backgroundElevated,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    maxWidth: 160,
  },
  scrollContent: {
    padding: 16,
  },
  artWrapper: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  artImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
  },
  genrePill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(8, 10, 17, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  genrePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryLight,
    textTransform: 'uppercase',
  },
  titleSection: {
    marginBottom: 16,
  },
  songTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  artistName: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 14,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  playBtnActive: {
    backgroundColor: colors.secondaryDark,
  },
  playBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metaPills: {
    flexDirection: 'row',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metaPillText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  distinctionCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#14151B',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 87, 0.25)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  distinctionContent: {
    flex: 1,
  },
  distinctionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFC857',
    marginBottom: 3,
  },
  distinctionText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 16,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: '#FF4F2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  soldOutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  soldOutText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  artistCard: {
    backgroundColor: '#14151B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 20,
  },
  artistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  artistAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C1C1C',
  },
  artistMeta: {
    flex: 1,
  },
  artistNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artistTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  artistHandle: {
    fontSize: 12,
    color: colors.primaryLight,
    marginTop: 1,
  },
  artistBio: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
  },
  recognitionSection: {
    marginTop: 4,
  },
  recognitionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recognitionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  recognitionSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyShoutoutCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    alignItems: 'center',
  },
  emptyShoutoutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptyShoutoutDesc: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  shoutoutItem: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    marginBottom: 8,
  },
  shoutoutTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  timestampBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timestampText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondaryLight,
  },
  tierTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  socialTagText: {
    fontSize: 11,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  shoutoutQuote: {
    fontSize: 12,
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
});
