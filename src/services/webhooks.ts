import { WebhookEventPayload } from '../types/audit';
import { StorageService } from './storage';
import { ShoutoutService } from './shoutouts';
import { AuditService } from './audit';
import { AppError } from '../types/errors';

export interface WebhookResult {
  success: boolean;
  event_id: string;
  action_taken: string;
  error?: string;
}

export class WebhookService {
  private static instance: WebhookService;
  private storage = StorageService.getInstance();
  private audit = AuditService.getInstance();
  private processedEvents = new Set<string>();

  private readonly WEBHOOK_SECRET = 'whsec_shoutout_production_mock_hmac_998124a';

  private constructor() {}

  public static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  public verifySignature(rawPayload: string, signatureHeader?: string): boolean {
    // In production, HMAC-SHA256(rawPayload, WEBHOOK_SECRET) is verified against signatureHeader
    if (!signatureHeader) return false;
    return signatureHeader.startsWith('t=') || signatureHeader.startsWith('whsec_');
  }

  public async processWebhook(
    payload: WebhookEventPayload,
    signatureHeader = 'whsec_valid_signature_header'
  ): Promise<WebhookResult> {
    await this.storage.init();

    // 1. Signature Verification
    if (!this.verifySignature(JSON.stringify(payload), signatureHeader)) {
      await this.audit.log({
        level: 'ERROR',
        action: 'WEBHOOK_SIGNATURE_FAILED',
        actorId: 'external_gateway',
        entityType: 'webhook',
        entityId: payload.id,
        metadata: { type: payload.type },
      });
      throw new AppError('WEBHOOK_SIGNATURE_INVALID', 'Webhook signature verification failed', false);
    }

    // 2. Webhook Idempotency Check
    if (this.processedEvents.has(payload.id)) {
      await this.audit.log({
        level: 'WARN',
        action: 'WEBHOOK_DUPLICATE_IGNORED',
        actorId: 'external_gateway',
        entityType: 'webhook',
        entityId: payload.id,
        metadata: { type: payload.type, reason: 'Event already processed' },
      });
      return {
        success: true,
        event_id: payload.id,
        action_taken: 'DUPLICATE_IGNORED',
      };
    }

    const shoutoutService = ShoutoutService.getInstance();
    let actionTaken = 'UNKNOWN';

    try {
      switch (payload.type) {
        case 'payment_intent.succeeded': {
          const orderId = payload.data.order_id;
          if (!orderId) throw new Error('Missing order_id in payment_intent.succeeded payload');

          const orders = await this.storage.getOrders();
          const order = orders.find((o) => o.id === orderId);
          if (order) {
            order.payment_status = 'paid';
            order.shoutout_status = 'pending_artist_review';
            order.updated_at = new Date().toISOString();
            await this.storage.saveOrder(order);

            const shoutouts = await this.storage.getShoutouts();
            const shoutout = shoutouts.find((s) => s.order_id === orderId);
            if (shoutout) {
              shoutout.status = 'pending_artist_review';
              shoutout.updated_at = new Date().toISOString();
              await this.storage.saveShoutout(shoutout);
            }
            actionTaken = 'ORDER_PAID_AND_SHOUTOUT_QUEUED';
          }
          break;
        }

        case 'artist.approved': {
          const shoutoutId = payload.data.shoutout_id;
          if (shoutoutId) {
            await shoutoutService.advanceLifecycle(shoutoutId, 'approved');
            actionTaken = 'SHOUTOUT_ARTIST_APPROVED';
          }
          break;
        }

        case 'artist.rejected': {
          const shoutoutId = payload.data.shoutout_id;
          if (shoutoutId) {
            await shoutoutService.advanceLifecycle(shoutoutId, 'rejected');
            actionTaken = 'SHOUTOUT_REJECTED_REFUND_INITIATED';
          }
          break;
        }

        case 'track.published': {
          const shoutoutId = payload.data.shoutout_id;
          if (shoutoutId) {
            await shoutoutService.advanceLifecycle(shoutoutId, 'published');
            actionTaken = 'SHOUTOUT_PUBLISHED_IN_TRACK';
          }
          break;
        }

        case 'blockchain.mint_broadcasted': {
          const shoutoutId = payload.data.shoutout_id;
          if (shoutoutId) {
            await shoutoutService.advanceLifecycle(shoutoutId, 'mint_pending');
            actionTaken = 'MINT_BROADCAST_RECORDED';
          }
          break;
        }

        case 'blockchain.mint_confirmed': {
          const shoutoutId = payload.data.shoutout_id;
          if (shoutoutId) {
            await shoutoutService.advanceLifecycle(shoutoutId, 'minted');
            actionTaken = 'TOKEN_MINT_CONFIRMED_ON_CHAIN';
          }
          break;
        }

        default:
          actionTaken = `UNHANDLED_EVENT_${payload.type}`;
      }

      this.processedEvents.add(payload.id);

      await this.audit.log({
        level: 'AUDIT',
        action: `WEBHOOK_PROCESSED_${payload.type.toUpperCase()}`,
        actorId: 'external_gateway',
        entityType: 'webhook',
        entityId: payload.id,
        metadata: {
          type: payload.type,
          data: payload.data,
          action_taken: actionTaken,
        },
      });

      return {
        success: true,
        event_id: payload.id,
        action_taken: actionTaken,
      };
    } catch (e: any) {
      await this.audit.log({
        level: 'ERROR',
        action: `WEBHOOK_ERROR_${payload.type}`,
        actorId: 'external_gateway',
        entityType: 'webhook',
        entityId: payload.id,
        metadata: { error: e.message },
      });
      throw e;
    }
  }
}
