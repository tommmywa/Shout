export type AuditLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

export type AuditEntityType = 'order' | 'shoutout' | 'identity' | 'payment' | 'webhook' | 'auth';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  level: AuditLogLevel;
  action: string;
  actor_id: string;
  entity_type: AuditEntityType;
  entity_id: string;
  from_state?: string;
  to_state?: string;
  idempotency_key?: string;
  metadata?: Record<string, any>;
}

export interface IdempotencyRecord {
  key: string;
  order_id: string;
  status: 'in_flight' | 'completed' | 'failed';
  response_payload?: any;
  created_at: string;
  updated_at: string;
}

export interface WebhookEventPayload {
  id: string;
  type:
    | 'payment_intent.succeeded'
    | 'payment_intent.payment_failed'
    | 'artist.approved'
    | 'artist.rejected'
    | 'track.published'
    | 'blockchain.mint_broadcasted'
    | 'blockchain.mint_confirmed';
  data: {
    order_id?: string;
    shoutout_id?: string;
    identity_id?: string;
    song_id?: string;
    amount?: number;
    currency?: string;
    transaction_hash?: string;
    reason?: string;
    timestamp?: number;
  };
  created_at: string;
}
