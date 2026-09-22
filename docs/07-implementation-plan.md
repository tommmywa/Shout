# Vibe Coding Implementation Plan

## Phase 0 — Foundation

Build:
- Next.js/React web app
- TypeScript
- Tailwind or existing design system
- PostgreSQL
- API layer
- Auth abstraction
- Seed data

Seed:
- 5 artists
- 15 songs
- 20 existing shoutouts
- 10 global identities
- Bronze/Silver tiers

## Phase 1 — Fan MVP

### Sprint 1: Auth + identity
- Sign up
- Login
- Session
- Identity creation
- Handle availability
- Active identity

### Sprint 2: Discovery
- Home
- Song list
- Song detail
- Audio player
- Existing shoutouts

### Sprint 3: Purchase
- Tier selection
- Shoutout details
- Review
- Checkout
- Payment mock
- Order creation
- Idempotency

### Sprint 4: Lifecycle
- Pending artist review
- Shoutout detail
- Published state
- Mock token mint
- Fan shoutout library
- Identity page

## Phase 2 — Real infrastructure

Replace mocks with:
- Wallet connection
- IdentityRegistry contract
- SocialCapitalFactory
- ShoutoutManager
- Real payment provider
- Blockchain indexer
- IPFS/Arweave where required

## Phase 3 — Advanced fan features

- Gold
- Platinum
- Voice notes
- Live sessions
- Real-time shoutout requests
- Reactions
- Donations
- Live token multiplier

## Phase 4

- Fan Spotlight
- Social capital scoring
- Token market/trading
- Advanced analytics
- Artist coin

## Definition of done for Phase 1

A test user can:

1. Create an account.
2. Claim a unique global identity.
3. Discover a song.
4. Select Bronze or Silver.
5. Review the shoutout.
6. Complete a mocked payment.
7. See the request enter `pending_artist_review`.
8. See the request transition to published using a developer/admin action.
9. See a mocked token mint.
10. Find the shoutout in their fan library.
11. Open their global identity and see recognition history.

## Non-goals

Do not build:
- Real DEX trading
- Bonding curve UI
- Live streaming
- Voice-note capture
- Cross-platform social ingestion
- Advanced scoring
- Artist analytics

until the core purchase journey is stable.
