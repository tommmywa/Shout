import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { GlobalIdentity, Shoutout, Song } from '../types';
import { ShoutoutService } from '../services/shoutouts';
import { SongService } from '../services/songs';
import { IdentityService } from '../services/identity';
import { ShoutoutStatusTimeline } from '../components/ShoutoutStatusTimeline';
import { NativeTopBar } from '../components/NativeTopBar';

interface ShoutoutDetailScreenProps {
  shoutoutId: string;
  onBack: () => void;
  onOpenSong: (song: Song) => void;
  onOpenIdentity: (handle: string) => void;
  onOpenDevSheet: (shoutoutId: string) => void;
}

export const ShoutoutDetailScreen: React.FC<ShoutoutDetailScreenProps> = ({
  shoutoutId,
  onBack,
  onOpenSong,
  onOpenIdentity,
  onOpenDevSheet,
}) => {
  const shoutoutService = ShoutoutService.getInstance();
  const songService = SongService.getInstance();
  const identityService = IdentityService.getInstance();

  const [shoutout, setShoutout] = useState<Shoutout | null>(null);
  const [song, setSong] = useState<Song | null>(null);
  const [identity, setIdentity] = useState<GlobalIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetails();
  }, [shoutoutId]);

  const loadDetails = async () => {
    setLoading(true);
    const sh = await shoutoutService.getShoutoutById(shoutoutId);
    if (sh) {
      setShoutout(sh);
      const [s, id] = await Promise.all([
        songService.getSongById(sh.song_id),
        identityService.getIdentity(sh.identity_id),
      ]);
      setSong(s);
      setIdentity(id);
    }
    setLoading(false);
  };

  if (!shoutout || !song) return null;

  return (
    <View style={styles.container}>
       {/* Navigation Bar */}
       <NativeTopBar
         onBack={onBack}
         backLabel="Shoutouts"
         title={`Order ${shoutout.id.slice(-8)}`}
         applyTopInset={false}
         showBorder={true}
         rightAction={
           <TouchableOpacity
             style={styles.devBtn}
             onPress={() => onOpenDevSheet(shoutout.id)}
             accessibilityLabel="Open Developer Simulation"
           >
             <Ionicons name="flask" size={16} color={colors.secondaryLight} />
           </TouchableOpacity>
         }
       />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Track Card */}
        <TouchableOpacity
          style={styles.songCard}
          onPress={() => onOpenSong(song)}
          activeOpacity={0.85}
        >
          <Image source={{ uri: song.cover_art_url }} style={styles.coverImage} />
          <View style={styles.songMeta}>
            <View style={styles.tierPill}>
              <Text style={styles.tierPillText}>{shoutout.tier.toUpperCase()} SHOUTOUT</Text>
            </View>
            <Text style={styles.songTitle} numberOfLines={1}>
              {song.title}
            </Text>
            <Text style={styles.artistName}>{song.artist_name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Target Identity Box */}
        {identity && (
          <TouchableOpacity
            style={styles.identityCard}
            onPress={() => onOpenIdentity(identity.handle)}
          >
            <View style={styles.identityIconBox}>
              <Ionicons name="finger-print" size={20} color={colors.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.identityLabel}>RECOGNIZED GLOBAL IDENTITY</Text>
              <Text style={styles.identityHandle}>{identity.handle}</Text>
              <Text style={styles.identityDisplay}>{identity.display_name}</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Shoutout Quote Card */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteHeader}>Requested Dedication:</Text>
          <Text style={styles.quoteBody}>&quot;{shoutout.shoutout_text}&quot;</Text>
          {shoutout.social_tag && (
            <Text style={styles.quoteSocial}>Tagged: {shoutout.social_tag}</Text>
          )}
        </View>

        {/* Lifecycle Status Timeline */}
        <Text style={styles.sectionHeading}>Lifecycle State Tracker</Text>
        <ShoutoutStatusTimeline
          status={shoutout.status}
          mintTx={shoutout.mint_transaction_hash}
          timestampSeconds={shoutout.timestamp}
        />

        {/* Token Minted Achievement Card */}
        {shoutout.status === 'minted' && (
          <View style={styles.mintedCard}>
            <View style={styles.mintedHeader}>
              <View style={styles.mintedBadge}>
                <Ionicons name="cube" size={16} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mintedTitle}>Recognition Immortality Verified</Text>
                <Text style={styles.mintedSub}>Soulbound NFT & Identity Tokens Minted</Text>
              </View>
            </View>
            <View style={styles.tokenStatRow}>
              <View style={styles.tokenStatItem}>
                <Text style={styles.tokenStatLabel}>Tokens Minted</Text>
                <Text style={styles.tokenStatValue}>+{shoutout.tokens_minted_at_event || 100}</Text>
              </View>
              <View style={styles.tokenStatItem}>
                <Text style={styles.tokenStatLabel}>Track Position</Text>
                <Text style={styles.tokenStatValue}>
                  {shoutout.timestamp
                    ? `${Math.floor(shoutout.timestamp / 60)}:${(shoutout.timestamp % 60).toString().padStart(2, '0')}`
                    : 'Master Tape'}
                </Text>
              </View>
            </View>
            <Text style={styles.txHashText} numberOfLines={1}>
              Tx: {shoutout.mint_transaction_hash}
            </Text>
          </View>
        )}

        {/* Dev simulation helper prompt */}
        <View style={styles.devPromptBox}>
          <Ionicons name="flask-outline" size={16} color={colors.secondaryLight} />
          <View style={{ flex: 1 }}>
            <Text style={styles.devPromptTitle}>Simulation Console Available</Text>
            <Text style={styles.devPromptDesc}>
              Tap the Flask icon in the header to simulate artist recording approvals, publication, and token rewards.
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navBar: {
    height: 52,
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
  },
  devBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  scrollContent: {
    padding: 16,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    gap: 12,
    marginBottom: 12,
  },
  coverImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  songMeta: {
    flex: 1,
  },
  tierPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  tierPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  artistName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 12,
  },
  identityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  identityHandle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryLight,
    marginTop: 1,
  },
  identityDisplay: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  quoteCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: 16,
  },
  quoteHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  quoteBody: {
    fontSize: 14,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  quoteSocial: {
    fontSize: 11,
    color: colors.secondaryLight,
    marginTop: 6,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mintedCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1.5,
    borderColor: colors.success,
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
    marginBottom: 16,
  },
  mintedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  mintedBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mintedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.success,
  },
  mintedSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  tokenStatRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  tokenStatItem: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 8,
  },
  tokenStatLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  tokenStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  txHashText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  devPromptBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },
  devPromptTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondaryLight,
  },
  devPromptDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
});
