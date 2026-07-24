# HypeProps 🧢⚡

**Brands don't buy flat sponsor reads — they tip 3D props onto a streamer's face-cam,
and the crowd's hype decides how long the ad lives.**

A Kick-style live-stream demo: a verified brand tips a prop (cap, shades) that pins to
the streamer's face in real time via MediaPipe + Three.js. A countdown runs; chat and
like velocity feed a hype score, and sustained hype visibly extends the placement.
Payments, KYC, and the Kick API are mocked — the event pipeline, hype engine, and slot
state machine are real, deterministic, and unit-tested.

## Quickstart (60 seconds)

```bash
git clone https://github.com/GeneralVoritzio/hypeprops.git
cd hypeprops
npm install
npm run dev
```

1. Open **http://localhost:5173** in **desktop Chrome** (GPU face tracking — Safari/iOS is flaky).
2. Allow camera access. Your face appears in the Kick-style stream view.
3. Press **`1`** → a sponsored cap lands on your head with a countdown.
4. Let the timer run red… then press **`s`** → the crowd surges and the countdown
   visibly jumps back up. That's the product.

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
The director panel also has: **FEED** toggle — 📡 live Kick embed (default,
any channel slug) vs 🎥 webcam + face props — plus 🎙 transcript on/off,
sim-reads on/off, and roulette round length.

## Interaction Engine

An extension-style layer that tells a viewer their odds of being seen — and gives
them a way to shorten them. All chat flows through a **Kick-webhook-shaped ingest
boundary** (`chat.message.sent` payload), so the engine ports to real Kick without
a rewrite.

- **Response odds** — acknowledged/total over a rolling 10-min window, always shown
  as "1 in N". Median latency, attention spread (Gini), and first-timer share drive
  three positive-only badges (Responsive · Reads everything · New-chatter friendly);
  chat that's too fast to track shows a stated reason instead of a bad score. The
  stats strip sits under the player; badges are injected on `/browse` tiles and
  sidebar rows — HypeKing's are measured live, with your session receipt
  ("N of M messages acknowledged tonight").
- **Acknowledgement sources** — 🎙 live streamer-audio transcript (Web Speech API,
  verbatim username match in a rolling 60s window), hover-✓ on any chat row
  (deterministic stage fallback), and roulette outcomes.
- **Dare roulette** — the Drops-style card pinned in chat: ~300-entry pool, ambient
  spinning reel, pity-timer odds (`1 + 0.5 × rounds_waited`), moderation on arrival
  (the wheel is built from survivors), accept/decline (declining is free — engagement
  is the metric), submitter verification, and KICKBot narrating the loop in chat.
- Engine math is pure and unit-tested (35 tests): `src/engine/ack.ts`,
  `src/engine/roulette.ts`.

## Fit the props to YOUR face

Anchor offsets are tuned for one head — yours is different. With a prop live, use the
fit keys above until it sits right. Every nudge logs a paste-ready line to the browser
console like:

```
[tune cap] anchor: { position: [0, 6.8, -3.0], rotation: [-0.12, 0, 0], scale: 1.08 },
```

Paste it over the matching `anchor:` in `src/data/catalog.ts` to make it permanent.
Fit tuning is in-memory only until you do.

**Hair sticking out over the cap?** That's physics, not a bug — video pixels can't be
occluded away, so like every commercial filter we oversize the crown to swallow hair.
Press `=` a couple of times if yours still escapes.

## The two routes

- **`/stream`** — the demo stage. Kick-dark layout, webcam + live 3D prop overlay,
  simulated chat crowd, hype meter, "Sponsored ✓ Verified" lower-third, countdown,
  queued-sponsor "live auction" badge.
- **`/brand`** — the brand console. Mock-KYC sign-in → pick a base prop → skin it
  (color, logo, matte/gloss/metallic) → price it → save → **⚡ Tip into stream**.
  The 3D preview and the live overlay share one render path: what you design is
  exactly what airs. Use the in-app links to switch routes — state is in-memory,
  a hard reload resets the world.

## Suggested 90-second pitch

1. `/stream` — tilt your head: the prop tracking is real (MediaPipe facial
   transformation matrix → Three.js, with a depth-only head occluder so props wrap
   *around* your skull instead of drawing over it).
2. `1` — a $2,000 VOLT tip lands. Lower-third, countdown, chat reacts.
3. Wait for the red pulsing "expiring" state… `s` — the surge rescues it. Timer jumps.
4. `2` mid-slot — second sponsor queues up: that's the auction pressure.
5. `/brand` — design a prop live in 20 seconds, save, tip it in, watch it land on
   your face. "The payment is faked; the system is not."

## How it works

```
src/engine/   pure hype math + slot state machine (16 unit tests) + Zustand store
              + Kick-webhook-shaped mock event generators
src/face/     webcam → MediaPipe FaceLandmarker → transient faceState singleton →
              R3F canvas applying the 4×4 face matrix (63° FOV camera at origin,
              cm units, column-major, no transpose) + invisible skull occluder
src/stream/   Kick UI shell, chat, HUD, director panel
src/brand/    brand console: picker, skin editor, shared-path 3D preview, library
```

Per-frame face pose never touches React state — it flows through a mutable module
singleton straight into the render loop; React only sees discrete state at ≤10Hz.
`npm test` runs the engine suite. `AUDIT.md` has the full spec audit and the
reasoning behind every technical decision.

## Troubleshooting

- **Black stage / "camera unavailable"** — allow camera permission, then reload.
  Close other apps holding the webcam (Zoom, OBS).
- **No prop on your face** — it only renders while a face is detected: face the
  camera, add light. The prop hides within ~350ms of losing tracking (that's
  intentional — no ghost props).
- **Props misaligned** — don't touch the matrix math (it's verified); nudge the
  `anchor` values with the fit keys instead.
- **Sluggish tracking** — use Chrome; the GPU delegate falls back to CPU on some
  browsers and it shows.
