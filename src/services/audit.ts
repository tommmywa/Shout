import { AuditLogEntry, AuditLogLevel, AuditEntityType, IdempotencyRecord } from '../types/audit';
import { StorageService } from './storage';

export class AuditService {
  private static instance: AuditService;
  private storage = StorageService.getInstance();

  private constructor() {}

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  public async log(params: {
    level: AuditLogLevel;
    action: string;
    actorId: string;
    entityType: AuditEntityType;
    entityId: string;
    fromState?: string;
    toState?: string;
    idempotencyKey?: string;
    metadata?: Record<string, any>;
  }): Promise<AuditLogEntry> {
    await this.storage.init();
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level: params.level,
      action: params.action,
      actor_id: params.actorId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      from_state: params.fromState,
      to_state: params.toState,
      idempotency_key: params.idempotencyKey,
      metadata: params.metadata ? this.sanitize(params.metadata) : undefined,
    };

    // Output to console in development
    const prefix = `[${entry.level}][${entry.action}]`;
    if (entry.level === 'ERROR') {
      console.error(prefix, entry);
    } else if (entry.level === 'WARN') {
      console.warn(prefix, entry);
    } else {
      console.log(prefix, `${entry.entity_type}:${entry.entity_id} (${entry.actor_id})`);
    }

    await this.storage.saveAuditLog(entry);
    return entry;
  }

  public async getAuditLogsForEntity(entityId: string): Promise<AuditLogEntry[]> {
    await this.storage.init();
    const all = await this.storage.getAuditLogs();
    return all.filter((l) => l.entity_id === entityId);
  }

  public async getAllAuditLogs(): Promise<AuditLogEntry[]> {
    await this.storage.init();
    return await this.storage.getAuditLogs();
  }

  // Idempotency Store
  public async getIdempotencyRecord(key: string): Promise<IdempotencyRecord | null> {
    await this.storage.init();
    return await this.storage.getIdempotencyRecord(key);
  }

  public async saveIdempotencyRecord(record: IdempotencyRecord): Promise<void> {
    await this.storage.init();
    await this.storage.saveIdempotencyRecord(record);
  }

  private sanitize(meta: Record<string, any>): Record<string, any> {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(meta)) {
      if (
        k.toLowerCase().includes('password') ||
        k.toLowerCase().includes('secret') ||
        k.toLowerCase().includes('private') ||
        k.toLowerCase().includes('card_number') ||
        k.toLowerCase().includes('cvv')
      ) {
        clean[k] = '[REDACTED]';
      } else {
        clean[k] = v;
      }
    }
    return clean;
  }
}
