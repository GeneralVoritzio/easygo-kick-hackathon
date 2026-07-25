# Kick Battles

An OBS browser-source overlay for a multi-streamer Kick battle. It shows a segmented versus bar, a countdown, and flying contribution labels (tips, subs, follows, chat bursts).

This is a standalone prototype. It does not share code with `prototypes/hypeprops` or `prototypes/kick-mobile-app`. It runs on its own port.

## Requirements

Node 20 or newer. This project uses Vite 8, which needs Node 20 at minimum.

Check your Node version first:

```bash
node --version
```

## Quickstart

```bash
cd prototypes/kick-battles
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5181`). The canvas is transparent by default, so an empty browser tab shows plain white or your OS background, not black. That is correct: add `?bg=1` to the URL to see it over a placeholder backdrop instead, for example `http://localhost:5181/?bg=1`.

## What it shows

- A **segmented bar**. Each segment is a side (a solo streamer or a team whose scores are summed). Segment color tracks current standing: gold for first, silver for second, bronze for third, gunmetal for fourth and below. Colors update live as the lead changes.
- A **countdown** to the end of the battle. It speeds up its own pulse in the final minute.
- **Flying contribution labels**. Each tip, sub, follow, or chat burst flies in above the bar, lands on its side's segment, and fades out.
- **Match-state visuals**: a green pulse when the top two sides are close, an amber glow on a blowout, a shake-and-flash on a rapid comeback, and a faster pulse in the final minute.

The mock battle runs three sides: two 2-streamer teams and one solo streamer, so all three bar shapes (duel, team score aggregation, 3-way) show up in one run.

## Preview modes (`?bg=`)

The real overlay has a transparent background, by design: OBS composites it over the actual stream. To preview it against something else while working on it:

- `?bg=1`: a placeholder dark backdrop with a grid pattern.
- `?bg=<kick-channel-slug>`: a real, currently-live Kick channel, embedded with Kick's own player. If that channel is not live, Kick's own player shows its real offline card.

Neither preview mode affects the real overlay unless you add the query param yourself.

## Backend: mock by default

There is no real backend yet, so `.env` sets `VITE_USE_MOCK=true`. The battle state, its score ticks, and each contribution event are all generated locally (see `src/shared/mock/mockData.ts`).

The data flow is already shaped for a real backend: `useBattle` (`src/shared/hooks/useBattle.ts`) reads a `battle_update` / `contribution_event` WebSocket envelope (`WsMessage` in `src/shared/types/index.ts`) and reconnects with backoff on drop. Point `VITE_WS_URL` at a real endpoint and set `VITE_USE_MOCK=false` (or add `?mock=0` to the URL) to switch over, once one exists.

`.env.example` documents both variables. `.env` itself is gitignored.

## Design tokens

Colors, radius, and the LIVE badge follow `.claude/KICK-DESIGN-SPEC.md` §9 in the repo root. The overlay-specific rules in §7 apply directly here:

- Transparent background, never a full-bleed backdrop (`index.html`'s inline style).
- 64px safe margin from every edge (`p-16` on the overlay's wrapper elements).
- Text sits on a semi-opaque plate (`bg-page/70` + `backdrop-blur-sm`) so it stays readable over arbitrary video.
- No audio from the overlay itself.

## File layout

```
src/
  App.tsx                the entry component, renders BattleOverlay
  BattleOverlay.tsx       top-level layout: countdown, bar, starting/waiting states
  BattleBar.tsx            the segmented versus bar
  ContributionLabel.tsx    one flying tip/sub/follow/chat-burst label
  palette.ts               gold/silver/bronze/gunmetal gradients by standing
  useScoreHistory.ts       rolling score-share history, for the ghost marker and comeback detection
  useBattleFlags.ts        derives close/blowout/comeback/leader state from the battle + history
  PreviewBackground.tsx    ?bg=1 / ?bg=<channel> preview backdrop, dev only
  shared/                  types, mock data, useBattle, useMockMode, Countdown
```

## Known gaps

- No real backend. Everything is mock data over a WebSocket-shaped interface that has nowhere real to connect yet.
- The battle roster (three sides, five streamer names) is fixed in `src/shared/mock/mockData.ts`. Edit `TOURNAMENT_ENTRANTS` there for a different lineup.
