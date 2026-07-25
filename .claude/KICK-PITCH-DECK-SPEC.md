# KICK Pitch Deck Spec

How we build the pitch deck. Goal: the deck looks like KICK made it, and it never gets in the way of the live demo.

---

## 0. Scope and status

**This spec applies only to files in `pitch/`.** No other folder uses it. Code in `prototypes/`, `demo/` and `docs/` follows the Design Spec and the Working Agreement alone.

Inside `pitch/`, this spec **adds to** the Design Spec. It does not replace it. Every rule in `.claude/KICK-DESIGN-SPEC.md` still applies, in particular the tokens in §9 and the green budget in §1.

**Confidence tags carry the same meaning as the Design Spec §0:**

| Tag | Meaning |
|---|---|
| ✅ **Verified** | Confirmed from a source we can point at |
| 🟡 **High confidence** | Consistent with KICK's public output, but not confirmed from source |
| 🔧 **Derived** | Our construction. Coherent and KICK-like, but invented |

**Open item.** We have no copy of a real KICK deck template. The [brand toolkit](https://about.kick.com/brand) sits behind a Brandfolder portal (Design Spec §0). Every "KICK presentation look" rule below is 🔧 **derived** from the Design Spec and from KICK's brand voice. Do not present these values to the judges as KICK's own.

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
    backgrounds/
      Glow.tsx
      Grid.tsx
      Grain.tsx
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
  transition: 'fade',
  transitionSpeed: 'fast',
})
```

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

  --d-hero:160px;   --d-hero-lh:148px;
  --d-h1:96px;      --d-h1-lh:100px;
  --d-h2:60px;      --d-h2-lh:68px;
  --d-h3:40px;      --d-h3-lh:48px;
  --d-body:30px;    --d-body-lh:44px;
  --d-caption:24px; --d-caption-lh:34px;
  --d-label:24px;   --d-label-lh:28px;
}
```

| Token | Weight / tracking | Use |
|---|---|---|
| `--d-hero` | 800, `-0.04em`, `--font-display` | One number or two words. One per slide, maximum |
| `--d-h1` | 800, `-0.03em`, `--font-display` | Slide title |
| `--d-h2` | 700, `-0.02em`, `--font-display` | Section title |
| `--d-h3` | 600, `-0.01em`, `--font-ui` | Card title |
| `--d-body` | 400, `--font-ui` | Body copy |
| `--d-caption` | 500, `--font-ui`, `--text-muted` | Captions, sources |
| `--d-label` | 700, `0.08em`, uppercase | Eyebrow labels, badges |

**Nothing on a slide goes below 24px at 1920 width.** A projector at the back of a room loses everything smaller.

The Design Spec §2 tracking rule still applies: as the size goes up, the tracking goes down.

### Colour on a slide

- The base surface is `--bg-base`. Panels use `--bg-surface`.
- The green budget is **under 10% of visible pixels, measured across the whole deck** (Design Spec §1). Not per slide. One green hero number on one slide costs the whole budget for the three slides around it.
- Use `--live` only for real live state, for example the LIVE badge on the demo slide.
- Never put `--kick-green` on a light surface, and never use it for body copy.

### The Slide component

Every slide renders through `components/Slide.tsx`. The component supplies:

- `padding: var(--deck-gutter)` on all four sides
- a background slot (§6)
- a content grid
- the `data-anim` hooks that Motion One reads (§7)

No slide sets its own padding. If a layout needs different spacing, add a variant to `Slide`.

---

## 6. Backgrounds

Backgrounds are what make the deck look like KICK and not like a corporate template. They are also the fastest way to make text unreadable. 🔧

### Hard rules

1. **Backgrounds are code, not image files.** CSS gradients, SVG and canvas. This keeps the deck small, sharp at any scale and free of licence risk.
2. **No network at runtime.** Every asset is local and committed. The venue wifi is not a dependency (Hackathon Spec §2A.3).
3. **The background never competes with the text.** Behind copy, the background contrast stays low. If you cannot read the slide with your eyes half closed, the background is too loud.
4. **One loud background in three slides, maximum.** A deck where every slide shouts reads as noise.
5. **Text over any busy background needs a carrier.** Use a plate at `rgba(11,14,15,.82)` or a shadow of `0 2px 8px rgba(0,0,0,.9)`. This is the Design Spec §7 rule and it applies to slides too.

### The layer stack

Build every background from this order. Use two layers or three, never all five.

| Order | Layer | Spec |
|---|---|---|
| 1 | Base | `--bg-base` flat fill. Always present |
| 2 | Glow | Radial gradient from `--kick-green-glow` to transparent. Off centre, 60% to 90% of the slide width |
| 3 | Grid | 1px lines in `--border` at 64px pitch, masked so it fades at the edges |
| 4 | Grain | SVG `feTurbulence` at 4% to 6% opacity. It stops large gradients from banding on a projector |
| 5 | Vignette | Radial `rgba(0,0,0,.45)` at the corners. Use it to hold attention on a centred hero |

### Ambient motion

One slow ambient loop is permitted per slide, for example a glow that drifts. It follows three limits:

- period of 8 seconds or more
- opacity change of 0.06 or less
- it stops under `prefers-reduced-motion`

**No strobe and no flash.** Nothing on the deck changes luminance more than three times per second. This is a safety floor, not a style preference.

---

## 7. Motion

Motion One drives every animation inside a slide. Reveal drives the change between slides.

### Tokens

Use the Design Spec §6 motion tokens. Do not invent new durations.

| Token | Value | Use in the deck |
|---|---|---|
| `--ease` | `cubic-bezier(.2,.8,.2,1)` | Default |
| `--fast` | `120ms` | Hover and colour |
| `--base` | `200ms` | Element entry |
| `--slow` | `400ms` | The hero number, the wow beat |

KICK's brand voice is "chaotically creative" ✅. Motion is snappy and it overshoots a little. It is not smooth and corporate. Use a spring with a small overshoot on hero numbers and on the wow beat. Use a plain ease everywhere else.

### Presets

`motion/presets.ts` holds every animation the deck uses. A slide imports a preset. A slide never writes its own keyframes.

Starting set 🔧:

| Preset | Effect |
|---|---|
| `riseIn` | `y: 24 -> 0`, `opacity: 0 -> 1`, `--base` |
| `wipeIn` | `clipPath` inset from the left, `--base` |
| `countUp` | Number tween to the target, tabular figures, `--slow` |
| `slamIn` | `scale: .82 -> 1` with overshoot, `--slow`. The wow beat only |
| `glowPulse` | Ambient background drift, per §6 |

### How a slide animates

`useSlideMotion` runs on the Reveal `ready` and `slidechanged` events. It finds `[data-anim]` inside the current slide, then it animates them with a stagger of 60ms 🔧.

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

Hackathon Spec §5.2 and clause 7(f) put licensing on us. Every asset must be licensable onward to KICK.

| ✅ Use | ❌ Do not use |
|---|---|
| Our own screenshots and screen recordings of our build | Stock photography without a written licence |
| Backgrounds and diagrams we generate in code | Photographs of real streamers or of real people |
| Lucide icons (ISC) | Game screenshots and game art |
| Inter and Archivo (OFL), self hosted | Screenshots of another product's UI |
| The KICK logo from the official brand toolkit, used to KICK's brand rules | Any font we cannot sublicense |

`prototypes/hypeprops/src/assets` already holds `kick-logo.svg` and a `kick-font.ttf` under the OFL, with the licence text next to it. Reuse those files. Copy the licence file with the font.

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

### Slide sequence 🔧

| # | Slide | Job |
|---|---|---|
| 1 | Hook | The title and the one line that makes them look up |
| 2 | Problem | The named user, and the moment it hurts |
| 3 | Fix | Our answer in one sentence |
| 4 | Demo | Hand off to the live build. Full bleed, LIVE badge |
| 5 | Wow | The marker for the one beat we trigger live |
| 6 | How it works | Adapter layer, mock data, the API surface we use |
| 7 | KICK-native | Why it belongs on KICK and not somewhere else |
| 8 | Team | Every member, and what they shipped |
| 9 | Close | What ships next, and the ask |

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

The Design Spec §8 floor applies, plus two rules a projected deck adds:

- Body copy holds 4.5:1 against its own surface, measured **over the background layer**, not over the flat token colour.
- Nothing on the deck flashes more than three times per second (§6).
- Never encode meaning in colour alone. A green number needs a label.
- `prefers-reduced-motion` stops the ambient loops and the entry animations.

---

## 12. Definition of done

Run this before the deck ships.

- [ ] Every file in `pitch/` uses the Design Spec §9 tokens. No new colour values
- [ ] Green stays under 10% of visible pixels across the whole deck
- [ ] Nothing renders below 24px at 1920 width
- [ ] Every slide has an `<aside class="notes">` block that names its speaker
- [ ] Every team member appears on the team slide and speaks at least once
- [ ] Copy is Simplified Technical English, 25 words per slide or fewer, no em dashes
- [ ] Every asset is local, committed, and licensable onward to KICK
- [ ] Every mock value on a slide is a real-looking name, message or number
- [ ] The deck runs with the network off
- [ ] The PDF fallback is exported and committed
- [ ] `prefers-reduced-motion` stops all motion, and the slides still read
- [ ] Nothing flashes more than three times per second
- [ ] The demo slide shows the running product, not a screenshot

---

*Written 25 July 2026. Values tagged 🔧 are our construction, not KICK's. Check the [brand toolkit](https://about.kick.com/brand) before 1 August and correct §5 and §6 if we get access.*
