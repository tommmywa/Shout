import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { Artist, Song } from '../types';
import { SongService } from '../services/songs';
import { SongCard } from '../components/SongCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;
const GRID_GAP = 10;
const ARTIST_CARD_WIDTH = Math.floor(
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GRID_GAP * 2) / 3
);

interface DiscoverScreenProps {
  onSelectSong: (song: Song) => void;
  onRequestShoutout: (song: Song) => void;
  onPlaySong: (song: Song) => void;
  currentPlayingSongId?: string;
  isPlaying: boolean;
  onOpenIdentitySetup?: () => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  onSelectSong,
  onRequestShoutout,
  onPlaySong,
  currentPlayingSongId,
  isPlaying,
  onOpenIdentitySetup,
  searchQuery: propSearchQuery,
  onClearSearch,
}) => {
  const songService = SongService.getInstance();
  const [currentView, setCurrentView] = useState<'discover' | 'artists' | 'songs'>('discover');
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const activeSearchQuery = propSearchQuery !== undefined ? propSearchQuery : internalSearchQuery;
  const [loading, setLoading] = useState(true);
  const [followedArtistIds, setFollowedArtistIds] = useState<string[]>([]);

  // Handle hardware back button on Android
  useEffect(() => {
    const onBackPress = () => {
      if (currentView !== 'discover') {
        setCurrentView('discover');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentView]);

  useEffect(() => {
    loadData();
  }, [selectedGenre, activeSearchQuery]);

  const loadData = async () => {
    setLoading(true);
    const [fetchedSongs, fetchedGenres, fetchedArtists] = await Promise.all([
      songService.getSongs(activeSearchQuery, selectedGenre),
      songService.getGenres(),
      songService.getArtists(),
    ]);
    setSongs(fetchedSongs);
    setGenres(fetchedGenres);
    setArtists(fetchedArtists);
    setLoading(false);
  };

  const handleClearSearch = () => {
    setInternalSearchQuery('');
    onClearSearch?.();
  };

  const toggleFollow = (artistId: string) => {
    setFollowedArtistIds((prev) =>
      prev.includes(artistId)
        ? prev.filter((id) => id !== artistId)
        : [...prev, artistId]
    );
  };

  const filteredArtists = artists.filter((a) => {
    if (activeSearchQuery.trim()) {
      const q = activeSearchQuery.toLowerCase().trim();
      const matchesSearch =
        a.name.toLowerCase().includes(q) ||
        a.handle.toLowerCase().includes(q) ||
        a.genre.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    if (selectedGenre !== 'All') {
      if (!a.genre.toLowerCase().includes(selectedGenre.toLowerCase())) return false;
    }
    return true;
  });

  // ==========================================
  // Dedicated View: Artists Page
  // ==========================================
  if (currentView === 'artists') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Back Navigation Bar */}
        <View style={styles.viewNavBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setCurrentView('discover')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back to Discover"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            <Text style={styles.backBtnText}>Discover</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.viewTitleHeader}>
          <Text style={styles.viewTitle}>Artists</Text>
          <Text style={styles.viewSubtitle}>
            Find your favorite creators and request official shoutouts
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#FFFFFF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Try ‘J Cole’"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={activeSearchQuery}
            onChangeText={setInternalSearchQuery}
            accessibilityLabel="Search artists"
          />
          {activeSearchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearSearchBtn}
            >
              <Ionicons name="close-circle" size={18} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

        {/* Genre Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.genreScrollView}
          contentContainerStyle={styles.genreList}
        >
          {genres.map((g) => {
            const isActive = selectedGenre === g;
            return (
              <TouchableOpacity
                key={g}
                style={[styles.genreChip, isActive && styles.genreChipActive]}
                onPress={() => setSelectedGenre(g)}
              >
                <Text style={[styles.genreText, isActive && styles.genreTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Artists Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading artists...</Text>
          </View>
        ) : filteredArtists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No artists found</Text>
            <Text style={styles.emptyText}>
              {activeSearchQuery
                ? `No artists matching "${activeSearchQuery}".`
                : `No artists in ${selectedGenre}.`}
            </Text>
            <TouchableOpacity
              style={styles.clearFiltersBtn}
              onPress={() => {
                handleClearSearch();
                setSelectedGenre('All');
              }}
            >
              <Ionicons name="refresh" size={14} color={colors.secondaryLight} />
              <Text style={styles.clearFiltersText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.artistGrid}>
            {filteredArtists.map((artist) => {
              const isFollowed = followedArtistIds.includes(artist.id);
              return (
                <View key={artist.id} style={styles.artistGridCard}>
                  {/* Avatar with Gradient Border Ring */}
                  <LinearGradient
                    colors={['#FF4F2E', '#FFC857', '#CEF7A0', '#7DF687']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.artistAvatarRing}
                  >
                    <Image source={{ uri: artist.avatar_url }} style={styles.artistAvatarImg} />
                  </LinearGradient>

                  <Text style={styles.artistGridName} numberOfLines={1}>
                    {artist.name}
                  </Text>

                  {/* Stats Row: tracks and followers matching Figma Frame 84 */}
                  <View style={styles.artistStatsRow}>
                    <View style={styles.artistStatItem}>
                      <Ionicons name="musical-notes" size={10} color="#8E8E93" />
                      <Text style={styles.artistStatText}>16</Text>
                    </View>
                    <View style={styles.artistStatDivider} />
                    <View style={styles.artistStatItem}>
                      <Ionicons name="person" size={10} color="#8E8E93" />
                      <Text style={styles.artistStatText}>11.2k</Text>
                    </View>
                  </View>

                  {/* Follow / View Songs Pill */}
                  <TouchableOpacity
                    onPress={() => toggleFollow(artist.id)}
                    activeOpacity={0.75}
                    style={[
                      styles.artistFollowBtn,
                      isFollowed ? styles.artistFollowingBtn : styles.artistUnfollowedBtn,
                    ]}
                  >
                    <Feather
                      name={isFollowed ? 'user-check' : 'user-plus'}
                      size={11}
                      color="#FFFFFF"
                    />
                    <Text
                      style={[
                        styles.artistFollowBtnText,
                        isFollowed ? styles.artistFollowingBtnText : null,
                      ]}
                    >
                      {isFollowed ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  }

  // ==========================================
  // Dedicated View: Songs Page
  // ==========================================
  if (currentView === 'songs') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Back Navigation Bar */}
        <View style={styles.viewNavBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setCurrentView('discover')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back to Discover"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            <Text style={styles.backBtnText}>Discover</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.viewTitleHeader}>
          <Text style={styles.viewTitle}>Songs</Text>
          <Text style={styles.viewSubtitle}>
            Discover studio releases with active shoutout recording slots
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#FFFFFF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Try ‘J Cole’"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={activeSearchQuery}
            onChangeText={setInternalSearchQuery}
            accessibilityLabel="Search catalog"
          />
          {activeSearchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearSearchBtn}
            >
              <Ionicons name="close-circle" size={18} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

        {/* Genre Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.genreScrollView}
          contentContainerStyle={styles.genreList}
        >
          {genres.map((g) => {
            const isActive = selectedGenre === g;
            return (
              <TouchableOpacity
                key={g}
                style={[styles.genreChip, isActive && styles.genreChipActive]}
                onPress={() => setSelectedGenre(g)}
              >
                <Text style={[styles.genreText, isActive && styles.genreTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Songs Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading tracks...</Text>
          </View>
        ) : songs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No tracks found</Text>
            <Text style={styles.emptyText}>
              {activeSearchQuery
                ? `No releases matching "${activeSearchQuery}".`
                : `No releases currently in ${selectedGenre}.`}
            </Text>
            <TouchableOpacity
              style={styles.clearFiltersBtn}
              onPress={() => {
                handleClearSearch();
                setSelectedGenre('All');
              }}
            >
              <Ionicons name="refresh" size={14} color={colors.secondaryLight} />
              <Text style={styles.clearFiltersText}>Reset Search & Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          songs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              isPlaying={currentPlayingSongId === song.id && isPlaying}
              onPress={() => onSelectSong(song)}
              onPlayPress={() => onPlaySong(song)}
              onRequestShoutout={() => onRequestShoutout(song)}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  }

  // ==========================================
  // Main View: Discover Home (Figma Node 2106:3201)
  // ==========================================
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Build Recognition Hero Card (Figma Node 2106:3201) */}
      <View style={styles.heroCardWrapper}>
        <ImageBackground
          source={require('../../assets/images/hero_card_bg.png')}
          style={styles.heroCardBg}
          imageStyle={styles.heroCardBgImg}
          resizeMode="cover"
        >
          <Image
            source={require('../../assets/images/hero_at_crystal.png')}
            style={styles.heroCrystalAt}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Build Recognition</Text>
          <Text style={styles.heroSubtitle}>
            Get your first shoutout and claim your unique ID
          </Text>
          <TouchableOpacity
            style={styles.heroClaimBtn}
            onPress={onOpenIdentitySetup}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Claim ID"
          >
            <Text style={styles.heroClaimText}>Claim ID</Text>
          </TouchableOpacity>
        </ImageBackground>
      </View>

      {/* 2. Discover Section Header */}
      <View style={styles.discoverHeaderRow}>
        <Text style={styles.discoverTitle}>Discover</Text>
      </View>

      {/* 3. Discover Interactive 3D Cards (Artists & Songs) - No selected states */}
      <View style={styles.categoryRow}>
        {/* Artists Card -> Transitions to Artists Page */}
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => setCurrentView('artists')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Open Artists page"
        >
          <Image
            source={require('../../assets/images/crystal_mic.png')}
            style={styles.cardMicImg}
            resizeMode="contain"
          />
          <View style={styles.cardTextCol}>
            <Text style={styles.cardTitle}>Artists</Text>
            <Text style={styles.cardSubtext}>Find your favorite artists</Text>
          </View>
        </TouchableOpacity>

        {/* Songs Card -> Transitions to Songs Page */}
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => setCurrentView('songs')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Open Songs page"
        >
          <Image
            source={require('../../assets/images/crystal_vinyl.png')}
            style={styles.cardVinylImg}
            resizeMode="contain"
          />
          <View style={styles.cardTextCol}>
            <Text style={styles.cardTitle}>Songs</Text>
            <Text style={styles.cardSubtext}>Discover songs on the go</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 4. Section Heading: Always "Featured Songs" (Unaffected by cards above) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Featured Songs</Text>
      </View>

      {/* 5. Genre Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.genreScrollView}
        contentContainerStyle={styles.genreList}
      >
        {genres.map((g) => {
          const isActive = selectedGenre === g;
          return (
            <TouchableOpacity
              key={g}
              style={[styles.genreChip, isActive && styles.genreChipActive]}
              onPress={() => setSelectedGenre(g)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Filter by ${g}`}
            >
              <Text style={[styles.genreText, isActive && styles.genreTextActive]}>{g}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 6. Featured Songs Content List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading tracks and shoutout slots...</Text>
        </View>
      ) : songs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No tracks found</Text>
          <Text style={styles.emptyText}>
            {activeSearchQuery
              ? `No releases matching "${activeSearchQuery}".`
              : `No releases currently in ${selectedGenre}.`}
          </Text>
          <TouchableOpacity
            style={styles.clearFiltersBtn}
            onPress={() => {
              handleClearSearch();
              setSelectedGenre('All');
            }}
            accessibilityRole="button"
            accessibilityLabel="Reset search and filters"
          >
            <Ionicons name="refresh" size={14} color={colors.secondaryLight} />
            <Text style={styles.clearFiltersText}>Reset Search & Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        songs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            isPlaying={currentPlayingSongId === song.id && isPlaying}
            onPress={() => onSelectSong(song)}
            onPlayPress={() => onPlaySong(song)}
            onRequestShoutout={() => onRequestShoutout(song)}
          />
        ))
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
    paddingTop: 8,
  },
  // Dedicated sub-views nav
  viewNavBar: {
    paddingVertical: 10,
    marginBottom: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewTitleHeader: {
    marginBottom: 16,
  },
  viewTitle: {
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  viewSubtitle: {
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },

  // Hero Card
  heroCardWrapper: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
  heroCardBg: {
    width: 220,
    height: 258,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroCardBgImg: {
    borderRadius: 16,
  },
  heroCrystalAt: {
    width: 111,
    height: 108,
    alignSelf: 'center',
    marginTop: 10,
  },
  heroTitle: {
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    fontSize: 10.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.72)',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
    paddingHorizontal: 4,
  },
  heroClaimBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 44,
    paddingVertical: 7,
    paddingHorizontal: 36,
    marginTop: 14,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroClaimText: {
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0B0C10',
    letterSpacing: -0.1,
  },

  // Discover Section
  discoverHeaderRow: {
    marginBottom: 14,
  },
  discoverTitle: {
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  categoryCard: {
    flex: 1,
    height: 213,
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  cardMicImg: {
    position: 'absolute',
    top: -60,
    right: -61,
    width: 203,
    height: 203,
  },
  cardVinylImg: {
    position: 'absolute',
    top: -24,
    right: -31,
    width: 131,
    height: 131,
  },
  cardTextCol: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 20,
    zIndex: 2,
  },
  cardTitle: {
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardSubtext: {
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    fontSize: 12,
    fontWeight: '500',
    color: '#919191',
    lineHeight: 16,
  },

  // Section Header Row
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  // Search Box
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    borderRadius: 99,
    paddingHorizontal: 16,
    height: 44,
    marginBottom: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchBoxFocused: {
    borderColor: '#FF4F2E',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: -0.4,
    paddingVertical: 0,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  clearSearchBtn: {
    padding: 4,
  },

  // Genre Chips
  genreScrollView: {
    marginBottom: 18,
  },
  genreList: {
    gap: 8,
    paddingRight: 16,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  genreChipActive: {
    backgroundColor: 'rgba(255, 79, 46, 0.15)',
    borderColor: '#FF4F2E',
  },
  genreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#919191',
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  genreTextActive: {
    color: '#FF4F2E',
    fontWeight: '700',
  },

  // Artists Grid (matching Figma 2103:2733 & 2097:1707)
  artistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    paddingBottom: 24,
  },
  artistGridCard: {
    width: ARTIST_CARD_WIDTH,
    backgroundColor: '#1C1C1C',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  artistAvatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  artistAvatarImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#2A2A2A',
  },
  artistGridName: {
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  artistStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  artistStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  artistStatText: {
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    fontSize: 10.5,
    color: '#8E8E93',
    fontWeight: '500',
  },
  artistStatDivider: {
    width: 1,
    height: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  artistFollowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
    paddingVertical: 6,
    borderRadius: 50,
  },
  artistUnfollowedBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  artistFollowingBtn: {
    backgroundColor: '#FF4F2E',
    borderWidth: 1,
    borderColor: '#FF4F2E',
  },
  artistFollowBtnText: {
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  artistFollowingBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Loading & Empty States
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 6,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 10,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryLight,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
});
