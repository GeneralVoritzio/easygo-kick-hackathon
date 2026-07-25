# KICK API Conventions — our style guide

> ⚠️ **We run entirely on mock data. There is no live API integration.** We do **not** call
> `api.kick.com`, hold tokens, subscribe to real webhooks, or depend on any network at runtime.
> The KICK Public API is used **only as a schema and naming reference** — we copy its shapes so
> our fixtures are indistinguishable from real payloads. Everything the app consumes is generated
> by us. (This is the deliberate call in Hackathon Spec §2A: it kills the biggest demo risk and
> gives us total control of the timeline.)

> **The KICK Public API is our reference implementation.** Two rules follow from that:
>
> 1. **If KICK already exposes it, use their exact names.** Real endpoint paths, real field
>    names, real event names, real object shapes — copied verbatim. Never paraphrase a field
>    that exists (`viewer_count`, not `viewers`; `broadcaster_user_id`, not `channelId`).
> 2. **If we have to invent it** (an endpoint, event or object KICK doesn't have — a prop drop,
>    an interaction roulette), we name and shape it **as if KICK's own engineers built it**,
>    following the conventions identified below. A judge should not be able to tell our
>    invented surface from the real one by its style.
>
> Ground truth for what actually exists: [KICK_API_MAP.md](KICK_API_MAP.md) and
> https://docs.kick.com. If a capability isn't there, we can't claim the API produces it — see
> Hackathon Spec §2A.1 ("mock the volume, never the capability").

---

## Part 1 — Conventions identified from the real API

These are lifted from the live surface (Categories, Channels, Users, Chat, Kicks, Livestreams,
Events). Match them exactly.

### Hosts & paths
- **API host** `https://api.kick.com` · **Auth host** `https://id.kick.com` — auth is a
  separate host; keep it that way in any mock URL.
- **Path shape:** `/public/v{n}/{resource}[/{sub}]`. Always `public`, always a version segment,
  resource is **plural** (`/channels`, `/livestreams`, `/categories`, `/events/subscriptions`).
- **Versioning is per-endpoint, in the path** (`/public/v2/livestreams` supersedes
  `/public/v1/livestreams`). New version = new path; the old one is marked DEPRECATED, not deleted.

### Verbs & resources
- REST CRUD maps to verbs: `GET` list/read, `POST` create, `PATCH` partial update (at least one
  field required), `DELETE` remove (`204 No Content` on success).
- Batch operations take **arrays with a cap** and report only failures (e.g. accept redemptions:
  up to 25 IDs, response carries only the ones that failed). Copy that pattern for our batches.

### Casing & field names
- **All wire fields are `snake_case`.** No camelCase, ever, on a payload.
- IDs embed the entity: `user_id`, `broadcaster_user_id`, `message_id`, `category_id`,
  `reward_id`, `client_id`. A bare `id` only appears as an object's own primary key.
- Counts end in `_count` (`active_subscribers_count`, `viewer_count`, `canceled_subscribers_count`).
- Booleans read as predicates: `is_live`, `is_verified`, `is_anonymous`, `is_mature`,
  `is_enabled`, `is_paused`, `has_mature_content`.
- Times end in `_at` and are **RFC3339 UTC** (`created_at`, `started_at`, `ended_at`,
  `redeemed_at`, `expires_at`) — with the odd legacy `start_time`. New fields use `_at`.
- Durations are named for their unit context (`duration` = months for subs, minutes for bans;
  `pinned_time_seconds` = seconds). If a unit is non-obvious, put it in the name.

### ID formats
- **ULID** (26-char Crockford base32) for message/event/reward/redemption IDs and the webhook
  `Kick-Event-Message-Id`.
- **UUID** for `LivestreamV2.id`.
- **integer** for `user_id` / `broadcaster_user_id` / `category_id`.
- Hex strings for colours (`background_color`, `username_color`).

### Response envelope & pagination
- Every REST response is wrapped: `{ "data": <payload>, "message": <string> }`.
- Cursor pagination only: `{ "next_cursor": <string> }`. No page numbers on current endpoints.

### The shared subject object (most important reuse)
KICK uses **one** compact user object for every human role — broadcaster, sender, follower,
subscriber, gifter, giftee, moderator, banned_user, redeemer:

```
is_anonymous, user_id, username, is_verified, profile_picture, channel_slug, identity
```

Anonymous → every identifying field is `null`, only `is_anonymous: true` remains. `identity`
(`username_color` + `badges[]`) is populated **only** on a chat sender. **Never invent a second
user shape** — a new event that involves a person reuses this object.

### Scopes
- Format `resource:action` (`channel:read`, `chat:write`, `moderation:ban`,
  `channel:rewards:write`, `events:subscribe`, `kicks:read`). An invented capability that needs a
  scope names it the same way.

### Webhooks / events
- **Event names are lowercase, dotted, `resource.past-tense-verb`:** `chat.message.sent`,
  `channel.followed`, `channel.subscription.new`, `kicks.gifted`,
  `channel.reward.redemption.updated`, `livestream.status.updated`. Note: **past tense** — the
  event announces something that already happened.
- Every event is delivered with six headers (`Kick-Event-Message-Id`, `-Subscription-Id`,
  `-Signature`, `-Message-Timestamp`, `-Type`, `-Version`) and is currently **version 1**.
- `Kick-Event-Message-Id` is the **idempotency key** — dedupe on it.

---

## Part 2 — Inventing our own surface

When HypeProps or the interaction engine needs something KICK doesn't expose, we still **mock**
it — we're not standing up real endpoints. But the invented surface gets named and shaped as if
KICK built it, so the fixtures read as one coherent API. Model it on the conventions above:

| We need | ❌ Off-style | ✅ KICK-style |
|---|---|---|
| Endpoint: place a sponsored prop | `POST /api/dropProp` | `POST /public/v1/props/drops` |
| Endpoint: list active prop slots | `GET /getActiveProps` | `GET /public/v1/props/slots` |
| Event: a prop was placed on cam | `PropPlaced` / `prop_drop` | `props.drop.placed` |
| Event: chat hype extended a slot | `hypeExtend` | `props.slot.extended` |
| Event: a roulette dare was drawn | `RouletteResult` | `interaction.roulette.drawn` |
| Field: how long the prop stays up | `durationMs`, `time` | `pinned_time_seconds` (reuse KICK's own) |
| Field: who triggered it | a new `{userName,id}` blob | the shared **subject** object |
| Scope: trigger a prop | `props_write` | `props:write` |

### Label the two sets apart

Anywhere we write an endpoint or an event name, the name carries a label:

| Label | Meaning | Example |
|---|---|---|
| `kick` | KICK publishes this surface | `kick GET /public/v2/livestreams`, `kick kicks.gifted` |
| `fake-kick` | We invented this surface | `fake-kick POST /public/v1/timelines/markers`, `fake-kick timeline.marker.created` |

The label goes in front of the verb and the path, or in front of the event name. It is a label for
readers, not part of the path. A mock payload keeps the real path (`/public/v1/...`), because the
invented surface still reads as KICK style.

Use the label in code, in docs and in UI copy. Keep the two sets in separate files: a mock API file
holds the `kick` labels only, and the code that consumes it holds the `fake-kick` labels. A
reader then knows which surface is real without a second file open.

Rules of thumb:
- Reuse a real KICK field before minting a new one (`kicks.gifted` already carries
  `pinned_time_seconds`, `amount`, `tier`, `message` — a prop drop is that event, not a new shape).
- New event → `resource.verb` past tense, version 1, same six headers, subject object for people.
- New endpoint → `/public/v1/{plural-resource}`, `{ data, message }` envelope, `snake_case` fields,
  cursor pagination if it lists.
- Write it down here when you add one, so the invented surface stays internally consistent.

---

## Part 3 — Mock data: real names, never placeholders

Mock data is a **scored surface** — the judges are KICK engineers and will read our fixtures. It
has to look like a real KICK stream, which means the names and values carry personality.

### The hard rule: no placeholders. Ever.
Never ship `user1`, `foo`, `bar`, `test`, `example`, `John Doe`, `Streamer A`, `Lorem ipsum`,
`sponsor_name`, `https://example.com`, `TODO`, or a numbered sequence standing in for content.
Every value is a concrete, believable, specific thing. If you're tempted to write a placeholder,
write a real example instead.

### Usernames — mix two flavours
1. **Real KICK-flavour streamer handles** for broadcasters and known regulars — the kind of
   names that actually headline KICK: `xQc`, `Trainwreckstv`, `Adin Ross`, `Amouranth`,
   `clavicular`, `Nickmercs`, `Roshtein`, `Suslong`, `Ac7ionMan`, `iceposeidon`, `BruceDropEmOff`,
   `N3on`. (Use as *flavour*; the broadcaster in our demo is our own channel.)
2. **Funny/random viewer handles** for the crowd — real-looking gamer tags with the usual
   suffixes and leetspeak: `SuperBunny551`, `xXNightRaverXx`, `toastedGG`, `lurkmaster99`,
   `clipfarm3r`, `kekw_enjoyer`, `ratioed_again`, `vibecheckerr`, `sleepygoose204`,
   `TurboRaccoon_`, `notacop_promise`, `mid_diff_andy`, `crispymoth42`, `pogchampion`.

Blend them ~1 memorable name per handful of randoms — that's what a real chat list looks like.
Keep a shared, growing name pool and draw from it, so the crowd is consistent across features.

### Everything else is concrete too
- **Chat messages:** real chat energy — `LETS GOOO 🔥`, `clip that`, `what rank are you now?`,
  `hi from brazil 🇧🇷`, `first time here, vibes are good`. Not `message 1`, `sample text`.
- **Categories:** real KICK categories — `Just Chatting`, `Slots & Casino`, `GTA V`,
  `Counter-Strike 2`, `Pools, Hot Tubs & Beaches`. Not `Game`, `Category A`.
- **Sponsors/brands:** invent brands that sound real and own them — `Prime Energy`,
  `G FUEL`, `HyperX`, `NordVPN` are the register (a plausible-but-fictional brand is fine; a
  literal `Sponsor` is not).
- **Amounts:** realistic distributions — most `kicks.gifted` at 100–500, the occasional 5,000
  whale. Not `100, 100, 100`.
- **Avatars/URLs:** shape them like real KICK asset URLs (`https://files.kick.com/images/...`),
  not `example.com`.
- **Colours:** real hex values already in use (`#53fc18` reserved for the KICK/bot voice, used
  sparingly per the Design Spec).

### Quick self-check before a fixture ships
- [ ] Zero placeholders — every name, message, brand, URL and number is a specific real-looking value
- [ ] Usernames blend KICK-streamer flavour with funny random handles
- [ ] Field/endpoint/event names match Part 1 (or Part 2 for invented surface) exactly
- [ ] No value implies a capability the API lacks (Hackathon Spec §2A.1)

---

## Part 4 — Populate everything: density & liveness

**Standard across everything we build.** Nothing ships empty. Every interactive element, list,
panel, category, leaderboard, feed or counter arrives already full of believable mock data. An
empty state is only ever shown *deliberately* to demo the empty state — never because we didn't
bother to seed it. A judge should never look at our UI and see a blank list where a real stream
would be busy.

### Two kinds of data, seeded differently

**Static / structural — seed it in full at startup.** Anything that would already exist before
the stream goes live is present from the first render, fully populated:
- Categories, tags, the browse grid, sponsor/brand catalogue, prop catalogue
- Leaderboards (`kicks.gifted` lifetime/month/week), follower counts, subscriber counts
- Channel metadata, past-VOD lists, the streamer's existing overlays
- The dare/interaction pool — seed it deep (the crowd generator already seeds ~300) so every
  action has real stakes and nothing waits on data to accumulate

**Live / behavioural — stream it in over time as you watch.** Anything that happens *during* the
stream accrues on a clock, so the UI visibly moves. Don't dump it all at once; add to it as the
viewer watches:
- Chat messages, follows, subs, gifted kicks, hype/interaction events, prop drops
- Derived meters (hype score, chat velocity, viewer_count drift) tick as their inputs arrive

### Rates scale with the audience

Live volume is a **function of `viewer_count`**, not a fixed loop. A 200-viewer stream trickles;
a 40,000-viewer raid firehoses. Tie every generated stream to the current audience so density
always reads as proportionate:
- **Chat rate ∝ viewers** (with the usual burstiness) — more viewers, faster chat. A tiny
  audience with a wall of chat, or a huge one with a dead chat, both look fake instantly.
- **Follows / subs / gifted kicks** scale the same way, at their own lower base rates.
- **Surges multiply the rate**, they don't just append a few lines — a raid spikes chat *and*
  `viewer_count` together, then decays.

### How it works, roughly
- **Static data** is a function that builds the full seed set once, called at startup — the
  world already exists before the first render.
- **Live data** is a generator on a clock (a scheduled loop / tick) that emits new events over
  time, with its interval driven by the current `viewer_count`. A surge shortens the interval and
  raises `viewer_count` together, then both decay back. Derived meters recompute as events land.
- Don't hand-place a static list of ten messages and call it live — live data has to accrue while
  the viewer watches.

### The rule in one line
Seed the world full at `t=0` (structure), then let it live as it's watched (behaviour, at a rate
the audience size justifies) — everywhere, by default.
