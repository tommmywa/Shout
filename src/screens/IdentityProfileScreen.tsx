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
import { GlobalIdentity, IdentityToken, Shoutout, Song, User } from '../types';
import { IdentityService } from '../services/identity';
import { ShoutoutService } from '../services/shoutouts';
import { SongService } from '../services/songs';

interface IdentityProfileScreenProps {
  handleOrId?: string;
  currentUser: User | null;
  onOpenSong: (song: Song) => void;
  onOpenIdentitySetup: () => void;
  onOpenAuth: () => void;
  onOpenShoutout: (shoutoutId: string) => void;
}

export const IdentityProfileScreen: React.FC<IdentityProfileScreenProps> = ({
  handleOrId,
  currentUser,
  onOpenSong,
  onOpenIdentitySetup,
  onOpenAuth,
  onOpenShoutout,
}) => {
  const identityService = IdentityService.getInstance();
  const shoutoutService = ShoutoutService.getInstance();
  const songService = SongService.getInstance();

  const [identity, setIdentity] = useState<GlobalIdentity | null>(null);
  const [token, setToken] = useState<IdentityToken | null>(null);
  const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);
  const [songsMap, setSongsMap] = useState<Record<string, Song>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [handleOrId, currentUser]);

  const loadProfile = async () => {
    setLoading(true);
    let targetIdentity: GlobalIdentity | null = null;

    if (handleOrId) {
      targetIdentity = await identityService.getIdentity(handleOrId);
    } else if (currentUser?.active_identity_id) {
      targetIdentity = await identityService.getIdentity(currentUser.active_identity_id);
    }

    setIdentity(targetIdentity);

    if (targetIdentity) {
      const [tok, shList, allSongs] = await Promise.all([
        identityService.getIdentityToken(targetIdentity.id),
        shoutoutService.getShoutoutsForIdentity(targetIdentity.id),
        songService.getSongs(),
      ]);
      setToken(tok);
      setShoutouts(shList);

      const map: Record<string, Song> = {};
      allSongs.forEach((s) => (map[s.id] = s));
      setSongsMap(map);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.emptyContainer, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>
          Loading global fan profile...
        </Text>
      </View>
    );
  }

  if (!identity) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBox}>
          <Ionicons name="finger-print" size={32} color={colors.primaryLight} />
        </View>
        <Text style={styles.emptyTitle}>No Global Identity Established</Text>
        <Text style={styles.emptySubtitle}>
          You are signed in as {currentUser?.display_name || currentUser?.email || 'Guest'}. Claim your unique global name to accumulate studio shoutouts and deploy your identity token.
        </Text>
        <TouchableOpacity
          style={styles.claimBtn}
          onPress={onOpenIdentitySetup}
          accessibilityRole="button"
          accessibilityLabel="Claim your global handle"
        >
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          <Text style={styles.claimBtnText}>Claim Your Global Handle</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwnProfile = currentUser?.active_identity_id === identity.id;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <View style={styles.avatarWrapper}>
            {identity.avatar_url ? (
              <Image source={{ uri: identity.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarLetter}>
                  {identity.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={colors.secondaryLight} />
            </View>
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.handleRow}>
              <Text style={styles.handleText}>{identity.handle}</Text>
              {isOwnProfile && (
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>YOU</Text>
                </View>
              )}
            </View>
            <Text style={styles.displayName}>{identity.display_name}</Text>
            <View style={styles.nftAddressRow}>
              <Ionicons name="shield-checkmark-outline" size={12} color={colors.secondaryLight} />
              <Text style={styles.nftAddressText}>
                Soulbound ID: {identity.identity_nft_address}
              </Text>
            </View>
          </View>
        </View>

        {identity.bio && <Text style={styles.bioText}>{identity.bio}</Text>}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{identity.total_shoutouts_ever}</Text>
            <Text style={styles.statLabel}>Shoutouts Ever</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: colors.secondaryLight }]}>
              {identity.global_resonance_score}
            </Text>
            <Text style={styles.statLabel}>Resonance Score</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: colors.primaryLight }]}>
              {shoutouts.filter((s) => s.status === 'minted' || s.status === 'published').length}
            </Text>
            <Text style={styles.statLabel}>Active in Tracks</Text>
          </View>
        </View>
      </View>

      {/* Identity Token Card */}
      {token && (
        <View style={styles.tokenCard}>
          <View style={styles.tokenHeader}>
            <View style={styles.tokenIconBox}>
              <Text style={styles.tokenIconText}>${token.symbol}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.tokenTitleRow}>
                <Text style={styles.tokenTitle}>Identity Token (${token.symbol})</Text>
                <View style={styles.mintStatusBadge}>
                  <Text style={styles.mintStatusText}>
                    {token.mintStatus === 'minted' ? 'MINTED' : 'INITIALIZING'}
                  </Text>
                </View>
              </View>
              <Text style={styles.tokenSub}>
                Backing contract: {token.contractAddress}
              </Text>
            </View>
          </View>

          <View style={styles.tokenStatsGrid}>
            <View style={styles.tokenStatCell}>
              <Text style={styles.cellLabel}>Current Value</Text>
              <Text style={styles.cellValue}>{token.currentPrice} ETH</Text>
              <Text style={styles.cellSub}>~${(token.currentPrice * 3000).toFixed(2)} USD</Text>
            </View>
            <View style={styles.tokenStatCell}>
              <Text style={styles.cellLabel}>Total Circulating</Text>
              <Text style={styles.cellValue}>{token.totalSupply}</Text>
              <Text style={styles.cellSub}>Minted across releases</Text>
            </View>
          </View>

          <View style={styles.tokenFooter}>
            <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
            <Text style={styles.tokenFooterText}>
              Tokens are automatically minted to your global identity each time an artist records and publishes your shoutout.
            </Text>
          </View>
        </View>
      )}

      {/* Recognition Portfolio */}
      <View style={styles.portfolioSection}>
        <Text style={styles.portfolioHeading}>Studio Recognition Portfolio</Text>
        <Text style={styles.portfolioSub}>Tracks where {identity.handle} is immortalized</Text>

        {shoutouts.length === 0 ? (
          <View style={styles.emptyPortfolioCard}>
            <Ionicons name="disc-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyPortfolioTitle}>No recognition records yet</Text>
            <Text style={styles.emptyPortfolioText}>
              Select any discoverable track and request your first artist shoutout.
            </Text>
          </View>
        ) : (
          shoutouts.map((sh) => {
            const s = songsMap[sh.song_id];
            return (
              <TouchableOpacity
                key={sh.id}
                style={styles.recognitionCard}
                onPress={() => onOpenShoutout(sh.id)}
                activeOpacity={0.85}
              >
                <Image
                  source={{
                    uri:
                      s?.cover_art_url ||
                      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
                  }}
                  style={styles.recognitionArt}
                />
                <View style={styles.recognitionMeta}>
                  <View style={styles.recognitionMetaTop}>
                    <Text style={styles.recognitionTier}>{sh.tier.toUpperCase()}</Text>
                    <View
                      style={[
                        styles.recognitionStatusPill,
                        sh.status === 'minted' && { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.recognitionStatusText,
                          sh.status === 'minted' && { color: colors.success },
                        ]}
                      >
                        {sh.status === 'minted' ? 'Minted On-Chain' : sh.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.recognitionSongTitle} numberOfLines={1}>
                    {s?.title || 'Studio Song'}
                  </Text>
                  <Text style={styles.recognitionArtistName}>{s?.artist_name}</Text>
                  <Text style={styles.recognitionQuote} numberOfLines={1}>
                    &quot;{sh.shoutout_text}&quot;
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <View style={{ height: 120 }} />
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
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  headerInfo: {
    flex: 1,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  handleText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  activePill: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.secondaryLight,
  },
  displayName: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 1,
  },
  nftAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  nftAddressText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  bioText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.cardBorder,
  },
  tokenCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    padding: 16,
    marginBottom: 16,
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tokenIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenIconText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tokenTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  mintStatusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mintStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.success,
  },
  tokenSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  tokenStatsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  tokenStatCell: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 8,
  },
  cellLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  cellValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondaryLight,
    marginTop: 2,
  },
  cellSub: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 1,
  },
  tokenFooter: {
    flexDirection: 'row',
    gap: 6,
  },
  tokenFooterText: {
    fontSize: 10,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 14,
  },
  portfolioSection: {
    marginTop: 4,
  },
  portfolioHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  portfolioSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 12,
    marginTop: 2,
  },
  emptyPortfolioCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    alignItems: 'center',
  },
  emptyPortfolioTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptyPortfolioText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  recognitionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    gap: 12,
    marginBottom: 10,
  },
  recognitionArt: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  recognitionMeta: {
    flex: 1,
  },
  recognitionMetaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  recognitionTier: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  recognitionStatusPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  recognitionStatusText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  recognitionSongTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recognitionArtistName: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  recognitionQuote: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  claimBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
