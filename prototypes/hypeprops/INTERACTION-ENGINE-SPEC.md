# Interaction Engine — build spec

> Original build spec (2026-07-24). Implemented in `src/engine/ack.ts`,
> `src/engine/roulette.ts`, `src/engine/interactionStore.ts` and the `src/stream/` +
> `src/browse/` UI. Deviations from this spec are noted at the bottom.

**One line:** an extension that tells a viewer their odds of being seen on a stream, and gives them a way to shorten them.

Two layers. The **engine** measures how reliably a streamer acknowledges chat and exposes it as a live badge on the browse grid. The **roulette** is a recurring segment that draws one random chat-submitted dare and puts it on air, giving any single viewer — not just the loudest bloc — a real shot at the stream.

The engine is the spine. The roulette is the entertainment layer that sits on it. Neither depends on computer vision.

---

## Why building on a clone changes things

On real Kick, reading chat requires OAuth from the broadcaster and a public webhook endpoint. On your own clone, you own the event bus — emit `message.sent` directly and skip the entire auth problem.

Two things you should still do:

- **Keep the ingest boundary shaped like Kick's webhook payload** (`sender.user_id`, `sender.username`, `sender.identity.badges[]`, `content`, `created_at`). Costs nothing now, means the engine ports to real Kick later without a rewrite, and it's a good line in the pitch.
- **Seed the clone with realistic chat.** The whole product is a rate over hundreds of messages. Three people typing in a test channel will not produce a believable badge. Write a chat simulator with configurable message rate, a returning-regulars population, and a first-timer trickle — you need it for the demo anyway, and it's what lets you tune thresholds before the day.

---

## Layer 1 — the engine

### The only event that matters

```
AcknowledgementEvent {
  message_id
  user_id
  message_ts
  ack_ts
  latency_ms
  tier            # "explicit" | "inferred" | "roulette"
  confidence      # 1.0 for explicit and roulette
}
```

Everything downstream is a view over this. Do not add a second event type until this one works.

### Detection tiers

**Tier 1 — explicit (deterministic, build first).**
Live transcript of streamer audio. Verbatim match of a chatter's username against the rolling 60s window of message senders. Unambiguous, attributable, needs no model. This alone is a complete product.

**Tier 2 — inferred (probabilistic, only if time).**
Streamer paraphrases or answers without naming anyone. Embedding similarity between the utterance and recent messages, plus temporal decay over ~30s. Always reported as a separate tier with its own coverage number. Never blend it silently into tier 1.

**Tier 3 — roulette.** Perfect labels, tiny volume. See layer 2.

**Excluded:** alert reads (subs, donations, follows). Automated and self-serving — they'd let a streamer farm the score by doing nothing.

### The score

The output number is **response odds**: given current chat conditions, what's the chance a message sent right now gets acknowledged.

```
odds = acked_messages / total_messages     # rolling 10-min window
```

Displayed as "1 in N", never a percentage or a 0–100 index. Odds resist inflation — you can't quietly rescale a fraction — and people reason about them better.

Because it's a rate over a rolling window it is already load-normalised: a stream that triples its viewers watches its own odds fall in real time, which is the honest answer.

### Supporting stats

- **Median latency** — how long from message to acknowledgement.
- **Attention spread** — Gini coefficient over acknowledgements per unique user. Low = spread across chat, high = the same six regulars absorb everything.
- **First-timer share** — % of acknowledgements going to users with no prior message in this channel. The most valuable stat you have, and nobody else surfaces it.

### Badges

Three states, positive only. Never ship a negative badge — it's punitive, streamers would fight it, and no platform would adopt it. Absence says enough.

| Badge | Condition (tune against simulated data) |
|---|---|
| Responsive | odds above channel-size-adjusted baseline |
| Reads everything | high odds **and** low Gini |
| New-chatter friendly | high first-timer share |

When chat is too fast to track, show **no badge with a stated reason** rather than a bad score. Coverage shown as UI.

### Anti-farming

A streamer could read usernames aloud to inflate the score. Three checks:

1. **Spread** — Gini caps the value of repeatedly acknowledging the same people.
2. **Depth** — did the exchange continue, or was it a name drop.
3. **First-timer share** — farming with regulars won't move this.

Rolling window means the score decays and has to be re-earned.

---

## Layer 2 — the roulette

### Loop

1. Viewers submit with `/interact <dare or task>`. **One live entry per user** — a resubmission replaces their previous entry.
2. Entries pool for the segment interval (start with 10 min, make it configurable).
3. On trigger, a slot-machine animation cycles through candidate entries and lands on one.
4. Streamer accepts or declines. Both are fine.
5. If accepted, the **submitter** marks it done or not done.
6. Chat's natural reaction in the following ~15s passively corroborates. If the submitter says "not done" while chat erupts, trust chat.

### Why random selection is the right call

It's sybil-resistant by construction. One entry per person, uniform odds — coordination buys nothing, so you don't need the volume-weighting and bot-detection machinery that a consensus mechanism would require. The price of participation drops from sustained loudness to a single message, and the payoff is independent of social capital.

### Pity timer

Not uniform. Entries from users who've never been drawn get escalating weight:

```
weight = 1 + (0.5 × rounds_entered_without_winning)
```

Cheap, well-understood by anyone who plays games, and it turns the lurker thesis from a claim into a mechanism. Show the viewer their odds improving.

### Moderation — do not skip this

Random selection means an unvetted dare gets top billing on a live stream. Classify every submission on arrival and build the wheel from **survivors only**. The spin is visually identical; the pool is pre-filtered. Streamer keeps an always-available skip.

Call this out unprompted in the demo. It reads as someone who's thought about operating the thing.

### Declining is free

Streamers will decline often — sponsors, safety, mid-fight. If "no" dents the badge, they uninstall it and you've built a coercion device. Measure **engagement with the segment**, not compliance. A streamer who reads every dare aloud and declines them all is being highly interactive and the metric should say so.

### Empty pool fallback

A dead segment is worse than no segment. When submissions are thin, auto-seed the wheel with genuine unanswered questions from chat, clustered and diversity-weighted. The wheel always spins, and quiet streams get the feature that helps them most.

### Feeding the engine

Every roulette outcome is a hard-labelled acknowledgement event — known user, known timestamp, known result. Small n, near-perfect precision. Use it as a calibration set for tier 2, not as the primary denominator.

---

## UI surfaces

**Browse grid (the extension surface).** Badge injected onto each stream tile with a one-line stat beneath it. This is discovery — it's the reason someone installs — and technically it's DOM injection with scores from your backend.

**In-stream meter.** "If you type now: 1 in 4." Median latency, and a personal session receipt: *4 of your 12 messages acknowledged tonight*. This is the thing no platform gives you — proof your attention was returned.

**Timing agency.** The overlay knows queue depth. Tell the viewer *when* to type: odds are poor at 40 msg/min, a lull opens, odds jump. Turns reading the meter into a skill.

**Roulette segment.** Slot animation, submitter's name, dare text, accept/decline, then the verification prompt to the submitter.

Design notes: live and changing, not a static profile award. Same grammar across both layers — the badge says *1 in 4 messages get answered here*, the roulette says *1 in 47 this round*.

---

## Build order

1. Event schema + chat simulator on the clone
2. Transcript capture + tier-1 username matching
3. Score, rolling window, supporting stats
4. Browse-grid badge injection
5. In-stream odds meter + session receipt
6. Roulette: submission, pool, moderation filter, weighted draw, animation
7. Verification + passive chat corroboration
8. *Optional:* tier-2 inferred acknowledgement
9. *Optional:* streamer-side dashboard — unanswered backlog, attention concentration, idle nudge

Threshold tuning needs real-shaped data, so get steps 1–3 collecting early.

---

## Explicitly out of scope

- **Computer vision.** Gaze can't tell you what's at the end of the vector without per-streamer calibration. Revisit only as a highlight-clip feature.
- **Consensus polling.** Produces ~8 episodic events per stream; the badge needs a rate over hundreds. Breaks the denominator, and it hands the microphone to whoever coordinates hardest — the opposite of the user problem.
- **Catalogue-wide ranking on real Kick.** Needs per-streamer OAuth. Frame it as the reason this belongs platform-side.

---

## The demo

Browse the directory → notice the badges → pick "new-chatter friendly" → someone in the room types → meter moves → acknowledged → receipt. Then the roulette fires and their dare goes on air.

No model that can fail on stage. Just a person getting seen, and a number that predicted it.

---

## Implementation deviations (as shipped)

- The roulette UI ended up as a **Drops-style collapsible card pinned in chat** (not a
  video overlay) after design iteration — square panel, pixel-corner accents, ambient
  constant-speed reel while collecting, burst-and-land on spin.
- The pool is **seeded with ~300 simulated entries** at startup so every spin has
  stakes without waiting; the sim tops it up and pity-weights persist across rounds.
- KICKBot narrates the loop in chat (submission confirmed / wheel spinning / outcome).
- The stage defaults to a **real live Kick embed** (player.kick.com iframe) with the
  interaction layer over it; webcam + face-props mode is a director-panel toggle.
- Tier 2 (inferred) and the streamer dashboard (optional steps 8–9) were not built.
- "Depth" anti-farming (did the exchange continue) is not implemented; spread,
  first-timer share, and window decay are.
