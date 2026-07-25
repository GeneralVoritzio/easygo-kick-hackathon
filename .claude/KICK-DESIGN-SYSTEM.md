# KICK Design System

Our design system for the hackathon build. Goal: the judges should not be able to tell our UI from something KICK shipped.

> **Read `.claude/KICK-BRAND-IDENTITY.md` first. Everything about the KICK brand is in there.**
> It holds the verified colours, the two type systems, the flood rule, the graphic devices, the
> measured motion curves, the voice, and the imagery and licence rules. It also names the sources
> those values came from.
>
> **This file covers product UI only.** Buttons, inputs, cards, chat rows, badges, overlay layout,
> focus rings and hit targets. If a question is about how the brand looks or sounds, and not about
> a control a user operates, the answer is in the Brand Identity file, not here.
>
> **The Brand Identity file supersedes some values below.** It read the live DOM on kick.com and
> about.kick.com, and it measured greys that differ from the 🔧 guesses in Section 1. See Brand Identity
> Section 3, "Where the Design System disagrees". This file stays locked, so read both and prefer the ✅
> value.

---

## 0. Confidence and verification — read first

I could not extract KICK's real CSS tokens. kick.com is client-rendered, and the official brand toolkit sits behind a [Brandfolder portal](https://brandfolder.com/portals/kick). So:

| Tag | Meaning |
|---|---|
| ✅ **Verified** | Confirmed from KICK's own pages |
| 🟡 **High confidence** | Widely used KICK values / consistent across their ecosystem, but not confirmed from source |
| 🔧 **Derived** | My construction — coherent and Kick-like, but invented. Fine to ship, not a claim about KICK |

**Do this before Friday — 10 minutes, one person.** Open kick.com on a live channel, DevTools → Elements, and read the computed styles. Correct these eight values in Section 1 and Section 3 and the whole system snaps into place:

1. `background-color` on `<body>` and on the chat panel
2. The exact green on the **Follow** button
3. `font-family` on the computed styles of a chat message
4. Chat message row `padding` and `font-size`
5. `border-radius` on buttons and on category cards
6. The LIVE badge's background and text colour
7. Sidebar width in px
8. Colour of a username vs. message body text in chat

Then paste the corrections into `tokens.css` and commit. Everything else here can stay as-is.

**Official sources:** [Brand toolkit](https://about.kick.com/brand) · [Logo download](https://brandfolder.com/s/vb9bf4cj6sbkvxmb5x8x7q2g) · [Brand hub](https://brandfolder.com/portals/kick)

---

## 1. Colour

### Primary

| Token | Value | Notes |
|---|---|---|
| `--kick-green` | `#53FC18` | 🟡 The signature green. Used across KICK's streaming-tool ecosystem. Verify against Brandfolder. |
| `--kick-green-hover` | `#42D912` | 🔧 Hover/active state |
| `--kick-green-dim` | `#2E8F0C` | 🔧 Disabled, borders, dim accents |
| `--kick-green-glow` | `rgba(83,252,24,.24)` | 🔧 Focus rings, glow layers |

**The green is a scalpel, not a paint roller.** KICK's interface is overwhelmingly dark neutrals with green used sparingly for live state, primary actions and emphasis. The single fastest way to look like a knock-off is to use green everywhere. Budget: **under 10% of visible pixels.**

Never use `--kick-green` for body text on a light background — it fails contrast badly. On dark surfaces it's excellent.

### Surfaces (dark ramp) 🔧

| Token | Value | Use |
|---|---|---|
| `--bg-base` | `#0B0E0F` | Page background, furthest back |
| `--bg-surface` | `#121517` | Cards, chat panel, primary panels |
| `--bg-raised` | `#191D1F` | Hover states, raised elements, inputs |
| `--bg-overlay` | `#22282A` | Menus, tooltips, modals |
| `--border` | `#282F31` | Default 1px borders |
| `--border-strong` | `#3A4245` | Emphasised dividers |

### Text 🔧

| Token | Value | Use |
|---|---|---|
| `--text-primary` | `#FFFFFF` | Headings, usernames, key numbers |
| `--text-body` | `#E3E7E8` | Body copy, chat messages |
| `--text-muted` | `#8B9598` | Timestamps, labels, metadata |
| `--text-disabled` | `#5A6467` | Disabled |

### Semantic 🔧

| Token | Value | Use |
|---|---|---|
| `--live` | `#FF1744` | LIVE badge, recording state. **Red, not green** — green is the brand, red is "on air" |
| `--warn` | `#FFB020` | Warnings, mod attention |
| `--danger` | `#FF4757` | Destructive, bans, errors |
| `--info` | `#3EA6FF` | Links, info states |

Reserve `--live` strictly for live/on-air state. If everything is red, nothing is urgent.

---

## 2. Typography

**KICK's display wordmark is a custom typeface** ✅ (their brand toolkit describes proprietary type). It is not publicly available and we should not attempt to clone it — clause 7(f) makes third-party font licensing our problem.

### Our stack 🔧

```
--font-ui:      'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-display: 'Archivo', 'Inter', sans-serif;   /* headlines, big numbers */
--font-mono:    'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
```

Inter for all UI — it's what most streaming interfaces use and it will read as native. Archivo (or Inter at weight 800 with tight tracking) for the loud display moments. Both are SIL Open Font License, so they're safely sublicensable to KICK.

### Scale 🔧

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `--t-display` | 48 / 52 | 800, `-0.03em` | Hero numbers, the one big stat |
| `--t-h1` | 32 / 38 | 700, `-0.02em` | Screen titles |
| `--t-h2` | 24 / 30 | 700, `-0.02em` | Section headers |
| `--t-h3` | 18 / 24 | 600, `-0.01em` | Card titles |
| `--t-body` | 14 / 21 | 400 | Default. **Chat messages live here** |
| `--t-sm` | 13 / 18 | 400 | Secondary |
| `--t-xs` | 12 / 16 | 500 | Metadata, timestamps |
| `--t-label` | 11 / 14 | 700, `0.06em`, uppercase | Badges, eyebrow labels |

**Rule:** tighten tracking as size increases. Display type at default tracking looks generic; at `-0.03em` it looks designed.

---

## 3. Spacing, radius, elevation

### Spacing — 4px base 🔧

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`

Nothing off-scale. If something needs 15px, it needs 16.

**Component padding defaults**

| Element | Padding |
|---|---|
| Button (default) | `10px 18px` |
| Button (small) | `6px 12px` |
| Card / panel | `16px` |
| Chat message row | `6px 12px` — tight vertical, chat is dense |
| Input | `10px 14px` |
| Badge / pill | `2px 8px` |
| Section gap | `24px` |
| Page gutter | `20px` (desktop), `16px` (mobile) |

### Radius 🔧

| Token | Value | Use |
|---|---|---|
| `--r-sm` | `4px` | Badges, tags, tiny chips |
| `--r-md` | `6px` | Buttons, inputs — **the workhorse** |
| `--r-lg` | `8px` | Cards, panels |
| `--r-xl` | `12px` | Modals, large surfaces |
| `--r-full` | `9999px` | Avatars, pills, viewer counts |

KICK reads **slightly sharp** — nearer 6px than 12px. Over-rounding is the second-fastest way to look non-native.

### Elevation 🔧

Dark UIs elevate with **lighter surfaces**, not heavy shadows. Change the background first, add shadow only for genuinely floating layers.

```
--shadow-md: 0 4px 12px rgba(0,0,0,.4);
--shadow-lg: 0 8px 28px rgba(0,0,0,.55);
--glow:      0 0 0 3px var(--kick-green-glow);   /* focus ring */
```

---

## 4. Components

### Buttons

| Variant | Spec |
|---|---|
| **Primary** | bg `--kick-green`, text `#0B0E0F` (dark text on green — never white), weight 600, radius `--r-md`, padding `10px 18px` |
| **Secondary** | bg `--bg-raised`, text `--text-primary`, 1px `--border` |
| **Ghost** | transparent, text `--text-body`, hover bg `--bg-raised` |
| **Danger** | bg `--danger`, text white |

All: `transition: background-color .15s ease, transform .1s ease`. Active state `transform: scale(.98)`. Focus visible ring `--glow`.

### LIVE badge

`--live` background, white text, `--t-label`, padding `2px 8px`, radius `--r-sm`, uppercase. Optional 2s pulse on the dot only — never the whole badge.

### Viewer count

Muted eye icon + count in `--t-xs` at `--text-muted`. Numbers abbreviated (`1.2K`, `14.8K`). Tabular figures (`font-variant-numeric: tabular-nums`) so live-updating digits don't jitter — this matters a lot for a real-time overlay.

### Chat message row

```
padding: 6px 12px;
font-size: 14px; line-height: 21px;
```
Username in `--text-primary` weight 600, coloured per-user; message body in `--text-body` weight 400. Badges inline before the username, 16px tall, 4px gap. Hover: bg `--bg-raised`. No border between rows — density comes from tight padding, not dividers.

### Cards

bg `--bg-surface`, 1px `--border`, radius `--r-lg`, padding `16px`. Hover: bg `--bg-raised`, border `--border-strong`, `transform: translateY(-2px)`, 150ms.

### Inputs

bg `--bg-base` (recessed, darker than the surface around it), 1px `--border`, radius `--r-md`, padding `10px 14px`. Focus: border `--kick-green`, ring `--glow`.

---

## 5. Icons

**Use [Lucide](https://lucide.dev)** — ISC licence, cleanly sublicensable to KICK under clause 7(f), and stylistically very close to what streaming UIs use. `lucide-react` if we're in React.

| Spec | Value |
|---|---|
| Sizes | 16 (inline/dense) · 20 (default) · 24 (nav/prominent) |
| Stroke width | `2` at 20–24px, `2.25` at 16px |
| Colour | Inherit `currentColor` — never hard-code |
| Alignment | Optically centred against text, not box-centred |

Do **not** mix icon sets. One family, whole build.

Common set: `eye` (viewers) · `radio` (live) · `message-square` (chat) · `heart` (follow) · `zap` (hype) · `trophy` (leaderboard) · `shield` (mod) · `trending-up` (growth) · `users` (community) · `settings` · `x` · `chevron-down`.

---

## 6. Motion 🔧

| Token | Value | Use |
|---|---|---|
| `--ease` | `cubic-bezier(.2,.8,.2,1)` | Default |
| `--fast` | `120ms` | Hover, colour |
| `--base` | `200ms` | Enter/exit, layout |
| `--slow` | `400ms` | Celebratory, attention |

KICK's brand voice is "chaotically creative" ✅ — motion should be **snappy and slightly overshooting**, not smooth and corporate. But: a real-time overlay updating constantly with animation is nauseating. Animate **state changes and events**, never continuous data. A number ticking up every 200ms should not animate each tick.

Respect `prefers-reduced-motion`.

---

## 7. Overlay-specific rules

If we ship an OBS browser source, different constraints apply — this is where teams that only designed for a webpage come unstuck.

- **Transparent background.** `body { background: transparent }`. Never paint a full-bleed backdrop.
- **Canvas 1920×1080**, designed at 1×. Assume it's scaled.
- **Safe margins: 64px** from every edge. Streamers crop, and platform UI overlaps corners.
- **Readable over arbitrary video.** Text needs a carrier — a semi-opaque plate (`rgba(11,14,15,.82)`) or a tight text shadow (`0 2px 8px rgba(0,0,0,.9)`). White text straight onto gameplay is unreadable half the time.
- **Nothing in the lower third** — that's where the streamer's own alerts and captions live. Non-intrusive is a hard gate in our spec (Section 7 C3).
- **No audio from the overlay** unless the streamer explicitly added it as a source. Per our cross-platform constraint (C4), sound that only fires on Kick is broken for a simulcasting streamer.
- **Self-recovering.** OBS browser sources get refreshed mid-stream. It must reconnect and repaint without intervention.

---

## 8. Accessibility floor

Cheap to hit, and "polished for a prototype" is 10% of our score.

- Body text ≥ 4.5:1 against its surface. `--text-body` on `--bg-surface` clears this; `--text-muted` is for metadata only, never body copy.
- Never encode meaning in colour alone — green/red state needs an icon or label too.
- Visible focus ring on every interactive element. `--glow` is there for exactly this.
- Hit targets ≥ 32×32px, ideally 40.
- `prefers-reduced-motion` honoured.

---

## 9. Drop-in tokens

Paste into `tokens.css` on day one. Correct the eight flagged values after the DevTools pass in Section 0.

```css
:root{
  /* brand */
  --kick-green:#53FC18;
  --kick-green-hover:#42D912;
  --kick-green-dim:#2E8F0C;
  --kick-green-glow:rgba(83,252,24,.24);

  /* surfaces */
  --bg-base:#0B0E0F;
  --bg-surface:#121517;
  --bg-raised:#191D1F;
  --bg-overlay:#22282A;
  --border:#282F31;
  --border-strong:#3A4245;

  /* text */
  --text-primary:#FFFFFF;
  --text-body:#E3E7E8;
  --text-muted:#8B9598;
  --text-disabled:#5A6467;

  /* semantic */
  --live:#FF1744;
  --warn:#FFB020;
  --danger:#FF4757;
  --info:#3EA6FF;

  /* type */
  --font-ui:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  --font-display:'Archivo','Inter',sans-serif;
  --font-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;

  /* radius */
  --r-sm:4px; --r-md:6px; --r-lg:8px; --r-xl:12px; --r-full:9999px;

  /* elevation */
  --shadow-md:0 4px 12px rgba(0,0,0,.4);
  --shadow-lg:0 8px 28px rgba(0,0,0,.55);
  --glow:0 0 0 3px var(--kick-green-glow);

  /* motion */
  --ease:cubic-bezier(.2,.8,.2,1);
  --fast:120ms; --base:200ms; --slow:400ms;
}

*{box-sizing:border-box}
body{
  margin:0; background:var(--bg-base); color:var(--text-body);
  font-family:var(--font-ui); font-size:14px; line-height:21px;
  -webkit-font-smoothing:antialiased;
}
.tabular{font-variant-numeric:tabular-nums}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
```

### Tailwind equivalent

```js
theme:{extend:{
  colors:{
    kick:{DEFAULT:'#53FC18',hover:'#42D912',dim:'#2E8F0C'},
    base:'#0B0E0F', surface:'#121517', raised:'#191D1F', overlay:'#22282A',
    line:{DEFAULT:'#282F31',strong:'#3A4245'},
    ink:{DEFAULT:'#E3E7E8',bright:'#FFFFFF',muted:'#8B9598',off:'#5A6467'},
    live:'#FF1744',
  },
  fontFamily:{sans:['Inter','sans-serif'],display:['Archivo','Inter','sans-serif']},
  borderRadius:{sm:'4px',md:'6px',lg:'8px',xl:'12px'},
}}
```

---

## 10. The five-second test

Before we demo, screenshot our UI next to a real kick.com screenshot. If the difference is obvious in five seconds, fix in this order:

1. **Green overuse** — the number one giveaway. Cut it back.
2. **Radius too round** — pull toward 6px.
3. **Padding too generous** — KICK is denser than a typical dashboard, especially chat.
4. **Wrong font weight** — usernames and labels are heavier than people expect.
5. **Surfaces too flat** — if every panel is the same grey, the hierarchy is missing.

---

*Compiled 25 July 2026. Tokens tagged 🔧 are our construction, not KICK's. Run the Section 0 DevTools pass before Friday.*
