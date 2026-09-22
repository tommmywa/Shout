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
import { GlobalIdentity, Shoutout, Song, User } from '../types';
import { ShoutoutService } from '../services/shoutouts';
import { SongService } from '../services/songs';

interface MyShoutoutsScreenProps {
  user: User | null;
  identity: GlobalIdentity | null;
  onOpenShoutout: (shoutoutId: string) => void;
  onDiscoverSongs: () => void;
  onOpenIdentitySetup: () => void;
}

export const MyShoutoutsScreen: React.FC<MyShoutoutsScreenProps> = ({
  user,
  identity,
  onOpenShoutout,
  onDiscoverSongs,
  onOpenIdentitySetup,
}) => {
  const shoutoutService = ShoutoutService.getInstance();
  const songService = SongService.getInstance();

  const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);
  const [songsMap, setSongsMap] = useState<Record<string, Song>>({});
  const [filter, setFilter] = useState<'all' | 'pending' | 'live'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyShoutouts();
  }, [user, identity]);

  const loadMyShoutouts = async () => {
    if (!user) {
      setShoutouts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const myShouts = await shoutoutService.getMyShoutouts(user.id);
    setShoutouts(myShouts);

    // Fetch songs for mapping
    const allSongs = await songService.getSongs();
    const map: Record<string, Song> = {};
    allSongs.forEach((s) => (map[s.id] = s));
    setSongsMap(map);
    setLoading(false);
  };

  const filteredShoutouts = shoutouts.filter((sh) => {
    if (filter === 'pending') {
      return ['pending_payment', 'paid', 'pending_artist_review', 'approved'].includes(
        sh.status
      );
    }
    if (filter === 'live') {
      return ['published', 'mint_pending', 'minted'].includes(sh.status);
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'minted':
        return colors.success;
      case 'published':
        return colors.secondaryLight;
      case 'approved':
        return colors.info;
      case 'pending_artist_review':
        return colors.warning;
      case 'rejected':
      case 'refunded':
        return colors.danger;
      default:
        return colors.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'minted':
        return 'Recognition added';
      case 'mint_pending':
        return 'Recognition being recorded';
      case 'published':
        return 'Shoutout is live';
      case 'approved':
        return 'Artist approved';
      case 'pending_artist_review':
        return 'Waiting for artist';
      case 'paid':
        return 'Payment confirmed';
      case 'pending_payment':
        return 'Payment required';
      case 'rejected':
        return 'Request declined';
      case 'refunded':
        return 'Payment refunded';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={[styles.emptyContainer, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>Loading your shoutouts...</Text>
      </View>
    );
  }

  if (!user || !identity) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBox}>
          <Ionicons name="finger-print" size={32} color={colors.primaryLight} />
        </View>
        <Text style={styles.emptyTitle}>Establish Your Global Identity</Text>
        <Text style={styles.emptySubtitle}>
          Claim your unique name to start receiving studio shoutouts across artists and track your recognition portfolio.
        </Text>
        <TouchableOpacity
          style={styles.claimCtaBtn}
          onPress={onOpenIdentitySetup}
          accessibilityRole="button"
          accessibilityLabel="Claim your unique global handle"
        >
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          <Text style={styles.claimCtaText}>Claim @Handle</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getEmptyStateMessage = () => {
    if (shoutouts.length === 0) {
      return {
        title: 'No shoutouts requested yet',
        desc: 'Explore active releases from independent artists and get your name immortalized in a track.',
      };
    }
    if (filter === 'pending') {
      return {
        title: 'No shoutouts in review',
        desc: 'All your submitted shoutouts have already been processed, approved, or published.',
      };
    }
    if (filter === 'live') {
      return {
        title: 'No live shoutouts yet',
        desc: 'Once artists approve and record your voice dedications, your live tracks will appear here.',
      };
    }
    return {
      title: 'No shoutouts in this category',
      desc: 'Explore curated releases and get your name spoken into a song today.',
    };
  };

  const emptyMsg = getEmptyStateMessage();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Info */}
      <View style={styles.headerBox}>
        <View>
          <Text style={styles.pageTitle}>Fan Shoutouts</Text>
          <Text style={styles.pageSubtitle}>
            Studio recognition linked to <Text style={{ color: colors.primaryLight }}>{identity.handle}</Text>
          </Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalCount}>{shoutouts.length}</Text>
          <Text style={styles.totalLabel}>Total</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => setFilter('all')}
          accessibilityRole="tab"
          accessibilityState={{ selected: filter === 'all' }}
          accessibilityLabel={`All shoutouts, total ${shoutouts.length}`}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({shoutouts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filter === 'pending' && styles.filterBtnActive]}
          onPress={() => setFilter('pending')}
          accessibilityRole="tab"
          accessibilityState={{ selected: filter === 'pending' }}
          accessibilityLabel="Filter by in-review shoutouts"
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            In Review
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filter === 'live' && styles.filterBtnActive]}
          onPress={() => setFilter('live')}
          accessibilityRole="tab"
          accessibilityState={{ selected: filter === 'live' }}
          accessibilityLabel="Filter by live and minted shoutouts"
        >
          <Text style={[styles.filterText, filter === 'live' && styles.filterTextActive]}>
            Live & Minted
          </Text>
        </TouchableOpacity>
      </View>

      {/* Shoutout Cards List */}
      {filteredShoutouts.length === 0 ? (
        <View style={styles.emptyListCard}>
          <Ionicons name="musical-notes-outline" size={36} color={colors.textMuted} />
          <Text style={styles.emptyListTitle}>{emptyMsg.title}</Text>
          <Text style={styles.emptyListSubtitle}>{emptyMsg.desc}</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={onDiscoverSongs}
            accessibilityRole="button"
            accessibilityLabel="Browse available songs with open shoutout slots"
          >
            <Text style={styles.browseBtnText}>Browse Available Tracks</Text>
          </TouchableOpacity>
        </View>
      ) : (
        filteredShoutouts.map((sh) => {
          const s = songsMap[sh.song_id];
          const statusColor = getStatusColor(sh.status);

          return (
            <TouchableOpacity
              key={sh.id}
              style={styles.card}
              onPress={() => onOpenShoutout(sh.id)}
              activeOpacity={0.85}
            >
              <Image
                source={{
                  uri:
                    s?.cover_art_url ||
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
                }}
                style={styles.cardArt}
              />
              <View style={styles.cardContent}>
                <View style={styles.cardMetaRow}>
                  <View
                    style={[
                      styles.tierPill,
                      {
                        backgroundColor:
                          sh.tier === 'silver' ? 'rgba(192, 192, 192, 0.2)' : 'rgba(205, 127, 50, 0.2)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tierText,
                        { color: sh.tier === 'silver' ? colors.silver : colors.bronze },
                      ]}
                    >
                      {sh.tier.toUpperCase()}
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { borderColor: statusColor }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {getStatusLabel(sh.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardSongTitle} numberOfLines={1}>
                  {s?.title || 'Unknown Track'}
                </Text>
                <Text style={styles.cardArtistName}>{s?.artist_name || 'Studio Artist'}</Text>
                <Text style={styles.cardQuote} numberOfLines={1}>
                  &quot;{sh.shoutout_text}&quot;
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          );
        })
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  totalBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  totalCount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  totalLabel: {
    fontSize: 9,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterBtnActive: {
    backgroundColor: '#14151B',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.55)',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14151B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    gap: 12,
    marginBottom: 10,
  },
  cardArt: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#1C1C1C',
  },
  cardContent: {
    flex: 1,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tierPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  cardSongTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardArtistName: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  cardQuote: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 3,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  claimCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  claimCtaText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyListCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyListTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptyListSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
  browseBtn: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryLight,
  },
});
