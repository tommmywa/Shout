import { StorageService } from './storage';
import { AuditService } from './audit';
import { SEED_TIERS } from '../data/seedData';
import { AppError } from '../types/errors';
import {
  PaymentStatus,
  Shoutout,
  ShoutoutOrder,
  ShoutoutStatus,
  Song,
  TierConfig,
  TierId,
} from '../types';

export interface CreateOrderParams {
  userId: string;
  identityId: string;
  songId: string;
  tier: TierId;
  shoutoutText: string;
  pronunciationGuide?: string;
  socialTag?: string;
  existingOrderId?: string;
}

export interface PaymentResult {
  success: boolean;
  order: ShoutoutOrder;
  shoutout?: Shoutout;
  error?: string;
  code?: string;
  isIdempotentReplay?: boolean;
}

// Strict state transition map enforcing transaction consistency (06-state-machine.md)
const VALID_TRANSITIONS: Record<ShoutoutStatus, ShoutoutStatus[]> = {
  draft: ['pending_payment', 'cancelled'],
  pending_payment: ['paid', 'rejected', 'cancelled'],
  paid: ['pending_artist_review'],
  pending_artist_review: ['approved', 'rejected'],
  approved: ['published', 'rejected'],
  published: ['mint_pending'],
  mint_pending: ['minted'],
  minted: [],
  rejected: ['refunded'],
  refunded: [],
  cancelled: [],
};

export class ShoutoutService {
  private static instance: ShoutoutService;
  private storage = StorageService.getInstance();
  private audit = AuditService.getInstance();

  private constructor() {}

  public static getInstance(): ShoutoutService {
    if (!ShoutoutService.instance) {
      ShoutoutService.instance = new ShoutoutService();
    }
    return ShoutoutService.instance;
  }

  public getTiers(): TierConfig[] {
    return SEED_TIERS;
  }

  public getTier(id: TierId): TierConfig | undefined {
    return SEED_TIERS.find((t) => t.id === id);
  }

  public async hasDuplicatePendingOrder(
    identityId: string,
    songId: string,
    tier: TierId
  ): Promise<boolean> {
    await this.storage.init();
    const shoutouts = await this.storage.getShoutouts();
    return shoutouts.some(
      (s) =>
        s.identity_id === identityId &&
        s.song_id === songId &&
        s.tier === tier &&
        ['pending_payment', 'paid', 'pending_artist_review'].includes(s.status)
    );
  }

  /**
   * 1. Authorization: Verifies requesting user holds ownership of target Global Identity.
   * 2. Server-Side Pricing: Resolves price exclusively from server tier configuration.
   * 3. Duplicate Prevention: Disallows duplicate orders unless updating an existing draft.
   * 4. Audit Trail: Logs order creation.
   */
  public async createOrder(params: CreateOrderParams): Promise<ShoutoutOrder> {
    await this.storage.init();

    // 1. Tier validation & Server-Side Pricing
    const tierConfig = this.getTier(params.tier);
    if (!tierConfig) {
      throw new AppError('INVALID_STATE_TRANSITION', `Invalid shoutout tier: ${params.tier}`, false);
    }
    if (!tierConfig.available_in_mvp) {
      throw new AppError(
        'FORBIDDEN',
        `${tierConfig.name} is arriving in Phase 2. Only Bronze and Silver are purchasable in MVP.`,
        false
      );
    }

    // 2. Resource existence checks
    const songs = await this.storage.getSongs();
    const song = songs.find((s) => s.id === params.songId);
    if (!song) {
      throw new AppError('SONG_NOT_FOUND', 'Selected song was not found in catalog.', false);
    }

    const identities = await this.storage.getIdentities();
    const identity = identities.find((i) => i.id === params.identityId);
    if (!identity) {
      throw new AppError('IDENTITY_NOT_FOUND', 'Global Identity not found. Please establish your identity first.', false);
    }

    // 3. Identity Ownership Authorization Check
    const users = await this.storage.getUsers();
    const user = users.find((u) => u.id === params.userId);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required to initiate orders.', false);
    }

    const ownerships = await this.storage.getOwnerships();
    const isOwner =
      ownerships.some((o) => o.user_id === params.userId && o.identity_id === params.identityId) ||
      user.active_identity_id === params.identityId ||
      identity.owner_user_id === params.userId;

    if (!isOwner) {
      await this.audit.log({
        level: 'WARN',
        action: 'ORDER_CREATION_DENIED_OWNERSHIP_MISMATCH',
        actorId: params.userId,
        entityType: 'identity',
        entityId: params.identityId,
        metadata: { songId: params.songId, tier: params.tier },
      });
      throw new AppError('IDENTITY_NOT_OWNED', 'You do not hold authenticated ownership of this Global Identity.', false);
    }

    // 4. Duplicate Order Prevention Check
    if (!params.existingOrderId) {
      const isDuplicate = await this.hasDuplicatePendingOrder(
        params.identityId,
        params.songId,
        params.tier
      );
      if (isDuplicate) {
        throw new AppError(
          'DUPLICATE_PENDING_ORDER',
          `You already have an active pending order for "${song.title}" on ${tierConfig.name} tier.`,
          false
        );
      }
    }

    // 5. Server-Side Price Resolution
    const amount = tierConfig.price_usd;

    // Reuse/update existing draft order if provided
    if (params.existingOrderId) {
      const orders = await this.storage.getOrders();
      const existing = orders.find(
        (o) => o.id === params.existingOrderId && o.payment_status === 'pending'
      );
      if (existing) {
        existing.tier = params.tier;
        existing.amount = amount;
        existing.updated_at = new Date().toISOString();
        await this.storage.saveOrder(existing);

        const shoutouts = await this.storage.getShoutouts();
        const draft = shoutouts.find((s) => s.order_id === existing.id);
        if (draft) {
          draft.tier = params.tier;
          draft.shoutout_text = params.shoutoutText.trim() || `Shoutout to ${identity.display_name}!`;
          draft.pronunciation_guide = params.pronunciationGuide?.trim();
          draft.social_tag = params.socialTag?.trim();
          draft.updated_at = new Date().toISOString();
          await this.storage.saveShoutout(draft);
        }

        await this.audit.log({
          level: 'INFO',
          action: 'ORDER_DRAFT_UPDATED',
          actorId: params.userId,
          entityType: 'order',
          entityId: existing.id,
          metadata: { tier: params.tier, amount },
        });

        return existing;
      }
    }

    const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const idempotencyKey = `idemp-${orderId}`;

    const order: ShoutoutOrder = {
      id: orderId,
      user_id: params.userId,
      identity_id: params.identityId,
      song_id: params.songId,
      tier: params.tier,
      amount,
      currency: 'USD',
      payment_status: 'pending',
      shoutout_status: 'draft',
      idempotency_key: idempotencyKey,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.storage.saveOrder(order);

    // Also store draft shoutout details
    const shoutoutId = `shoutout-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const draftShoutout: Shoutout = {
      id: shoutoutId,
      order_id: orderId,
      song_id: params.songId,
      identity_id: params.identityId,
      tier: params.tier,
      status: 'pending_payment',
      shoutout_text: params.shoutoutText.trim() || `Shoutout to ${identity.display_name}!`,
      pronunciation_guide: params.pronunciationGuide?.trim(),
      social_tag: params.socialTag?.trim(),
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.storage.saveShoutout(draftShoutout);

    await this.audit.log({
      level: 'AUDIT',
      action: 'ORDER_CREATED',
      actorId: params.userId,
      entityType: 'order',
      entityId: orderId,
      idempotencyKey,
      metadata: {
        songId: params.songId,
        identityId: params.identityId,
        tier: params.tier,
        amount,
      },
    });

    return order;
  }

  /**
   * Payment Idempotency, Transaction State Consistency & Audit Trail
   */
  public async processPayment(
    orderId: string,
    idempotencyKey: string,
    paymentMethod: 'credit_card' | 'apple_pay' | 'web3_wallet' = 'credit_card',
    simulateFailure = false
  ): Promise<PaymentResult> {
    await this.storage.init();

    // 1. Idempotency Check in Audit / Idempotency Store
    const idempotencyRecord = await this.audit.getIdempotencyRecord(idempotencyKey);
    if (idempotencyRecord && idempotencyRecord.status === 'completed' && idempotencyRecord.response_payload) {
      await this.audit.log({
        level: 'INFO',
        action: 'PAYMENT_IDEMPOTENT_REPLAY',
        actorId: 'client',
        entityType: 'payment',
        entityId: orderId,
        idempotencyKey,
        metadata: { status: 'replayed_cached_success' },
      });
      return {
        ...idempotencyRecord.response_payload,
        isIdempotentReplay: true,
      };
    }

    const orders = await this.storage.getOrders();
    const order = orders.find((o) => o.id === orderId);

    if (!order) {
      return { success: false, order: null as any, error: 'Order not found.', code: 'ORDER_NOT_FOUND' };
    }

    // In-flight concurrency lock marker
    await this.audit.saveIdempotencyRecord({
      key: idempotencyKey,
      order_id: orderId,
      status: 'in_flight',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (simulateFailure) {
      order.payment_status = 'failed';
      order.updated_at = new Date().toISOString();
      await this.storage.saveOrder(order);

      await this.audit.log({
        level: 'WARN',
        action: 'PAYMENT_FAILED_SIMULATED',
        actorId: order.user_id,
        entityType: 'payment',
        entityId: orderId,
        idempotencyKey,
        metadata: { paymentMethod, reason: 'Simulated card declined' },
      });

      await this.audit.saveIdempotencyRecord({
        key: idempotencyKey,
        order_id: orderId,
        status: 'failed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return {
        success: false,
        order,
        error: 'Simulated card declined. Please try again or switch payment method.',
        code: 'PAYMENT_DECLINED',
      };
    }

    // Simulate payment success & server-confirmed transition
    order.payment_status = 'paid';
    order.shoutout_status = 'pending_artist_review';
    order.payment_provider_reference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    order.updated_at = new Date().toISOString();
    await this.storage.saveOrder(order);

    // Atomically transition shoutout to pending_artist_review
    const shoutouts = await this.storage.getShoutouts();
    let shoutout = shoutouts.find((s) => s.order_id === orderId);

    if (!shoutout) {
      shoutout = {
        id: `shoutout-${Date.now()}`,
        order_id: order.id,
        song_id: order.song_id,
        identity_id: order.identity_id,
        tier: order.tier,
        status: 'pending_artist_review',
        shoutout_text: `Shoutout for identity ${order.identity_id}`,
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
      shoutout.status = 'pending_artist_review';
      shoutout.updated_at = new Date().toISOString();
    }

    await this.storage.saveShoutout(shoutout);

    const resultPayload: PaymentResult = {
      success: true,
      order,
      shoutout,
    };

    // Save final completed idempotency record
    await this.audit.saveIdempotencyRecord({
      key: idempotencyKey,
      order_id: orderId,
      status: 'completed',
      response_payload: resultPayload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await this.audit.log({
      level: 'AUDIT',
      action: 'PAYMENT_CONFIRMED_ESCROW_LOCKED',
      actorId: order.user_id,
      entityType: 'payment',
      entityId: orderId,
      fromState: 'pending_payment',
      toState: 'paid',
      idempotencyKey,
      metadata: {
        paymentMethod,
        reference: order.payment_provider_reference,
        amount: order.amount,
        shoutoutId: shoutout.id,
      },
    });

    return resultPayload;
  }

  public async getShoutoutById(id: string): Promise<Shoutout | null> {
    await this.storage.init();
    const shoutouts = await this.storage.getShoutouts();
    return shoutouts.find((s) => s.id === id) || null;
  }

  public async getShoutoutsForIdentity(identityId: string): Promise<Shoutout[]> {
    await this.storage.init();
    const shoutouts = await this.storage.getShoutouts();
    return shoutouts.filter((s) => s.identity_id === identityId);
  }

  public async getMyShoutouts(userId: string): Promise<Shoutout[]> {
    await this.storage.init();
    const users = await this.storage.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user || !user.active_identity_id) return [];

    return await this.getShoutoutsForIdentity(user.active_identity_id);
  }

  /**
   * Enforces State Machine Consistency (06-state-machine.md)
   * Rejects invalid state leaps and logs state audit records.
   */
  public async advanceLifecycle(
    shoutoutId: string,
    targetState?: ShoutoutStatus,
    actorId = 'admin_or_webhook'
  ): Promise<Shoutout> {
    await this.storage.init();
    const shoutouts = await this.storage.getShoutouts();
    const shoutout = shoutouts.find((s) => s.id === shoutoutId);

    if (!shoutout) {
      throw new AppError('SHOUTOUT_NOT_FOUND', `Shoutout ${shoutoutId} not found`, false);
    }

    const currentState = shoutout.status;
    let nextStatus: ShoutoutStatus;

    if (targetState) {
      nextStatus = targetState;
    } else {
      switch (currentState) {
        case 'pending_artist_review':
          nextStatus = 'approved';
          break;
        case 'approved':
          nextStatus = 'published';
          break;
        case 'published':
          nextStatus = 'mint_pending';
          break;
        case 'mint_pending':
          nextStatus = 'minted';
          break;
        default:
          nextStatus = currentState;
      }
    }

    // State Machine Transition Validation
    const allowed = VALID_TRANSITIONS[currentState] || [];
    if (!allowed.includes(nextStatus) && nextStatus !== currentState) {
      await this.audit.log({
        level: 'ERROR',
        action: 'INVALID_STATE_TRANSITION_ATTEMPT',
        actorId,
        entityType: 'shoutout',
        entityId: shoutoutId,
        fromState: currentState,
        toState: nextStatus,
        metadata: { allowed },
      });
      throw new AppError(
        'INVALID_STATE_TRANSITION',
        `Cannot transition shoutout from "${currentState}" directly to "${nextStatus}". Allowed transitions: [${allowed.join(', ')}]`,
        false
      );
    }

    // Apply state changes atomically
    shoutout.status = nextStatus;
    shoutout.updated_at = new Date().toISOString();

    if (nextStatus === 'published' && !shoutout.timestamp) {
      const song = (await this.storage.getSongs()).find((s) => s.id === shoutout.song_id);
      const maxSec = song ? Math.max(30, song.duration - 20) : 120;
      shoutout.timestamp = Math.floor(Math.random() * (maxSec - 20) + 15);
      shoutout.duration = shoutout.tier === 'silver' ? 5 : 3;
      shoutout.is_active = true;

      if (song) {
        song.shoutout_count += 1;
        await this.storage.saveSong(song);
      }
    }

    if (nextStatus === 'minted') {
      const randomTx = Math.random().toString(16).substring(2, 10);
      shoutout.mint_transaction_hash = `0x${randomTx}a88b9c01828192a472c1a9381029381029`;
      shoutout.tokens_minted_at_event = shoutout.tier === 'silver' ? 200 : 100;
      shoutout.is_active = true;

      // Update identity stats
      const identities = await this.storage.getIdentities();
      const identity = identities.find((i) => i.id === shoutout.identity_id);
      if (identity) {
        identity.total_shoutouts_ever += 1;
        identity.global_resonance_score += shoutout.tier === 'silver' ? 150 : 80;
        await this.storage.saveIdentity(identity);
      }
    }

    if (nextStatus === 'rejected') {
      shoutout.status = 'rejected';
      shoutout.is_active = false;
    }

    if (nextStatus === 'refunded') {
      shoutout.status = 'refunded';
      shoutout.is_active = false;
    }

    await this.storage.saveShoutout(shoutout);

    // Atomically synchronize associated order if present
    if (shoutout.order_id) {
      const orders = await this.storage.getOrders();
      const order = orders.find((o) => o.id === shoutout.order_id);
      if (order) {
        order.shoutout_status = nextStatus;
        if (nextStatus === 'refunded') {
          order.payment_status = 'refunded';
        }
        order.updated_at = new Date().toISOString();
        await this.storage.saveOrder(order);
      }
    }

    await this.audit.log({
      level: 'AUDIT',
      action: 'SHOUTOUT_STATE_TRANSITION',
      actorId,
      entityType: 'shoutout',
      entityId: shoutoutId,
      fromState: currentState,
      toState: nextStatus,
      metadata: {
        orderId: shoutout.order_id,
        songId: shoutout.song_id,
        tier: shoutout.tier,
      },
    });

    return shoutout;
  }
}
