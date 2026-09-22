export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'IDENTITY_NOT_OWNED'
  | 'IDENTITY_NOT_FOUND'
  | 'SONG_NOT_FOUND'
  | 'ORDER_NOT_FOUND'
  | 'SHOUTOUT_NOT_FOUND'
  | 'DUPLICATE_PENDING_ORDER'
  | 'PRICE_TAMPERING_DETECTED'
  | 'INVALID_STATE_TRANSITION'
  | 'IDEMPOTENCY_CONFLICT'
  | 'PAYMENT_DECLINED'
  | 'HANDLE_TAKEN'
  | 'WEBHOOK_SIGNATURE_INVALID'
  | 'WEBHOOK_EVENT_ALREADY_PROCESSED'
  | 'INTERNAL_ERROR';

export interface AppErrorPayload {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, any>;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly retryable: boolean;
  public readonly details?: Record<string, any>;

  constructor(code: ErrorCode, message: string, retryable = false, details?: Record<string, any>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.retryable = retryable;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  public toJSON(): AppErrorPayload {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      details: this.details,
    };
  }
}
