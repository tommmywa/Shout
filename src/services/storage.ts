import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Artist,
  GlobalIdentity,
  Shoutout,
  ShoutoutOrder,
  Song,
  User,
  UserIdentityOwnership,
} from '../types';
import { AuditLogEntry, IdempotencyRecord } from '../types/audit';
import {
  SEED_ARTISTS,
  SEED_IDENTITIES,
  SEED_SHOUTOUTS,
  SEED_SONGS,
} from '../data/seedData';

const KEYS = {
  USERS: '@shoutout_users_v1',
  IDENTITIES: '@shoutout_identities_v1',
  OWNERSHIPS: '@shoutout_ownerships_v1',
  SONGS: '@shoutout_songs_v1',
  ARTISTS: '@shoutout_artists_v1',
  SHOUTOUTS: '@shoutout_shoutouts_v1',
  ORDERS: '@shoutout_orders_v1',
  AUDIT_LOGS: '@shoutout_audit_logs_v1',
  IDEMPOTENCY_RECORDS: '@shoutout_idempotency_records_v1',
  CURRENT_USER_ID: '@shoutout_current_user_id_v1',
  RETURN_CONTEXT: '@shoutout_return_context_v1',
  INITIALIZED: '@shoutout_initialized_v1',
  ONBOARDING_COMPLETED: '@shoutout_onboarding_completed_v1',
};

// In-memory fallback in case AsyncStorage encounters environment quirks
const memoryStore: Record<string, string> = {};

async function getItem(key: string): Promise<string | null> {
  try {
    const val = await AsyncStorage.getItem(key);
    if (val !== null) return val;
  } catch (e) {
    // fallback
  }
  return memoryStore[key] ?? null;
}

async function setItem(key: string, value: string): Promise<void> {
  memoryStore[key] = value;
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    // silently use memoryStore
  }
}

export class StorageService {
  private static instance: StorageService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  public async init(): Promise<void> {
    if (this.initialized) return;

    const isInitialized = await getItem(KEYS.INITIALIZED);
    if (!isInitialized) {
      await this.resetToSeeds();
    }
    this.initialized = true;
  }

  public async resetToSeeds(): Promise<void> {
    // Seed initial users
    const defaultUser: User = {
      id: 'user-sara',
      wallet_address: '0x94B73e277c01828192a472c1a938102938101F20',
      email: 'sara@shoutout.fm',
      is_artist: false,
      active_identity_id: 'id-sara',
      display_name: 'Sara K.',
      created_at: new Date().toISOString(),
    };

    const guestUser: User = {
      id: 'user-guest',
      wallet_address: '0x88A210982301828192a472c1a938102938102B11',
      email: 'guest@shoutout.fm',
      is_artist: false,
      active_identity_id: undefined, // Fresh user without identity to demonstrate onboarding
      display_name: 'Alex Rivera',
      created_at: new Date().toISOString(),
    };

    const ownerships: UserIdentityOwnership[] = [
      {
        user_id: 'user-sara',
        identity_id: 'id-sara',
        is_primary: true,
      },
    ];

    await setItem(KEYS.USERS, JSON.stringify([defaultUser, guestUser]));
    await setItem(KEYS.IDENTITIES, JSON.stringify(SEED_IDENTITIES));
    await setItem(KEYS.OWNERSHIPS, JSON.stringify(ownerships));
    await setItem(KEYS.ARTISTS, JSON.stringify(SEED_ARTISTS));
    await setItem(KEYS.SONGS, JSON.stringify(SEED_SONGS));
    await setItem(KEYS.SHOUTOUTS, JSON.stringify(SEED_SHOUTOUTS));
    await setItem(KEYS.ORDERS, JSON.stringify([]));
    await setItem(KEYS.CURRENT_USER_ID, 'user-sara');
    await setItem(KEYS.INITIALIZED, 'true');
  }

  // Users
  public async getUsers(): Promise<User[]> {
    const raw = await getItem(KEYS.USERS);
    return raw ? JSON.parse(raw) : [];
  }

  public async saveUser(user: User): Promise<void> {
    const users = await this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    await setItem(KEYS.USERS, JSON.stringify(users));
  }

  public async getCurrentUserId(): Promise<string | null> {
    return await getItem(KEYS.CURRENT_USER_ID);
  }

  public async setCurrentUserId(userId: string | null): Promise<void> {
    if (userId) {
      await setItem(KEYS.CURRENT_USER_ID, userId);
    } else {
      try {
        await AsyncStorage.removeItem(KEYS.CURRENT_USER_ID);
      } catch (e) {}
      delete memoryStore[KEYS.CURRENT_USER_ID];
    }
  }

  // Identities
  public async getIdentities(): Promise<GlobalIdentity[]> {
    const raw = await getItem(KEYS.IDENTITIES);
    return raw ? JSON.parse(raw) : [];
  }

  public async saveIdentity(identity: GlobalIdentity): Promise<void> {
    const identities = await this.getIdentities();
    const idx = identities.findIndex((i) => i.id === identity.id);
    if (idx >= 0) {
      identities[idx] = identity;
    } else {
      identities.push(identity);
    }
    await setItem(KEYS.IDENTITIES, JSON.stringify(identities));
  }

  // Ownerships
  public async getOwnerships(): Promise<UserIdentityOwnership[]> {
    const raw = await getItem(KEYS.OWNERSHIPS);
    return raw ? JSON.parse(raw) : [];
  }

  public async saveOwnership(ownership: UserIdentityOwnership): Promise<void> {
    const ownerships = await this.getOwnerships();
    ownerships.push(ownership);
    await setItem(KEYS.OWNERSHIPS, JSON.stringify(ownerships));
  }

  // Songs & Artists
  public async getSongs(): Promise<Song[]> {
    const raw = await getItem(KEYS.SONGS);
    return raw ? JSON.parse(raw) : [];
  }

  public async saveSong(song: Song): Promise<void> {
    const songs = await this.getSongs();
    const idx = songs.findIndex((s) => s.id === song.id);
    if (idx >= 0) {
      songs[idx] = song;
    } else {
      songs.push(song);
    }
    await setItem(KEYS.SONGS, JSON.stringify(songs));
  }

  public async getArtists(): Promise<Artist[]> {
    const raw = await getItem(KEYS.ARTISTS);
    return raw ? JSON.parse(raw) : [];
  }

  // Shoutouts
  public async getShoutouts(): Promise<Shoutout[]> {
    const raw = await getItem(KEYS.SHOUTOUTS);
    return raw ? JSON.parse(raw) : [];
  }

  public async saveShoutout(shoutout: Shoutout): Promise<void> {
    const shoutouts = await this.getShoutouts();
    const idx = shoutouts.findIndex((s) => s.id === shoutout.id);
    if (idx >= 0) {
      shoutouts[idx] = shoutout;
    } else {
      shoutouts.unshift(shoutout);
    }
    await setItem(KEYS.SHOUTOUTS, JSON.stringify(shoutouts));
  }

  // Orders
  public async getOrders(): Promise<ShoutoutOrder[]> {
    const raw = await getItem(KEYS.ORDERS);
    return raw ? JSON.parse(raw) : [];
  }

  public async saveOrder(order: ShoutoutOrder): Promise<void> {
    const orders = await this.getOrders();
    const idx = orders.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      orders[idx] = order;
    } else {
      orders.unshift(order);
    }
    await setItem(KEYS.ORDERS, JSON.stringify(orders));
  }

  // Return context (for interrupted purchase flow)
  public async getReturnContext(): Promise<string | null> {
    return await getItem(KEYS.RETURN_CONTEXT);
  }

  public async setReturnContext(contextJson: string | null): Promise<void> {
    if (contextJson) {
      await setItem(KEYS.RETURN_CONTEXT, contextJson);
    } else {
      try {
        await AsyncStorage.removeItem(KEYS.RETURN_CONTEXT);
      } catch (e) {}
      delete memoryStore[KEYS.RETURN_CONTEXT];
    }
  }

  // Audit Logs
  public async getAuditLogs(): Promise<AuditLogEntry[]> {
    const raw = await getItem(KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : [];
  }

  public async saveAuditLog(entry: AuditLogEntry): Promise<void> {
    const logs = await this.getAuditLogs();
    logs.unshift(entry);
    // Keep last 250 audit log entries to prevent memory unbounded growth
    if (logs.length > 250) logs.pop();
    await setItem(KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  // Idempotency Records
  public async getIdempotencyRecord(key: string): Promise<IdempotencyRecord | null> {
    const raw = await getItem(KEYS.IDEMPOTENCY_RECORDS);
    const records: IdempotencyRecord[] = raw ? JSON.parse(raw) : [];
    return records.find((r) => r.key === key) || null;
  }

  public async saveIdempotencyRecord(record: IdempotencyRecord): Promise<void> {
    const raw = await getItem(KEYS.IDEMPOTENCY_RECORDS);
    const records: IdempotencyRecord[] = raw ? JSON.parse(raw) : [];
    const idx = records.findIndex((r) => r.key === record.key);
    if (idx >= 0) {
      records[idx] = record;
    } else {
      records.unshift(record);
    }
    if (records.length > 250) records.pop();
    await setItem(KEYS.IDEMPOTENCY_RECORDS, JSON.stringify(records));
  }

  // Onboarding status
  public async hasCompletedOnboarding(): Promise<boolean> {
    const raw = await getItem(KEYS.ONBOARDING_COMPLETED);
    return raw === 'true';
  }

  public async setOnboardingCompleted(completed: boolean): Promise<void> {
    await setItem(KEYS.ONBOARDING_COMPLETED, completed ? 'true' : 'false');
  }
}
