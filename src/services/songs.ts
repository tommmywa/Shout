import { StorageService } from './storage';
import { Artist, Shoutout, Song } from '../types';

export class SongService {
  private static instance: SongService;
  private storage = StorageService.getInstance();

  private constructor() {}

  public static getInstance(): SongService {
    if (!SongService.instance) {
      SongService.instance = new SongService();
    }
    return SongService.instance;
  }

  public async getSongs(query?: string, genre?: string): Promise<Song[]> {
    await this.storage.init();
    let songs = await this.storage.getSongs();

    if (genre && genre !== 'All') {
      songs = songs.filter((s) => s.genre.toLowerCase().includes(genre.toLowerCase()));
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      songs = songs.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist_name.toLowerCase().includes(q) ||
          s.genre.toLowerCase().includes(q)
      );
    }

    return songs;
  }

  public async getFeaturedSongs(): Promise<Song[]> {
    await this.storage.init();
    const songs = await this.storage.getSongs();
    return songs.slice(0, 5);
  }

  public async getSongById(songId: string): Promise<Song | null> {
    await this.storage.init();
    const songs = await this.storage.getSongs();
    return songs.find((s) => s.id === songId) || null;
  }

  public async getArtistById(artistId: string): Promise<Artist | null> {
    await this.storage.init();
    const artists = await this.storage.getArtists();
    return artists.find((a) => a.id === artistId) || null;
  }

  public async getArtists(): Promise<Artist[]> {
    await this.storage.init();
    return await this.storage.getArtists();
  }

  public async getShoutoutsForSong(songId: string): Promise<Shoutout[]> {
    await this.storage.init();
    const all = await this.storage.getShoutouts();
    // Return published or minted shoutouts that are public
    return all.filter(
      (s) =>
        s.song_id === songId &&
        (s.status === 'published' || s.status === 'minted' || s.status === 'mint_pending')
    );
  }

  public async getGenres(): Promise<string[]> {
    await this.storage.init();
    const songs = await this.storage.getSongs();
    const set = new Set<string>();
    songs.forEach((s) => set.add(s.genre));
    return ['All', ...Array.from(set)];
  }
}
