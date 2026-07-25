# Concept Spec — Stream Timeline & Decision Engine

**Status:** selected concept, in build
**Track:** Challenge 1 — Hype Tracker / Stream Companion Overlay
**Date:** 25 July 2026 · **Build window:** now → 1 August
**Score:** 78 as originally stated · **~89 with the sharpening in §2 and §5**

Companion documents — locked sources: `.claude/KICK-HACKATHON-SPEC.md` (rules and spec test) · `.claude/KICK-DESIGN-SPEC.md` (styling). Generated: `idea-docs/KICK-IDEA-BANK.md` (alternatives and API research) · `idea-docs/hackathon-scorer.html` (Idea Scorer)

---

## 1. One-liner

> Live decisions on stream are resolved by weighted chance instead of majority vote, and every decision leaves a permanent, hoverable marker on the stream timeline — including the branch that didn't win.

---

## 2. Problem statement

**This is the highest-value section in the document.** Problem Solving & Product Thinking is 25% of the score, and the concept as originally described was a mechanism with no stated problem — worth 15/25. Adopting the statement below is worth roughly +7.5 points and costs no engineering time.

### The problem

**Chat polls are won by the loudest bloc, so everyone else stops voting.**

In any chat above a few hundred people, poll outcomes are effectively predetermined. The largest faction — or the most organised one — wins every time. Regular viewers learn within a handful of polls that their vote never changes anything, so they stop casting it. Engagement collapses to a predictable bloc vote, the streamer gets a rubber-stamp instead of a decision, and the poll stops being interesting to watch.

Majority rule is the wrong mechanism for entertainment. It optimises for the correct answer. Streams want tension.

### The fix

**The crowd's vote sets the odds, not the outcome.**

A 90/10 split becomes a 90/10 chance, not a 90/10 win. The minority option still wins one time in ten. Nobody's vote is ever wasted, so nobody stops voting — and the streamer gets genuine unpredictability instead of a foregone conclusion.

### Who it's for

- **Primary — the streamer** who wants decisions to create tension rather than confirm what everyone already knew.
- **Secondary — the minority voter**, whose participation currently has no effect and who is the first to disengage.
- **Tertiary — the viewer arriving late or watching the VOD**, who can navigate to what actually mattered.

### How we'd know it worked

Poll participation rate holding steady or rising across successive polls in one stream, rather than decaying. That's the metric, and it's the one to name in the pitch.

> ⚠️ **Minimum viable audience.** This mechanism needs a crowd. With 8 viewers a weighted roulette is absurd. This concept is aimed at mid-to-large channels, which is where most other teams will also be aiming — see §9.

---

## 3. The concept

Preserved from the brief, with the sharpening marked.

### 3.1 Live layer — the decision moment

- Streamer triggers a decision point with 2+ options.
- The poll appears **in chat and on the overlay** simultaneously.
- Streamer chooses the resolution mode per decision:
  - **Up to viewers** — straight majority. The familiar path, kept deliberately as contrast.
  - **Up to chance** — a ~5 second spin, then resolution. Two sub-modes:
    - **Even split** — every option equally likely regardless of vote.
    - **Weighted by viewers** — vote share becomes probability share (90/10 vote → 90/10 odds). **This is the default and the core of the product.**
- A live visual breakdown shows the current split as it moves.
- Streamers can **opt out** of a decision appearing on the public timeline.

### 3.2 ✨ Sharpening — odds as contested state

**New, and the main source of remaining Creativity headroom (+5).**

Let viewers **spend Kicks to shift the odds**, not to buy the outcome.

This is the escalation the concept was missing:

- Preserves the anti-brigading property entirely — money moves probability, never certainty.
- Turns a static bar into **live contested state** right up to the moment of the spin, which is exactly what §2C of the Idea Bank identifies as the gap between a readout and theatre.
- Builds on `kicks.gifted` and `GET /kicks/leaderboard` — the API surface flagged as almost entirely unclaimed.
- Gives KICK a monetisation argument, which four engineering managers will notice without being told.

Cap the shift (suggest ±15 points of probability) so money can tilt a decision but never buy it. That cap is a design statement worth saying out loud in the pitch.

### 3.3 Timeline layer

- Decision points and clips appear on the VOD timeline **as they happen, in real time** — not assembled afterwards. This is what satisfies requirement 4.
- **Hover shows a preview** of the decision or the clip.
- Clips flagged by streamers and mods appear as distinct markers.
- Full timeline view: timestamps, decision history, jump-to-point navigation.

### 3.4 ✨ Sharpening — render the road not taken

The decision tree must show **what didn't happen**: the losing option, its vote share, and its odds, greyed alongside the winner.

A list of what occurred is a scrubber — blocklist item #19. A tree that renders the unchosen branch is something else, and "what if he'd picked the other one" is the emotional hook that makes the artifact worth reopening.

### 3.5 Export layer

- Overlay elements exportable as a browser source, **opt-in**.
- Cross-platform by construction: a simulcasting streamer's whole audience sees it, not just the Kick half. This satisfies team constraint C4 better than any other concept we've considered.

---

## 4. Score

| Criterion | Weight | As stated | Sharpened + week | Notes |
|---|---:|---:|---:|---|
| Problem Solving & Product Thinking | 25% | 15.0 | **22.5** | Entirely from §2 |
| Creativity & Innovation | 25% | 20.0 | **20.0** | 25 reachable via §3.2 + §3.4 |
| Technical Execution | 20% | 16.0 | **18.0** | +2 from the extra runway |
| Presentation & Demo | 10% | 10.0 | **10.0** | The spin is the best beat we have |
| Collaboration & Teamwork | 10% | 9.0 | **9.0** | Five clean workstreams, §7 |
| User Experience & Design | 10% | 8.0 | **9.0** | Polish time now exists |
| **Total** (risk ×1.0, mocked) | | **78.0** | **88.5** | |

### Where the remaining headroom is

**~12 points are available from thinking. ~2 from building.**

Technical Execution is capped at 20% and we're already near the top of it. A week of additional feature work is worth roughly two points. The same week spent on problem framing, the §3.2 escalation, polish and rehearsal is worth twelve.

**Plan the week accordingly.** The default failure mode is spending all of it in the lowest-yield column.

---

## 5. Spec test results

### Part A — published requirements

| | Test | Result |
|---|---|---|
| A1 | Working prototype built during the hackathon | ⚠️ **Waived by team decision.** Recorded, not relitigated. See §9.1. |
| A2 | Clear, defined user problem | ✅ **Resolved by §2** — was the single biggest gap |
| A3 | Interactive, not static | ✅ Strong |
| A4 | Reflects real-time stream behaviour | ✅ Resolved by real-time markers in §3.3 |
| A5 | Demo-ready | ✅ Strong |
| A6 | Overlay or companion UI | ✅ Both — overlay for the decision, companion for the timeline |

### Part B — rules compliance

| | Test | Result |
|---|---|---|
| B1 | Modelled on real API capability | ⚠️ **Partial — declare it.** Kick has no polls, clips or VOD-timeline primitives. We are *proposing* three platform features, not reading them. That's legitimate and arguably stronger, but state it in the pitch rather than letting judges assume an integration exists. |
| B1b | Adapter layer + real OAuth wired | 🔲 To build — see §6 |
| B2 | KICK ToS / Community Guidelines | ⚠️ **Decide deliberately — see §8.1 (roulette optics)** |
| B3 | Dependencies sublicensable | ✅ Lucide ISC, Inter/Archivo OFL |
| B4 | Original work | ⚠️ Tied to A1 |
| B5 | Nothing we want to commercialise | ✅ |

### Part C — team constraints

| | Test | Result |
|---|---|---|
| C1 | Unique, off the blocklist | ⚠️ **Partial.** Collides with #5 (polls) and #19 (timeline scrubber). The chance layer is the differentiator — §8.2 |
| C2 | Fun, energetic, loud | ✅ **Best in class** |
| C3 | Non-intrusive | ⚠️ **Tension — §8.3** |
| C4 | Cross-platform aware | ✅ **Best in class** — the export is designed for it |
| C5 | KICK-native UI | 🔲 Per `.claude/KICK-DESIGN-SPEC.md` |
| C6 | Demoable on mock data | ✅ By construction |
| C7 | 4-hour core loop | ⚠️ Waived with A1 — replaced by the §6 scope |
| C8 | Parallelisable | ✅ **Strong** — five workstreams, §7 |
| C9 | Reason and purpose articulable | ✅ Resolved by §2 |

---

## 6. Scope

**Realistic capacity:** five people with day jobs, evenings Mon–Thu plus Friday in person ≈ **25–35 person-hours.** Not a sprint. Enough for the core loop plus genuine polish — not enough for everything in §3.

### Build — the demo depends on these

1. Decision trigger → poll renders in chat and overlay
2. Live vote collection with the split bar updating in real time
3. **Kicks-shift-the-odds mechanic** (§3.2) with the ±15pt cap
4. Weighted roulette resolution, ~5s spin
5. Real-time marker landing on the timeline
6. Hover preview on markers
7. Timeline scrub + jump-to-point
8. Decision tree view **including the losing branch** (§3.4)
9. Mock data harness with a scripted, scrubbable session
10. Adapter layer + real OAuth against one live endpoint (B1b)

### Stretch — only if 1–10 are finished and polished

11. Clip flagging by streamers and mods
12. Cross-platform export as browser source
13. Opt-out settings UI *(a sentence in the pitch, not a screen)*
14. Even-split mode *(weighted is the story; even-split is a toggle)*

### Cut

- Any clip *creation* or editing
- Historical cross-stream analytics
- Anything requiring a live audience

---

## 7. Workstreams

Collaboration is 10% and explicitly rewards **evidence of a contribution from every team member**. Everyone commits under their own name; everyone speaks in the demo.

| # | Stream | Owns |
|---|---|---|
| 1 | **Decision engine** | Vote collection, odds calculation, Kicks weighting, resolution. The core — decoupled from presentation. |
| 2 | **Overlay** | Poll card, live split bar, the wheel. The wow beat. |
| 3 | **Timeline** | Markers, hover previews, scrub, jump. |
| 4 | **Tree view** | Decision history including unchosen branches. |
| 5 | **Harness + data** | Mock generator, scripted session, scrubber, adapter layer, OAuth. |

Stream 5 is the demo's backbone and should start first — everyone else needs it to develop against.

---

## 8. Decisions to make

### 8.1 Roulette optics ⚠️

A spinning wheel on a platform under gambling scrutiny. Kick has a Gambling category so it's arguably on-brand, and this is chance resolution rather than wagering — but the visual reads as a casino wheel, and clause 5(b) covers conduct that might damage Easygo's reputation.

**Make this call consciously.** A dial, a spinner, a slot or a meter reads identically in mechanism with none of the freight. If we keep the wheel, keep it because we decided to, and be ready to answer for it.

### 8.2 Lead with chance, not polls

A judge who has seen four poll overlays that morning will pattern-match within ten seconds. **Open the demo on the wheel spinning.** The poll is setup; the mechanism is the product.

### 8.3 Non-intrusive tension

Constraint C3 says nothing should affect the streamer's overlays or alerts. This renders a 5-second animation on stream by design. The likely original intent was "don't break their existing setup" rather than "never render" — and opt-in resolves it. **Confirm the reading, then record it here.**

### 8.4 Odds shift cap

±15 percentage points is the suggested cap on what Kicks can move. The number matters less than having one — an uncapped mechanic becomes pay-to-win and loses the anti-brigading property that is the entire argument.

---

## 9. Risks

### 9.1 Pre-build exposure

Team decision made; recorded here without further argument. The live consequence to manage: **the detailed spec drops on 1 August and we are committed before seeing it.**

**Hedge:** keep the decision engine (workstream 1) decoupled from what it's attached to. Vote in → odds out → resolution → event emitted. If the released spec points elsewhere, we re-point the same core in an hour rather than rebuilding.

### 9.2 Market positioning

This concept requires a crowd, which aims it at mid-to-large channels — where most other teams will also aim. `KICK-IDEA-BANK.md` §2 identifies the median streamer with 15 viewers and a dead chat as the largest unserved market and the most sympathetic pitch. **We are deliberately walking away from that.** Legitimate, but make it knowingly, and have an answer ready if a judge asks what this does for a small streamer.

### 9.3 Blocklist collision

Mitigated by §8.2 framing, not eliminated.

### 9.4 Scope

Ten build items in 25–35 hours is tight. **Cut stretch items early rather than shipping ten things at 80%.** Polish is 10% of the score; feature count is worth nothing on its own.

---

## 10. Demo script — 90 seconds

| Time | Beat |
|---|---|
| 0:00 | Cold open. Stream running, chat moving. No explanation. |
| 0:10 | Streamer hits a decision point. |
| 0:15 | Poll lands in chat and on the overlay simultaneously. |
| 0:25 | Votes arrive. Split bar moves live — settles around 88/12. |
| 0:35 | Kicks spent. **Odds visibly shift.** The bar and the wheel disagree with the vote. |
| 0:45 | **The wheel spins.** Five seconds. Say nothing. |
| 0:50 | **The 12% option wins.** |
| 0:55 | Let the room react. Still say nothing. |
| 1:00 | A marker drops onto the timeline in real time. |
| 1:10 | Scrub back. Hover the marker — preview appears. |
| 1:15 | Open the tree. **Show the branch that lost.** |
| 1:25 | *"Majority rule means most people's vote never matters. Here, every vote always does."* |

The silence at 0:45–0:55 is doing more work than any sentence. Rehearse it.

---

## 11. Open items

| Item | Owner | By |
|---|---|---|
| Adopt §2 problem statement — in pitch, README and UI emphasis | | Sun 26 |
| Decide roulette optics (§8.1) | | Sun 26 |
| Confirm C3 reading (§8.3) | | Sun 26 |
| Set odds-shift cap (§8.4) | | Mon 27 |
| Written confirmation we're allocated to Challenge 1 | | Sun 26 |
| Wildcard scoring and time budget — still unconfirmed | | Sun 26 |
| DevTools pass on kick.com for real design tokens | | Wed 29 |
| Mock harness live so others can build against it | | Mon 27 |

---

## 12. Changelog

**v2 — 25 July**
- Real-time timeline markers added — resolves gate A4
- Hover previews added
- Problem statement adopted (§2) — +7.5
- Kicks-shift-the-odds escalation proposed (§3.2)
- Road-not-taken rendering proposed (§3.4)
- A1 and C7 waived by team decision
- Technical Execution revised +2 for the extended build window

**v1 — 25 July** — initial concept: timeline, polls, chance resolution, clips, export

---

*Scores are estimates using the team formula — re-score in session. Everything in §3.2 and §3.4 is a proposal, not a decision.*
