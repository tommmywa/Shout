# Source Notes

This implementation package is derived from the supplied `Shout-out app.pdf`.

Key source requirements:
- ShoutOut is a Web3 platform for personalized name shoutouts.
- Each shoutout points to a globally unique identity.
- Fan is the persona that purchases shoutout tiers.
- Bronze and Silver are Phase 1; Gold/Platinum arrive in Phase 2.
- The explicit purchase flow is select song → choose tier → pay → artist approves/records → shoutout live → token minted.
- Identity registration is user signup → search name → claim handle → mint Soulbound NFT → deploy identity token.
- Phase 1 includes auth, song upload, basic shoutout, Bronze/Silver, and token minting.
- Live streaming, Fan Spotlight, analytics, and trading are later phases.

Where this package adds implementation structure, it is explicitly marked as an MVP implementation decision rather than presented as a source requirement.
