# KICK Site Reference

What kick.com actually looks like, measured from the live site. The Design System gives you the
tokens. This file gives you the **page**: the grid, the chrome, and where each component sits.

Read this before you build any page that is supposed to look like KICK. It exists so that nobody
has to open kick.com and measure it again.

> **Read `.claude/KICK-DESIGN-SYSTEM.md` first for colour, type and component specs.** This file
> does not repeat them. It records layout, structure and the values that only the live site can
> tell you.

**Source:** `https://kick.com/xqc`, a live channel page, read on 26 July 2026 at a 1600 by 900
viewport, logged out. Values come from the DOM and from computed styles, not from a screenshot.

**Start at Section 8.** The wordmark, the icon set and the font are committed files. Copying them
buys more fidelity than any amount of careful CSS.

**Change this file only from the live site**, the same rule the API map follows. Record the date
you checked.

---

## 0. Confidence

The same three tags the Design System uses.

| Tag | Meaning |
|---|---|
| ✅ **Verified** | Read from kick.com's own DOM or computed styles |
| 🟡 **High confidence** | Visible in KICK's output, measured by eye |
| 🔧 **Derived** | Our construction, KICK-like but invented |

Everything in Sections 1 to 5 is ✅ unless it says otherwise.

---

## 1. The page grid

KICK exposes its layout in CSS custom properties on the root element. Use these names.

| KICK variable | Value | What it is |
|---|---|---|
| `--navbar-height` | `60px` | The top bar |
| `--sidebar-expanded-width` | `256px` | The left rail, open |
| `--sidebar-collapsed-width` | `56px` | The left rail, closed |

At 1600 wide the page is three columns under a full width bar:

```
+------------------------------------------------------------------+
| navbar 60px, full width, #0B0B0C                                  |
+----------+--------------------------------------------+----------+
| sidebar  | main column, fluid                          | chat     |
| 256px    | 1004px at a 1600 viewport                   | 340px    |
| #0B0B0C  |                                             | #0B0B0C  |
+----------+--------------------------------------------+----------+
```

- **Every column is the same colour.** The page has no panel backgrounds. Separation comes from
  borders and from spacing, not from a lighter surface. This is the single most common way a copy
  of KICK looks wrong.
- The chat width is a **drag handle**, not a fixed number. A 4px vertical strip sits between the
  main column and the chat, `aria-label="Resize chatroom"`, and it turns `#53FC18` on hover.
- The navbar has **no bottom border**.

---

## 2. The navbar

60px tall, `#0B0B0C`, full width.

| Position | Contents |
|---|---|
| Left | The KICK wordmark, with a `BETA` superscript |
| Centre | A search field, see below |

### The search field

It is **transparent with a border**. It is not a filled or recessed box, which is the easy thing to
get wrong.

| Property | Value |
|---|---|
| Size | 450 wide, **32 tall** (`h-8`), radius 4px |
| Background | None. Fully transparent |
| Border | `1px solid rgba(240,241,242,.4)`, the `outline-region` token |
| Hover | The border lifts to `neutral-300` |
| Padding, gap | `0 12px`, 8px gap |
| Contents | A 16px search icon, the input, then a **13px clear button** once there is text |
| Input | 16px, white text, placeholder in the secondary grey |
| Right | Icon buttons, then `Log In` and `Sign Up` when logged out |

---

## 3. The left sidebar

256px, `#0B0B0C`. Top to bottom:

1. `Home`, `Browse`, `Following`, each an icon and a label.
2. A `Recommended` heading.
3. A live channel list. Each row is a 28px round avatar, the channel name at 14px weight 700, the
   category under it at 12px weight 700 in `#929EA6`, and a viewer count on the right.
4. `About Kick` and `Start Live` at the bottom.

---

## 4. The player

The video fills the main column at 16:9. At a 1600 viewport that is 1004 by 565.

### The control bar

It floats over the video. It has **no background plate**. It appears on hover.

| Part | Spec |
|---|---|
| Progress bar | Full bleed, edge to edge, **4px tall**, 56px above the video bottom. `aria-label="Loaded progress"` |
| Control row | 44px tall, inset 20px from each edge |
| Buttons | 44 by 44 hit area, transparent, icon only |
| Left cluster | Play, volume, the elapsed time, then the live chip |
| Right cluster | In this order: picture in picture, `Clip`, theatre mode, full screen, settings |

**KICK's live player already carries a 4px progress bar.** A thin timeline rail is not a new idea
bolted on. It is the bar KICK already draws.

### The seekbar

This is the detail that gives a copy away. Read from the live markup.

| Part | Spec |
|---|---|
| Track | `h-1`, so **4px**. It grows to `h-1.5`, so **6px**, on hover of the seekbar group |
| Buffer | `bg-white/50`, white at 50% |
| Thumb | **16px** (`size-4`), `rounded-full`, filled `#53FC18` |
| Thumb visibility | **Hidden until the group is hovered.** It is not a permanent dot |
| Thumb hit area | A 32px invisible square (`before:size-8`) centred on the thumb |

The thumb is green. The volume thumb is **white**, also 16px. Do not make them the same colour.

### The live chip

```
an 8px round dot, bg-green-500     +     "LIVE" at 14px weight 600, white
```

**It is a green dot and white text, not a red badge.** A red `LIVE` pill in the control bar is
wrong. The red badge belongs on the avatar in the channel bar, and on thumbnails.

---

## 5. The channel bar

Sits under the player, inside the main column, 16px horizontal padding.

| Element | Spec |
|---|---|
| Avatar | 56 by 56, round, with a `LIVE` badge overlapping the bottom edge. Badge text 10px weight 700, ink on green |
| Channel name | `<h1>`, 20px, weight 700, white |
| Stream title | 14px, weight 600, white |
| Category | 14px, weight 400, **`#53FC18`**. It is a green link, not muted text |
| Tags | 14px, weight 400, white, one button each |
| Viewer count | 14px, weight 700, green, with an odometer roll on each digit |
| `Follow` | bg `#53FC18`, text `#0B0B0C`, 16px weight 600, radius 4px, padding 8px 12px, 40px tall |
| `Subscribe` | bg `#42474D`, text white, same metrics |
| Share | 40 by 40 icon button |

The green category link is a KICK signature. Do not render it as muted text.

---

## 6. The chat panel

340px wide, `#0B0B0C`. KICK exposes the chat settings as CSS variables, and a viewer can change
them. The values below are the logged out defaults.

| KICK variable | Default | What it is |
|---|---|---|
| `--chatroom-font-size` | `14px` | Message size |
| `--chatroom-message-spacing` | `4px` | Vertical padding on a row |
| `--chatroom-timestamps-display` | `none` | Timestamps are off |
| `--chatroom-mod-actions-display` | `none` | Mod actions are off |

### Structure, top to bottom

1. **Header.** Minimum height 38px, 50px in practice. Padding `12px 6px`. A **2px** bottom border
   in `#24272C`. The word `Chat` centred, with an icon button on each side.
2. **Gifter leaderboard.** A 34px strip, a border top and bottom. It lists the top gifters with an
   amount each.
3. **The message list**, which grows.
4. **The input**, at the bottom.

### A message row

```
outer   padding: 0 12px          (8px under the lg breakpoint)
inner   padding: 4px 8px         border-radius: 8px
hover   background: #232629
```

| Part | Spec |
|---|---|
| Timestamp | 12px, weight 600, muted. Hidden by default |
| Badges | Images, sized `1em * 18/13`, so about 19px at 14px text. 4px gap |
| Username | Weight 700, colour set inline, one of the identity colours |
| Separator | A bold `: ` between the username and the body |
| Body | Weight 400, **`line-height: 1.55`** |
| Emotes | 30px tall, inline, aligned to the middle |

**There is no divider between rows.** Density comes from the 4px padding.

### The input

| Part | Spec |
|---|---|
| Wrapper | Transparent background, **2px** border in neutral 700, radius 4px, 45px tall |
| Hover | The border lightens to neutral 400, 200ms |
| Field | 14px, transparent, no border of its own |
| Send | Labelled `Chat`. bg `#53FC18`, text `#0B0B0C`, 14px weight 600, padding 6px 12px, 32px tall, radius 4px |

---

## 7. Values this file confirms

Read from computed styles, so these settle any argument.

| Thing | Live value | Design System token |
|---|---|---|
| Page background | `rgb(11, 11, 12)` | `--bg-base` `#0B0B0C` ✅ |
| Raised surface | `rgb(23, 26, 28)` | `--bg-surface` `#171A1C` ✅ |
| Highest surface | `rgb(35, 38, 41)` | `--bg-raised` `#232629` ✅ |
| Green | `rgb(83, 252, 24)` | `--kick-green` `#53FC18` ✅ |
| Font | `Inter` | `--font-ui` ✅ |
| Button radius | `4px` | `--r-sm` ✅ |
| Chat row radius | `8px` | `--r-lg` ✅ |

---

## 8. Assets. Never draw these yourself

Three things decide at a glance whether a page reads as KICK. All three are committed, so **copy
the file, do not draw an approximation.**

| Thing | Where it is | Rule |
|---|---|---|
| The wordmark | `assets/brand/kick-logo.svg` | 97 by 26, one green path plus a white `BETA`. Never set the word KICK in a font |
| The icons | `assets/icons/kick-inline/`, 22 files | KICK's own. Solid fill, no stroke, 32 grid, `currentColor`, rendered at 16px |
| Inter | `assets/fonts/inter/` | kick.com loads Inter and nothing else |

**A stroked, rounded icon set is the fastest way to look wrong.** KICK's icons are hard edged and
filled, with no curves at all where a curve is avoidable. Their home icon is a house with zero
round joins. Lucide, Feather and Tabler all read as a different product immediately.

Three icons in that folder are ours, not KICK's: `pause`, `mute` and `timeline`. `assets/README.md`
says why.

---

## 9. Scrollbars

The page **never scrolls**: `body` is `overflow: hidden`, and each column scrolls on its own. A
page that scrolls as one document is the wrong shape before any styling.

KICK sets one global rule, then hides the bar where they do not want it. Copy both verbatim:

```css
::-webkit-scrollbar       { width: 4px; height: 4px }
::-webkit-scrollbar-track { background: 0 0 }
::-webkit-scrollbar-thumb {
  background-clip: padding-box;
  border: 5px solid #ffffff40;
  border-radius: 15px;
}

.no-scrollbar                     { -ms-overflow-style: none; scrollbar-width: none }
.no-scrollbar::-webkit-scrollbar  { display: none }
```

The thumb has **no background**. The visible part is the 5px translucent white border, clipped to
the padding box. That is why the bar looks like a soft 4px line and not a solid block.

| Region | Behaviour |
|---|---|
| The main column | `.no-scrollbar`. It scrolls, and the bar is fully hidden. Measured gutter **0px** |
| The chat list | The global bar. Measured gutter **4px** |

A default browser scrollbar, 15px wide with a grey track, is one of the loudest tells.

---

## 10. Where icons come from

**There is no icon font, no sprite sheet and no icon URL to fetch.** KICK's icons are React
components compiled into one Next.js JavaScript chunk, each an inline `<svg>` whose paths carry
`fill="current"`. In the shipped bundle the components are minified to names like `et` and `ea`,
so there is no name to path map to read.

**So read the rendered DOM, not the bundle.** Open the page that shows the icon you need, then
collect every `<svg>` with its `viewBox` and its `d` attributes, and key each one by the
`aria-label` of the closest button. That gives a correct icon with a correct name, and it takes one
pass. Hunting the JavaScript chunk gives you geometry with no names attached.

Two practical points:

- **An icon only exists in the DOM if the page draws it.** A logged out page never renders `pause`
  or `mute`, so you cannot read them. Draw the missing one on the same 32 grid from a neighbouring
  KICK path, and record it as ours.
- **Some icons carry a full box path**, for example `M0 0h32v32H0z`, as a transparent hit area.
  Drop it. If you keep it and set a fill, the icon paints as a solid square.

Take only the icons the page you are building needs, and record where each one came from in
`assets/README.md`. These are KICK trademarks, held so we can match the chrome.

---

## 11. Where the live site and the Design System differ

The Design System is locked. These are **observations, not edits**. Raise them before you change
anything.

1. **Chat font size.** Design System Section 4 says `--chatroom-font-size: 16px`. The live default
   is **14px**. The variable name and the mechanism are right, the number moved. It is a viewer
   preference, so 14px is the logged out default and not the only value.
2. **The secondary button.** Design System Section 4 puts secondary on `--bg-raised` `#232629`. The
   live `Subscribe` button is **`#42474D`**, which is lighter. Use `#42474D` for a button that sits
   beside a green primary.
3. **The icon reference folder.** Design System Section 5 points at `assets/icons/kick-inline/`.
   On 26 July 2026 we filled that folder with 22 icons read from the live site, so the Design
   System now points at something real. Section 8 above covers it.

---

## 12. Checklist for a page that must look like KICK

Run a finished page against this list.

**Layout**
- [ ] One background colour across the navbar, the sidebar, the main column and the chat.
- [ ] Navbar 60px. Sidebar 256px. Chat 340px. A 4px drag handle between main and chat.
- [ ] `body` is `overflow: hidden`. The page does not scroll as one document.
- [ ] The main column scrolls with `.no-scrollbar`. The chat scrolls with the 4px bar.
- [ ] The search field is transparent with a border, 450 by 32, not a filled box.

**Assets**
- [ ] The wordmark is `assets/brand/kick-logo.svg`, not type set in a font.
- [ ] Every icon comes from `assets/icons/kick-inline/`. Filled, no stroke, 16px.
- [ ] Inter, and nothing else.

**The player**
- [ ] The progress bar is 4px, full bleed, and grows to 6px on hover.
- [ ] The seek thumb is a 16px green circle, hidden until hover.
- [ ] The volume thumb is a 16px white circle.
- [ ] The live chip is a green dot and white text, never a red badge.
- [ ] Control buttons are 44 by 44 with no background.

**Chat and the channel bar**
- [ ] The category under the stream title is green.
- [ ] The primary button is ink on green. The secondary is white on `#42474D`.
- [ ] Chat is 14px, 4px row padding, no dividers, body line height 1.55.
- [ ] The chat send button says `Chat`, not `Send`.

**Last**
- [ ] Green stays under 10% of visible pixels (Design System Section 1).
