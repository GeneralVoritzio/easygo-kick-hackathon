# KICK Hackathon — Idea Bank

100 concepts for Challenge 1 and the wildcard, scored against our formula and filtered against the API's actual capabilities.

> **Read Section 0 first.** There's a tension in this document you should know about before you use it.

---

## 0. The honest caveat

You told me the trend you're worried about is everyone using AI to generate ideas, and that we'd end up converging on the same concept as another team. You then asked me to generate 100 ideas.

I've done it, but be clear-eyed about what this is. **The ideas below are not a menu to pick from.** If our winning concept is item #34 lifted intact, we've done exactly the thing you were trying to avoid — another team's model may well produce something adjacent.

What's actually defensible here is **Section 2, the white space analysis** — the structural gaps in what everyone else will build, derived from the API's real capabilities. The ideas are worked examples of those gaps. Use them as provocations in Sunday's session: read the angle, then have the team generate against it. The idea you invent in the room beats the idea I handed you, even if mine scores higher on paper, because you'll be able to defend it and you'll actually believe in it.

Scores are **my estimates** using our formula. Re-score as a team — my Creativity scores in particular are the least trustworthy, because I can't see what the other nine teams are building.

---

## 1. API reality check

Verified from the [KICK Dev Docs](https://github.com/KickEngineering/KickDevDocs) changelog and published scopes. This is the hard boundary on what's buildable.

### What we get

**Webhook events**

| Event | Notes |
|---|---|
| `chat.message.sent` | Includes `replies_to`, `created_at`, and an `identity` object on the sender |
| `channel.followed` | |
| `channel.subscription.new` / `.renewal` / `.gifts` | Subs include `expires_at` |
| `kicks.gifted` | Includes `pinned_time_seconds` |
| `livestream.status.updated` | Went live / went offline |
| `livestream.metadata.updated` | Title or category changed **mid-stream** |
| `moderation.banned` | |

**REST + WebSocket**

- `GET /channels` — by slug, with `thumbnail` and `custom_tags`
- `GET /livestreams` — multiple `broadcaster_user_id` in one call, `custom_tags`
- `GET /categories/:id` — with `tags` and `viewer_count`
- `GET /kicks/leaderboard`
- Users, moderation (ban/timeout, max 7 days), send chat, `DELETE /chat/:message_id`
- Live chat over WebSocket

**Scopes:** `user:read`, `channel:read`, `channel:write`, `channel:rewards:read`, `channel:rewards:write`, `chat:write`, `streamkey:read`, `events:subscribe`, `moderation:ban`, `moderation:chat_message:manage`, `kicks:read`

### What we do NOT get — these kill ideas

- ❌ **No video or audio frame access.** No computer vision on gameplay, no audio analysis, no detecting what's happening on screen. Anything requiring "the overlay reacts to what's happening in the game" is dead unless we mock it and say so.
- ❌ **No game state.** No K/D, no score, no rank.
- ❌ **No per-viewer telemetry.** We know `viewer_count`. We do **not** know who those viewers are unless they authenticate into our companion. Silent lurkers are invisible.
- ❌ **No emote or reaction events.** Only messages.
- ❌ **No historical analytics endpoint.** No "compare to last month" without storing it ourselves.
- ❌ **No injection into the KICK player.** We ship an OBS browser source or a separate companion surface. Not a layer inside kick.com.

### ✅ Resolved: we're running on mocked data

**Team decision — the API above is our schema reference, not our runtime dependency.** Full rationale in Section 2A of the hackathon spec. Three consequences for this document:

**1. Demo risk multipliers mostly collapse to ×1.0.** The webhook trap below is no longer our problem, and neither is venue wifi. Ideas I marked ×0.85 purely for live-data fragility — **#5 Kicks Bounties, #8 Reaction Lag, #10 The Handoff** — should be re-scored upward by roughly 5–7 points each. That moves Kicks Bounties into serious contention.

> The trap we're sidestepping: Kick retries a webhook **3 times**, then **automatically unsubscribes the event**. One hiccup mid-pitch and you're silently disconnected with no error on screen. There's a known open issue about [stalled chat webhook delivery](https://github.com/KickEngineering/KickDevDocs/issues/300) too. Teams running live will get bitten by this.

**2. The kill list in Section 7 stays dead.** This is the part that matters. We can mock the *volume and timing* of data the API could genuinely produce — a 3,000-person raid on cue, 400 messages a minute, a stream dropping offline mid-demo. We cannot mock a *capability the API doesn't have*. The judges are four KICK engineering managers; they know their own API surface. An overlay reading game state off the video feed doesn't become viable because we faked the data — it becomes a product that can never ship, demoed to the five people most able to spot it.

**3. Payload fidelity is now a scored surface.** Fixtures must mirror the real shapes — `identity`, `replies_to` and `created_at` on `chat.message.sent`, `pinned_time_seconds` on `kicks.gifted`. Matching the real schema is visible evidence of technical thinking. Invented field names read as lazy.

### Underused surface — where the white space is

Almost every team will build on `chat.message.sent` and viewer count. These are barely touched:

| Surface | Why it's open |
|---|---|
| `kicks.gifted` + `/kicks/leaderboard` | A real currency with a leaderboard. Nobody's building game mechanics on it. |
| `channel:rewards:read/write` | A full redeemable rewards economy sitting unused. |
| `replies_to` on chat messages | **Chat has threading structure and nobody uses it.** |
| `livestream.metadata.updated` | Category and title changes mid-stream — a signal of what's happening. |
| `moderation.banned` | Nobody builds on moderation as a data source. |
| `custom_tags` | Discovery and matching. |

---

## 2. Where the white space is

Five structural gaps. Every Tier S idea sits in one.

**A. Everyone builds for the big streamer.** xQc has 40,000 in chat and a mod team. The median Kick streamer has under 15 viewers and a dead chat. Every tool assumes abundance; the actual crisis is scarcity. **This is the largest unserved market and the most sympathetic pitch.**

**B. Everyone builds for the person already in chat.** The lurker, the tabbed-away viewer, the person who just arrived and understands nothing — all invisible to every tool on the blocklist.

**C. Everyone builds a readout; nobody builds contested state.** A meter you look at is inert on stage. Something the crowd fights over is theatre. Presentation is 10% and the wow beat is most of it.

**D. Streams are ephemeral and nothing persists.** In-jokes, promises, running bits, the shared history of a channel — all of it evaporates. Newcomers can't access it and regulars can't hold anyone to it.

**E. The transitions are broken.** Going live, raiding, dropping out, ending. These are the highest-emotion moments in streaming and they're completely unbuilt. Everyone builds for the steady state.

---

## 3. Tier S — the ten I'd actually take into Sunday

Full treatment. These clear 75 on my scoring.

---

### 1. The Raid Bridge — *est. 87*
**Gap E · Raids are the biggest moment in streaming and the most broken.**

500 people land in a channel they know nothing about, spam the raid message, and most leave within 30 seconds. The streamer gains nothing. The raider loses their audience.

A 30-second onboarding layer that fires on arrival: who this streamer is, what's happening *right now* in one line, the three in-jokes you need, and one thing to say so you're not silent. It decays and disappears — it isn't a permanent overlay.

- **Why it scores:** universal, painful, completely unbuilt, and there's a real number attached (raid retention). Product thinking 5/5 because the problem states itself.
- **Demo beat:** show the raid landing without it — chat scrolls, 400 people leave. Then again with it. The before/after is the whole pitch.
- **API:** `livestream.status.updated`, `GET /channels`, `chat.message.sent`, `custom_tags`
- **4 hours:** the arrival trigger and the decaying card. Fake the raid with a mock event.
- **Risk:** ×1.0

---

### 2. Channel Lore — *est. 85*
**Gap D + B · Every channel has a private language. Newcomers are locked out of it.**

Chat says "the cone thing" and 200 regulars laugh while 30 newcomers have no idea. Lore is a live decoder: when a channel's canonical phrase appears in chat, newcomers — and only newcomers — get a quiet inline explainer. Regulars see nothing. The lore is crowd-authored and upvoted, so the community builds its own onboarding.

- **Why it scores:** genuinely novel, warm, funny, and it makes a real cultural mechanic legible. Creativity 5/5 — nothing on the blocklist is remotely close.
- **Demo beat:** two side-by-side viewport panes, a regular and a newcomer, same chat. The newcomer's pane lights up with context. Instantly legible with no explanation.
- **API:** `chat.message.sent`, `identity` on sender, channel-side storage
- **4 hours:** phrase matching against a seeded lore table, plus the newcomer/regular split. Don't build the authoring flow — mock it.
- **Risk:** ×1.0 — pairs beautifully with #1 if you want one bigger concept.

---

### 3. Dead Chat CPR — *est. 84*
**Gap A · The hardest problem in streaming, and nobody builds for it.**

A streamer with 8 viewers talking into silence. Nobody types because nobody wants to be the first person to speak in an empty room. The streamer burns out and quits.

Detects the silence gap, and instead of nagging the streamer, gives lurkers a zero-effort on-ramp: a single tap that costs no social exposure and breaks the seal. Explicitly designed for channels under ~30 viewers — it switches itself off above that.

- **Why it scores:** the most sympathetic pitch in the room, and it targets the overwhelming majority of Kick's actual streamers. "We built for the 95% of streamers every tool ignores" is a hell of an opening line.
- **Demo beat:** a real dead-air timer counting up on screen, then the first message landing.
- **API:** `chat.message.sent` timing gaps, `GET /livestreams` viewer_count
- **4 hours:** silence detection plus the one-tap companion. Very achievable.
- **Risk:** ×1.0

---

### 4. The Understudy — *est. 83*
**Gap E · The stream drops. Everyone leaves. They don't come back.**

Internet dies mid-stream and the audience evaporates within 90 seconds. The streamer comes back to an empty room. This holds the audience through the gap — the companion takes over, tells them what happened, gives them something to do, and pulls them back the instant the stream returns.

- **Why it scores:** a real, universal, expensive problem nobody has touched. And it's the best demo beat available to us.
- **Demo beat:** **kill the stream live on stage.** Nothing else in the room will have that.
- **API:** `livestream.status.updated`, `GET /livestreams`
- **4 hours:** state detection and the holding experience. Small surface, big impact.
- **Risk:** ×1.0

---

### 5. Kicks Bounties — *est. 82*
**Gap C · Contested state, built on the API surface nobody's using.**

Viewers pool Kicks toward a specific named challenge — "5,000 Kicks and he has to do it." It only unlocks when the pool fills. Not a bet on an outcome; a crowd-funded commission for an action. Everyone can see the pool filling in real time and pile in.

- **Why it scores:** genuine contested state, loud, on-brand, and it uses `kicks.gifted` + the leaderboard, which almost nobody will touch. Real revenue argument for Kick too — it's a monetisation feature, which the judges will notice.
- **Demo beat:** the pool bar filling live with the room contributing.
- **API:** `kicks.gifted`, `GET /kicks/leaderboard`, `channel:rewards:write`
- **⚠️ Framing:** keep it strictly *pay-for-action*, never *wager-on-outcome*. Prediction and betting are on the blocklist and Kick has enough gambling scrutiny.
- **Risk:** ×0.85 — depends on Kicks behaving in a sandbox.

---

### 6. The Ledger — *est. 81*
**Gap D · Streamers make promises on stream. They evaporate.**

"I'll do a 24-hour stream if we hit 10k." "Next week I'll finally play it." Chat remembers for about a day. The Ledger captures commitments as they're made — mod-flagged or chat-nominated — and keeps them on a public, permanent, slightly menacing scoreboard with deadlines.

- **Why it scores:** very funny, very on-brand for Kick's irreverence, and structurally novel. Creates accountability theatre the community polices itself.
- **Demo beat:** an overdue promise from three weeks ago surfacing at exactly the wrong moment.
- **API:** `chat.message.sent`, `replies_to`, moderation scopes for flagging
- **4 hours:** the capture flow plus the board. Skip NLP entirely — mod-flagged capture is better product design *and* faster to build.
- **Risk:** ×1.0

---

### 7. First Time Caller — *est. 79*
**Gap B · The single highest-leverage moment in a viewer's life as a fan.**

Someone types in a channel for the very first time. Right now: nothing happens, it scrolls past, they never type again. This catches that moment and makes it an event — a small, warm, unmissable beat that the streamer can react to.

- **Why it scores:** tiny scope, enormous emotional payload, and it maps directly onto a retention metric. The pitch writes itself.
- **Demo beat:** the moment lands and the streamer says the person's name. That's the whole thing.
- **API:** `chat.message.sent` with sender `identity`, channel-side first-seen store
- **4 hours:** comfortably. Leaves room to polish, which is 10% of the score.
- **Risk:** ×1.0 — the safest build in Tier S. Strong candidate if the team is unsure.

---

### 8. Reaction Lag — *est. 78*
**Gap C · A better hype signal than the one everyone else will build.**

Message velocity — the blocklist's #4 — is a *lagging* signal. Chat reacts 3–8 seconds after the thing happens, so a velocity meter always points at the wrong moment. Reaction Lag lets viewers mark the moment retroactively ("that, 6 seconds ago") and clusters those marks to find where the peak actually was.

- **Why it scores:** it's the obvious idea, corrected. Being able to say "everyone here built a hype meter, here's why they're all measuring the wrong instant" is a strong creativity play — you're beating the blocklist by critiquing it.
- **Demo beat:** show a velocity meter and Reaction Lag side by side, pointing at different moments. Prove the naive one is wrong.
- **API:** `chat.message.sent` with `created_at` for lag distribution
- **Risk:** ×0.85 — needs a convincing recorded session to land.

---

### 9. King of the Hill — *est. 77*
**Gap C · Pure contested state.**

One chatter holds a visible throne on the overlay. Holding it earns something. Anyone can take it. Visible, single-slot, constantly contested, and it makes the overlay a place the audience is *fighting over* rather than reading.

- **Why it scores:** the loudest, most energetic thing in this document and the most Kick-brand. Presentation and UX score very well.
- **Demo beat:** get the judges to take the throne off each other from their phones.
- **API:** `chat.message.sent`, `kicks.gifted`, `channel:rewards:write`
- **Risk:** ×1.0 — mechanically simple, which frees time for polish.
- **Weakness:** thinner product thinking than the rest of Tier S. Pair it with a real retention argument or it reads as a toy.

---

### 10. The Handoff — *est. 76*
**Gap E · Streams end. Audiences dissolve. Nobody builds the ending.**

The last 5 minutes of a stream are dead air and everyone drifts off alone. The Handoff turns the ending into a deliberate migration — where this crowd is going next, who's live now that this community overlaps with, and it moves people together rather than one by one.

- **Why it scores:** strong platform-level argument. It keeps viewers on Kick instead of leaking them to another platform, which is a business case the KICK EMs will immediately understand.
- **Demo beat:** the countdown, then the crowd moving as a block.
- **API:** `livestream.status.updated`, `GET /livestreams` multi-broadcaster, `custom_tags`
- **Risk:** ×0.85

---

## 4. Tier A — twenty strong seconds

Scored 68–75. Real contenders, slightly thinner on one axis.

| # | Idea | Est. |
|---|---|---|
| 11 | **The Green Room** — streamer sees an incoming raid 20 seconds before it lands: who, how many, what they're into. Turns an ambush into a welcome. | 75 |
| 12 | **Threadkeeper** — uses `replies_to` to surface the actual conversations happening inside the chat river. Chat has thread structure and literally nobody renders it. | 74 |
| 13 | **The Bouncer** — hate raid detection built on `moderation.banned` velocity, with a one-tap community lockdown. Serious problem, serious credibility. | 74 |
| 14 | **Warm-Up Act** — the first 5 minutes of a stream are dead while people trickle in. Bridges the gap with what they missed and who's arriving. | 73 |
| 15 | **Second Monitor** — deliberately designed for the muted, backgrounded tab. Ambient, glanceable, pulls you back only when something's actually worth it. | 73 |
| 16 | **Chapter Marks, crowd-authored** — viewers name the moments live; the stream becomes navigable as it happens. | 72 |
| 17 | **The Regulars' Table** — a persistent side-space for people who've been here a while, visible to newcomers as something to earn. | 72 |
| 18 | **Split Purse** — collab streams: Kicks split live between co-streamers with a visible tug of war over the split. | 71 |
| 19 | **Say It Back** — call-and-response chanting mechanic. Streamer calls, chat answers, the overlay measures how hard the room hits. Loud and dumb in the best way. | 71 |
| 20 | **Cold Open** — a 15-second auto-generated "what you walked into" for anyone arriving mid-stream. Distinct from the blocklist's AI recap: no summarising, just live state. | 70 |
| 21 | **The Understudy Queue** — when a streamer drops, a designated friend's channel picks up the crowd automatically. | 70 |
| 22 | **Kicks Weather** — where in the world the Kicks are coming from, live. Beautiful, and surprisingly emotional for IRL streamers. | 70 |
| 23 | **The Gauntlet** — chat sets escalating challenges; each cleared one unlocks a harder one. Structured contested state. | 69 |
| 24 | **Mod Load** — makes invisible moderation labour visible to the community. Novel and decent, but heavy in tone against Kick's brand. | 69 |
| 25 | **Name In Lights** — the single most generous thing a streamer can do is say your name. Engineers that moment for people who've earned it. | 69 |
| 26 | **Tag Drift** — `livestream.metadata.updated` shows category changes mid-stream. Surfaces "this stream just became something else" to people who'd want it. | 68 |
| 27 | **The Petition** — chat collectively demands something; it needs a real threshold and it's visible the whole way up. | 68 |
| 28 | **Sub Anniversary** — `expires_at` on subs means we know loyalty duration. Turns renewal into a moment instead of a silent transaction. | 68 |
| 29 | **Overheard** — the best line in chat in the last 10 minutes, chosen by chat, on the overlay. Simple, warm, endlessly rewatchable. | 68 |
| 30 | **Ghost Numbers** — shows lurkers how many other lurkers are there. "You are one of 340 people not talking" is a startlingly effective nudge. | 68 |

---

## 5. Tier B — forty more, honestly rated

Scored 55–67. Solid, not winners as stated — but several are one twist away.

| # | Idea | Est. |
|---|---|---|
| 31 | **Chat Tug-of-War** — two sides, one tension bar, live | 67 |
| 32 | **The Encore** — chat signals "do that again" | 67 |
| 33 | **New Here?** — quiet on-ramp shown only to first-session viewers | 67 |
| 34 | **The Vault** — channel's greatest hits, community-curated, surfaced when referenced | 66 |
| 35 | **Streak** — consecutive streams attended, visible, losable | 66 |
| 36 | **Co-Sign** — vouch for a newcomer; your reputation rides on their behaviour | 66 |
| 37 | **The Bell** — one shared alarm the whole chat can ring, with a cooldown | 65 |
| 38 | **Runback** — track a recurring bit's every appearance across streams | 65 |
| 39 | **Quiet Hours** — auto-detects when a streamer is concentrating, suppresses noisy overlays | 65 |
| 40 | **Two Screens** — mobile companion designed for the person watching on TV | 65 |
| 41 | **The Draft** — chat drafts teams before a game, stakes visible | 64 |
| 42 | **Hot Seat** — one chatter answers rapid-fire questions on the overlay | 64 |
| 43 | **Kicks Ladder** — leaderboard with visible tiers and decay, not a static list | 64 |
| 44 | **Tourist Mode** — channel-hop with a 20-second orientation at each stop | 64 |
| 45 | **The Wall** — collective build/destroy that persists between streams | 63 |
| 46 | **Callback** — detects a phrase used earlier in the same stream and flags it | 63 |
| 47 | **Sub Goal, but real** — goals framed as concrete outcomes, not arbitrary bars | 63 |
| 48 | **The Roster** — who's in chat right now, as people not usernames | 63 |
| 49 | **Away Message** — set a status when you tab out, reclaim your seat when back | 62 |
| 50 | **The Nudge** — streamer taps one button, a specific lurker gets gently invited in | 62 |
| 51 | **Chat Weather Station** — room energy without sentiment analysis, purely structural | 62 |
| 52 | **The Relay** — sequential challenge passed between chatters | 62 |
| 53 | **Long Time Listener** — surfaces watch-history depth at the moment someone first speaks | 62 |
| 54 | **Mod Handoff** — shift changes for mod teams, with a live briefing | 61 |
| 55 | **The Lineup** — who's live next in this community, as a schedule | 61 |
| 56 | **Pin Economy** — `pinned_time_seconds` on Kicks as a contested attention auction | 61 |
| 57 | **Rewind Room** — a side-channel for people watching slightly behind live | 61 |
| 58 | **The Chorus** — everyone types the same thing at once; overlay measures sync | 60 |
| 59 | **Backseat Meter** — visualises how much chat is telling the streamer what to do | 60 |
| 60 | **First Follow** — engineers the moment someone follows for the first time | 60 |
| 61 | **The Marquee** — streamer's own words from earlier, quoted back on the overlay | 60 |
| 62 | **Threshold** — anything unlocks only when N people act together | 59 |
| 63 | **The Understudy Board** — who's covering for whom across a friend group | 59 |
| 64 | **Ration** — each viewer gets 3 messages per hour; scarcity raises quality | 59 |
| 65 | **The Bounty Board** — persistent open challenges across streams | 59 |
| 66 | **Shift Change** — hands a global audience over across timezones | 58 |
| 67 | **Chat Radio** — a slow, calm chat view for background viewing | 58 |
| 68 | **The Tally** — one running count of anything, chat-defined, persists forever | 58 |
| 69 | **Proximity** — surfaces viewers near you for IRL streams | 58 |
| 70 | **The Cameo** — a viewer gets 10 seconds on the overlay, earned | 57 |
| 71 | **Slow Clap** — applause that builds only if enough people sustain it | 57 |
| 72 | **The Almanac** — this day in channel history | 57 |
| 73 | **Handshake** — two viewers agree to both do something | 57 |
| 74 | **The Queue, but fair** — first-time chatters get priority in Q&A | 56 |
| 75 | **Signal Boost** — chat collectively promotes one message | 56 |
| 76 | **The Understory** — what chat is talking about that isn't the stream | 56 |
| 77 | **Cooldown** — enforced pause after a heated moment, community-triggered | 56 |
| 78 | **The Postcard** — send a moment to a friend who's not watching | 55 |
| 79 | **Rally** — coordinates a return at a specific time | 55 |
| 80 | **The Ticker** — cross-channel news bar for one community | 55 |
| 81 | **Understudy Kicks** — Kicks that only pay out if the streamer comes back | 55 |
| 82 | **The Sixth Man** — crowd affects one small thing in the streamer's world | 55 |
| 83 | **Chat Hansard** — full searchable record of what was said and by whom | 55 |
| 84 | **The Warm List** — people who always show up, surfaced to the streamer | 55 |
| 85 | **Second Wind** — detects flagging energy, triggers a community intervention | 55 |
| 86 | **The Doorbell** — notifies chat when a notable regular arrives | 55 |
| 87 | **Split Screen** — two channels, one companion, for collab watching | 55 |
| 88 | **The Honour Roll** — public credit for people who de-escalate in chat | 55 |
| 89 | **Timebank** — bank watch-time, spend it on something | 55 |
| 90 | **The Send-Off** — end-of-stream ritual the community performs together | 55 |

---

## 6. Wildcard track — ten `[MIXER]`

Anywhere on the platform. **Warning:** if the real-time requirement applies to the wildcard too — and Section 3 of our spec assumes it does until confirmed — most of these fail gate A4. Confirm before committing.

| # | Idea | Est. |
|---|---|---|
| 91 | **Proof of Presence** — badges you can only earn by being there live, never purchasable. Directly counters the blocklist's generic "loyalty points". | 72 |
| 92 | **The Feed You Made** — discovery driven by who you watch *with*, not what you watch | 70 |
| 93 | **Channel Constitution** — communities publish their own rules; visible on arrival | 69 |
| 94 | **Warm Intro** — matches a newcomer to a small channel that needs them, not a big one | 68 |
| 95 | **The Long Tail Row** — a home-page row that only shows streamers under 20 viewers | 67 |
| 96 | **Receipts** — public, permanent record of what a channel actually did | 65 |
| 97 | **Two-Way Follow** — mutual follows between viewers, not just viewer→streamer | 64 |
| 98 | **The Alumni** — where a departed community went | 62 |
| 99 | **Taste Twins** — find the one person whose watch history mirrors yours | 61 |
| 100 | **Founding Member** — permanent, non-transferable status for early supporters of a small channel | 60 |

---

## 7. Ten I killed, and why

Worth as much as the list above — these look great until you check them against Section 1.

| Idea | Killed by |
|---|---|
| Auto-clip detection from gameplay | ❌ No video frame access. Also blocklist #1. |
| Live game stats overlay | ❌ No game state. Blocklist #13. |
| Hype meter from message velocity | ⚠️ Buildable but blocklist #4 — and it measures the wrong instant (see #8). |
| Sentiment heat map | ⚠️ Blocklist #2, and every team with an LLM key will build it. |
| Detect who's tabbed away | ❌ No viewer telemetry for non-authed viewers. |
| Emote rain / reaction bursts | ❌ No emote events. Blocklist #7. |
| AI co-host commentary | ❌ Can't see or hear the stream. Blocklist #8. |
| Unified simulcast chat | ⚠️ Needs other platforms' APIs — clause 3(g) risk. |
| Live translation overlay | ⚠️ Blocklist #3, and a solved commodity. |
| Anything requiring audio alerts | ⚠️ Fails our cross-platform constraint C4. |

---

## 8. How to use this on Sunday

1. **Don't open this file first.** Run the divergence round cold — everyone brings 5 ideas of their own. Reading a ranked list before you think is how you get anchored, and anchoring is exactly what we're trying to avoid.
2. **Then read Section 2 aloud** — the five gaps, not the ideas. Generate against the gaps for 20 minutes.
3. **Then open Tier S** as a benchmark. If nothing the team generated beats these, take the best of these and make it ours — change the user, change the mechanic, change the angle until we can defend it as our own.
4. **Re-score everything yourselves.** My numbers are estimates from outside the room.

**If you want my single pick:** **#1 Raid Bridge fused with #2 Channel Lore.** Same user (the person who just arrived and understands nothing), same moment, one coherent product, and it lands in two white-space gaps at once. Strong problem statement, genuinely original, demos as a dramatic before/after, and it's comfortably buildable in four hours.

**Safest pick if the team wants certainty:** **#7 First Time Caller.** Smallest scope, biggest emotional payload per line of code, near-zero demo risk, and it leaves hours for the polish that's worth 30% of the score.

---

*Compiled 25 July 2026. API surface verified against [KickDevDocs](https://github.com/KickEngineering/KickDevDocs). Scores are estimates — re-score as a team.*
