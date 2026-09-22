import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { AudioPlaybackState, AudioService } from '../services/audio';
import { Shoutout } from '../types';
import { SongService } from '../services/songs';

interface AudioPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  playbackState: AudioPlaybackState;
  onTogglePlay: () => void;
  onRequestShoutout?: () => void;
}

export const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({
  visible,
  onClose,
  playbackState,
  onTogglePlay,
  onRequestShoutout,
}) => {
  const audio = AudioService.getInstance();
  const songService = SongService.getInstance();
  const { currentSong, isPlaying, position, duration } = playbackState;

  const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);

  useEffect(() => {
    if (currentSong) {
      songService.getShoutoutsForSong(currentSong.id).then(setShoutouts);
    }
  }, [currentSong]);

  if (!currentSong) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  const handleSeek = (ratio: number) => {
    const target = ratio * duration;
    audio.seek(target);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <Ionicons name="chevron-down" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerTitleBox}>
              <Text style={styles.headerTitle}>NOW PLAYING</Text>
              <Text style={styles.headerSubtitle}>{currentSong.genre}</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Artwork */}
            <View style={styles.artContainer}>
              <Image source={{ uri: currentSong.cover_art_url }} style={styles.albumArt} />
              {currentSong.shoutouts_available && (
                <View style={styles.shoutoutFloatingTag}>
                  <Ionicons name="megaphone" size={12} color="#FFFFFF" />
                  <Text style={styles.shoutoutFloatingText}>Open for Shoutouts</Text>
                </View>
              )}
            </View>

            {/* Song Details */}
            <View style={styles.metaRow}>
              <View style={styles.metaTextBox}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {currentSong.title}
                </Text>
                <Text style={styles.artistName}>{currentSong.artist_name}</Text>
              </View>
              <View style={styles.specChips}>
                {currentSong.bpm && (
                  <View style={styles.specChip}>
                    <Text style={styles.specText}>{currentSong.bpm} BPM</Text>
                  </View>
                )}
                {currentSong.musical_key && (
                  <View style={styles.specChip}>
                    <Text style={styles.specText}>{currentSong.musical_key}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Scrubber */}
            <View style={styles.scrubberSection}>
              <TouchableOpacity
                style={styles.scrubberTrack}
                activeOpacity={1}
                onPress={(e) => {
                  const { locationX } = e.nativeEvent;
                  // rough ratio estimation
                  const ratio = Math.max(0, Math.min(1, locationX / 320));
                  handleSeek(ratio);
                }}
              >
                <View style={[styles.scrubberFill, { width: `${progressPercent}%` }]} />
                <View style={[styles.scrubberThumb, { left: `${progressPercent}%` }]} />
              </TouchableOpacity>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>

            {/* Controls */}
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={() => handleSeek(Math.max(0, (position - 15) / duration))}>
                <Ionicons name="play-back" size={26} color={colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.mainPlayBtn} onPress={onTogglePlay}>
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={32}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleSeek(Math.min(1, (position + 15) / duration))}>
                <Ionicons name="play-forward" size={26} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* CTA to get shoutout */}
            {currentSong.shoutouts_available && (
              <TouchableOpacity
                style={styles.getShoutoutBtn}
                onPress={() => {
                  onClose();
                  if (onRequestShoutout) onRequestShoutout();
                }}
              >
                <Ionicons name="megaphone" size={16} color="#FFFFFF" />
                <Text style={styles.getShoutoutText}>Request Shoutout on this Track</Text>
              </TouchableOpacity>
            )}

            {/* Shoutout Timestamp Markers List */}
            <View style={styles.shoutoutSection}>
              <View style={styles.shoutoutSectionHeader}>
                <Text style={styles.shoutoutSectionTitle}>
                  Recognition Moments ({shoutouts.length})
                </Text>
                <Text style={styles.shoutoutSectionSubtitle}>Tap to listen to shoutout</Text>
              </View>

              {shoutouts.length === 0 ? (
                <View style={styles.emptyShoutoutsBox}>
                  <Text style={styles.emptyShoutoutsText}>
                    Be the first fan immortalized in this release!
                  </Text>
                </View>
              ) : (
                shoutouts.map((s) => {
                  const sTime = s.timestamp || 30;
                  const isCurrentMoment = Math.abs(position - sTime) < 4;

                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.momentCard,
                        isCurrentMoment && styles.momentCardActive,
                      ]}
                      onPress={() => audio.seek(sTime)}
                    >
                      <View style={styles.momentTimeBadge}>
                        <Ionicons name="volume-high" size={12} color={colors.secondaryLight} />
                        <Text style={styles.momentTimeText}>{formatTime(sTime)}</Text>
                      </View>
                      <View style={styles.momentInfo}>
                        <View style={styles.momentTierRow}>
                          <Text style={styles.momentTier}>{s.tier.toUpperCase()}</Text>
                          {s.social_tag && (
                            <Text style={styles.momentTag}>{s.social_tag}</Text>
                          )}
                        </View>
                        <Text style={styles.momentText} numberOfLines={1}>
                          &quot;{s.shoutout_text}&quot;
                        </Text>
                      </View>
                      <Ionicons name="play" size={16} color={colors.secondaryLight} />
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 13, 0.95)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: colors.cardBorder,
    height: '92%',
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  iconBtn: {
    padding: 6,
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.primaryLight,
    fontWeight: '600',
    marginTop: 2,
  },
  scrollBody: {
    alignItems: 'center',
    paddingTop: 10,
  },
  artContainer: {
    position: 'relative',
    width: 260,
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
  },
  albumArt: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
  },
  shoutoutFloatingTag: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  shoutoutFloatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metaRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metaTextBox: {
    flex: 1,
    marginRight: 10,
  },
  songTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  artistName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 3,
  },
  specChips: {
    flexDirection: 'row',
    gap: 6,
  },
  specChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  specText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  scrubberSection: {
    width: '100%',
    marginBottom: 20,
  },
  scrubberTrack: {
    height: 6,
    backgroundColor: colors.cardBorderSubtle,
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: colors.primaryLight,
    borderRadius: 3,
  },
  scrubberThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    marginLeft: -7,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    marginBottom: 24,
  },
  mainPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getShoutoutBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: colors.secondaryLight,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  getShoutoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondaryLight,
  },
  shoutoutSection: {
    width: '100%',
  },
  shoutoutSectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  shoutoutSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  shoutoutSectionSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyShoutoutsBox: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyShoutoutsText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  momentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 8,
  },
  momentCardActive: {
    borderColor: colors.secondaryLight,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  momentTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  momentTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondaryLight,
  },
  momentInfo: {
    flex: 1,
  },
  momentTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  momentTier: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  momentTag: {
    fontSize: 10,
    color: colors.textMuted,
  },
  momentText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
});
