# KICK PLAYS — prototype notes

> **Streamer-authored interactive rounds — polls, quizzes, draws, bets — settled provably fair.**
> Settlement layer brand: **Ref** ("settled by Ref").

The full build spec (v1.0) is the team document. This file records what the
`/kickplays` route in this app actually is, so nobody on stage claims more than
we built.

## What this route demonstrates

One engine, four modes, one lifecycle: **commit → collect → settle → reward**.

| Mode | Settle function | Demo beat |
|---|---|---|
| Bet (pooled) | `oracle` | "This is your Predictions feature" — one config of a general engine |
| Quiz | `answer_key` | Proof of attention: a lurker goes 100% and gets gold |
| Draw | `pf_draw` | Winner is a pure function of revealed seeds — recount matches live |
| Poll | `approval_tally` | Troll bloc leads first-choice, loses on approval — dual bars diverge |

Every Play posts its commitment to chat **before** the window opens
(`[REF-COMMIT]`), posts chain roots as it runs (`[REF-ROOT]`), then reveals and
settles (`[REF-REVEAL]`, `[REF-VERDICT]`). The **Recount it yourself** panel
rebuilds the chain, re-checks the commitment against the revealed payload, and
re-runs the settle function from the logged events alone.

## What is real / what is faked

Be precise about this on stage — the honesty is part of the pitch.

**Real in this prototype**
- The Play lifecycle and the commit-before-open rule (a window cannot open until
  the commitment line exists).
- The hash-chained event log: every vote, entry, stake, settlement and mod call
  is appended and chained, and the verify panel genuinely rebuilds it.
- **Approval voting vs plurality** (`src/plays/settle.ts`) — unit-tested,
  including the divergence case that is the demo's argument.
- **Answer-key grading** with the tiered gold / silver / flair thresholds.
- **The draw** as a deterministic function of (server seed, client seed, nonce):
  the recount reproduces the same winner because the maths is the same maths.
- **The oracle *policy*** — presumption of compliance: a single run may PASS, a
  FAIL requires an agreeing re-run, low confidence can never produce FAIL,
  ABSTAIN routes to a mod whose call is logged like any other event.
- The client seed being fixed by chat's own entries, so it cannot be known at
  commit time.

**Faked / stubbed in this prototype**
- **Hashes are display-only stubs.** `src/plays/refCrypto.ts` uses a
  deterministic non-cryptographic digest (FNV-1a, formatted to look like
  SHA-256) so the recount beat works on screen. It proves nothing.
  **TODO:** swap in Web Crypto `SHA-256` for commitments and the chain, and
  `HMAC-SHA256` over (server_seed, client_seed, nonce, round) for the byte
  stream, mirroring the documented Stake provably-fair construction. The
  function signatures in `refCrypto.ts` are already the right shapes, so this is
  a file-local change. Commented reference implementation is in that file.
- **The video oracle is scripted.** No model, no ffmpeg, no HLS capture. The
  director bar picks the verdict (PASS / FAIL / ABSTAIN) and the "Pass-1 event
  log" and evidence frames are generated to match. The *policy* around the
  verdict is real; the verdict itself is theatre.
- **No Kick integration.** No OAuth, no webhooks, no reward redemptions, no bot.
  Chat and stakes are simulated in-page. Stake amounts are cosmetic.
- The stage is a placeholder surface, not video.

## Economy posture (unchanged from the spec)

Stakes are **earned channel points only**, entering via native custom-reward
redemptions in the real design. Rewards flow one way, house → viewer: badges,
session leaderboard, streamer-funded drops. Never KICKs, subs, gifted subs or
any purchased value; no P2P transfer; no custody; no cash-out. On-stage
vocabulary is "Plays / rounds / calls / points", not "bets / wagers / odds".

## Try it

```bash
npm install && npm run dev     # then open /kickplays
```

Director bar: `p` toggles it. `1` pooled bet · `2` quiz · `3` draw · `4` poll ·
`x` close the window now · `v` recount. The oracle verdict selector drives the
bet beat, including the ABSTAIN → mod-resolution path.

Suggested order (spec Section 10): bet → quiz → draw → poll → close on the
recount and the path-to-native ask.

## Files

| File | Contents |
|---|---|
| `src/plays/refCrypto.ts` | digest/canonical/seed helpers — **stubbed, see TODO above** |
| `src/plays/settle.ts` | the four settle functions + oracle policy (pure) |
| `src/plays/settle.test.ts` | 15 unit tests over tally, grading, draw, policy, chain |
| `src/plays/playsStore.ts` | Play lifecycle, event log, simulated crowd, scripted oracle |
| `src/plays/KickPlaysPage.tsx` | the `/kickplays` route |

## Not built here (from the spec, deliberately)

Real OAuth/webhook/reward integration · ffmpeg HLS ring buffer · the VLM
two-pass oracle · PVP `/bet` challenge flow as a distinct initiator path ·
merkle anchor stretch · `verify.py` as a standalone script (the in-page verify
panel stands in for it).
