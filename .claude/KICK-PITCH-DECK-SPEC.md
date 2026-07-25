# KICK Pitch Deck Spec

How we build the pitch deck. Goal: the deck looks like KICK made it, and it never gets in the way of the live demo.

---

## 0. Scope and status

**This spec applies only to files in `pitch/`.** No other folder uses it. Code in `prototypes/`, `demo/` and `docs/` follows the Design Spec and the Working Agreement alone.

### Which file governs what

The deck is **media**, not interface. Three files stack on it.

| File | What it decides here |
|---|---|
| `.claude/KICK-BRAND-IDENTITY.md` | **The look.** Colour, display type, voice, motion feel, backgrounds, graphic devices, footage |
| `.claude/KICK-DESIGN-SPEC.md` | The token base, and every rule for **product UI shown on a slide** |
| **This file** | Deck mechanics only. Reveal, slide layout, the deck type scale, the run sheet |

**This file does not restate the brand rules.** If you want to know what the deck looks like, read the Brand Identity file. If you want to know how the deck is built, read this one. A rule written twice goes stale in one place first.

Confidence tags carry the same meaning as Brand Identity §0.

**Open item.** We have no copy of a real KICK deck template. The [brand toolkit](https://about.kick.com/brand) sits behind a Brandfolder portal (Design Spec §0). Do not present our derived values to the judges as KICK's own.

---

## 1. The deck is not the product

Hackathon Spec §2 rules out "concept pitches, mockups, slideware" as the submission. Presentation and Demo is worth 10% (Hackathon Spec §4). The live build carries the other 90%.

Three rules follow:

1. **The live build is the centre of the pitch.** The deck opens it and closes it. The deck does not narrate it.
2. **Never demo from a screenshot.** If a slide shows the product, it shows the running product.
3. **The deck must survive being cut.** If we run out of time, we drop slides, not demo time.

The deck carries the 90-second story in Hackathon Spec §8: who it is for, the moment it hurts, the fix, the proof.

---

## 2. Stack

| Layer | Choice | Package | Licence |
|---|---|---|---|
| Build | Vite | `vite` | MIT ✅ |
| UI | React 19 + TypeScript | `react`, `react-dom` | MIT ✅ |
| Deck engine | Reveal.js | `reveal.js` | MIT ✅ |
| Motion | Motion One | `motion` | MIT ✅ |
| Icons | Lucide | `lucide-react` | ISC ✅ |
| Type | Inter + Archivo, self hosted | local files | OFL ✅ |

Every licence above is permissive. This satisfies Spec Test B3 (Hackathon Spec §7): each dependency is licensable onward to KICK under clause 7(f).

**Do not add a dependency to the deck without checking its licence first.** A restrictive licence on a slide library is a rules problem, not a taste problem.

**No CSS framework in `pitch/`.** The deck uses plain CSS with the Design Spec §9 tokens. Tailwind is used in `prototypes/`, not here. A deck has about ten layouts, so a utility framework adds weight and no speed.

---

## 3. Project layout

```
pitch/
  index.html
  package.json
  vite.config.ts
  src/
    main.tsx
    Deck.tsx
    tokens.css
    deck.css
    slides/
      Hook.tsx
      Problem.tsx
      Fix.tsx
      Demo.tsx
      HowItWorks.tsx
      Team.tsx
      Close.tsx
    components/
      Slide.tsx
      Eyebrow.tsx
      HeroStat.tsx
      Split.tsx
      DemoFrame.tsx
      LiveBadge.tsx
      SpeakerNotes.tsx
      CropMarks.tsx
      Sticker.tsx
      CamcorderHud.tsx
    backgrounds/
      Glow.tsx
      Grid.tsx
      Grain.tsx
      Macroblock.tsx
      ChromaSplit.tsx
      ScanBar.tsx
    motion/
      presets.ts
      useSlideMotion.ts
    assets/
```

`tokens.css` is the Design Spec §9 block, copied verbatim, plus the deck additions in §5 below. Do not edit the copied values. If a token is wrong, fix it in the Design Spec first.

---

## 4. Reveal.js rules

### Configuration 🔧

```ts
Reveal.initialize({
  width: 1920,
  height: 1080,
  margin: 0,
  minScale: 0.2,
  maxScale: 1.5,
  controls: false,
  progress: true,
  hash: true,
  keyboard: true,
  overview: true,
  transition: 'none',
})
```

**The deck cuts. It does not dissolve.** The film uses hard cuts from end to end. A fade reads as corporate and it costs the presenter time. 🟡

The deck is designed at 1920x1080 and scales to the room projector. `margin: 0` keeps the layout predictable. The `Slide` component owns the gutter instead (§5).

Reveal handles the slide change. Motion One handles everything inside a slide (§7). Do not use Reveal fragments for motion. Fragments and Motion One both animate the same element and they fight.

### React and Reveal must not fight for the DOM

Reveal mutates the deck: it adds classes, moves sections and clones nodes for backgrounds. React owns the content of a slide. Reveal owns the deck shell.

- Initialise Reveal once, in a `useEffect` with an empty dependency array, after React mounts the slides.
- Keep the slide list **static**. Never add, remove or reorder `<section>` elements after `initialize` runs.
- Keep React state inside a slide, below the `<section>`.
- Call `Reveal.destroy()` in the effect cleanup so hot reload does not stack two instances.

### Speaker notes

Every slide carries an `<aside class="notes">` block. Load the `RevealNotes` plugin so the speaker view works. Each note starts with the name of the person who speaks that slide. Hackathon Spec §4 scores "evidence of a contribution from every team member", and §8 asks that every member speaks.

---

## 5. Theme

### Tokens

Use the Design Spec §9 tokens verbatim. Add these deck tokens on top. They are 🔧 derived.

```css
:root{
  --deck-gutter:96px;
  --deck-max-measure:24ch;

  --d-hero:160px;   --d-hero-lh:160px;
  --d-h1:96px;      --d-h1-lh:96px;
  --d-h2:60px;      --d-h2-lh:60px;
  --d-h3:40px;      --d-h3-lh:48px;
  --d-body:30px;    --d-body-lh:44px;
  --d-caption:24px; --d-caption-lh:34px;
  --d-label:24px;   --d-label-lh:28px;

  --sticker:#E4032E;
}
```

| Token | Weight / tracking | Use |
|---|---|---|
| `--d-hero` | 800, `normal`, `--font-display`, uppercase | One number or two words. One per slide, maximum |
| `--d-h1` | 800, `normal`, `--font-display`, uppercase | Slide title |
| `--d-h2` | 700, `normal`, `--font-display`, uppercase | Section title |
| `--d-h3` | 600, `-0.01em`, `--font-ui` | Card title |
| `--d-body` | 400, `--font-ui` | Body copy |
| `--d-caption` | 500, `--font-ui`, `--text-muted` | Captions, sources |
| `--d-label` | 700, `0.08em`, uppercase | Eyebrow labels, badges |

**The three display rows carry leading of exactly 1.0 and tracking of `normal`.** That is measured on KICK's own headings ✅ (Brand Identity §4). It replaces the Design Spec §2 rule that tightens tracking as size grows, which governs UI type.

**Nothing on a slide goes below 24px at 1920 width.** A projector at the back of a room loses everything smaller.

`--sticker` is the one non-green accent in the deck, used once, on the wow beat.

### Colour, display type and devices

**Brand Identity §3, §4 and §5 decide all of it.** The flood rule, the green to cyan gradient, ALL CAPS display at leading 1.0, corner brackets, stickers, marquees and the camcorder HUD are defined there, once.

Two deck-specific limits sit on top:

- **The deck gets two flood slides: the hook and the close.** That is the Brand Identity §3 ration, applied to a ten slide deck.
- **Product UI on a slide keeps the Design Spec §1 green budget.** A screenshot of our overlay is interface, wherever it sits.

The deck implements the devices as React components: `CropMarks`, `Sticker`, `CamcorderHud`.

### The Slide component

Every slide renders through `components/Slide.tsx`. The component supplies:

- `padding: var(--deck-gutter)` on all four sides
- a background slot (§6)
- a content grid
- the `data-anim` hooks that Motion One reads (§7)

No slide sets its own padding. If a layout needs different spacing, add a variant to `Slide`.

---

## 6. Backgrounds

**The layer stack is Brand Identity §8.** Build every slide background from it, and keep to its rule of one loud layer per surface.

Two deck-specific limits sit on top:

1. **No network at runtime.** Every asset is local and committed. The venue wifi is not a dependency (Hackathon Spec §2A.3).
2. **One loud background in three slides, maximum.** A deck where every slide shouts reads as noise.

`backgrounds/` holds one component per layer, so a slide composes them rather than writing CSS.

---

## 7. Motion

Motion One drives every animation inside a slide. Reveal drives the change between slides.

**The motion feel is Brand Identity §6**, including the measured KICK curves and the flash safety floor.

### Tokens

Use the Design Spec §6 motion tokens for UI, and the media curve for slide entry.

| Token | Value | Use in the deck |
|---|---|---|
| `--fast` | `120ms` | Hover and colour |
| `--base` | `200ms` | Element entry |
| `--slow` | `400ms` | The hero number, the wow beat |
| `--ease-media` | `cubic-bezier(.87,0,.13,1)` ✅ | Slide entry. Measured on about.kick.com |

### Presets

`motion/presets.ts` holds every animation the deck uses. A slide imports a preset. A slide never writes its own keyframes.

Starting set 🔧:

| Preset | Effect |
|---|---|
| `hardCut` | No animation. The element is there on frame one. **This is the default** |
| `riseIn` | `y: 24 -> 0`, `opacity: 0 -> 1`, `--base` |
| `glitchIn` 🟡 | 90ms of chroma split and a 6px horizontal offset, then it settles |
| `bracketSnap` 🟡 | Corner marks in from `scale: 1.15`, `--fast` |
| `stickerPop` 🟡 | `rotate: -6deg`, scale overshoot, `--slow`. The sticker only |
| `countUp` | Number tween to the target, tabular figures, `--slow` |
| `slamIn` | `scale: .82 -> 1` with overshoot, `--slow`. The wow beat only |
| `glowPulse` | Ambient background drift, per §6 |

`wipeIn` is gone. It is smooth and it has no basis in the film.

### How a slide animates

`useSlideMotion` runs on the Reveal `ready` and `slidechanged` events. It finds `[data-anim]` inside the current slide, then it animates them with a stagger of 40ms 🔧.

```tsx
<h1 data-anim="riseIn">Chat already told you</h1>
<p data-anim="riseIn">It just could not tell you fast enough.</p>
```

Rules:

- Animate on enter. Do not animate on exit. Exit animation adds delay the presenter feels.
- Total entry time per slide stays under 600ms. The presenter speaks over it, so it must finish first.
- Respect `prefers-reduced-motion`. The Design Spec §9 block already disables transitions. `useSlideMotion` must also skip the animation and set the final state.

---

## 8. Images and assets

### Licence gate

**Brand Identity §7 holds the licence gate and the imagery rules.** Every asset on a slide must pass it.

`prototypes/hypeprops/src/assets` already holds `kick-logo.svg`. `prototypes/hypeprops/src/assets/fonts` holds `kick-font.ttf` with `kick-font-license.txt` next to it. Reuse those files. Copy the licence file with the font.

### Device components

The Brand Identity §5 devices become React components in the deck.

| Component | What it draws | Where it goes |
|---|---|---|
| `CropMarks` | Corner brackets | `DemoFrame` and the hero moment |
| `Sticker` | Diamond badge, flat fill, icon and caps label | The wow slide, once |
| `CamcorderHud` | REC dot, running timecode, menu labels along the bottom edge | The demo slide |

`CamcorderHud` says "this is a real capture" for free. It is the cheapest way to make the demo slide look shot, not rendered.

### Formats

| Content | Format |
|---|---|
| Marks, icons, diagrams | SVG |
| Product screenshots | WebP, 2x the slot size |
| Product recordings | MP4 or WebM, muted, looped, under 8 seconds |
| Fonts | WOFF2, self hosted, subset to Latin |

**No audio from the deck.** The pitch has a speaker. A slide that talks over them costs points.

### The demo frame

`DemoFrame` is the component that holds the live build on a slide. It gives the product a 1px `--border`, radius `--r-lg` and `--shadow-lg`, on a `--bg-base` field. It never scales the product below 1:1 readable size. If the product does not fit, cut the slide and switch to the real app.

---

## 9. Content rules

- **One idea per slide.** If a slide needs a comma to explain itself, it is two slides.
- **25 words per slide, maximum.** The presenter carries the detail. The slide carries the point.
- **8 to 10 slides.** The story in Hackathon Spec §8 fits in that. More slides eat demo time.
- **All copy is ASD-STE100 Simplified Technical English**, per the Working Agreement. Active voice, present tense, one topic per sentence.
- **No em dashes.** Use a comma, a colon, a full stop or brackets.
- **Mock data on a slide follows the API Conventions Part 3.** Real names, funny handles, real chat energy. Never a placeholder. A judge reads the slide as closely as the fixture.
- **Say the mock-data line out loud.** Hackathon Spec §2A.2 point 3 asks for it: same interface, live client behind it, deterministic fixture so the raid lands on cue. Put it on the "how it works" slide.
- **Name the roles.** One slide lists every team member and what they built (Hackathon Spec §4, §8).

### Voice

**Brand Identity §2 holds the voice rules**, including the banned enterprise words.

One deck-specific rule: **the close slide carries a three-word imperative triad.** Three verbs, three full stops, in the shape of "Find it. Share it. Own it." Write our own. Do not reuse KICK's.

### Slide sequence 🔧

| # | Slide | Job |
|---|---|---|
| 0 | Cold open | Near black. One line. It cuts hard into the hook (film 0.0s to 0.9s) |
| 1 | Hook | Flood frame. The title stacked in caps, inside crop marks |
| 2 | Problem | The named user, and the moment it hurts |
| 3 | Fix | Our answer in one sentence |
| 4 | Demo | Hand off to the live build. Full bleed, LIVE badge, `CamcorderHud` |
| 5 | Wow | The marker for the one beat we trigger live. The sticker lives here |
| 6 | How it works | Adapter layer, mock data, the API surface we use |
| 7 | KICK-native | Why it belongs on KICK and not somewhere else |
| 8 | Team | Every member, and what they shipped |
| 9 | Close | Flood frame. The wordmark, the triad, and the ask |

---

## 10. Delivery

The deck runs in a room we do not control. Plan for that.

- **It runs offline.** Build it, then serve the `dist` folder locally. No CDN, no font service, no network call at runtime.
- **Keep a PDF fallback.** Export with the Reveal `?print-pdf` query and commit the PDF before the pitch. If the laptop fails, the PDF opens on any machine.
- **Test on the room projector, or on the nearest thing to it.** Check the 24px floor and the green at low brightness.
- **Rehearse twice, timed, with the real build** (Hackathon Spec §8).
- **Packaging is part of the run sheet.** Clause 3(h) needs the submission emailed, then every local copy deleted. Do not let this eat demo prep.

---

## 11. Accessibility and safety floor

Design Spec §8 and Brand Identity §9 both apply. A projected deck adds one rule:

- **Test the contrast at projector brightness.** A room projector loses more contrast than any laptop screen. Check the 24px floor and the green at low brightness before the pitch.

---

## 12. Definition of done

Run this before the deck ships.

- [ ] The deck passes the "is this KICK" test in Brand Identity §10
- [ ] Every file in `pitch/` uses the Design Spec §9 tokens, plus the deck tokens in §5
- [ ] Product UI on a slide keeps green under 10% of visible pixels
- [ ] The deck has exactly two flood frames: the hook and the close
- [ ] `--sticker` appears once in the whole deck
- [ ] Crop marks wrap the demo and the hero moment, and nothing else
- [ ] Reveal runs `transition: 'none'`. No slide dissolves
- [ ] No slide stacks two loud background layers
- [ ] No banned enterprise word appears on a slide
- [ ] Nothing renders below 24px at 1920 width
- [ ] Every slide has an `<aside class="notes">` block that names its speaker
- [ ] Every team member appears on the team slide and speaks at least once
- [ ] Copy is Simplified Technical English, 25 words per slide or fewer, no em dashes
- [ ] Every asset is local, committed, and licensable onward to KICK
- [ ] Every mock value on a slide is a real-looking name, message or number
- [ ] The deck runs with the network off
- [ ] The PDF fallback is exported and committed
- [ ] `prefers-reduced-motion` stops all motion, and the slides still read
- [ ] Nothing flashes more than three times per second, glitch layers included
- [ ] The demo slide shows the running product, not a screenshot

---

*Written 25 July 2026. Revised 25 July 2026: the brand rules moved out to `.claude/KICK-BRAND-IDENTITY.md`, and this file kept the deck mechanics. Values tagged 🔧 are our construction, not KICK's.*
