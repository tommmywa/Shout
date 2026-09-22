# PRD Analysis — Fan Role

## 1. Product concept

The PRD defines ShoutOut as a Web3 platform where musicians monetize fan recognition through personalized name shoutouts. The core asset is the person's name: every shoutout points to one globally unique identity, and recognition accumulates around that identity.

The source PRD explicitly distinguishes:
- **Fan:** listener who purchases shoutout tiers, submits voice notes, and engages.
- **Listener:** casual user who discovers music and observes shoutout culture.
- **Identity Holder:** a person with a registered global name identity/token.

For this implementation, treat **Fan as the authenticated purchasing role**, while a non-purchasing visitor/listener can browse public content.

## 2. Fan journey extracted from the PRD

The explicit Phase 1 purchase flow is:

`Fan selects song → chooses tier → pays → artist approves/records → shoutout goes live → token minted → value begins accruing.`

The identity flow is:

`User signs up → searches name → claims handle → mints Soulbound NFT → identity token deployed → can receive shoutouts across platform.`

These two flows should be joined into one coherent fan onboarding experience.

## 3. Important product dependencies

A fan cannot reliably purchase a shoutout until an identity exists because shoutouts reference `identity_id`, not a fan account.

Therefore the practical sequence should be:

`Sign up → create/claim Global Identity → discover song → choose shoutout → review → pay → wait for artist → receive published shoutout`

If a fan attempts to purchase before identity setup, route them to identity creation and return them to the original song afterward.

## 4. PRD ambiguities that must be resolved in implementation

### Tier pricing
The PRD says Bronze is free/low, Silver is mid, Gold is high and Platinum is premium, but it does not provide exact monetary prices.

**MVP decision:** store tier prices in configuration rather than hard-code them into UI. Use a clearly marked placeholder price until business pricing is supplied.

### Artist approval
The PRD says the artist approves/records the shoutout, but does not define rejection, cancellation, expiration, or refund behavior.

**MVP decision:** support `pending_artist_review`, `approved`, `published`, `rejected`, and `cancelled` states. Keep refund handling behind a payment-service abstraction.

### Token mint timing
The PRD says the token is minted after the shoutout goes live. The database also records a mint transaction on the shoutout.

**MVP decision:** token impact becomes visible only after publication/mint confirmation. Never show a completed token reward while the transaction is pending.

### Wallet
The data model requires a wallet address, but the UX does not define wallet onboarding.

**MVP decision:** use a wallet abstraction during MVP. A user can authenticate first; wallet creation/connection can happen when identity/token functionality is activated. Do not force crypto terminology into every screen.

### Identity uniqueness
The PRD requires a globally unique handle.

**MVP decision:** validate handle availability in real time and reserve it transactionally when claimed.

## 5. Fan value proposition

The fan experience should communicate one simple idea:

> Pay to have your name recognized by an artist, then keep that recognition attached to your global identity.

The token layer should be presented as the consequence of recognition, not the first thing a new fan must understand.

## 6. UX principles

1. **Identity before transaction** — establish who the shoutout is for.
2. **Recognition before speculation** — explain the shoutout experience before token mechanics.
3. **Progressive disclosure** — hide blockchain details until they become relevant.
4. **State visibility** — clearly show whether the shoutout is paid, awaiting artist action, approved, published, or token-minted.
5. **Return users to context** — after identity creation or authentication, return the fan to the song/shoutout they intended to buy.
6. **No dead ends** — every blocked action should provide a next step.
7. **One global identity** — never make the fan create a new identity for every artist.
