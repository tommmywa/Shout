# Vibe Coding Prompts

## Prompt 1 — Scaffold

Build the ShoutOut Fan MVP from the attached product specification.

Start with:
- authentication
- global identity creation
- song discovery
- song detail
- Bronze/Silver shoutout purchase
- checkout
- shoutout lifecycle
- fan library
- global identity page

Do not implement live streaming, Gold/Platinum, voice notes, token trading, Fan Spotlight, or advanced social-capital scoring.

Use the markdown files in this folder as the product contract. Ask for clarification only when an implementation decision cannot be represented as a configurable abstraction.

## Prompt 2 — Identity

Implement Global Identity creation.

Requirements:
- display name
- unique handle
- handle availability API
- validation
- loading/error/success states
- authenticated ownership
- preserve the original song/shoutout route
- return the user to the purchase journey after success

Do not create an identity per artist.

## Prompt 3 — Purchase

Implement the Fan shoutout purchase flow:

Song detail → choose tier → details → review → payment → confirmation.

Only Bronze and Silver are purchasable.

Create an order record before payment and update its state through server-confirmed transitions.

## Prompt 4 — Lifecycle

Implement the shoutout state machine from `06-state-machine.md`.

Create a developer-only/admin test control that can transition:
- pending_artist_review → approved
- approved → published
- published → mint_pending
- mint_pending → minted

Do not expose this control to ordinary fans.

## Prompt 5 — UX polish

Review the Fan flow for:
- unnecessary steps
- unclear terminology
- missing loading states
- missing empty states
- payment ambiguity
- identity confusion
- poor error recovery
- accessibility issues

Reduce friction without changing the core product rules.

## Prompt 6 — Production readiness

Audit:
- authorization
- payment idempotency
- duplicate order prevention
- server-side pricing
- identity ownership
- webhook handling
- transaction state consistency
- error handling
- logging
- audit trail

Do not claim blockchain/payment completion until the backend confirms it.
