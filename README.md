# HypeProps 🧢⚡ — Kick hackathon monorepo

One Kick-accurate clone, three demos on top of it:

1. **HypeProps** — brands tip 3D props onto a streamer's face-cam; crowd hype extends
   how long the paid placement lives (MediaPipe + Three.js face tracking).
2. **KICK Circles** — the official Easygo Mini Hackathon challenge (1 Aug 2026):
   solution deck at `/solution`, interactive orbit prototype at `/circles`.
3. **Interaction Engine** — response-odds badges that tell a viewer their chance of
   being seen, plus the `/interact` dare roulette, running over a real live Kick embed.

Payments, KYC, and the Kick API are mocked — but every pipeline is structurally real:
Kick-webhook-shaped events, deterministic pure engines, 35 unit tests.

## Quickstart (60 seconds)

```bash
git clone https://github.com/GeneralVoritzio/hypeprops.git
cd hypeprops
npm install
npm run dev
```

1. Open **http://localhost:5173** in **desktop Chrome**.
2. `/stream` opens on a **real live Kick embed** (maxholloway by default) with the
   interaction layer running: watch the roulette card in chat, type `/interact <dare>`,
   press `r` to spin.
3. For the face-props demo: open the director panel (`` ` ``) → FEED → **🎥 webcam +
   props**, allow the camera, then press `1` — a sponsored cap lands on your head.
   Let the timer run red, press `s`, watch the crowd rescue it.

## The five routes

| Route | What it is |
|---|---|
| `/stream` | The demo stage: live Kick embed (or webcam + 3D props), simulated chat crowd, sponsor lower-third + countdown, interaction stats strip, roulette card in chat |
| `/browse` | Directory grid — the Interaction Engine's discovery surface, badges injected per channel (HypeKing's measured live) |
| `/brand` | HypeProps brand console: mock KYC → design a prop → price it → ⚡ tip it into the stream |
| `/solution` | KICK Circles 2-minute solution deck (8 slides, ← → keys) |
| `/circles` | KICK Circles prototype: orbit map — click a Circle, its live streams fan out; click one to drop into `/stream` |

State is in-memory; use in-app links between routes — a hard reload resets the world.

## Controls (on `/stream`)

| Key | Action |
|---|---|
| `` ` `` | Toggle the director panel |
| `1` / `2` / `3` | Fire a sponsor tip (VOLT cap / Nova shades / BYTE cap) |
| `s` | ⚡ Hype surge — instant +15s plus a crowd frenzy |
| `c` | 💬 Chat spike |
| `r` | 🎰 Spin the interaction roulette now |
| `i`/`k` · `j`/`l` | Fit the live prop: up/down · back/forward |
| `u`/`o` · `-`/`=` | Fit the live prop: tilt · size |

Chat input accepts `!sponsor volt` / `!sponsor nova` / `!sponsor byte` and
`/interact <dare>` (one live roulette entry per person; resubmitting replaces it).
The director panel also has: **FEED** toggle (📡 live Kick embed, any channel slug ·
🎥 webcam + face props), 🎙 transcript on/off, sim-reads on/off, and roulette round length.

## Interaction Engine

An extension-style layer that tells a viewer their odds of being seen — and gives
them a way to shorten them. All chat flows through a **Kick-webhook-shaped ingest
boundary** (`chat.message.sent` payload), so the engine ports to real Kick without
a rewrite. Full build spec: `docs/INTERACTION_ENGINE_SPEC.md`.

- **Response odds** — acknowledged/total over a rolling 10-min window, always "1 in N".
  Median latency, attention spread (Gini), and first-timer share drive three
  positive-only badges (Responsive · Reads everything · New-chatter friendly); chat
  that's too fast to track shows a stated reason instead of a bad score. Stats strip
  under the player includes your session receipt ("N of M messages acknowledged tonight").
- **Acknowledgement sources** — 🎙 live streamer-audio transcript (Web Speech API,
  verbatim username match in a rolling 60s window), hover-✓ on any chat row
  (deterministic stage fallback), and roulette outcomes.
- **Dare roulette** — the Drops-style card pinned in chat: ~300-entry pool, ambient
  spinning reel, pity-timer odds (`1 + 0.5 × rounds_waited`), moderation on arrival
  (the wheel is built from survivors), accept/decline (declining is free — engagement
  is the metric), submitter verification, KICKBot narration in chat.

## HypeProps: fit the props to YOUR face

Anchor offsets are tuned for one head. In webcam mode with a prop live, use the fit
keys until it sits right — every nudge logs a paste-ready line to the console like:

```
[tune cap] anchor: { position: [0, 6.8, -3.0], rotation: [-0.12, 0, 0], scale: 1.08 },
```

Paste it over the matching `anchor:` in `src/data/catalog.ts` to make it permanent.
Hair sticking out over the cap is physics, not a bug — press `=` to oversize the crown,
same trick every commercial filter uses.

## How it works

```
src/engine/   pure engines, all unit-tested: hype + slot machine (HypeProps),
              ack odds/badges + roulette (Interaction Engine), Zustand stores,
              Kick-webhook-shaped simulated crowd (regulars, first-timers, dares)
src/face/     webcam → MediaPipe FaceLandmarker → transient faceState singleton →
              R3F canvas applying the 4×4 face matrix (63° FOV camera at origin,
              cm units, column-major, no transpose) + invisible skull occluder,
              OR a live player.kick.com iframe when FEED = kick
src/stream/   Kick UI shell, chat (+ roulette card), HUD, stats strip, director panel
src/browse/   directory grid with interaction-badge injection
src/brand/    brand console: picker, skin editor, shared-path 3D preview, library
src/circles/  KICK Circles solution deck + React Flow orbit prototype
docs/         original specs (HypeProps, Interaction Engine) + full Kick API map
```

Per-frame face pose never touches React state; chat events flow through one ingest
boundary shaped like Kick's webhook payload. `npm test` runs the 35-test engine suite.
`AUDIT.md` holds the HypeProps plan audit; `docs/KICK_API_MAP.md` maps every public
Kick endpoint/webhook/scope to these products.

## Demo-day dependencies & troubleshooting

- **Live embed is black** — the embedded channel must actually be live, and the venue
  network must reach kick.com. Fallback: FEED → webcam + props (fully offline).
- **DiceBear avatars missing** — they load from api.dicebear.com; offline they fall
  back to colored circles. Everything else runs without internet.
- **🎙 transcript not acking** — Chrome only, needs mic permission and a quiet-ish
  room; say the username verbatim. Stage fallback: hover any chat row → ✓ ack.
- **Camera issues (webcam mode)** — allow permission, close Zoom/OBS, add light.
  Props hide within ~350ms of losing tracking (intentional — no ghost props).
- **Props misaligned** — don't touch the matrix math (verified against MediaPipe
  source); nudge `anchor` values with the fit keys instead.
