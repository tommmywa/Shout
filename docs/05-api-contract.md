# Fan API Contract

This is an implementation-oriented contract for vibe coding. It preserves the source PRD's concepts while adding the minimum orchestration needed for a real user journey.

## Auth

### POST /auth/signup
Creates a user account.

### POST /auth/login
Authenticates a user.

## Identity

### GET /identities/handle/:handle/availability
Returns:

```json
{
  "handle": "@john_smith",
  "available": true
}
```

### POST /identities
Creates/claims a global identity.

Request:

```json
{
  "displayName": "John Smith",
  "handle": "@john_smith"
}
```

Response:

```json
{
  "id": "identity_id",
  "handle": "@john_smith",
  "verificationStatus": "unverified"
}
```

## Songs

### GET /songs
Returns discoverable songs.

### GET /songs/:songId
Returns song details and public shoutout information.

## Tiers

### GET /shoutout-tiers
Returns configured tiers and prices.

Do not hard-code prices in the client.

## Shoutout

### POST /shoutouts
Creates a shoutout order/request.

Request:

```json
{
  "songId": "song_id",
  "identityId": "identity_id",
  "tier": "bronze"
}
```

Response:

```json
{
  "shoutoutId": "shoutout_id",
  "orderId": "order_id",
  "status": "pending_payment"
}
```

### GET /shoutouts/:id
Returns lifecycle state.

## Checkout

### POST /checkout/:orderId/payment-intent
Creates a payment intent.

### POST /checkout/:orderId/confirm
Confirms payment.

On confirmed payment:
- mark order paid
- mark shoutout `pending_artist_review`
- trigger artist notification

## Fan library

### GET /me/shoutouts
Returns the authenticated fan's shoutouts.

### GET /me/identity
Returns the fan's active global identity.

## Token

### GET /identities/:identityId/token
Returns token information when available.

Phase 1 can return mock data:

```json
{
  "symbol": "JSMITH",
  "currentPrice": 0.001,
  "totalSupply": 0,
  "mintStatus": "not_started"
}
```

## Idempotency

All money-moving requests must accept:

`Idempotency-Key: <uuid>`

The same key must not create duplicate payment/shoutout records.
