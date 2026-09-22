# AI Coding Agent Instructions

## Product priority

Build the Fan journey first. Do not expand into Artist or Listener workflows unless required to complete the Fan experience.

## Source-of-truth hierarchy

1. `Shout-out app.pdf`
2. `01-prd-analysis.md`
3. `02-fan-user-flow.md`
4. `03-screen-spec.md`
5. `04-data-model.md`
6. `05-api-contract.md`
7. `06-state-machine.md`
8. `07-implementation-plan.md`

If a requirement is missing, do not silently invent complex business rules. Add a small abstraction/configuration point or flag the assumption.

## Coding rules

- TypeScript strict mode.
- Keep domain logic separate from UI.
- Use typed API contracts.
- Validate all server inputs.
- Never trust client-side price values.
- Use server-side authorization for identity ownership and shoutout access.
- Use idempotency for payments and blockchain-triggering operations.
- Make payment and blockchain providers replaceable interfaces.
- Keep token calculations out of presentation components.
- Use explicit state machines/enums for shoutout status.
- Never use `user_id` where `identity_id` is required.
- Never expose private wallet keys.
- Never simulate a blockchain confirmation as real data without marking it as mock.

## UX rules

- Preserve user context after auth/identity setup.
- Explain why identity is needed before asking for a handle.
- Keep crypto terminology secondary.
- Show clear lifecycle states.
- Disable impossible actions instead of allowing invalid submissions.
- Use optimistic UI only for non-critical interactions.
- Payment success must be server-confirmed.

## Component strategy

Prefer reusable domain components:
- SongCard
- AudioPlayer
- ShoutoutCard
- TierCard
- IdentityCard
- HandleAvailability
- CheckoutSummary
- PaymentStatus
- ShoutoutStatusTimeline
- TokenImpactCard

## Error strategy

Every API operation should expose:
- machine-readable error code
- human-readable message
- retryability

Example:

```json
{
  "code": "HANDLE_TAKEN",
  "message": "That handle is already claimed.",
  "retryable": true
}
```

## Do not

- Build the entire Web3 stack before validating the fan journey.
- Add features because they sound Web3-native.
- Create separate identities per artist.
- make token price the primary CTA.
- invent Gold/Platinum behavior in Phase 1.
