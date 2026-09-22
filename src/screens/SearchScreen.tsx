import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { Artist, Song } from '../types';
import { SongService } from '../services/songs';
import { SongCard } from '../components/SongCard';

const RECENT_SEARCHES_STORAGE_KEY = 'shoutout_recent_searches_v1';
const DEFAULT_RECENT_SEARCHES = ['J Cole', 'Burna Boy', 'Afrobeats', 'Rema'];
const TRENDING_SEARCHES = [
  'J Cole',
  'Burna Boy',
  'Rema',
  'Tems',
  'Afrobeats',
  'Hip Hop',
  'Studio Release',
  'Amapiano',
];

const GENRE_CATEGORIES = [
  { name: 'Afrobeats', colors: ['#FF4F2E', '#FF8359'], icon: 'musical-notes' },
  { name: 'Hip Hop', colors: ['#9D4EDD', '#C77DFF'], icon: 'mic' },
  { name: 'R&B', colors: ['#2A9D8F', '#52B788'], icon: 'disc' },
  { name: 'Pop', colors: ['#E76F51', '#F4A261'], icon: 'radio' },
  { name: 'Amapiano', colors: ['#FFC857', '#FFE082'], icon: 'pulse' },
  { name: 'Electronic', colors: ['#00B4D8', '#90E0EF'], icon: 'headset' },
];

type SearchCategory = 'all' | 'songs' | 'artists';

interface SearchScreenProps {
  onBack: () => void;
  onSelectSong: (song: Song) => void;
  onRequestShoutout: (song: Song) => void;
  onPlaySong: (song: Song) => void;
  currentPlayingSongId?: string;
  isPlaying: boolean;
  onSelectArtist?: (artist: Artist) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  onBack,
  onSelectSong,
  onRequestShoutout,
  onPlaySong,
  currentPlayingSongId,
  isPlaying,
  onSelectArtist,
}) => {
  const songService = SongService.getInstance();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [followedArtistIds, setFollowedArtistIds] = useState<string[]>([]);

  // Hardware Back Handler on Android
  useEffect(() => {
    const onBackPress = () => {
      onBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [onBack]);

  // Load Initial Catalog & Saved Searches
  useEffect(() => {
    const init = async () => {
      try {
        const [songs, artists, storedRecents] = await Promise.all([
          songService.getSongs(),
          songService.getArtists(),
          AsyncStorage.getItem(RECENT_SEARCHES_STORAGE_KEY),
        ]);
        setAllSongs(songs);
        setAllArtists(artists);
        if (storedRecents) {
          const parsed = JSON.parse(storedRecents);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecentSearches(parsed);
          } else {
            setRecentSearches(DEFAULT_RECENT_SEARCHES);
          }
        } else {
          setRecentSearches(DEFAULT_RECENT_SEARCHES);
        }
      } catch {
        setRecentSearches(DEFAULT_RECENT_SEARCHES);
      }
    };
    init();
  }, []);

  // Filter Catalog dynamically as Query or Genre changes
  useEffect(() => {
    const trimmed = query.trim().toLowerCase();

    if (!trimmed && !selectedGenre) {
      setFilteredSongs([]);
      setFilteredArtists([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      // Filter songs
      let songs = allSongs;
      if (selectedGenre) {
        songs = songs.filter(
          (s) => s.genre.toLowerCase() === selectedGenre.toLowerCase()
        );
      }
      if (trimmed) {
        songs = songs.filter(
          (s) =>
            s.title.toLowerCase().includes(trimmed) ||
            s.artist_name.toLowerCase().includes(trimmed) ||
            s.genre.toLowerCase().includes(trimmed)
        );
      }

      // Filter artists
      let artists = allArtists;
      if (selectedGenre) {
        artists = artists.filter(
          (a) => a.genre.toLowerCase() === selectedGenre.toLowerCase()
        );
      }
      if (trimmed) {
        artists = artists.filter(
          (a) =>
            a.name.toLowerCase().includes(trimmed) ||
            a.handle.toLowerCase().includes(trimmed) ||
            a.genre.toLowerCase().includes(trimmed)
        );
      }

      setFilteredSongs(songs);
      setFilteredArtists(artists);
      setLoading(false);
    }, 120);

    return () => clearTimeout(timer);
  }, [query, selectedGenre, allSongs, allArtists]);

  // Save term to recents
  const saveToRecentSearches = async (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    try {
      const updated = [cleaned, ...recentSearches.filter((t) => t.toLowerCase() !== cleaned.toLowerCase())].slice(
        0,
        10
      );
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // storage non-critical
    }
  };

  const handleSelectRecent = (term: string) => {
    setSelectedGenre(null);
    setQuery(term);
    saveToRecentSearches(term);
  };

  const handleRemoveRecent = async (term: string) => {
    const updated = recentSearches.filter((t) => t !== term);
    setRecentSearches(updated);
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // storage non-critical
    }
  };

  const handleClearAllRecents = async () => {
    setRecentSearches([]);
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch {
      // storage non-critical
    }
  };

  const handleSelectGenreCard = (genreName: string) => {
    if (selectedGenre === genreName) {
      setSelectedGenre(null);
    } else {
      setSelectedGenre(genreName);
      setQuery('');
    }
  };

  const handleSubmitSearch = () => {
    if (query.trim()) {
      saveToRecentSearches(query.trim());
      Keyboard.dismiss();
    }
  };

  const handleClearQuery = () => {
    setQuery('');
    setSelectedGenre(null);
    inputRef.current?.focus();
  };

  const toggleFollow = (artistId: string) => {
    setFollowedArtistIds((prev) =>
      prev.includes(artistId)
        ? prev.filter((id) => id !== artistId)
        : [...prev, artistId]
    );
  };

  const isSearchActive = Boolean(query.trim().length > 0 || selectedGenre);
  const totalResultsCount =
    (activeCategory === 'artists' ? 0 : filteredSongs.length) +
    (activeCategory === 'songs' ? 0 : filteredArtists.length);

  return (
    <View style={styles.container}>
      {/* 1. Dedicated Search Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back to previous screen"
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={18} color="#FFFFFF" style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search songs, artists, genres..."
            placeholderTextColor="rgba(255, 255, 255, 0.45)"
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (selectedGenre && text.length > 0) {
                setSelectedGenre(null);
              }
            }}
            onSubmitEditing={handleSubmitSearch}
            returnKeyType="search"
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Search catalog"
          />
          {Boolean(query.length > 0 || selectedGenre) && (
            <TouchableOpacity
              onPress={handleClearQuery}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Clear search input"
            >
              <Ionicons name="close-circle" size={18} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={onBack}
          style={styles.cancelButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Cancel search"
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Genre Banner indicator if active */}
      {selectedGenre && (
        <View style={styles.activeGenreBanner}>
          <Text style={styles.activeGenreText}>
            Filtering by genre: <Text style={styles.activeGenreHighlight}>{selectedGenre}</Text>
          </Text>
          <TouchableOpacity
            onPress={() => setSelectedGenre(null)}
            style={styles.genreBannerClose}
          >
            <Ionicons name="close" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* 2. Category Filter Tabs (All / Songs / Artists) */}
      {isSearchActive && (
        <View style={styles.categoryTabsRow}>
          <TouchableOpacity
            style={[styles.categoryTab, activeCategory === 'all' && styles.categoryTabActive]}
            onPress={() => setActiveCategory('all')}
          >
            <Text
              style={[
                styles.categoryTabText,
                activeCategory === 'all' && styles.categoryTabTextActive,
              ]}
            >
              All {`(${filteredSongs.length + filteredArtists.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryTab, activeCategory === 'songs' && styles.categoryTabActive]}
            onPress={() => setActiveCategory('songs')}
          >
            <Text
              style={[
                styles.categoryTabText,
                activeCategory === 'songs' && styles.categoryTabTextActive,
              ]}
            >
              Songs {`(${filteredSongs.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryTab,
              activeCategory === 'artists' && styles.categoryTabActive,
            ]}
            onPress={() => setActiveCategory('artists')}
          >
            <Text
              style={[
                styles.categoryTabText,
                activeCategory === 'artists' && styles.categoryTabTextActive,
              ]}
            >
              Artists {`(${filteredArtists.length})`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Main Content Body */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Searching catalog...</Text>
          </View>
        )}

        {/* ============================================================== */}
        {/* STATE A: ACTIVE SEARCH RESULTS                                */}
        {/* ============================================================== */}
        {!loading && isSearchActive && (
          <>
            {totalResultsCount === 0 ? (
              /* State A.1: Empty Search Results */
              <View style={styles.noResultsContainer}>
                <View style={styles.noResultsGlow}>
                  <Ionicons name="search-outline" size={38} color={colors.primary} />
                </View>
                <Text style={styles.noResultsTitle}>
                  No matches for &ldquo;{query || selectedGenre}&rdquo;
                </Text>
                <Text style={styles.noResultsSubtitle}>
                  Check for spelling errors or try searching for another artist name, song title, or genre.
                </Text>
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={handleClearQuery}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={15} color="#FFFFFF" />
                  <Text style={styles.resetBtnText}>Clear Search</Text>
                </TouchableOpacity>

                {/* Quick suggestions */}
                <View style={styles.quickSuggestionsBox}>
                  <Text style={styles.quickSuggestionsTitle}>Popular suggestions:</Text>
                  <View style={styles.suggestionsPills}>
                    {['J Cole', 'Burna Boy', 'Afrobeats'].map((term) => (
                      <TouchableOpacity
                        key={term}
                        style={styles.suggestionPill}
                        onPress={() => handleSelectRecent(term)}
                      >
                        <Text style={styles.suggestionPillText}>{term}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              /* State A.2: Results Found */
              <>
                {/* Section 1: Matching Artists */}
                {(activeCategory === 'all' || activeCategory === 'artists') &&
                  filteredArtists.length > 0 && (
                    <View style={styles.resultsSection}>
                      <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionHeading}>Artists</Text>
                        <Text style={styles.sectionCountBadge}>{filteredArtists.length}</Text>
                      </View>

                      <View style={styles.artistList}>
                        {filteredArtists.map((artist) => {
                          const isFollowed = followedArtistIds.includes(artist.id);
                          return (
                            <TouchableOpacity
                              key={artist.id}
                              style={styles.artistRowCard}
                              onPress={() => onSelectArtist?.(artist)}
                              activeOpacity={0.8}
                            >
                              <LinearGradient
                                colors={['#FF4F2E', '#FFC857', '#7DF687']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.artistAvatarRing}
                              >
                                <Image
                                  source={{ uri: artist.avatar_url }}
                                  style={styles.artistAvatarImg}
                                />
                              </LinearGradient>

                              <View style={styles.artistInfoCol}>
                                <View style={styles.artistNameRow}>
                                  <Text style={styles.artistName} numberOfLines={1}>
                                    {artist.name}
                                  </Text>
                                  {artist.verified && (
                                    <Ionicons
                                      name="checkmark-circle"
                                      size={14}
                                      color={colors.secondary}
                                      style={{ marginLeft: 4 }}
                                    />
                                  )}
                                </View>
                                <Text style={styles.artistHandle} numberOfLines={1}>
                                  {artist.handle} • {artist.genre}
                                </Text>
                              </View>

                              <TouchableOpacity
                                onPress={() => toggleFollow(artist.id)}
                                activeOpacity={0.75}
                                style={[
                                  styles.followBtn,
                                  isFollowed ? styles.followingBtn : styles.unfollowedBtn,
                                ]}
                              >
                                <Feather
                                  name={isFollowed ? 'user-check' : 'user-plus'}
                                  size={12}
                                  color="#FFFFFF"
                                />
                                <Text style={styles.followBtnText}>
                                  {isFollowed ? 'Following' : 'Follow'}
                                </Text>
                              </TouchableOpacity>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                {/* Section 2: Matching Songs */}
                {(activeCategory === 'all' || activeCategory === 'songs') &&
                  filteredSongs.length > 0 && (
                    <View style={styles.resultsSection}>
                      <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionHeading}>Songs</Text>
                        <Text style={styles.sectionCountBadge}>{filteredSongs.length}</Text>
                      </View>

                      {filteredSongs.map((song) => (
                        <SongCard
                          key={song.id}
                          song={song}
                          isPlaying={currentPlayingSongId === song.id && isPlaying}
                          onPress={() => {
                            saveToRecentSearches(song.title);
                            onSelectSong(song);
                          }}
                          onPlayPress={() => onPlaySong(song)}
                          onRequestShoutout={() => {
                            saveToRecentSearches(song.title);
                            onRequestShoutout(song);
                          }}
                        />
                      ))}
                    </View>
                  )}
              </>
            )}
          </>
        )}

        {/* ============================================================== */}
        {/* STATE B: INITIAL / DISCOVERY SEARCH STATE                     */}
        {/* ============================================================== */}
        {!isSearchActive && (
          <>
            {/* B.1: Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.initialSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderTitleWithIcon}>
                    <Ionicons name="time-outline" size={17} color={colors.textSecondary} />
                    <Text style={styles.initialSectionTitle}>Recent Searches</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleClearAllRecents}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Clear all recent searches"
                  >
                    <Text style={styles.clearAllText}>Clear all</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.recentsList}>
                  {recentSearches.map((term) => (
                    <View key={term} style={styles.recentItemRow}>
                      <TouchableOpacity
                        style={styles.recentItemClickable}
                        onPress={() => handleSelectRecent(term)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="search-outline"
                          size={15}
                          color="rgba(255, 255, 255, 0.4)"
                        />
                        <Text style={styles.recentItemText} numberOfLines={1}>
                          {term}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleRemoveRecent(term)}
                        style={styles.recentRemoveBtn}
                        accessibilityLabel={`Remove ${term} from recent searches`}
                      >
                        <Ionicons name="close" size={15} color="rgba(255, 255, 255, 0.4)" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* B.2: Trending Searches */}
            <View style={styles.initialSection}>
              <View style={styles.sectionHeaderTitleWithIcon}>
                <Ionicons name="flame" size={17} color={colors.brandCoral} />
                <Text style={styles.initialSectionTitle}>Trending Searches</Text>
              </View>

              <View style={styles.trendingPillsWrap}>
                {TRENDING_SEARCHES.map((term) => (
                  <TouchableOpacity
                    key={term}
                    style={styles.trendingPill}
                    onPress={() => handleSelectRecent(term)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="trending-up" size={13} color={colors.primaryLight} />
                    <Text style={styles.trendingPillText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* B.3: Browse by Genre */}
            <View style={styles.initialSection}>
              <View style={styles.sectionHeaderTitleWithIcon}>
                <Ionicons name="grid-outline" size={17} color={colors.secondary} />
                <Text style={styles.initialSectionTitle}>Browse by Genre</Text>
              </View>

              <View style={styles.genreGrid}>
                {GENRE_CATEGORIES.map((genre) => (
                  <TouchableOpacity
                    key={genre.name}
                    style={styles.genreCard}
                    onPress={() => handleSelectGenreCard(genre.name)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={genre.colors as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.genreCardGradient}
                    >
                      <View style={styles.genreCardIconWrap}>
                        <Ionicons
                          name={genre.icon as any}
                          size={20}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text style={styles.genreCardTitle}>{genre.name}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C10',
  },
  /* Header Bar */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#12141A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    backgroundColor: '#1B1D27',
    borderRadius: 21,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    paddingVertical: 0,
    letterSpacing: -0.2,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  cancelButton: {
    paddingLeft: 12,
    paddingVertical: 6,
  },
  cancelButtonText: {
    color: '#FF4F2E',
    fontSize: 14,
    fontWeight: '600',
  },
  /* Active Genre Banner */
  activeGenreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 79, 46, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 79, 46, 0.25)',
  },
  activeGenreText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  activeGenreHighlight: {
    color: '#FF4F2E',
    fontWeight: '700',
  },
  genreBannerClose: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* Category Tabs */
  categoryTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#12141A',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryTabActive: {
    backgroundColor: '#FF4F2E',
    borderColor: '#FF4F2E',
  },
  categoryTabText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 13,
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  /* Scroll Area */
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  /* Loading */
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
  },
  /* Results Sections */
  resultsSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  /* Artist List in Search */
  artistList: {
    gap: 8,
    marginBottom: 8,
  },
  artistRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161820',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  artistAvatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  artistAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#20222C',
  },
  artistInfoCol: {
    flex: 1,
  },
  artistNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  artistHandle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5,
  },
  unfollowedBtn: {
    backgroundColor: '#FF4F2E',
  },
  followingBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  followBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  /* No Results View */
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  noResultsGlow: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 79, 46, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 79, 46, 0.25)',
  },
  noResultsTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSubtitle: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    maxWidth: 280,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4F2E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  quickSuggestionsBox: {
    marginTop: 32,
    alignItems: 'center',
  },
  quickSuggestionsTitle: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    marginBottom: 10,
  },
  suggestionsPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  suggestionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  suggestionPillText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  /* Initial State Sections */
  initialSection: {
    marginBottom: 28,
  },
  sectionHeaderTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  initialSectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  clearAllText: {
    color: '#FF4F2E',
    fontSize: 12,
    fontWeight: '600',
  },
  recentsList: {
    backgroundColor: '#14151B',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  recentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  recentItemClickable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recentItemText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '500',
  },
  recentRemoveBtn: {
    padding: 6,
  },
  trendingPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  trendingPillText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genreCard: {
    width: '48%',
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
  },
  genreCardGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  genreCardIconWrap: {
    alignSelf: 'flex-start',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genreCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
