import { StorageService } from './storage';
import { User } from '../types';

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
}

export interface ReturnContext {
  screen: string;
  songId?: string;
  tierId?: string;
  shoutoutId?: string;
}

export class AuthService {
  private static instance: AuthService;
  private storage = StorageService.getInstance();
  private listeners: ((session: AuthSession) => void)[] = [];

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async getSession(): Promise<AuthSession> {
    await this.storage.init();
    const currentId = await this.storage.getCurrentUserId();
    if (!currentId) {
      return { user: null, isAuthenticated: false };
    }
    const users = await this.storage.getUsers();
    const user = users.find((u) => u.id === currentId) || null;
    return {
      user,
      isAuthenticated: !!user,
    };
  }

  public async login(email: string): Promise<User> {
    await this.storage.init();
    const users = await this.storage.getUsers();
    let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Auto-register convenience for seamless testing
      user = await this.signup(email, email.split('@')[0]);
    } else {
      await this.storage.setCurrentUserId(user.id);
      this.notifyListeners({ user, isAuthenticated: true });
    }
    return user;
  }

  public async signup(email: string, displayName: string): Promise<User> {
    await this.storage.init();
    const users = await this.storage.getUsers();

    // Check if user already exists
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      await this.storage.setCurrentUserId(existing.id);
      this.notifyListeners({ user: existing, isAuthenticated: true });
      return existing;
    }

    const randomHex = Math.random().toString(16).substring(2, 10).toUpperCase();
    const newUser: User = {
      id: `user-${Date.now()}`,
      wallet_address: `0x${randomHex}92c10298a472c1a9381029381029`,
      email,
      is_artist: false,
      display_name: displayName,
      created_at: new Date().toISOString(),
    };

    await this.storage.saveUser(newUser);
    await this.storage.setCurrentUserId(newUser.id);
    this.notifyListeners({ user: newUser, isAuthenticated: true });
    return newUser;
  }

  public async updateUser(updates: Partial<User>): Promise<User | null> {
    await this.storage.init();
    const currentId = await this.storage.getCurrentUserId();
    if (!currentId) return null;
    const users = await this.storage.getUsers();
    const user = users.find((u) => u.id === currentId);
    if (!user) return null;

    const updatedUser: User = {
      ...user,
      ...updates,
    };
    await this.storage.saveUser(updatedUser);
    this.notifyListeners({ user: updatedUser, isAuthenticated: true });
    return updatedUser;
  }

  public notifyUserUpdated(user: User): void {
    this.notifyListeners({ user, isAuthenticated: true });
  }

  public async switchUser(userId: string): Promise<User | null> {
    await this.storage.init();
    const users = await this.storage.getUsers();
    const target = users.find((u) => u.id === userId);
    if (target) {
      await this.storage.setCurrentUserId(target.id);
      this.notifyListeners({ user: target, isAuthenticated: true });
      return target;
    }
    return null;
  }

  public async logout(): Promise<void> {
    await this.storage.setCurrentUserId(null);
    this.notifyListeners({ user: null, isAuthenticated: false });
  }

  public async setReturnContext(context: ReturnContext | null): Promise<void> {
    await this.storage.setReturnContext(context ? JSON.stringify(context) : null);
  }

  public async getAndClearReturnContext(): Promise<ReturnContext | null> {
    const raw = await this.storage.getReturnContext();
    if (raw) {
      await this.storage.setReturnContext(null);
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  public subscribe(listener: (session: AuthSession) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(session: AuthSession): void {
    this.listeners.forEach((l) => l(session));
  }
}
