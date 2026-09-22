# Fan Shoutout State Machine

## Shoutout lifecycle

```text
DRAFT
  |
  v
PENDING_PAYMENT
  |
  +---- PAYMENT_FAILED
  |        |
  |        +---- retry ----> PENDING_PAYMENT
  |
  v
PAID
  |
  v
PENDING_ARTIST_REVIEW
  |
  +---- REJECTED ----> REFUND_PENDING / REFUNDED
  |
  v
APPROVED
  |
  v
PUBLISHED
  |
  v
MINT_PENDING
  |
  v
MINTED
```

## Rules

### Draft
The fan has selected a tier but has not completed payment.

### Pending payment
A payment attempt exists but has not been confirmed.

### Paid
Payment has been confirmed.

### Pending artist review
The financial transaction succeeded; the artist must approve/record the shoutout.

### Approved
Artist has accepted the request.

### Published
The shoutout is live in the song/session.

### Mint pending
The system has requested the token reward/mint but blockchain confirmation is pending.

### Minted
The token transaction is confirmed.

### Rejected
Artist rejected the shoutout. The exact refund policy must be configured.

## UI status mapping

| Backend state | Fan-facing status |
|---|---|
| pending_payment | Payment required |
| paid | Payment confirmed |
| pending_artist_review | Waiting for artist |
| approved | Artist approved |
| published | Shoutout is live |
| mint_pending | Recognition being recorded |
| minted | Recognition added |
| rejected | Request declined |
| refunded | Payment refunded |

## Critical rule

Never infer `minted` merely because a shoutout was published. The PRD ties token minting to the shoutout event, but a real blockchain integration has asynchronous confirmation.
