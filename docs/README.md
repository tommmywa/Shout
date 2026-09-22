# ShoutOut — Vibe Coding Product Spec

ShoutOut is a Web3 music-fan platform where artists can recognize fans by name through personalized shoutouts in songs and, later, live sessions. The key product concept is **one global identity per person**: a fan's name can accumulate recognition across multiple artists and songs.

## Source of truth

The original PRD is `Shout-out app.pdf`. This folder translates the source PRD into an implementation-oriented MVP specification, with the **Fan** role as the primary journey.

## MVP boundary

Phase 1 in the PRD includes:
- User authentication
- Global identity registration
- Song discovery/selection
- Bronze and Silver shoutout tiers
- Payment
- Basic shoutout creation/purchase
- Artist approval/recording
- Token minting

Explicitly defer:
- Gold and Platinum
- Voice notes
- Live streaming
- Real-time live shoutouts
- Token trading
- Fan Spotlight
- Advanced social-capital scoring
- Artist coins

## Core product rule

A shoutout belongs to a `Global Identity`, not merely to a fan account. A fan account can own an identity, and the same identity can receive shoutouts across different artists and songs.

## Build philosophy

Build the product as a believable end-to-end experience first. Keep blockchain integrations behind a service boundary so the UI can be developed with mocked transactions before wallet/smart-contract infrastructure is connected.

Recommended order:
1. Auth + identity
2. Discover songs
3. Select shoutout tier
4. Review + pay
5. Pending artist approval
6. Shoutout published
7. Identity/token impact
8. Fan library/history
