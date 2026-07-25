# Kick Recap

A permanent widget on the Kick video player. Tap it and it opens a small stack of option bubbles: Recap, Highlights, and Share. Recap is the main feature: a short, stories-style catch-up for a viewer who just joined a stream already in progress.

This is a standalone prototype. It does not share code with `prototypes/hypeprops`, `prototypes/kick-mobile-app`, or `prototypes/kick-battles`. It runs on its own port.

## Requirements

Node 20 or newer. This project uses Vite 8, which needs Node 20 at minimum.

```bash
node --version
```

## Quickstart

```bash
cd prototypes/kick-recap
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5182`). The page is a real Kick channel embed filling the screen, with the widget floating on the right edge, same as it would sit on a real stream page.

## The widget

A small circle sits at the middle of the right edge, clear of the native player's live badge (top) and its own controls (bottom). Tap it and three option bubbles fan out above it:

- **Recap** — opens the stories-style catch-up (below).
- **Highlights** — the detected engagement spikes as a plain list. Tap one to jump into the recap at that exact moment.
- **Share** — copies the page link to your clipboard. The only one of the three that is a real action rather than a demo of one.

## How the recap is built

There is no seekable VOD here, only a live Kick embed, so a recap can't actually jump to old video frames. What it can do: build a short sequence of cards from a synthetic **engagement timeline** (`src/shared/mock/mockData.ts`), the kind of aggregate signal a real chat-rate or viewer-delta feed could plausibly produce (never per-viewer data, per the hackathon's API-boundary rule).

`src/recap.ts` holds the actual logic, kept separate from the UI:

1. **`detectHighlights`**: walks the engagement timeline and flags local peaks that clear their trailing baseline by 1.6x. Spikes within 90 seconds of each other are merged, keeping the stronger one. The top 5 remaining spikes, by size, become highlights.
2. **`buildRecap`**: assembles the card sequence. First card: the stream's opening seconds. One card per detected highlight, in order. Last card: the seconds right before the viewer joined. Highlights that fall inside the opening or closing window are dropped, so cards never overlap.

Since we only know engagement jumped, not why, highlight captions stay generic ("Engagement spiked here") rather than inventing a specific cause (a sub train, a raid) we have no real signal for.

`RecapView` plays the sequence stories-style: a progress bar per card, auto-advance on a timer, tap left or right to go back or forward, close to return to the live view.

## Design tokens

Colors and radius follow `.claude/KICK-DESIGN-SPEC.md` §9 in the repo root. Icons use `lucide-react`, per §5. This is a viewer-facing UI feature, not an OBS overlay, so the §7 overlay-specific rules (transparent canvas, 64px safe margins) do not apply here — general product-UI rules do.

## File layout

```
src/
  App.tsx              the demo page: full-screen Kick embed + the widget
  StreamSurface.tsx      the real Kick iframe embed
  RecapWidget.tsx         the persistent button + bubble menu, owns which panel is open
  RecapView.tsx           the stories-style recap playback
  HighlightsPanel.tsx     the plain list of detected highlights
  SharePanel.tsx          copy-link panel
  recap.ts                pure logic: detectHighlights, buildRecap, formatElapsed
  shared/                 types, mock stream session generator
```

## Known gaps

- The mock engagement timeline layers a few deliberate bumps onto a random walk, so a demo run reliably has something to detect. Verified over 20 simulated runs: an average of ~3 highlights per run, no runs with zero. Real engagement would just be the random walk, since real spikes aren't scripted.
- One mock stream (`maxholloway`, the same default channel `prototypes/hypeprops` uses). If it is not live, Kick's own player shows its real offline card.
- The session is generated fresh on every page load: "viewer joined" is always "just now," relative to a stream that has been running for 48 mock minutes.
