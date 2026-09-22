export type TierId = 'bronze' | 'silver' | 'gold' | 'platinum';

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';

export type ShoutoutStatus =
  | 'draft'
  | 'pending_payment'
  | 'paid'
  | 'pending_artist_review'
  | 'approved'
  | 'published'
  | 'mint_pending'
  | 'minted'
  | 'rejected'
  | 'refunded'
  | 'cancelled';

export interface TierConfig {
  id: TierId;
  name: string;
  price_usd: number;
  price_eth: number;
  description: string;
  benefits: string[];
  available_in_mvp: boolean;
  badge_color: string;
  accent_gradient: [string, string];
}

export interface User {
  id: string;
  wallet_address: string;
  email: string;
  is_artist: boolean;
  active_identity_id?: string;
  display_name?: string;
  created_at: string;
}

export interface GlobalIdentity {
  id: string;
  handle: string;
  display_name: string;
  identity_nft_address: string;
  owner_wallet_address: string;
  owner_user_id?: string;
  verification_status: 'unverified' | 'verified';
  total_shoutouts_ever: number;
  global_resonance_score: number;
  token_mint_address: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export interface UserIdentityOwnership {
  user_id: string;
  identity_id: string;
  is_primary: boolean;
}

export interface Artist {
  id: string;
  name: string;
  handle: string;
  avatar_url: string;
  bio: string;
  genre: string;
  verified: boolean;
}

export interface Song {
  id: string;
  artist_id: string;
  artist_name: string;
  artist_avatar?: string;
  title: string;
  duration: number; // in seconds
  audio_url: string;
  cover_art_url: string;
  genre: string;
  shoutouts_available: boolean;
  shoutout_count: number;
  bpm?: number;
  musical_key?: string;
}

export interface ShoutoutOrder {
  id: string;
  user_id: string;
  identity_id: string;
  song_id: string;
  tier: TierId;
  amount: number;
  currency: string;
  payment_status: PaymentStatus;
  shoutout_status: ShoutoutStatus;
  payment_provider_reference?: string;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
}

export interface Shoutout {
  id: string;
  order_id: string;
  song_id: string;
  identity_id: string;
  tier: TierId;
  status: ShoutoutStatus;
  timestamp?: number; // timestamp in seconds where shoutout happens in the song
  duration?: number;
  shoutout_text: string;
  pronunciation_guide?: string;
  social_tag?: string;
  is_active: boolean;
  mint_transaction_hash?: string;
  tokens_minted_at_event?: number;
  created_at: string;
  updated_at: string;
}

export interface IdentityToken {
  symbol: string;
  currentPrice: number;
  totalSupply: number;
  mintStatus: 'not_started' | 'pending' | 'minted';
  contractAddress: string;
  priceChange24h: number;
}

export interface RecognitionHistoryItem {
  shoutout: Shoutout;
  song: Song;
  artist: Artist;
  identity: GlobalIdentity;
}

export interface HandleAvailabilityResponse {
  handle: string;
  available: boolean;
  reason?: string;
  suggestions?: string[];
}

export type ActiveScreen =
  | 'discover'
  | 'my_shoutouts'
  | 'my_identity'
  | 'song_detail'
  | 'tier_selection'
  | 'shoutout_details'
  | 'order_review'
  | 'checkout'
  | 'shoutout_status'
  | 'identity_setup'
  | 'public_identity';
