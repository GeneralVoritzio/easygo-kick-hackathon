# KICK Pitch Deck Mechanics

**How the deck is laid out and built. Nothing about how it looks.**

Applies only to files in `pitch/`. Outside `pitch/`, ignore this file.

---

## 0. What decides what

| Question | File |
|---|---|
| What colour, type, texture, motion feel, voice, imagery? | `.claude/KICK-BRAND-IDENTITY.md`. **The deck is media** |
| What do mock product elements look like? | `.claude/KICK-DESIGN-SYSTEM.md`. **A control is UI wherever it sits** |
| Where does a thing sit on the slide, and how is the deck built? | **This file** |

**This file never restates a brand rule or a token.** If you want a hex value, a curve, a font weight
or a texture, it is not here and it must not be added here. A rule written twice goes stale in one
place first.

**Copy an asset into `pitch/src/assets/` before you use it**, per the Working Agreement. Never import
from `assets/` with a path that climbs out of `pitch/`: a bundler will not serve it in dev. Copy the
licence file with the asset, and record where the copy came from in `pitch/README.md`.

---

## 1. It must look like slides, not a website

This is the rule the deck gets judged on, and it is easy to fail by accident.

**A slide is one held frame with a lot of empty space.** A website is a scrolling column of sections
with a nav. React and CSS make the second one by default, so push back on purpose:

- **No scrolling. Ever.** If content does not fit the frame, it is two slides.
- **No nav, no header, no footer, no logo on every slide.** The wordmark appears twice in the deck,
  on the cold open and the close (Brand Identity Section 5).
- **No hover states on slide furniture.** Nobody hovers a projector. Hover belongs only inside a mock
  product element (Section 5).
- **No card grids of three or four equal boxes.** That is a landing page. A slide carries one idea.
- **Empty space is correct, but a dead half is not.** Space around a centred block reads as designed.
  A block at the top with nothing under it reads as unfinished. Centre the content, and give the
  bottom band a device.
- **One focal point per slide.** A viewer should know where to look before they read anything.
- **Nothing responsive, but no letterbox either.** The deck fills the window at any aspect, because
  every size is a fraction of the viewport width. Do not write a media query.

A useful test: **screenshot a slide and remove the text. If it still reads as a web page, it is
wrong.**

---

## 2. Stack

| Layer | Choice | Package | Licence |
|---|---|---|---|
| Build | Vite | `vite` | MIT ✅ |
| UI | React 19 + TypeScript | `react`, `react-dom` | MIT ✅ |
| Deck engine | Reveal.js | `reveal.js` | MIT ✅ |
| Type | Inter + Archivo, copied into `src/assets/fonts/` | local files | OFL ✅ |

Every licence is permissive, which satisfies Spec Test B3 (Hackathon Brief Section 7). **Do not add a
dependency without checking its licence.** A restrictive licence on a slide library is a rules
problem, not a taste problem.

**No CSS framework in `pitch/`.** Plain CSS with the Design System Section 9 tokens. A deck has about
ten layouts, so a utility framework adds weight and no speed.

**No icon library.** The deck needs almost no icons. Draw the few it needs, per Design System
Section 5.

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
    tokens.css          Design System Section 9, copied verbatim
    media.css           media colour and the two @font-face rules
    deck.css            layout only: the grid, the gutter, the type scale
    slides/
      Cold.tsx  Hook.tsx  Problem.tsx  Fix.tsx  Demo.tsx
      Wow.tsx  HowItWorks.tsx  Native.tsx  Team.tsx  Close.tsx
    components/
      Slide.tsx         the frame every slide renders through
      Stack.tsx         a stacked display lockup
      HeroStat.tsx      one number, one label
      Split.tsx         two columns, for the only slide that needs two
      DemoFrame.tsx     holds the live build or a mock element
      SpeakerNotes.tsx
    mock/               mock product elements. See Section 5
    backgrounds/        one component per Brand Identity Section 8 layer
    anim.css            entry animation, in CSS
    assets/             local copies of the fonts and the wordmark
```

`tokens.css` is copied verbatim from the Design System. **Do not edit the copied values.** If a token
is wrong, fix it in the Design System and copy again.

`deck.css` holds layout only. If you are about to put a colour in it, it belongs in `tokens.css`.

---

## 4. Slide layout

### The frame

**Every slide renders through `components/Slide.tsx`.** It supplies the gutter, a background slot, the
content grid and the `data-anim` hooks. **No slide sets its own padding.** If a layout needs different
spacing, add a variant to `Slide`.

```css
:root{
  --deck-gutter:5vw;       /* 96 at a 1920 canvas, all four sides */
  --deck-measure:30ch;     /* never let a line run wider */
}
```

**Every size is `vw`, as a fraction of the 1920 design canvas.** 1px at 1920 is 0.0521vw. That is what
lets the deck fill any window with no black bars and still hold its proportions. Reveal runs at
`width:'100%'` with the scale pinned to 1, so it does no scaling of its own.

**A device that sits against a slide edge goes in the `overlay` slot on `Slide`, not with the content.**
The content block is centred, so an absolutely positioned child would anchor to the content and land
in the middle of the slide. The marquee, the sticker and the HUD all use `overlay`.

### The type scale

Deck geometry, not theming. **The styling of these rows is Brand Identity Section 4**: display is ALL
CAPS, weight 800, leading 1.0, tracking `normal`.

| Token | vw | At 1920 | Use |
|---|---|---|---|
| `--d-hero` | 8.33 | 160 | One number or two words. One per slide, maximum |
| `--d-h1` | 5 | 96 | Slide title |
| `--d-h2` | 3.125 | 60 | Section title |
| `--d-h3` | 2.08 | 40 | Card title |
| `--d-body` | 1.56 | 30 | Body copy |
| `--d-caption` | 1.25 | 24 | Captions, sources |
| `--d-label` | 1.25 | 24 | Eyebrow labels, badges |

**Nothing renders below 1.25vw, which is 24px at 1920 width.** A projector at the back of a room loses everything
smaller. This floor applies to slide furniture. A mock product element is exempt, per Section 5.

### Position

- **Content is centred in the frame.** Top loading it leaves a dead half that reads as unfinished.
- **Use the bottom edge for a device, not for copy.** A marquee or a HUD earns that band.
- **Flush left by default.** Centre only a flood frame and the close.
- **One vertical rhythm per slide.** Do not mix a centred block with a flush-left block.

---

## 5. Mock product elements

A slide may carry a mock element that imitates a feature we built: a chat row, a hype meter, a LIVE
badge, a marker on a timeline. This is how we show a feature that the live demo does not reach.

**Six rules.**

0. **Position in percentages, never pixels.** A mock element scales with the slide, so a marker placed
   at a pixel offset drifts off whatever it points at as soon as the width changes. This one shipped.
1. **A mock element is UI, so the Design System governs it.** Real tokens, real 16px chat, real
   identity colours, real radius. Not the deck scale, and not the media rules.
2. **It goes inside `DemoFrame`.** Never loose on the slide. The frame reads as a screen.
3. **Build it from real markup, not a picture of one.** A screenshot at projector scale looks soft.
4. **Label it.** A mock element carries a `MOCK` label, in `--d-label`. **Never let a judge think a
   mock is the running product.** Four KICK engineering managers will ask.
5. **Green stays under 10% of the pixels inside the frame** (Design System Section 1), even when the
   slide around it is a flood.

**The mock is not the demo.** Slide 4 hands off to the running build. A mock supports a point about a
feature. If a slide mocks the thing the demo already shows, cut the slide.

`src/mock/` holds these. Import a real component from `prototypes/` where one exists, rather than
rebuilding it.

---

## 6. Reveal.js rules

```ts
Reveal.initialize({
  width: '100%', height: '100%', margin: 0,
  minScale: 1, maxScale: 1,
  controls: false, progress: true, hash: true,
  keyboard: true, overview: true,
  transition: 'none',
})
```

`transition:'none'` is deliberate. **The deck cuts, it does not dissolve** (Brand Identity Section 6).

`margin:0` keeps the layout predictable, because `Slide` owns the gutter.

### React and Reveal must not fight for the DOM

Reveal mutates the deck: it adds classes, moves sections and clones nodes. **React owns the content of
a slide. Reveal owns the deck shell.**

- Initialise Reveal once, in a `useEffect` with an empty dependency array, after React mounts.
- Keep the slide list **static**. Never add, remove or reorder `<section>` after `initialize` runs.
- Keep React state inside a slide, below the `<section>`.
- Call `Reveal.destroy()` in the effect cleanup, so hot reload does not stack two instances.

### Motion

Reveal drives the change between slides. **CSS drives everything inside a slide.** Do not use Reveal
fragments, and do not add a JS animation library.

**Entry animation is CSS, on purpose.** A stalled JS animation leaves a slide blank in front of an
audience, so the resting state must be the browser's job. `animation-fill-mode:both` guarantees it.
Reveal sets `display:none` on every slide that is not present, so returning to `display:block` replays
the animation on each entry, for free.

`anim.css` holds every keyframe. A slide asks for one with `data-anim`, and the stagger is
`nth-child` delays.

```tsx
<h1 data-anim="riseIn">Chat already told you</h1>
```

**We tried the JS route and it failed.** Motion One left the first slide at `opacity:0` when its
handler registered after Reveal had already fired `ready`. Nothing that can hide a slide belongs in
the deck.

**The feel is Brand Identity Section 6**, including the curves and the flash safety floor. Two limits
are deck-specific:

- **Total entry per slide stays under 600ms.** The presenter speaks over it, so it must finish first.
- **Animate on enter, never on exit.** Exit animation is delay the presenter feels.

### Speaker notes

Every slide carries an `<aside class="notes">` block, and it starts with the name of the person who
speaks that slide. Load the `RevealNotes` plugin. Hackathon Brief Section 4 scores a contribution from
every member, and Section 8 asks that every member speaks.

---

## 7. Slide sequence 🔧

Ten slides. The live build carries 90% of the score, so the deck opens it and closes it.

| # | Slide | Job | Layout |
|---|---|---|---|
| 0 | Cold open | One line, near black. Cuts hard into the hook | Centred, one line |
| 1 | Hook | The title, stacked | Flood frame, `Stack` |
| 2 | Problem | The named user, and the moment it hurts | Flush left, `--d-h1` |
| 3 | Fix | Our answer in one sentence | Flush left, `--d-h1` |
| 4 | Demo | **Hand off to the live build** | Full bleed `DemoFrame` |
| 5 | Wow | The one beat we trigger live | `HeroStat`, one loud device |
| 6 | How it works | Adapter layer, mock data, the API surface | `Split`, the only two-column slide |
| 7 | KICK-native | Why it belongs on KICK | Flush left, plus a mock element |
| 8 | Team | Every member and what they shipped | `Split` |
| 9 | Close | The wordmark, a three-word triad, the ask | Flood frame, centred |

**The deck must survive being cut.** If time runs short we drop slides, never demo time. Slides 5, 7
and 8 are the ones that go.

---

## 8. Content rules

- **One idea per slide.** If a slide needs a comma to explain itself, it is two slides.
- **25 words per slide, maximum.** The presenter carries the detail.
- **Never demo from a screenshot.** If a slide shows the product, it shows the running product, or a
  labelled mock element per Section 5.
- **Mock data follows the API Conventions Part 3.** Real names, funny handles, real chat energy. Never
  a placeholder. A judge reads a slide as closely as a fixture.
- **Say the mock-data line out loud** (Hackathon Brief Section 2A.2): same interface, live client
  behind it, deterministic fixture so the raid lands on cue. Put it on slide 6.
- **Name the roles.** Slide 8 lists every member and what they built.
- **All copy is ASD-STE100 Simplified Technical English**, per the Working Agreement. No em dashes.
- **The voice is Brand Identity Section 2**, including the banned enterprise words. One deck-specific
  rule: the close carries a three-word imperative triad, in the shape of "Find it. Share it. Own it."
  Write our own. Do not reuse KICK's.

---

## 9. Traps that already cost us a day

Every one of these shipped a broken deck past a clean build. `npm run check` now guards the first
five. Read them before you wire Reveal again.

| Trap | What you see | The rule |
|---|---|---|
| **Vendor CSS last** | A white deck. `reveal.css` sets `.reveal-viewport{background:#fff;color:#000}`, and a class beats `body` | Import `reveal.css` first in `main.tsx`, then ours. Restate the background on `.reveal-viewport` |
| **A container with no height** | Everything drawn tiny in the middle of nothing. Reveal measures its container and clamps to `minScale` | Give `#root` `height:100%` |
| **JS that reveals content** | A slide stuck at `opacity:0`. Our handler registered after Reveal had fired `ready` | **Nothing in JS may be the only thing making content visible.** Entry animation is CSS with `animation-fill-mode:both` |
| **Pixels over a scaled element** | Markers drifting off the curve at every width but one | Position against a scaled element in **percentages**, never pixels |
| **Reaching outside the project** | Works in the build, 403 in dev, and a font that silently falls back | Copy the asset into `pitch/src/assets/` and import it locally |
| **One test aspect** | Black bars on every screen that is not the one you tried | Screenshot at three aspect ratios |
| **A blocked asset fails quietly** | The page looks fine. The font is wrong | Check the network status of every asset, not just the page |

**The pattern behind all seven: the build was never the thing under test.** A deck is pixels on a
wall. Verify pixels.

---

## 10. Delivery

The deck runs in a room we do not control.

- **It runs offline.** Build it, serve `dist` locally. No CDN, no font service, no network call.
- **Keep a PDF fallback.** Export with `?print-pdf` and commit it. If the laptop dies, the PDF opens
  anywhere.
- **Test on the room projector**, or the nearest thing. Check the 24px floor and the green at low
  brightness.
- **Rehearse twice, timed, with the real build** (Hackathon Brief Section 8).
- **Packaging is on the run sheet.** Clause 3(h) needs the submission emailed, then every local copy
  deleted.

---

## 11. Definition of done

**A green build is not evidence.** The deck once compiled clean, served HTTP 200, and rendered a
blank white page. Every fault below shipped past a passing build, because a bundler cannot see
pixels. So the check has two halves, and you owe both.

### Half one: run the script

```
npm run check
```

`pitch/check.mjs` holds every rule a script can decide, and `npm run build` runs it first. Prose did
not catch one of these while the deck was being written. A script caught all of them.

It checks: `tokens.css` still matches Design System Section 9, `deck.css` holds no colour literal, no
media query except `prefers-reduced-motion`, `reveal.css` imports before our CSS, `#root` has a
height, `.reveal-viewport` is restated, no file reaches outside `pitch/`, no pixel positioning in
`src/mock/`, 25 words per slide, two flood surfaces, no stacked loud devices, every slide has notes,
every frame has a tag, no em dash, no section symbol, no banned enterprise word.

**Add a rule to the script, not to this list, whenever a script could decide it.**

### Half two: look at it

The script cannot see a thing. **Render every slide and look at the picture.**

- [ ] Every slide screenshotted and checked **at 16:9, at 16:10, and wider**. Testing one aspect is how the letterboxing got missed
- [ ] Every slide shows its content. Nothing blank, nothing stuck part way through an animation
- [ ] No device covers text, and no tag covers a frame's content
- [ ] The marquee and the REC dot are moving
- [ ] No slide has a dead half
- [ ] Run it in **dev and in preview**. They fail differently: dev blocks files outside the root, and the build bundles them
- [ ] Check with the network off, and with `prefers-reduced-motion` on

Driving a headless browser is enough for all of this:

```
chrome --headless --window-size=1440,900 --virtual-time-budget=8000 \
  --screenshot=slide.png "http://localhost:4173/#/4"
```

### The rest, by eye

- [ ] Every slide renders through `Slide`, and no slide sets its own padding
- [ ] Every mock element sits in a frame and carries a `MOCK` tag
- [ ] Slide 4 shows the running product, not a picture of it
- [ ] Every team member appears on slide 8 and speaks at least once
- [ ] The PDF fallback is exported and committed
- [ ] Dropping slides 5, 7 and 8 still leaves a coherent pitch

**For the look, run Brand Identity Section 10.** For mock elements, run Design System Section 10.

---

*Written 25 July 2026. Revised 25 July 2026: the theming rules moved out to the Brand Identity and
the Design System, and this file kept the layout and the mechanics. Values tagged 🔧 are our
construction, not KICK's.*
