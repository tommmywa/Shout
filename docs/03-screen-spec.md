# Fan Screen Specification

## Route map

```text
/                         Home / Discover
/login                    Login
/signup                   Sign up
/songs/:songId            Song detail
/songs/:songId/shoutout   Shoutout tier selection
/identity/create          Create identity
/shoutouts/:id/details    Shoutout details
/shoutouts/:id/review     Review
/checkout/:orderId        Payment
/shoutouts/:id            Shoutout status/detail
/identity/:handle         Public identity
/me/shoutouts             My shoutouts
/me                       Fan profile
```

## Screen states

### Home
Loading → Empty → Loaded → Error

### Song detail
Loading → Loaded → Audio playing → Error

### Identity creation
Idle → Checking handle → Available → Submitting → Created → Error

### Tier selection
Loading → Available → Selected

### Checkout
Ready → Processing → Success / Failed

### Shoutout detail
Pending review → Approved → Published → Mint pending → Minted → Rejected / Cancelled

## Navigation rules

- Preserve `returnTo` context when auth/identity setup interrupts a purchase.
- Back from identity creation returns to the intended song.
- Back from payment returns to review.
- Published shoutout can navigate to the global identity.
- Global identity can navigate back to all shoutouts.

## UX copy principles

Prefer:
- "Get a shoutout"
- "Claim your identity"
- "Your shoutout is waiting for artist approval"
- "Your shoutout is live"
- "Recognition added to your identity"

Avoid leading with:
- "Mint"
- "Bonding curve"
- "DEX"
- "Soulbound NFT"

Those are implementation/value-layer concepts and should appear when relevant.

## Accessibility

- All controls keyboard accessible on web.
- Visible focus state.
- Audio player controls have labels.
- Status changes are announced where appropriate.
- Do not rely on color alone for payment/order status.
- Tier cards must have accessible selected/unselected states.
