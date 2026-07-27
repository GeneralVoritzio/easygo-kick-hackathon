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

Sections 15 to 18 come from `demo/kick-reference/`, the saved markup and CSS of the live site, read
on 27 July 2026. Section 14 says how to query it.

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
| The wordmark | `demo/src/kick/brand/kick-logo.svg` | 97 by 26, one green path plus a white `BETA`. Never set the word KICK in a font |
| The icons | `demo/src/kick/icons/`, 67 files | KICK's own. Solid fill, no stroke, 32 grid, `currentColor`, rendered at 16px |
| Inter | `demo/src/kick/fonts/` | kick.com loads Inter and nothing else |

**A stroked, rounded icon set is the fastest way to look wrong.** KICK's icons are hard edged and
filled, with no curves at all where a curve is avoidable. Their home icon is a house with zero
round joins. Lucide, Feather and Tabler all read as a different product immediately.

Three icons in that folder are ours, not KICK's: `pause`, `mute` and `timeline`. `.claude/KICK-ASSETS.md`
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
`.claude/KICK-ASSETS.md`. These are KICK trademarks, held so we can match the chrome.

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
3. **The icon reference folder.** Design System Section 5 points at the old `assets/icons/kick-inline/`
   path and says 18 icons. The set now holds **67 icons** and lives at `demo/src/kick/icons/`. The
   Design System is locked, so the path in it is stale. Section 8 above is correct.
4. **Asset paths.** The Design System still points at a root `assets/` folder. That folder is gone.
   `.claude/KICK-ASSETS.md` records where every file lives now.

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
- [ ] The wordmark is `demo/src/kick/brand/kick-logo.svg`, not type set in a font.
- [ ] Every icon comes from `demo/src/kick/icons/`. Filled, no stroke, 16px.
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

**Grids and spacing**
- [ ] The column spacing came from this page's markup, not from another page (Section 15).
- [ ] Stream grids carry the collapsed-sidebar column variants (Section 15).
- [ ] Category grids are auto-fill at 139px from `lg`, with an 8px column gap (Section 15).
- [ ] Home sections hold one row. Browse sections wrap.
- [ ] Every z-index comes from Section 18.

**Last**
- [ ] Green stays under 10% of visible pixels (Design System Section 1).

---

## 13. The sidebar channel row

Read from the live DOM on 26 July 2026, logged in. This row repeats under `Following` and under
`Recommended`, and it is easy to get subtly wrong.

The row has **two children, not three.** The viewer count is not a third column.

```
a           flex h-11 w-full flex-row items-center gap-2 rounded px-1.5
  div       the avatar, size-7, rounded-full
  div       flex min-w-0 max-w-full shrink grow flex-col gap-0.5
    span    the username, text-sm font-bold leading-[1.2], white
    span    the category, text-xs font-bold leading-normal, #929EA6
  div       flex w-fit shrink-0 flex-nowrap items-center gap-x-1 self-start text-white
    div     the live dot, h-2 w-2 rounded-full bg-green-500
    span    the count, text-sm font-semibold, white
```

| Thing | Live value |
|---|---|
| Row height | 44px (`h-11`) |
| Avatar | 28px (`size-7`) |
| Username | 14px, weight 700, white |
| Category | 12px, weight 700, `#929EA6` |
| Viewer count | 14px, weight 600, **white** |
| Live dot | **A plain 8px `div`**, `rounded-full`, `bg-green-500`. It is not an SVG icon |
| Count alignment | **`self-start`.** It sits on the username's line, not centred in the row |

Two details decide whether this reads as KICK:

- **The count uses `self-start`.** Centring it across both lines is the common mistake.
- **The dot is a `div`, not an icon.** Reaching for an SVG circle gives the wrong size and colour.

An offline row dims the avatar with `mix-blend-luminosity grayscale` and sets the username to
`text-neutral-700`.

---

## 14. Where the scrape lives

`demo/kick-reference/` holds the machine-readable capture this file is written from:

| Folder | What it holds |
|---|---|
| `html/` | The raw server response for nine URLs |
| `css/` | KICK's four live CSS chunks, 239 KB. Every class in the trees resolves here |
| `trees/` | Each page's DOM as an indented tree, repeated siblings collapsed |
| `icons/` | 67 inline SVG icons |

**KICK renders all page content on the client.** The server sends skeleton placeholders where every
card will appear. The saved HTML gives correct chrome and correct card geometry, but no card
content. Read a live page when you need the filled markup.

**A skeleton is a dimensional drawing.** It looks like nothing, but KICK sizes each placeholder to
the element it stands in for, so it carries the real numbers. `h-7 w-16` on the hero live badge,
`size-9 lg:size-14` on the hero avatar and `h-9 w-[100px]` on `Watch now` all came from skeletons
and all proved correct against the live page. Do not skip a skeleton file because it has no text.

**How to answer a question with this folder.** Three steps, in order:

1. Find the element in `html/`. Search for a word the page shows, or for a class you already know.
2. Resolve its class names in `css/`. KICK's custom names live there. `grid-cols-auto-fill-category`
   is `repeat(auto-fill, minmax(139px, 1fr))`, which no amount of measuring by eye would give you.
3. Open a live page only for what the scrape cannot hold: card content, hover and focus states, and
   any page behind a login.

Sections 15 to 17 were written this way, in minutes, after the same values had already been guessed
wrong once.

---

## 15. The page column, and the grids

Read from `demo/kick-reference/html/` on 27 July 2026, and confirmed against the running clone.

**Two pages, two sets of spacing.** This is the trap. A shared page shell with one set of values is
wrong on one of them.

| Thing | Home | Browse |
|---|---|---|
| Scroll container | no top padding | `pt-3 lg:pt-6` |
| Column | `gap-y-5 pt-3 lg:gap-y-7 lg:pt-0` | `gap-y-3` |

Both share `px-4 lg:px-8 xl:px-10` on the outer div, then `m-auto flex max-w-[125rem] flex-col`.

**Home sections hold one row. Browse sections wrap.** KICK holds a section to one row with
`grid-rows-1` and `auto-rows-[0]`, so every card after the first row collapses to zero height, and
`overflow-y-hidden` clips it. Below `lg` the same section becomes a horizontal snap scroller:
`-mx-4 px-4 snap-x snap-mandatory scroll-ps-4`, with a fixed child width of 268px for a stream and
108px for a category.

**Stream grid columns**, the same on both pages:

```
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6
group-data-[sidebar=false]/main:xl:grid-cols-5
group-data-[sidebar=false]/main:2xl:grid-cols-6
group-data-[sidebar=false]/main:3xl:grid-cols-7
```

Gaps are `gap-x-4 gap-y-5 lg:gap-y-6`.

**The collapsed sidebar adds a column.** KICK puts `data-sidebar` on the page root and reads it with
`group-data-[sidebar=false]/main:`. The state of the chrome changes the content grid. Copy the
attribute, not just the widths.

**Category grid columns:** `grid-cols-2 sm:grid-cols-4 md:grid-cols-5`, then
**`repeat(auto-fill, minmax(139px, 1fr))`** from `lg`. The column gap is **8px**, not 16px, and the
card gap is 4px. A category grid is not a stream grid with narrower cards.

---

## 16. The home hero

| Thing | Value |
|---|---|
| Aspect box | `w-[calc((2*100%-12px)/3)]`, `3xl:w-[calc((3*100%-12px)/4)]`, 12px gap to the chat |
| Chat aside | `w-[calc((100%-24px)/3)]`, `3xl:w-[calc((100%-36px)/4)]`, radius 8, 1px `outline-region`, `pb-4` |
| Chat header | **Absolute over the body**, `top-0 w-full rounded-t-lg p-4`. It has no bottom border |
| Chat body | `px-4 pt-20`. Each line is `h-[30px]` with `gap-2` |
| Overlay | `absolute inset-x-4 bottom-4 flex gap-3 rounded-lg bg-dark-64 p-4 backdrop-blur-sm` |
| Overlay layout | The avatar is a **sibling of the whole stack**, not a member of the top row. The carousel dots start under the title, not under the avatar |
| Avatar | `size-9 lg:size-14` |
| Watch now | **100 by 36**, radius 6 |
| Live badge | **64 by 28**, radius 4, 16px in from the top left |
| Dots | 8px, the active one 48 by 8, the first with `ml-1` |

The banner above the hero is Section 17.

---

## 17. The home banner

| Thing | Value |
|---|---|
| Wrapper | `bg-surface-lowest lg:pt-4` |
| Frame | `grid grid-cols-[1fr_auto_1fr] grid-rows-1 items-center gap-4 rounded-lg bg-surface-base bg-cover bg-center bg-no-repeat p-4` |
| Height | **Not fixed. 112px follows from the content**: 16 padding, 28 title, 16 gap, 36 button, 16 padding |
| Columns | Three. The left and right are empty and carry `empty:hidden`. The content sits in column 2 |
| Title | 24px weight 700, line height 28, uppercase, `text-shadow: rgb(0 0 0 / 65%) 0 1px 8px` |
| Button | `h-9 w-fit`, padding `0 8px`, 14px weight 600, `bg-primary-base`, `state-layer-base` |
| Below `lg` | KICK ships a second copy: the whole banner is a link, the title drops to 20px, and the button is not shown |

The plate is a CMS image and changes every week. Copy the frame, not the artwork.

---

## 18. The z-index scale

Read from `css/`. Use these names and these numbers.

| Class | Value |
|---|---|
| `z-absolute` | 101 |
| `z-player` | 201 |
| `z-controls` | 202 |
| `z-navbar` | 301 |
| `z-popover` | 401 |

A scale of 300, 400 and 500 is invented. It works until two invented layers meet.
