# Fan Acceptance Criteria

## Identity

- User can create an account.
- User can enter a display name.
- User can search/check handle availability.
- User cannot claim an unavailable handle.
- A claimed handle is globally unique.
- The active identity is associated with the user account.

## Song discovery

- User can browse songs.
- User can open song details.
- User can play the song.
- User can see whether shoutouts are available.

## Tier selection

- Bronze is selectable.
- Silver is selectable.
- Gold and Platinum are unavailable in Phase 1.
- Tier price comes from server configuration.
- Selected tier remains selected through review.

## Purchase

- User must have an identity before purchasing.
- User sees artist, song, identity, tier, benefits and price before payment.
- Payment cannot be confirmed solely by client state.
- Failed payment does not create a paid shoutout.
- Retrying the same payment cannot create duplicate orders.

## Artist review

- Paid shoutout becomes `pending_artist_review`.
- Fan can see that the artist still needs to act.
- Fan can revisit the request later.

## Publication

- An approved shoutout can become published.
- Published shoutout appears in the song and fan library.
- The fan can see the shoutout timestamp and tier.

## Token

- Token mint status is visible.
- Mock minting is explicitly represented as mock/development behavior.
- Production token state comes from backend/indexer data, not local UI state.

## Recovery

- Refreshing the page preserves server state.
- Reopening a shoutout shows its current lifecycle state.
- Network/payment errors provide a retry path.
- Auth interruptions return the fan to the original purchase context.
