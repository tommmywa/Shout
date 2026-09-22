import { StorageService } from './storage';
import { GlobalIdentity, HandleAvailabilityResponse, IdentityToken, UserIdentityOwnership } from '../types';
import { AppError } from '../types/errors';

export class IdentityService {
  private static instance: IdentityService;
  private storage = StorageService.getInstance();

  private constructor() {}

  public static getInstance(): IdentityService {
    if (!IdentityService.instance) {
      IdentityService.instance = new IdentityService();
    }
    return IdentityService.instance;
  }

  public normalizeHandle(handle: string): string {
    let clean = handle.trim().toLowerCase();
    if (!clean.startsWith('@')) {
      clean = '@' + clean;
    }
    return clean;
  }

  public validateHandleFormat(handle: string): { isValid: boolean; error?: string } {
    const clean = this.normalizeHandle(handle);
    const body = clean.slice(1);

    if (body.length < 3) {
      return { isValid: false, error: 'Handle must be at least 3 characters long.' };
    }
    if (body.length > 20) {
      return { isValid: false, error: 'Handle cannot exceed 20 characters.' };
    }
    if (!/^[a-z0-9_]+$/.test(body)) {
      return { isValid: false, error: 'Handle can only contain letters, numbers, and underscores.' };
    }
    return { isValid: true };
  }

  public async checkAvailability(rawHandle: string): Promise<HandleAvailabilityResponse> {
    await this.storage.init();
    const handle = this.normalizeHandle(rawHandle);
    const formatCheck = this.validateHandleFormat(handle);

    if (!formatCheck.isValid) {
      return {
        handle,
        available: false,
        reason: formatCheck.error,
      };
    }

    const identities = await this.storage.getIdentities();
    const isTaken = identities.some(
      (i) => i.handle.toLowerCase() === handle.toLowerCase()
    );

    if (isTaken) {
      const suggestions = await this.generateSuggestions(handle, identities);
      return {
        handle,
        available: false,
        reason: 'This handle is already claimed by another global identity.',
        suggestions,
      };
    }

    return {
      handle,
      available: true,
    };
  }

  private async generateSuggestions(
    baseHandle: string,
    identities: GlobalIdentity[]
  ): Promise<string[]> {
    const raw = baseHandle.replace(/^@/, '');
    const candidates = [
      `@${raw}_fan`,
      `@${raw}_music`,
      `@${raw}_vibes`,
      `@${raw}_official`,
      `@${raw}_${Math.floor(Math.random() * 89 + 10)}`,
    ];

    const takenSet = new Set(identities.map((i) => i.handle.toLowerCase()));
    return candidates.filter((c) => !takenSet.has(c.toLowerCase())).slice(0, 3);
  }

  public async claimIdentity(
    userId: string,
    displayName: string,
    rawHandle: string,
    bio?: string
  ): Promise<GlobalIdentity> {
    await this.storage.init();
    const handle = this.normalizeHandle(rawHandle);
    const availability = await this.checkAvailability(handle);

    if (!availability.available) {
      throw new AppError('HANDLE_TAKEN', availability.reason || 'Handle is not available.', false);
    }

    const users = await this.storage.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'User not found. You must be signed in to claim a global identity.', false);
    }

    const randomNft = Math.random().toString(16).substring(2, 6).toUpperCase();
    const randomMint = Math.random().toString(16).substring(2, 6).toUpperCase();

    const identityId = `id-${handle.slice(1)}-${Date.now().toString().slice(-4)}`;
    const newIdentity: GlobalIdentity = {
      id: identityId,
      handle,
      display_name: displayName.trim(),
      identity_nft_address: `0x${randomNft}...SBT`,
      owner_wallet_address: user.wallet_address,
      owner_user_id: user.id,
      verification_status: 'unverified',
      total_shoutouts_ever: 0,
      global_resonance_score: 50, // Starter score
      token_mint_address: `0x${randomMint}...TKN`,
      bio: bio?.trim() || 'Music supporter & ShoutOut identity holder.',
      created_at: new Date().toISOString(),
    };

    // Save identity
    await this.storage.saveIdentity(newIdentity);

    // Save ownership
    const ownership: UserIdentityOwnership = {
      user_id: user.id,
      identity_id: identityId,
      is_primary: true,
    };
    await this.storage.saveOwnership(ownership);

    // Update user active identity
    user.active_identity_id = identityId;
    user.display_name = displayName.trim();
    await this.storage.saveUser(user);

    // Broadcast session update to auth listeners across the app
    const { AuthService } = await import('./auth');
    AuthService.getInstance().notifyUserUpdated(user);

    // Audit trail logging
    const audit = (await import('./audit')).AuditService.getInstance();
    await audit.log({
      level: 'AUDIT',
      action: 'GLOBAL_IDENTITY_CLAIMED',
      actorId: user.id,
      entityType: 'identity',
      entityId: identityId,
      metadata: {
        handle,
        displayName: displayName.trim(),
        walletAddress: user.wallet_address,
        nftAddress: newIdentity.identity_nft_address,
      },
    });

    return newIdentity;
  }

  public async getIdentity(idOrHandle: string): Promise<GlobalIdentity | null> {
    await this.storage.init();
    const identities = await this.storage.getIdentities();
    const clean = this.normalizeHandle(idOrHandle);

    return (
      identities.find(
        (i) => i.id === idOrHandle || i.handle.toLowerCase() === clean.toLowerCase()
      ) || null
    );
  }

  public async getIdentityForUser(userId: string): Promise<GlobalIdentity | null> {
    await this.storage.init();
    const users = await this.storage.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user || !user.active_identity_id) return null;

    return await this.getIdentity(user.active_identity_id);
  }

  public async getIdentityToken(identityId: string): Promise<IdentityToken> {
    const identity = await this.getIdentity(identityId);
    const symbol = identity
      ? identity.handle.replace(/[@_]/g, '').slice(0, 5).toUpperCase()
      : 'SHOUT';

    const count = identity?.total_shoutouts_ever || 0;
    const price = +(0.001 + count * 0.0004).toFixed(4);
    const supply = count * 100;

    return {
      symbol,
      currentPrice: price,
      totalSupply: supply,
      mintStatus: count > 0 ? 'minted' : 'not_started',
      contractAddress: identity?.token_mint_address || '0x0000...0000',
      priceChange24h: +(count * 1.8).toFixed(1),
    };
  }
}
