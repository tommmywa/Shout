# Fan Data Model

The source PRD uses PostgreSQL and defines the following core entities.

## Required entities

### User
Represents the authenticated application account.

Relevant fields:
- `id`
- `wallet_address`
- `email`
- `is_artist`
- `active_identity_id`

### GlobalIdentity
Represents the globally unique person/name receiving recognition.

Relevant fields:
- `id`
- `handle`
- `display_name`
- `identity_nft_address`
- `owner_wallet_address`
- `verification_status`
- `total_shoutouts_ever`
- `global_resonance_score`
- `token_mint_address`

### UserIdentityOwnership
Links a user account to an identity.

Relevant fields:
- `user_id`
- `identity_id`
- `is_primary`

### Song
Represents an artist's song.

Relevant fields:
- `id`
- `artist_id`
- `title`
- `duration`
- `audio_url`
- `cover_art_url`

### Shoutout
Represents the fan's purchased/requested recognition.

Relevant fields:
- `id`
- `song_id`
- `identity_id`
- `tier`
- `timestamp`
- `duration`
- `shoutout_text`
- `pronunciation_guide`
- `voice_note_url`
- `is_active`
- `mint_transaction_hash`
- `tokens_minted_at_event`

## MVP additions recommended for implementation

The original PRD does not define a dedicated purchase/order table. Add one for reliable commerce state.

### ShoutoutOrder

```text
id
user_id
identity_id
song_id
tier
amount
currency
payment_status
shoutout_status
payment_provider_reference
created_at
updated_at
```

Suggested enums:

```text
payment_status:
- pending
- processing
- paid
- failed
- refunded

shoutout_status:
- draft
- pending_artist_review
- approved
- rejected
- published
- cancelled
```

This separates financial state from content state.

## Relationships

```text
User
  |
  +----< UserIdentityOwnership >---- GlobalIdentity
                                      |
                                      +----< Shoutout >---- Song
                                      |
                                      +---- IdentityToken
                                      |
                                      +----< ArtistFanRelationship >

Song
  |
  +---- Artist

Shoutout
  |
  +----< ShoutoutEngagement
  |
  +----< TokenTransaction
```

## Important invariant

`Shoutout.identity_id` must always reference the global identity receiving recognition.

Never use `user_id` as the identity target of a shoutout.

## Duplicate prevention

For payment retries, use idempotency keys.

Suggested uniqueness:
- `payment_provider_reference` unique
- blockchain transaction hash unique
- identity handle unique

## Token layer

The source PRD defines one identity token per global identity.

Phase 1 can represent this with a mock `IdentityToken` service even if the real contract is not connected yet.
