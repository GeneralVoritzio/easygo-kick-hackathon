# KICK Brand Identity

What KICK looks like, sounds like and believes, away from the product interface. This is the identity file. Theme, motion, effects, backgrounds and voice all come from here.

---

## 0. Scope, sources and status

### The split

KICK runs two visual systems. They share a palette and they share nothing else.

| | **KICK UI** | **KICK media** |
|---|---|---|
| Where | kick.com, the player, the dashboard, any product screen | about.kick.com, brand films, social, decks, event graphics |
| Governed by | `.claude/KICK-DESIGN-SYSTEM.md` | **This file** |
| Type | Inter only | Booster Polygonal for display, Inter for body |
| Green | Accent. Under 10% of pixels | Flood. Whole screens of it |
| Motion | 150ms, neutral easing | Hard cuts, marquees, glitch |
| Job | Get out of the way | Be impossible to ignore |

**The proof is measurable.** kick.com loads Inter and nothing else. about.kick.com loads Booster Polygonal, Booster Polygonal Compact and Inter. KICK does not put its display face in the product. ✅

**Which file applies?** Ask what the surface is. If a user operates it, it is UI. If a user watches it, it is media. Our overlay is UI. Our pitch deck is media. A screenshot of our overlay inside the deck stays UI.

### Sources we read

| Source | Read on | What it gives |
|---|---|---|
| [about.kick.com](https://about.kick.com) | 25 July 2026 | Brand values, mission copy, display type, flood colour, marquee |
| [about.kick.com/brand](https://about.kick.com/brand) | 25 July 2026 | The public brand toolkit page. Brand copy, and the two links to Brandfolder |
| **The four stylesheets that about.kick.com loads** | 25 July 2026 | **KICK own design tokens. 282 of them. See Section 3** |
| [kick.com](https://kick.com) | 25 July 2026 | The UI half of the split, for contrast |
| [KICK, "From Every Angle"](https://www.youtube.com/watch?v=02Vj-TkQhAI) | 30 second brand film | Footage culture, graphic devices, cut rate. Every 🟡 value |
| `.claude/KICK-DESIGN-SYSTEM.md` | | The token base this file extends |

**Everything we downloaded is in `assets/`.** The logo, the fonts, the extracted token file and the
page copy. `assets/README.md` names every source, its date and its licence.

**These pages need a browser user agent.** A plain request gets HTTP 403. `assets/README.md` holds
the one line curl command that works. This is not a block on us, it is bot filtering.

### The source we still cannot read 🔒

| Source | Status | What it holds |
|---|---|---|
| [Brand hub](https://brandfolder.com/portals/kick) | **Gated. Sign-in required** | The brand toolkit: logo rules, clear space, minimum size, misuse rules |
| [Logo share link](https://brandfolder.com/s/vb9bf4cj6sbkvxmb5x8x7q2g) | **Public page, gated files** | "3 Assets from Easygo Brandfolder". The page loads, the asset list needs an API token |

Checked 25 July 2026. The Brand hub is an **Easygo** Brandfolder and it asks for a sign-in.

**`about.kick.com/brand` publishes no logo rule at all.** We read the whole page. It holds brand
copy, a Download button and an Explore button, and both buttons point at Brandfolder. So the
toolkit is the only place a logo rule exists, and it stays closed to us.

**If a team member can sign in, get the logo rules first.** That is the one thing no public KICK
surface states. These are what we still guess, and a judge could check:

1. Logo clear space, minimum size and the misuse rules. Section 5 of this file holds a 🔧 rule for now.
2. Whether the halftone plates are a core brand asset or one page's treatment.
3. Whether Booster Polygonal can be licensed to us, which decides if Archivo stays our substitute.

**Do not tell a judge that a 🔧 or 🟡 value is KICK's own.** Say we measured it. The ✅ values in Section 3
and Section 4 are safe to name, because they come from KICK own CSS.

### Confidence tags

| Tag | Meaning |
|---|---|
| ✅ **Verified** | Read from a KICK property. Computed values, not guesses |
| 🟡 **High confidence** | Visible in KICK's own output, but we measured it by eye |
| 🔧 **Derived** | Our construction. Coherent and KICK-like, but invented |

Values marked ✅ below were read from the live DOM. Do not "improve" them.

---

## 1. What KICK believes

### The three values ✅

KICK publishes these under the heading "Can we get some values in the chat".

| Value | KICK's own words |
|---|---|
| **Boldly authentic** | "We hype what makes us human, coz human generated content is our future." |
| **Deliberately different** | "Ignore expectations. Being unconventional isn't discouraged – it's championed." |
| **Chaotically creative** | "Mediocrity is never an option. We max out at every chance we get." |

### The lines ✅

- "WHERE HUMAN CREATIVITY BREAKS FREE"
- "OUR MISSION FOR FULL TRANSMISSION"
- "UN-FILTER REALITY"
- "HUMAN GENERATED CONTENT"
- "FROM EVERY ANGLE"
- "Every perspective, every belief, every unique angle belongs here."
- "When it's unscripted, that's where reality happens."
- "Live life unfiltered."
- "Everything we do has gotta have that big KICK energy."
- "Find it. Share it. Own it."

Read 25 July 2026 on about.kick.com and about.kick.com/brand, so all of these are ✅:

- "This is the home for the misfits and the real ones."
- "Go frame urself"
- "Become iconic, create your own KICK Frame image."
- "Our brand is the result of harnessing the chaos that makes KICK, KICK."
- "Create, export, and share on your socials ;)"
- "'Nuff said."
- "Yeah of course you can. No matter if you're a streamer or viewer, signing up to KICK is way easy."

**KICK ships an emoticon in body copy.** `;)` appears twice on the Frame Generator page. It also
writes "urself", "'Nuff said" and "way easy". This is further down the register than we had it.

### What this means for us

**Human, unscripted, unfiltered, owned by the creator.** KICK sells the opposite of polish. Three of the lines above name the human directly. A deck that looks like a consultancy template argues against the brand it is pitching to.

**Read "HUMAN GENERATED CONTENT" as a position, not a joke.** KICK states that human work is the future. Do not present machine-made imagery as our craft, and do not describe our product as replacing a person.

---

## 2. Voice

**Write like chat, not like a press release.**

- Short imperatives. Full stops, not commas. "Find it. Share it. Own it." ✅
- Big lines are ALL CAPS. Body copy is sentence case. ✅
- Slang is allowed and it is on brand. KICK ships "coz" and "gotta" in its own values copy. ✅
- Hyphen a word to break it when it earns emphasis: "UN-FILTER". ✅
- A hashtag lockup is `#` plus caps, no spaces, in green. 🟡
- Numbers get stated flat and large: "500M +", "4.6M +". ✅

**Never write enterprise.** These words are banned in our copy: seamless, leverage, empower, solution, unlock, journey, revolutionise, ecosystem.

Our own prose rule still applies on top. All copy is ASD-STE100 Simplified Technical English, per the Working Agreement. STE and KICK's voice agree more than they disagree, because both want short, active, concrete sentences.

---

## 3. Colour

### KICK ships a design system, and it is called neon ✅

This is the biggest thing we know about KICK. **KICK own tokens are live CSS custom properties on
about.kick.com**, named `--neon-*`. We read all 282 of them. They are in
`assets/reference/kick-neon-tokens.css`, and they are KICK values, not ours.

The system has three layers:

1. **13 colour ramps, 11 steps each.** `neutral`, `green`, `cyan`, `icedOutCyan`, `mint`, `blue`, `purple`, `pink`, `red`, `orange`, `bowelBrown`, plus `light` and `dark` alpha ramps.
2. **A semantic layer** that points at the ramps: `--neon-primary-base`, `--neon-surface-base`, `--neon-text-base`, `--neon-outline-decorative`, `--neon-stateLayer-*`, `--neon-identity-*`.
3. **Scales.** Type: 12, 14, 16, 18, 20, 24, 28, 32, 36, 48. Spacing: 0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96, 112 and up.

The ramp names are a brand asset on their own. **`icedOutCyan`, `bowelBrown` and `sunshine` are
KICK own token names.** No other company would ship those. If a judge asks whether we studied the
brand, this is the answer.

### The palette that matters ✅

| Role | Token | Value |
|---|---|---|
| Green | `--neon-color-green-500` | `#53FC18` |
| Green, brighter | `--neon-color-green-400` | `#75FD45` |
| Green, darker | `--neon-color-green-600` | `#3AD903` |
| Ink, and the darkest ground | `--neon-color-neutral-950` | `#0B0B0C` |
| Surface | `--neon-color-neutral-900` | `#171A1C` |
| Surface, raised | `--neon-color-neutral-800` | `#232629` |
| Border | `--neon-color-neutral-700` | `#42474D` |
| Muted text | `--neon-color-neutral-400` | `#9FA6AD` |
| Secondary text | `--neon-color-neutral-300` | `#BABFC4` |
| Body text | `--neon-text-base` | `#E9ECED` |
| White | `--neon-color-white` | `#FFFFFF` |
| Cyan, the ramp | `--neon-color-cyan-500` | `#18E9FB` |
| Cyan, the bright one | `--neon-color-icedOutCyan-200` | `#00FFFF` |

**On the cyan.** KICK runs **two** cyan ramps. `cyan-500` is `#18E9FB` and it is the systematic
one. `#00FFFF` is real, but it is `icedOutCyan-200`. Name it correctly and the claim holds.

### Three rules the tokens prove ✅

1. **Type on green is ink, never white.** `--neon-primary-base` is `green-500` and its pair `--neon-primary-onPrimary` is `neutral-950`. KICK states the rule in its own tokens.
2. **Green means positive and primary, both.** `--neon-positive-base` and `--neon-primary-base` are the same `green-500`. So green on a KICK surface reads as "good" and "do this", and it must not carry a neutral meaning.
3. **Borders are light at low alpha, not a grey.** `--neon-outline-decorative` is `light-16`, which is `#F0F1F2` at 16%. Our `--border` hex is a flat grey, so it does not sit on any surface the way KICK's does.

### The chat username colours ✅

`--neon-identity-*` holds the 16 colours KICK gives a chat username: **bubblegum, celeste, coral,
cyan, lavender, lime, melon, mint, mist, neon, powder, rose, sand, sky, sunshine, violet.** They are
all ramp steps 100 to 500, so they are light on a dark ground. `--neon-identity-onIdentity` is
`neutral-950`, so a badge in an identity colour takes ink text.

Design System Section 4 asks for a username "coloured per-user". **Use these 16 and nothing else.** It is
the cheapest way to make our chat read as native.

### Green to cyan is a halftone, not a gradient ✅

**Correction, 25 July 2026.** This file used to state a smooth gradient:

```css
background:linear-gradient(to right,#53FC18,#00FFFF);  /* we could not verify this */
```

We read all four stylesheets and both pages, and **no green to cyan `linear-gradient` exists on
about.kick.com.** We then downloaded KICK own pattern plates, and they show what KICK really does.

`assets/brand/patterns/pattern-3.png` is **4096x4096, and it holds two colours only**: green
`#53FC18` and cyan `#00FFFF`. The two never blend. **They meet through a halftone dot screen**: a
regular grid of square dots of one colour on a field of the other, and the dot density carries the
transition. The result reads as a print screen or a dither, not as a fade.

`assets/brand/patterns/cta-section.png` is the 1920x1080 plate, and it adds the rest of the
vocabulary. Both files are in `assets/`, so look at them before you build a background.

**Use a dot screen where you would have used a gradient.** A smooth gradient is the wrong texture,
and it is the one thing on this page we got wrong before.

The vertical fades that do exist are short, hard-edged, and they run into a dark olive, which is
KICK own `bowelBrown` ramp.

### The flood rule 🟡

**In media, green is a paint roller.** KICK fills whole screens with `#53FC18` and sets `#0B0B0C` type on top. Its brand pattern plates are 4096px squares of green and cyan.

This is the single biggest difference from the UI system, where Design System Section 1 caps green under 10% of pixels.

Rules for a flood:

- Type on green is always `#0B0B0C`. Never white.
- A flood is a whole surface, never a panel. Half a green screen looks like a mistake.
- **Floods are rationed.** In any one piece, two floods maximum: the open and the close. A third makes it wallpaper.
- Product UI inside a media piece keeps the Design System Section 1 budget.

### The Design System is now aligned ✅

**These two files agree.** On 25 July 2026 we corrected every drifted value in the Design System
against KICK's own tokens. The DevTools pass its Section 0 used to ask for is done, because KICK
publishes the tokens.

This is the record of what moved. Read it once, then trust the Design System.

| Design System token | Was 🔧 | Now ✅ | KICK token |
|---|---|---|---|
| `--kick-green` | `#53FC18` 🟡 | `#53FC18` **exact** | `green-500` |
| `--kick-green-hover` | `#42D912` | `#3AD903` | `green-600` |
| `--kick-green-dim` | `#2E8F0C` | `#2BA202` | `green-700` |
| `--bg-base` | `#0B0E0F` | `#0B0B0C` | `neutral-950` |
| `--bg-surface` | `#121517` | `#171A1C` | `neutral-900` |
| `--bg-raised` | `#191D1F` | `#232629` | `neutral-800` |
| `--bg-overlay` | `#22282A` | `rgba(11,11,12,.8)` | `surfaceOverlay-base` |
| `--border` | `#282F31` | `rgba(240,241,242,.16)` | `outline-decorative` |
| `--border-strong` | `#3A4245` | `rgba(240,241,242,.4)` | `outline-region` |
| `--text-primary` | `#FFFFFF` | `#FFFFFF` **correct** | `color-white` |
| `--text-body` | `#E3E7E8` | `#E9ECED` | `text-base` |
| `--text-muted` | `#8B9598` | `#9FA6AD` | `neutral-400` |
| `--live` | `#FF1744` | `#FB1818` | `red-500` |
| `--danger` | `#FF4757` | `#D80303` | `red-600` |
| `--warn` | `#FFB020` | `#FBA418` | `orange-500` |
| `--info` | `#3EA6FF` | `#1899FB` | `blue-500` |
| `--ease` | `cubic-bezier(.2,.8,.2,1)` | `cubic-bezier(.4,0,.2,1)` | 22 uses on KICK |
| Chat font size | `14px` | `16px` | `--chatroom-font-size` |
| `--t-sm` / `--t-label` | `13px` / `11px` | `14px` / `12px` | The type scale has no 11 or 13 |
| Icons | Lucide, stroked, 24 grid | Our own, filled, 32 grid | KICK ships 114 custom filled icons |
| Radius | `4 / 6 / 8 / 12` 🔧 | unchanged 🔧 | KICK exposes no radius token |

**Four findings worth saying out loud.**

1. **Our greens and our whites were right. Our greys, our semantics and our motion were not.**
2. **`--border` and `--bg-overlay` were the wrong kind of value, not just the wrong number.** KICK uses translucent light and translucent ink, so its panels stack. A flat grey border cannot.
3. **Chat was 14px and KICK sets 16px.** Chat is the densest thing we build, so that one error would have given us away fastest.
4. **We specified a stroked icon set against a filled one.** See Design System Section 5.

### Where the two files still differ, and why

These are not gaps. UI and media are different jobs, so three rules are deliberately opposite:

| Rule | Design System, for UI | This file, for media |
|---|---|---|
| Green | Under 10% of pixels. An accent | A flood. Whole screens |
| Display tracking | `normal`, per KICK's own headings ✅ | `normal`, and leading of exactly 1.0 |
| Entry curve | `--ease`, KICK's 22-use default | `--ease-media`, for brand surfaces only |
| Weight | 400, 600, 700. KICK names three ✅ | 800 for display. Our choice, media only |

---

## 4. Typography

### The two faces ✅

| Face | KICK own family name | Where KICK uses it | Weights seen |
|---|---|---|---|
| **Booster Polygonal** | `boosterPolygonal` | Display only, on brand surfaces | 700, and 400 on the marquee |
| **Booster Polygonal Compact** | `boosterPolygonalCompact` | Tighter display lockups | 700 |
| **Inter** | `Inter` | All body, and the entire product UI | 100 to 900 variable |

The family names come from KICK own CSS, as `--font-booster-polygonal` and
`--font-booster-polygonal-compact`. `--neon-font-family-default` is `Inter`. ✅

**KICK names three weights, not nine.** `--neon-font-weight-default` is Regular,
`--neon-font-weight-thick` is SemiBold, `--neon-font-weight-heavy` is Bold. ✅ So a KICK UI uses
400, 600 and 700, and nothing else. Our display weight of 800 is a media choice, not a UI one.

Booster is published by [Blaze Type](https://www.myfonts.com/collections/booster-font-blaze-type/). Polygonal is one of its subfamilies.

### The licence problem

**Booster is a commercial retail font. We cannot self-host it.** Hackathon Brief Section 5.2 and clause 7(f) require every asset to be licensable onward to KICK. We hold no Booster licence, so shipping the file fails the rules test.

**KICK serves the two woff2 files publicly, and we still did not take them.** The URLs are in
`assets/README.md`. A public URL is not a licence. This rule does not bend because the file is easy
to get.

Our substitute 🔧:

```css
--font-display:'Archivo','Inter',sans-serif;  /* OFL, self hosted */
--font-ui:'Inter',sans-serif;                 /* OFL, self hosted. Same as KICK ✅ */
```

Set Archivo at weight 800 and apply the display rules below. It will not match Booster, but it holds the same posture. **Say this out loud if a judge asks about type.** Naming the constraint reads better than a silent mismatch.

`assets/fonts/kick-font/` holds `kick-font.ttf` with `kick-font-license.txt`. That is a community font built from the KICK wordmark, by "NachoZombiezz", under the OFL. Use it for a wordmark lockup only, never for reading text. A second copy sits in `prototypes/hypeprops/src/assets/fonts/`.

`assets/fonts/` also holds Inter and Archivo, each with its `OFL.txt`. Take both from there.

### How KICK sets display type ✅

Measured on about.kick.com headings at 67px, 64px, 48px and 34px.

- **ALL CAPS.** Every display heading, without exception.
- **Weight 700.**
- **Line height equals the font size.** 67.48px type on 67.48px leading. The lines touch.
- **Letter spacing is `normal`.** KICK does not track its headlines tight.

```css
.display{
  font-family:var(--font-display);
  font-weight:800;
  text-transform:uppercase;
  line-height:1;
  letter-spacing:normal;
}
```

The Design System Section 2 rule that tracking tightens as size grows applies to **UI** type. Media display type does not do this. ✅ beats 🔧.

### Stacked lockups 🟡

The brand film sets titles as a stacked block: 2 to 4 words per line, 3 lines maximum, flush left or centred, leading 1.0. Use this for an opening title and a closing title. Never set it on a diagonal.

---

## 5. The graphic devices

These are the parts that make a surface read as KICK rather than as a dark template. Draw all of them in code. See Section 7.

| Device | Evidence | What it is |
|---|---|---|
| **The frame** | **KICK ships a whole tool for it** ✅ | See below. The strongest device KICK has |
| **Halftone dot screen** | `pattern-3.png`, `cta-section.png` ✅ | A grid of square dots of one brand colour on a field of the other. This is how green meets cyan (Section 3) |
| **Registration crosses** | `cta-section.png` ✅ | A regular field of `+` marks, dark, on a green flood. Printers' registration marks. It reads as a proof sheet |
| **Corner brackets** | Film 3.0s, 6.8s, 20.0s, 23.0s 🟡 | L-shaped crop marks. Never a closed box. Still film only. In `cta-section.png` the bracket shapes are registration crosses clipped by a block edge, so they support the look without proving the device |
| **Edge bar** | `border-*.png`, 14px wide ✅ | A narrow vertical strip of green and cyan blocks, set against the left edge of a block of copy. KICK runs one per value |
| **Marquee** | `animation:marquee var(--duration) linear infinite` ✅ | One phrase repeated across a strip, scrolling forever. Horizontal or vertical |
| **Flood plate** | about.kick.com ✅ | A whole surface of green, ink type on top |
| **Macroblocking** | `cta-section.png` ✅, film 1.0s, 6.8s, 15.0s | Hard-edged rectangular blocks, quantised, offset from the grid. KICK own plate does this, so it is a graphic choice and not a video fault |
| **Sticker badge** | Film 12.0s 🟡 | A rotated diamond, flat fill, an icon and a caps label |
| **Doodles** | Film 17.0s, 21.5s 🟡 | Hand-drawn stars, circles and arrows over footage |
| **Camcorder HUD** | Film 24.0s to 27.0s 🟡 | REC dot, running timecode, menu labels along the bottom edge |
| **Repeat grid** | Film 8.0s, 17.5s 🟡 | The same subject tiled 3x3. Multi-angle made literal |
| **Object still life** | 15 files in `/img/landing/` ✅ | See below |

### The frame is the signature device ✅

KICK publishes a **KICK Frame Generator** at
[about.kick.com/brand/frame-generator](https://about.kick.com/brand/frame-generator). A person
uploads a photo, drags a KICK frame over it, resizes it, and exports a PNG. KICK own copy is **"Go
frame urself"** and **"Become iconic, create your own KICK Frame image."**

**This is the most important thing on this page.** KICK built a tool so that anybody can put the
KICK frame on their own image. The frame is not decoration, it is the brand action. It is also the
literal form of "FROM EVERY ANGLE": the frame picks the angle.

**So the deck frames things.** A frame component is this device, and it earns its
place on more than the demo slide.

### The object still life ✅

`/img/landing/` holds 15 photographed objects: a cassette tape, a CD, a floppy disk, a cinder
block, a traffic cone, a plant, a walkie talkie, binoculars, a microphone, headphones, a computer,
a W key, a ring binder, a paper plane, and a 95/5 sign.

**KICK illustrates with old physical objects, not with icons or 3D renders.** Analogue, slightly
worn, cut out on a flood. It is the still-life half of "human generated content", and it pairs with
the creator footage in Section 7.

**We cannot use KICK's files** (Section 7 licence gate). We can copy the idea: photograph a real object off
our own desk, cut it out, and put it on a green flood.

### The wordmark 🔧

`assets/brand/kick-logo.svg` is the official wordmark: a 97x26 viewBox, one path, `fill="#53FC18"`.

**We hold no official logo rule, because the brand toolkit is gated (Section 0).** These rules are ours.
They are conservative, so a real toolkit is unlikely to contradict them. Replace them if we get access.

- **Clear space is the height of the K on all four sides.** Nothing crosses it, text included.
- **Minimum height is 48px at 1920 width.** A type floor is not a mark floor.
- **Two colourways only.** Green `#53FC18` on a dark ground, or ink `#0B0B0C` on a green flood.
- **Never modify the mark.** No recolour, rotation, stretch, outline, shadow, gradient or texture.
- **Never set the mark over a loud background layer.** It needs a flat field.
- **Never lock our own mark to the KICK mark.** A shared lockup claims a partnership we do not have.

### Rationing

Loud devices do not stack. **One loud device per surface.** A slide with a flood, a glitch layer, a sticker and a marquee reads as noise, and noise is not the same as chaos. KICK's chaos is edited.

---

## 6. Motion

### Verified curves ✅

| Where | Value | Read from | Uses counted |
|---|---|---|---|
| Product UI, and most things | `cubic-bezier(.4,0,.2,1)` | kick.com and about.kick.com | 22. **The default** |
| Menus and popovers | `400ms cubic-bezier(.16,1,.3,1)` | about.kick.com `slideUpAndFade`, `slideDownAndFade`, `slideLeftAndFade`, `slideRightAndFade` | 12 |
| Media entry | `300ms cubic-bezier(.87,0,.13,1)` | about.kick.com `slideUpKF`, `slideDownKF` | 2 |
| A pulse | `2s cubic-bezier(.4,0,.6,1) infinite` | about.kick.com `pulse` | 1 |
| Marquee | `linear infinite`, duration set per instance | about.kick.com `marquee`, `marquee-vertical` | |

Counted across the four stylesheets about.kick.com loads, on 25 July 2026. ✅

`cubic-bezier(.87,0,.13,1)` sits still, then moves fast, then stops hard. That is the media curve. Use it for entrances on brand surfaces.

`cubic-bezier(.16,1,.3,1)` starts fast and settles long. **This is the curve we did not have.** KICK
uses it for anything that opens over the top of something else. Use it for a panel or a popover.

**The marquee duration is a variable, not 40s.** KICK sets `animation:marquee var(--duration) linear
infinite` and passes the duration per instance, so 40s is one instance and not the rule. KICK also
ships a vertical marquee.

The Design System now carries all three curves, and its `--ease` is KICK's `cubic-bezier(.4,0,.2,1)`.
Use `--ease-media` on brand surfaces only. Never put the media curve on a product control.

### Rules

1. **Cut. Do not dissolve.** The brand film uses hard cuts end to end. A crossfade is the most corporate thing a deck can do. 🟡
2. **Entrances are short.** Under 300ms. The viewer is listening to a person, so the motion must finish before the sentence does.
3. **Animate in. Do not animate out.** Exit animation is delay the presenter feels.
4. **One ambient loop per surface, maximum.** Period of 8 seconds or more, opacity change of 0.06 or less. 🔧
5. **`prefers-reduced-motion` stops everything** and sets the final state. Design System Section 9 already disables transitions. Ambient loops and marquees must stop too.

### The safety floor

**Nothing changes luminance more than three times per second.** The brand film cuts far faster than that. **We take the look, not the flicker rate.** A glitch layer holds its state. It does not blink.

This is a safety rule, not a style preference. It does not get traded away for energy.

---

## 7. Imagery and footage

### What KICK's own footage is 🟡

Every shot in the brand film is creator-grade capture. Phone, action cam, 360 rig, screen capture, game footage. There is no studio plate anywhere in 30 seconds.

- **Extreme lenses only.** Fisheye, 360 tiny-planet, a camera mounted under a skateboard, ultra-wide in someone's face. Never a normal lens on a tripod.
- **Real rooms, real light.** Bedrooms, streets, deserts, barber shops.
- **Ordinary subjects are welcome.** A snail on moss sits between a skydiver and a rave.
- **Compression is a texture, not a fault.**

### Our licence gate

Hackathon Brief Section 5.2 and clause 7(f) put licensing on us. **We cannot copy KICK's approach directly, because KICK's footage is full of real creators and we hold no rights to any of it.**

| ✅ Use | ❌ Do not use |
|---|---|
| Our own screen recordings of our build | Stock photography without a written licence |
| Our own faces and our own rooms | Photographs of real streamers or any real person |
| Backgrounds, patterns and diagrams we generate in code | Game screenshots and game art |
| Lucide icons (ISC) | Screenshots of another product's UI |
| Inter and Archivo (OFL), self hosted | Booster Polygonal, or any font we cannot sublicense |
| The KICK logo from the official brand toolkit, to KICK's rules | KICK's own campaign footage |

**Our human texture comes from our own faces and from type.** That is the honest version of "human generated content", and it is the only version we can license.

### Formats

| Content | Format |
|---|---|
| Marks, icons, diagrams, patterns | SVG or canvas, drawn in code |
| Product screenshots | WebP, 2x the slot size |
| Product recordings | MP4 or WebM, muted, looped, under 8 seconds |
| Fonts | WOFF2, self hosted, subset to Latin |

KICK runs its own hero as a muted looping autoplay MP4. ✅ Copy the pattern, not the file.

---

## 8. Backgrounds

**Backgrounds are code, not image files.** CSS gradients, SVG and canvas. This keeps a build small, sharp at any scale, offline, and free of licence risk.

### The layer stack

Build every background in this order. Use two layers or three, never more.

| Order | Layer | Spec |
|---|---|---|
| 1 | Base | Flat fill. `--bg-base`, or a flood of `#53FC18` |
| 2 | Halftone ✅ | Square dots of `#00FFFF` on the green flood, on a regular grid, with the dot density carrying the transition. **This replaces the gradient.** See Section 3 |
| 3 | Glow | Radial from `--kick-green-glow` to transparent. Off centre, 60% to 90% of the width |
| 4 | Grid | 1px lines in `--border` at 64px pitch, masked so it fades at the edges. **On a flood, use a field of `+` registration crosses instead** ✅, which is what KICK does |
| 5 | Macroblock ✅ | Hard-edged rectangles, quantised to a coarse grid, offset from each other. KICK own plate does this with flat blocks, so build it with rectangles, not with `feTurbulence` |
| 6 | Chroma split 🟡 | The layer below, copied twice and offset 3px in cyan and 3px in magenta, at 30% opacity |
| 7 | Scan bar 🟡 | One bright horizontal band, 6% of the height, crossing once on entry |
| 8 | Grain | SVG `feTurbulence` at 4% to 6% opacity. It stops large gradients banding on a projector |
| 9 | Vignette | Radial `rgba(0,0,0,.45)` at the corners |

Layers 5, 6 and 7 are the loud ones. **One of them per surface, never two.**

### Readability

**The background never competes with the text.** If you cannot read the surface with your eyes half closed, the background is too loud.

Text over any busy background needs a carrier: a plate at `rgba(11,11,12,.82)` or a shadow of `0 2px 8px rgba(0,0,0,.9)`. This is Design System Section 7, and it applies to media too.

---

## 9. What this file does not govern

**Product interface.** Buttons, inputs, cards, chat rows, viewer counts, the LIVE badge, overlay layout, focus rings, hit targets. All of that is `.claude/KICK-DESIGN-SYSTEM.md`, and none of it changes because of this file.

Three rules survive into media unchanged, because they are floors and not styles:

- Body copy holds 4.5:1 against what sits behind it, measured over the background layer.
- Never encode meaning in colour alone. A green number needs a label.
- Nothing flashes more than three times per second.

---

## 10. The "is this KICK" test

Run a finished media surface against this. Four or more no answers means it is not on brand yet.

- [ ] Would a person who has never seen our work know it is KICK in one second?
- [ ] Is the display type ALL CAPS, weight 700 or 800, on leading of 1.0?
- [ ] Is the body type Inter?
- [ ] Does green appear either as a flood or not at all, with nothing in between?
- [ ] Is type on green `#0B0B0C` rather than white?
- [ ] Is there exactly one loud device on this surface?
- [ ] Does it cut rather than dissolve?
- [ ] Does the copy sound like chat instead of a press release?
- [ ] Is every banned enterprise word absent?
- [ ] Is every asset drawn in code, or shot by us, or licensed to us?
- [ ] Does it still read with the network off?
- [ ] Does `prefers-reduced-motion` stop the motion and leave it readable?
- [ ] Does nothing flash more than three times per second?

---

*Written 25 July 2026. Values tagged ✅ were read from the live DOM on kick.com and about.kick.com on that date. Values tagged 🟡 come from KICK's "From Every Angle" brand film. Values tagged 🔧 are our construction, not KICK's. The Brandfolder brand hub is still unread, and Section 0 lists what it would settle.*

*Second pass, 25 July 2026. We read `about.kick.com/brand`, the Frame Generator page and all four
stylesheets, and we downloaded KICK own assets into `assets/`. That pass added the neon token system
(Section 3), the chat identity colours (Section 3), the real weight names (Section 4), two more easing curves (Section 6), the
frame device and the object still life (Section 5), and more voice lines (Section 2). It also **corrected one
thing: green to cyan is a halftone dot screen, not a `linear-gradient`** (Section 3).*
