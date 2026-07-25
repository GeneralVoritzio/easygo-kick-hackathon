# kick-timelines pitch deck

Ten slides for the `kick-timelines` prototype. Built to `.claude/KICK-PITCH-DECK-MECHANICS.md`.

```
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc --noEmit, then vite build to dist/
npm run preview    # serve dist/, this is what runs on the day
```

Press `S` for the speaker view. Every slide carries notes that name its speaker.

## Before the pitch

1. **Put the real names in `src/slides/team.ts`.** Only Matt is known from the repo history.
2. **Export the PDF fallback.** Open the preview at `?print-pdf`, print to PDF, commit it.
3. **Test on the room projector.** Check the 24px floor and the green at low brightness.
4. **Rehearse twice, timed, with the running prototype.**

## How it is put together

| Path | What it holds |
|---|---|
| `src/tokens.css` | Copied verbatim from Design System Section 9. Do not edit |
| `src/media.css` | Media colour and the two fonts. Brand Identity Section 3 |
| `src/deck.css` | Layout only. It holds no colour literal |
| `src/components/` | `Slide`, `Stack`, `HeroStat`, `Split`, `Frame`, `Wordmark` |
| `src/backgrounds/` | The Brand Identity Section 8 layer stack, drawn in code |
| `src/mock/` | Mock product elements, and the fixture they run on |
| `src/slides/` | The ten slides |
| `src/anim.css` | Entry keyframes. CSS, so a stall cannot hide a slide |

Fonts and the wordmark come from `assets/`, so the build carries no network call.

## The mock elements

Slides 5 and 6 show mock product elements: a chat peek and a decision card. **These are UI, so they
use the Design System tokens**, not the deck scale. Each one sits in a `Frame` and carries a `MOCK`
tag, so no judge mistakes one for the running build.

Slide 4 is the handoff. **It shows a static frame, and then you switch to the real app.** Never demo
from the deck.

## The story is the fixture

The deck uses the same fixture the prototype seeds, so the slides and the demo agree:
ClutchGoblin, a raid from Ac7ionMan at 01:05, the category change to Slots and Casino at 02:41 that
costs 15.3% of the room, and 5,000 kicks from BigYoshi_AU at 03:29.
