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
> **The two files now agree.** On 25 July 2026 we read KICK's own design tokens from their live CSS,
> and every value below is corrected to match. Where this file and the Brand Identity file both
> speak, they say the same thing. Where they differ, it is on purpose, because UI and media are
> different jobs: green is under 10% here and a flood there, and display type tracks differently.

---

## 0. Confidence and verification — read first

**We have KICK's real tokens.** KICK ships a design system called **neon**, and its tokens are live
CSS custom properties on about.kick.com. We read all 282 of them on 25 July 2026. They sit in
`assets/reference/kick-neon-tokens.css`, and Brand Identity Section 3 explains the system.

Every colour in Section 1 and every size in Section 2 now comes from that file. The DevTools pass
this section used to ask for is done.

| Tag | Meaning |
|---|---|
| ✅ **Verified** | Read from KICK's own CSS. A KICK value, not ours |
| 🟡 **High confidence** | Visible in KICK's output, measured by eye |
| 🔧 **Derived** | Our construction. Coherent and KICK-like, but invented. Fine to ship, not a claim about KICK |

**Each token below names its KICK token.** If a row says `neutral-900`, you can find that exact name
in `assets/reference/kick-neon-tokens.css` and check us.

### What is still ours, not KICK's

Three things carry no KICK token, so they stay 🔧. Do not present them as KICK's:

1. **The radius scale** (Section 3). KICK exposes no radius token. Our scale is a good eye match.
2. **`--kick-green-glow`** (Section 1), our focus ring.
3. **The icon set** (Section 5). KICK ships a custom set we cannot use, so we draw our own.

**Official sources:** [Brand toolkit](https://about.kick.com/brand) · [Logo download](https://brandfolder.com/s/vb9bf4cj6sbkvxmb5x8x7q2g) · [Brand hub](https://brandfolder.com/portals/kick), still gated. See Brand Identity Section 0.

---

## 1. Colour

### Primary

| Token | Value | KICK token | Use |
|---|---|---|---|
| `--kick-green` | `#53FC18` | `green-500` ✅ | The signature green |
| `--kick-green-hover` | `#3AD903` | `green-600` ✅ | Hover and active |
| `--kick-green-dim` | `#2BA202` | `green-700` ✅ | Disabled, dim accents |
| `--kick-green-bright` | `#75FD45` | `green-400` ✅ | The one step up, for a hover on a dark ground |
| `--kick-green-glow` | `rgba(83,252,24,.24)` | none 🔧 | Focus rings, glow layers |

**Green means two things in KICK's system, and both are "yes".** `--neon-primary-base` and
`--neon-positive-base` are the same `green-500` ✅. So green marks a primary action and a good state.
**Never use green for a neutral or a count that carries no judgement.**

**Text on green is always ink `#0B0B0C`, never white.** KICK states this in its own tokens:
`--neon-primary-onPrimary` is `neutral-950` ✅.

**The green is a scalpel, not a paint roller.** KICK's interface is overwhelmingly dark neutrals with green used sparingly for live state, primary actions and emphasis. The single fastest way to look like a knock-off is to use green everywhere. Budget: **under 10% of visible pixels.**

Never use `--kick-green` for body text on a light background — it fails contrast badly. On dark surfaces it's excellent.

### Surfaces (the KICK neutral ramp) ✅

| Token | Value | KICK token | Use |
|---|---|---|---|
| `--bg-base` | `#0B0B0C` | `neutral-950`, `surface-lowest` | Page background, furthest back |
| `--bg-surface` | `#171A1C` | `neutral-900`, `surface-base` | Cards, chat panel, primary panels |
| `--bg-raised` | `#232629` | `neutral-800`, `surface-highest` | Hover states, raised elements, inputs |
| `--bg-overlay` | `rgba(11,11,12,.8)` | `surfaceOverlay-base` | Menus, tooltips, modals |
| `--border` | `rgba(240,241,242,.16)` | `outline-decorative` | Default 1px borders |
| `--border-strong` | `rgba(240,241,242,.4)` | `outline-region` | Emphasised dividers |

**Borders and overlays are translucent, not grey.** This is the change that matters most. KICK builds
a border from light at 16% and an overlay from ink at 80%, so both take a tint from whatever sits
behind them and the panels stack correctly. A flat grey border looks right on one surface and wrong
on the next.

### Text ✅

| Token | Value | KICK token | Use |
|---|---|---|---|
| `--text-primary` | `#FFFFFF` | `color-white`, `surface-onSurface` | Headings, usernames, key numbers |
| `--text-body` | `#E9ECED` | `text-base` | Body copy, chat messages |
| `--text-secondary` | `#D3D8DB` | `text-secondary` | The step between body and muted |
| `--text-muted` | `#9FA6AD` | `neutral-400`, `onSurfaceSecondary` | Timestamps, labels, metadata |
| `--text-disabled` | `rgba(240,241,242,.24)` | `disabled-onSurface` | Disabled |

### Semantic ✅

| Token | Value | KICK token | Use |
|---|---|---|---|
| `--live` | `#FB1818` | `red-500`, `danger-base` | LIVE badge, on-air state |
| `--danger` | `#D80303` | `red-600`, `negative-base` | Destructive, bans, errors |
| `--warn` | `#FBA418` | `orange-500`, `warning-base` | Warnings, mod attention |
| `--info` | `#1899FB` | `blue-500` | Links, info states |

**KICK ships two reds and no separate live-red.** We map on-air to the brighter `red-500` and
destructive to the darker `red-600`. Both are KICK values, and the pair keeps the old rule that
on-air and danger must not look identical.

Reserve `--live` strictly for live and on-air state. If everything is red, nothing is urgent. Never
carry the meaning in the colour alone, per Section 8.

### Chat username colours ✅

KICK gives a chat username one of **16 named identity colours**, in `--neon-identity-*`. Use these
and nothing else, so our chat reads as native:

| Name | Value | Name | Value |
|---|---|---|---|
| bubblegum | `#FEA0CF` | neon | `#75FD45` |
| celeste | `#A0F6FE` | powder | `#A0D5FE` |
| coral | `#FEA0A0` | rose | `#FD72B8` |
| cyan | `#18E9FB` | sand | `#FEDAA0` |
| lavender | `#EACDFE` | sky | `#45ADFC` |
| lime | `#B8FEA0` | sunshine | `#FCB645` |
| melon | `#FECDCD` | violet | `#D8A0FE` |
| mint | `#18FBB0` | mist | `#A0FEDE` |

All 16 are ramp steps 100 to 500, so they stay light on a dark ground and they all clear contrast on
`--bg-surface`. A badge filled with an identity colour takes ink text `#0B0B0C`, because
`--neon-identity-onIdentity` is `neutral-950` ✅.

---

## 2. Typography

**KICK sets display type in Booster Polygonal** ✅, loaded as `boosterPolygonal` and
`boosterPolygonalCompact`. It is a retail font from Blaze Type, we hold no licence, and clause 7(f)
makes font licensing our problem. **KICK does not put its display face in the product anyway**: kick.com
loads Inter and nothing else ✅. So this file needs no display face. Brand Identity Section 4 covers the
substitute for media.

### Our stack 🔧

```
--font-ui:      'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-display: 'Archivo', 'Inter', sans-serif;   /* headlines, big numbers */
--font-mono:    'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
```

**Inter is KICK's UI face, confirmed.** `--neon-font-family-default` is `Inter` ✅, and kick.com loads
Inter and nothing else. Archivo is our display substitute for the loud moments. Both are SIL Open
Font License, so they are safely sublicensable to KICK. Take both from `assets/fonts/`.

**KICK names three weights, not nine** ✅: `font-weight-default` is Regular, `font-weight-thick` is
SemiBold, `font-weight-heavy` is Bold. **So a KICK UI uses 400, 600 and 700, and nothing else.**
Weight 800 is a media choice, and it belongs in the deck, not in the product.

### Scale ✅

KICK's type scale is **12, 14, 16, 18, 20, 24, 28, 32, 36, 48**. There is no 11 and no 13. Every size
below sits on that scale.

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `--t-display` | 48 / 56 | 700 | Hero numbers, the one big stat |
| `--t-h1` | 32 / 40 | 700 | Screen titles |
| `--t-h2` | 24 / 32 | 700 | Section headers |
| `--t-h3` | 18 / 24 | 600 | Card titles |
| `--t-body` | 16 / 24 | 400 | Default. **Chat messages live here** ✅ |
| `--t-sm` | 14 / 20 | 400 | Secondary |
| `--t-xs` | 12 / 16 | 500 | Metadata, timestamps |
| `--t-label` | 12 / 16 | 700, `0.06em`, uppercase | Badges, eyebrow labels |

**Chat is 16px, not 14px.** KICK sets `--chatroom-font-size:16px` ✅. This was our biggest sizing
error, and chat is the densest surface we build, so it is the one most likely to give us away.

**Tracking stays at `normal` in UI.** The old rule here tightened tracking as size grew. KICK does
not do that: its headings measure at `letter-spacing:normal` ✅. Only `--t-label` tracks out, which is
normal practice for small caps. Brand Identity Section 4 says the same for media.

---

## 3. Spacing, radius, elevation

### Spacing — the KICK number scale ✅

`1 · 2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · 28 · 32 · 36 · 40 · 44 · 48 · 56 · 64 · 80 · 96 · 112 · 128`

Read from `--neon-number-*`. Nothing off-scale. If something needs 15px, it needs 14 or 16.

**The scale is finer than a strict 4px grid.** KICK includes 6, 10, 14 and 44, so a dense surface like
chat can take a step that a 4px grid would forbid. Use the small odd steps for chat and badges, and
keep to multiples of 8 for layout.

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
| **Primary** | bg `--kick-green`, text `#0B0B0C` (ink on green, never white ✅), weight 600, radius `--r-md`, padding `10px 18px` |
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
font-size: 16px; line-height: 24px;   /* KICK sets --chatroom-font-size:16px ✅ */
```
Username weight 600, coloured per-user from the **16 identity colours in Section 1** ✅; message body in `--text-body` weight 400. Badges inline before the username, 16px tall, 4px gap. Hover: bg `--bg-raised`. No border between rows — density comes from tight padding, not dividers.

### Cards

bg `--bg-surface`, 1px `--border`, radius `--r-lg`, padding `16px`. Hover: bg `--bg-raised`, border `--border-strong`, `transform: translateY(-2px)`, 150ms.

### Inputs

bg `--bg-base` (recessed, darker than the surface around it), 1px `--border`, radius `--r-md`, padding `10px 14px`. Focus: border `--kick-green`, ring `--glow`.

---

## 5. Icons

### What KICK actually ships ✅

Read from kick.com on 25 July 2026. **KICK uses a custom icon set, and it is part of the neon
system.** The components are named `<name>Icon`, and one family carries a `Neon` prefix:
`NeonSearchIcon`, `NeonDashboardIcon`, `NeonWalletIcon`, `NeonVerifiedIcon` and more. We counted
**114 named icons**.

| Property | KICK's icons ✅ |
|---|---|
| Grid | `viewBox="0 0 32 32"`, with some at `0 0 16 16`. Third-party brand marks sit on `0 0 24 24` |
| Style | **Solid fill. No stroke at all** |
| Colour | `fill="currentColor"` |
| Rendered size | Tailwind `size-4`, so **16px** |
| Geometry | Hard edges, flat corners, no rounded joins. Their home icon is a house with zero curves |

**This is the opposite of Lucide.** Lucide is a 24 grid, stroked, rounded outline set. Placing Lucide
next to KICK's chrome reads wrong immediately, and this section used to specify Lucide.

`assets/icons/kick-inline/` holds **18 of KICK's real icons**, lifted verbatim from the markup
kick.com serves. Use them as the geometry reference.

### What we do instead 🔧

**Draw our own, filled, on a 32 grid.** An overlay needs about a dozen icons, and a dozen hard-edged
filled glyphs is an afternoon. It costs less than a dependency and it is the single cheapest way to
look native.

| Spec | Value |
|---|---|
| Grid | `viewBox="0 0 32 32"`, drawn to the pixel |
| Style | Solid fill, no stroke |
| Sizes | 16 (default, matching KICK) · 20 · 24 (nav) |
| Colour | `fill="currentColor"` — never hard-code |
| Alignment | Optically centred against text, not box-centred |

Do **not** mix icon sets. One family, whole build.

Common set: viewers (eye) · live (dot) · chat · follow (heart) · hype (bolt) · leaderboard (trophy) ·
mod (shield) · growth (arrow) · community (people) · settings · close · chevron.

**If we run out of time, fall back to [Phosphor](https://phosphoricons.com) at weight `fill`** (MIT,
sublicensable under clause 7(f)). It is filled, so it is much closer than Lucide. Never ship the
outline weight.

---

## 6. Motion ✅

Counted across the stylesheets kick.com and about.kick.com load, on 25 July 2026.

| Token | Value | KICK usage | Use |
|---|---|---|---|
| `--ease` | `cubic-bezier(.4,0,.2,1)` | **22 uses. Their default** ✅ | Everything, unless a row below applies |
| `--ease-overlay` | `cubic-bezier(.16,1,.3,1)` | 12 uses ✅ | Anything that opens over the top: menu, popover, tooltip |
| `--ease-media` | `cubic-bezier(.87,0,.13,1)` | 2 uses ✅ | Brand surfaces only. The deck uses this, the overlay does not |
| `--fast` | `120ms` 🔧 | | Hover, colour |
| `--base` | `200ms` 🔧 | | Enter, layout |
| `--overlay` | `400ms` ✅ | KICK pairs 400ms with `--ease-overlay` | Menus and popovers |
| `--slow` | `400ms` 🔧 | | Celebratory, attention |

The old `--ease:cubic-bezier(.2,.8,.2,1)` 🔧 was close to nothing KICK uses. **`cubic-bezier(.4,0,.2,1)`
replaces it**, and it is the standard material curve, which is what KICK settled on.

KICK's brand voice is "chaotically creative" ✅, but its interface motion is not chaotic at all: one
neutral curve, 22 times. **Keep the chaos in the deck and out of the product.** A real-time overlay
that animates constantly is nauseating. Animate **state changes and events**, never continuous data.
A number ticking up every 200ms should not animate each tick.

Respect `prefers-reduced-motion`.

---

## 7. Overlay-specific rules

If we ship an OBS browser source, different constraints apply — this is where teams that only designed for a webpage come unstuck.

- **Transparent background.** `body { background: transparent }`. Never paint a full-bleed backdrop.
- **Canvas 1920×1080**, designed at 1×. Assume it's scaled.
- **Safe margins: 64px** from every edge. Streamers crop, and platform UI overlaps corners.
- **Readable over arbitrary video.** Text needs a carrier — a semi-opaque plate (`rgba(11,11,12,.82)`) or a tight text shadow (`0 2px 8px rgba(0,0,0,.9)`). White text straight onto gameplay is unreadable half the time.
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

Paste into `tokens.css` on day one. **Every value marked ✅ is a KICK value**, read from their live CSS
on 25 July 2026 and cross-checked against `assets/reference/kick-neon-tokens.css`. Do not "improve"
one.

```css
:root{
  /* brand ✅ */
  --kick-green:#53FC18;         /* green-500 */
  --kick-green-bright:#75FD45;  /* green-400 */
  --kick-green-hover:#3AD903;   /* green-600 */
  --kick-green-dim:#2BA202;     /* green-700 */
  --kick-green-glow:rgba(83,252,24,.24);   /* ours */

  /* surfaces ✅ */
  --bg-base:#0B0B0C;            /* neutral-950 */
  --bg-surface:#171A1C;         /* neutral-900 */
  --bg-raised:#232629;          /* neutral-800 */
  --bg-overlay:rgba(11,11,12,.8);          /* surfaceOverlay-base */
  --border:rgba(240,241,242,.16);          /* outline-decorative */
  --border-strong:rgba(240,241,242,.4);    /* outline-region */

  /* text ✅ */
  --text-primary:#FFFFFF;
  --text-body:#E9ECED;          /* text-base */
  --text-secondary:#D3D8DB;     /* text-secondary */
  --text-muted:#9FA6AD;         /* neutral-400 */
  --text-disabled:rgba(240,241,242,.24);   /* disabled-onSurface */

  /* semantic ✅ */
  --live:#FB1818;               /* red-500 */
  --danger:#D80303;             /* red-600 */
  --warn:#FBA418;               /* orange-500 */
  --info:#1899FB;               /* blue-500 */

  /* chat username colours, the 16 KICK identity colours ✅ */
  --id-bubblegum:#FEA0CF; --id-celeste:#A0F6FE; --id-coral:#FEA0A0;
  --id-cyan:#18E9FB;      --id-lavender:#EACDFE; --id-lime:#B8FEA0;
  --id-melon:#FECDCD;     --id-mint:#18FBB0;    --id-mist:#A0FEDE;
  --id-neon:#75FD45;      --id-powder:#A0D5FE;  --id-rose:#FD72B8;
  --id-sand:#FEDAA0;      --id-sky:#45ADFC;     --id-sunshine:#FCB645;
  --id-violet:#D8A0FE;
  --id-on:#0B0B0C;              /* text on an identity fill */

  /* type ✅ Inter is KICK's face. Scale: 12 14 16 18 20 24 28 32 36 48 */
  --font-ui:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  --font-display:'Archivo','Inter',sans-serif;
  --font-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;

  /* radius, ours. KICK exposes no radius token 🔧 */
  --r-sm:4px; --r-md:6px; --r-lg:8px; --r-xl:12px; --r-full:9999px;

  /* elevation 🔧 */
  --shadow-md:0 4px 12px rgba(0,0,0,.4);
  --shadow-lg:0 8px 28px rgba(0,0,0,.55);
  --glow:0 0 0 3px var(--kick-green-glow);

  /* motion ✅ */
  --ease:cubic-bezier(.4,0,.2,1);           /* KICK's default, 22 uses */
  --ease-overlay:cubic-bezier(.16,1,.3,1);  /* menus and popovers */
  --ease-media:cubic-bezier(.87,0,.13,1);   /* brand surfaces only */
  --fast:120ms; --base:200ms; --overlay:400ms; --slow:400ms;
}

*{box-sizing:border-box}
body{
  margin:0; background:var(--bg-base); color:var(--text-body);
  font-family:var(--font-ui); font-size:16px; line-height:24px;
  -webkit-font-smoothing:antialiased;
}
.tabular{font-variant-numeric:tabular-nums}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
```

### Tailwind equivalent

```js
theme:{extend:{
  colors:{
    kick:{DEFAULT:'#53FC18',bright:'#75FD45',hover:'#3AD903',dim:'#2BA202'},
    base:'#0B0B0C', surface:'#171A1C', raised:'#232629',
    overlay:'rgba(11,11,12,.8)',
    line:{DEFAULT:'rgba(240,241,242,.16)',strong:'rgba(240,241,242,.4)'},
    ink:{DEFAULT:'#E9ECED',bright:'#FFFFFF',secondary:'#D3D8DB',muted:'#9FA6AD',off:'rgba(240,241,242,.24)'},
    live:'#FB1818', danger:'#D80303', warn:'#FBA418', info:'#1899FB',
  },
  fontFamily:{sans:['Inter','sans-serif'],display:['Archivo','Inter','sans-serif']},
  fontSize:{xs:'12px',sm:'14px',base:'16px',lg:'18px',xl:'20px','2xl':'24px','3xl':'28px','4xl':'32px','5xl':'36px','6xl':'48px'},
  borderRadius:{sm:'4px',md:'6px',lg:'8px',xl:'12px'},
  transitionTimingFunction:{DEFAULT:'cubic-bezier(.4,0,.2,1)',overlay:'cubic-bezier(.16,1,.3,1)',media:'cubic-bezier(.87,0,.13,1)'},
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

*Compiled 25 July 2026. Corrected 25 July 2026 against KICK's own neon tokens, read from their live
CSS. Tokens tagged ✅ are KICK values. Tokens tagged 🔧 are our construction, and Section 0 lists all
three of them. This file and `.claude/KICK-BRAND-IDENTITY.md` now agree, and Brand Identity Section 3
records what changed.*
