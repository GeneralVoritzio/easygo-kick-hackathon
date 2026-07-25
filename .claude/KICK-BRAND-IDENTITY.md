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
| [about.kick.com](https://about.kick.com) | 25 July 2026 | Brand values, mission copy, display type, flood colour, marquee. Every ✅ value in §1 to §4 |
| [kick.com](https://kick.com) | 25 July 2026 | The UI half of the split, for contrast |
| [KICK, "From Every Angle"](https://www.youtube.com/watch?v=02Vj-TkQhAI) | 30 second brand film | Footage culture, graphic devices, cut rate. Every 🟡 value |
| `.claude/KICK-DESIGN-SYSTEM.md` | | The token base this file extends |

### The source we have not read 🔒

| Source | Status | What it would settle |
|---|---|---|
| [Brandfolder portal](https://brandfolder.com/portals/kick) | **Gated. Sign-in required** | The official brand toolkit: logo lockups, clear space, minimum size, misuse rules, the real greys, confirmed type names |
| [about.kick.com/brand](https://about.kick.com/brand) | **Blocked to us** | The same toolkit, linked from the public site |

Checked 25 July 2026. The Brandfolder link resolves to an **Easygo** portal and it asks for a
sign-in, so no value in this file comes from it. This is the reason §3 and §4 still carry 🔧 tags.

**If a team member can sign in, read it and correct §3, §4 and §5 before 1 August.** These are the
things we currently guess and a judge could check:

1. Logo clear space, minimum size and the misuse rules. We hold no rule for any of them.
2. The official secondary palette. We took cyan `#00FFFF` from the DOM, not from a toolkit.
3. The display face and its licence terms, which decide if Archivo stays our substitute (§4).
4. Whether the green to cyan gradient is a brand asset or one page's treatment.

Until then, **do not tell a judge that a 🔧 or 🟡 value is KICK's own.** Say we measured it.

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

### Verified brand palette ✅

Read from the live DOM on about.kick.com and kick.com.

| Role | Value | Notes |
|---|---|---|
| Green | `#53FC18` | The signature. Confirmed on both properties |
| Cyan | `#00FFFF` | The real secondary. It is not a glitch artefact |
| Ink | `#0B0B0C` | Text on green. Also the darkest ground |
| Surface | `#171A1C` | Panels |
| Border | `#42474D` | Also used at 20% opacity |
| Muted text | `#9FA6AD` | |
| Secondary text | `#BABFC4` | |
| White | `#FFFFFF` | The dominant text colour by a wide margin |

### The gradient ✅

```css
background:linear-gradient(to right,#53FC18,#00FFFF);
```

Green to cyan, left to right. KICK uses this on its own brand surfaces, and its full-bleed pattern plates are built from the same two colours.

### The flood rule 🟡

**In media, green is a paint roller.** KICK fills whole screens with `#53FC18` and sets `#0B0B0C` type on top. Its brand pattern plates are 4096px squares of green and cyan.

This is the single biggest difference from the UI system, where Design System §1 caps green under 10% of pixels.

Rules for a flood:

- Type on green is always `#0B0B0C`. Never white.
- A flood is a whole surface, never a panel. Half a green screen looks like a mistake.
- **Floods are rationed.** In any one piece, two floods maximum: the open and the close. A third makes it wallpaper.
- Product UI inside a media piece keeps the Design System §1 budget.

### Where the Design System disagrees

The Design System is locked, so this file does not change it. These gaps are reported, not fixed. Design System §0 already asks for a DevTools pass to correct flagged values, and this is that pass.

| Token | Design System | Measured on KICK ✅ |
|---|---|---|
| `--kick-green` | `#53FC18` 🟡 | `#53FC18`. **Promote to verified** |
| `--bg-base` | `#0B0E0F` 🔧 | `#0B0B0C` |
| `--bg-surface` | `#121517` 🔧 | `#171A1C` |
| `--border` | `#282F31` 🔧 | `#42474D` |
| `--text-muted` | `#8B9598` 🔧 | `#9FA6AD` |
| `--r-sm` / `--r-lg` / `--r-full` | `4px` / `8px` / `9999px` 🔧 | `4px`, `8px`, `9999px`. **All three correct** |

The radius scale was a good guess. The greys run about one step darker than KICK's. Ask before changing the locked file.

---

## 4. Typography

### The two faces ✅

| Face | Where KICK uses it | Weights seen |
|---|---|---|
| **Booster Polygonal** | Display only, on brand surfaces | 700, and 400 on the marquee |
| **Booster Polygonal Compact** | Tighter display lockups | 700 |
| **Inter** | All body, and the entire product UI | 100 to 900 variable |

Booster is published by [Blaze Type](https://www.myfonts.com/collections/booster-font-blaze-type/). Polygonal is one of its subfamilies.

### The licence problem

**Booster is a commercial retail font. We cannot self-host it.** Hackathon Brief §5.2 and clause 7(f) require every asset to be licensable onward to KICK. We hold no Booster licence, so shipping the file fails the rules test.

Our substitute 🔧:

```css
--font-display:'Archivo','Inter',sans-serif;  /* OFL, self hosted */
--font-ui:'Inter',sans-serif;                 /* OFL, self hosted. Same as KICK ✅ */
```

Set Archivo at weight 800 and apply the display rules below. It will not match Booster, but it holds the same posture. **Say this out loud if a judge asks about type.** Naming the constraint reads better than a silent mismatch.

The repo also holds `prototypes/hypeprops/src/assets/fonts/kick-font.ttf` with `kick-font-license.txt`. That is a community font built from the KICK wordmark, under the OFL. Use it for a wordmark lockup only, never for reading text.

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

The Design System §2 rule that tracking tightens as size grows applies to **UI** type. Media display type does not do this. ✅ beats 🔧.

### Stacked lockups 🟡

The brand film sets titles as a stacked block: 2 to 4 words per line, 3 lines maximum, flush left or centred, leading 1.0. Use this for an opening title and a closing title. Never set it on a diagonal.

---

## 5. The graphic devices

These are the parts that make a surface read as KICK rather than as a dark template. Draw all of them in code. See §7.

| Device | Evidence | What it is |
|---|---|---|
| **Corner brackets** | Film 3.0s, 6.8s, 20.0s, 23.0s 🟡 | Four L-shaped crop marks around a subject. Never a closed box. The campaign's signature, and the literal meaning of "from every angle" |
| **Marquee** | `marquee 40s linear infinite` ✅ | One phrase repeated across a strip, scrolling forever. KICK runs "UN-FILTER REALITY" this way |
| **Flood plate** | about.kick.com ✅ | A whole surface of green, black type on top |
| **Green to cyan** | ✅ | The gradient and the pattern plates |
| **Glitch and datamosh** | Film 1.0s, 6.8s, 15.0s 🟡 | Macroblocking, chroma-key spill, cyan and magenta fringing, scan bars |
| **Sticker badge** | Film 12.0s 🟡 | A rotated diamond, flat fill, an icon and a caps label |
| **Doodles** | Film 17.0s, 21.5s 🟡 | Hand-drawn stars, circles and arrows over footage |
| **Camcorder HUD** | Film 24.0s to 27.0s 🟡 | REC dot, running timecode, menu labels along the bottom edge |
| **Repeat grid** | Film 8.0s, 17.5s 🟡 | The same subject tiled 3x3. Multi-angle made literal |

### Rationing

Loud devices do not stack. **One loud device per surface.** A slide with a flood, a glitch layer, a sticker and a marquee reads as noise, and noise is not the same as chaos. KICK's chaos is edited.

---

## 6. Motion

### Verified curves ✅

| Where | Value | Read from |
|---|---|---|
| Product UI | `150ms cubic-bezier(.4,0,.2,1)` | kick.com |
| Media entry | `300ms cubic-bezier(.87,0,.13,1)` | about.kick.com `slideUpKF` |
| Marquee | `40s linear infinite` | about.kick.com |

`cubic-bezier(.87,0,.13,1)` sits still, then moves fast, then stops hard. That is the media curve. Use it for entrances on brand surfaces.

The Design System `--ease:cubic-bezier(.2,.8,.2,1)` 🔧 is close to neither. Keep it for UI until the locked file is corrected, and use the measured curves for media.

### Rules

1. **Cut. Do not dissolve.** The brand film uses hard cuts end to end. A crossfade is the most corporate thing a deck can do. 🟡
2. **Entrances are short.** Under 300ms. The viewer is listening to a person, so the motion must finish before the sentence does.
3. **Animate in. Do not animate out.** Exit animation is delay the presenter feels.
4. **One ambient loop per surface, maximum.** Period of 8 seconds or more, opacity change of 0.06 or less. 🔧
5. **`prefers-reduced-motion` stops everything** and sets the final state. Design System §9 already disables transitions. Ambient loops and marquees must stop too.

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

Hackathon Brief §5.2 and clause 7(f) put licensing on us. **We cannot copy KICK's approach directly, because KICK's footage is full of real creators and we hold no rights to any of it.**

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
| 2 | Gradient | Green to cyan, left to right ✅ |
| 3 | Glow | Radial from `--kick-green-glow` to transparent. Off centre, 60% to 90% of the width |
| 4 | Grid | 1px lines in `--border` at 64px pitch, masked so it fades at the edges |
| 5 | Macroblock 🟡 | SVG `feTurbulence` plus `feDisplacementMap` at a coarse scale. It reads as video compression breaking up |
| 6 | Chroma split 🟡 | The layer below, copied twice and offset 3px in cyan and 3px in magenta, at 30% opacity |
| 7 | Scan bar 🟡 | One bright horizontal band, 6% of the height, crossing once on entry |
| 8 | Grain | SVG `feTurbulence` at 4% to 6% opacity. It stops large gradients banding on a projector |
| 9 | Vignette | Radial `rgba(0,0,0,.45)` at the corners |

Layers 5, 6 and 7 are the loud ones. **One of them per surface, never two.**

### Readability

**The background never competes with the text.** If you cannot read the surface with your eyes half closed, the background is too loud.

Text over any busy background needs a carrier: a plate at `rgba(11,11,12,.82)` or a shadow of `0 2px 8px rgba(0,0,0,.9)`. This is Design System §7, and it applies to media too.

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

*Written 25 July 2026. Values tagged ✅ were read from the live DOM on kick.com and about.kick.com on that date. Values tagged 🟡 come from KICK's "From Every Angle" brand film. Values tagged 🔧 are our construction, not KICK's. The official brand toolkit is still unread, and §0 lists what it would settle.*
