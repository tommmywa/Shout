# Fan User Flow

## Primary objective

Allow a fan to go from discovering an artist/song to successfully purchasing and receiving a personalized shoutout with minimal cognitive load.

## High-level flow

```text
PUBLIC / LISTENER
    |
    v
Discover
    |
    v
Song Detail
    |
    +----> Listen / inspect existing shoutouts
    |
    v
Get a Shoutout
    |
    v
AUTH CHECK
    |
    +---- No account ----> Sign up / Log in ----+
    |                                             |
    +---------------------------------------------+
    |
    v
IDENTITY CHECK
    |
    +---- No identity ----> Create Global Identity
    |                           |
    |                           +--> Choose handle
    |                           +--> Check availability
    |                           +--> Verify
    |                           +--> Identity created
    |                           |
    +---------------------------+
    |
    v
Choose Tier
    |
    +--> Bronze
    |      Name mentioned once
    |
    +--> Silver
           Name + social tag
    |
    v
Shoutout Details
    |
    v
Review Order
    |
    v
Payment
    |
    +---- Failed ----> Retry / change payment method
    |
    +---- Success
    |
    v
Purchase Confirmation
    |
    v
Await Artist Approval
    |
    +---- Rejected ----> Refund/support state
    |
    +---- Approved
    |
    v
Shoutout Recorded / Published
    |
    v
Token Minted
    |
    v
Identity / Shoutout Detail
    |
    +--> View recognition
    +--> View token impact
    +--> Share
    +--> Discover more songs
```

## Detailed screen flow

### 0. Discover / Home

**Purpose:** Let a fan find artists, songs, and shoutout opportunities.

Key content:
- Featured songs
- Artists
- Songs with active shoutout opportunities
- Existing shoutout activity
- Search

Primary CTA:
- `Get a shoutout`

Secondary:
- `Listen`

---

### 1. Song Detail

**Entry:** Fan taps a song.

Show:
- Cover art
- Song title
- Artist
- Audio player
- Shoutout opportunities
- Existing shoutouts, if public
- `Get a shoutout` CTA

Important distinction:
- Listening is free.
- Purchasing a shoutout is an intentional conversion action.

---

### 2. Authentication

If unauthenticated:

`Create account` / `Log in`

After success:
- Preserve the originating song.
- Continue directly to the shoutout flow.

Do not send the user to a generic home screen.

---

### 3. Global Identity Setup

**Goal:** Establish the identity that will receive recognition.

Screen:
- Display name
- Desired handle
- Availability indicator
- Verification method
- Explanation: "Your Global Identity is the name artists can recognize across ShoutOut."

Handle states:
- Empty
- Checking
- Available
- Unavailable
- Invalid
- Claimed

CTA:
- `Claim @handle`

Success:
- Identity created
- Return to selected song

---

### 4. Choose Shoutout Tier

Display tier cards.

#### Bronze
- Name mentioned once
- Low/free price

#### Silver
- Name mentioned
- Social media tag
- Mid price

Gold and Platinum should be shown as `Coming later` if the product wants to communicate the roadmap, but they should not be purchasable in Phase 1.

CTA:
- `Continue`

---

### 5. Shoutout Details

The PRD only requires extra voice-note input for Platinum, which is outside Phase 1.

For Bronze/Silver:
- Confirm display name
- Confirm Global Handle
- Optional short message if business rules permit
- Confirm social tag for Silver

Do not invent a voice-note step for MVP.

CTA:
- `Review shoutout`

---

### 6. Review Order

Show a compact summary:

- Artist
- Song
- Identity / handle
- Tier
- Included benefit
- Price
- Payment method
- Important approval note

Approval note:
`Your shoutout is submitted to the artist. It becomes active after the artist approves and records it.`

CTA:
- `Pay and request shoutout`

---

### 7. Payment

Show:
- Order amount
- Payment method
- Transaction status

States:
- Ready
- Processing
- Success
- Failed
- Cancelled

On success:
- Create shoutout with `pending_artist_review`.

---

### 8. Confirmation / Pending

Primary message:

`Your shoutout request is in.`

Explain:
- Payment succeeded.
- Artist still needs to approve/record it.
- The shoutout is not live yet.
- Token impact is not final until publication/mint.

Actions:
- `View request`
- `Back to song`
- `Discover more`

---

### 9. Shoutout Request Detail

Show a persistent lifecycle timeline:

```text
Payment confirmed       ✓
Artist review            •
Artist approved
Shoutout published
Token minted
```

This is the fan's source of truth for the order.

---

### 10. Published Shoutout

When the artist approves/records and the shoutout is live:

Show:
- Artist
- Song
- Shoutout timestamp
- Fan identity
- Tier
- Audio playback / song playback context
- Token minted status
- Recognition score/value if available

Primary actions:
- `Share`
- `Listen`
- `View my identity`

---

### 11. Global Identity

The fan can see:
- Handle
- Display name
- Verification state
- Total shoutouts
- Global Resonance Score when Phase 2 exists
- Token symbol
- Token balance
- Current token price when token data exists

Phase 1 should keep this simple.

## Edge flows

### Handle unavailable

`Identity setup → handle unavailable → suggest alternatives → select new handle`

### Payment fails

`Review → Payment → failed → retry`

Do not create a successful shoutout record.

### Artist rejects request

`Pending → rejected → reason if available → refund/support state`

The original PRD does not define the rejection policy, so this should be configurable.

### User leaves during payment

On return:
- If no payment intent completed: resume review/payment.
- If payment succeeded: show pending request.
- Never create duplicate shoutouts.

### Duplicate purchase

Before creating a new order, check for an active pending request for the same:
- user identity
- song
- tier

If duplicates are allowed commercially, expose that intentionally. Otherwise warn the user.

## Post-MVP fan flow

```text
Identity
  |
  +--> Gold shoutout
  |
  +--> Platinum shoutout
  |      +--> Voice note
  |      +--> Pronunciation
  |      +--> Style preference
  |
  +--> Live sessions
  |      +--> Join live
  |      +--> Request shoutout
  |      +--> React / donate
  |
  +--> Fan Spotlight
  |
  +--> Token market
  |      +--> Buy
  |      +--> Sell
  |      +--> Hold
  |
  +--> Social capital analytics
```
