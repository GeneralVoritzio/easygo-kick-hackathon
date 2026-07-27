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

Section 19 comes from the live site read **logged in** on 27 July 2026 at 2560 by 1249. It covers
the three cards, and the browse and following pages. The saved scrape cannot answer it, because a
logged out card is a skeleton.

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
  **The strip takes no width.** It sits over the chat left edge, so the chat column measures 340px
  in total. A strip that takes its own 4px makes the main column 4px narrow, and the player, which
  is 16 by 9, then sits about 2px high.
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

### 3.1 The collapse, measured on kick.com 27 July 2026

The hamburger in the navbar changes the rail between 256px and 56px. **The width changes in one
frame. There is no animation.** This is easy to get wrong, because a nav link carries
`transition-all` at 150ms, so a link that survives the toggle animates its own width down and the
labels smear inside the 56px rail.

KICK avoids that by **replacing the link elements**. Sampled every frame across a toggle, the
`#sidebar-wrapper` element is the same node, but each `a` inside it is a new node. A new element
has no previous value, so its transition never runs. In React, give the sidebar a `key` that
changes with the state.

| Part | Open, 256px | Closed, 56px |
|---|---|---|
| Nav link | `h-12 py-1 w-full justify-start gap-x-4 px-4`, 240 by 48 | `h-12 py-1 w-full justify-center`, 40 by 48 |
| Nav link, active | `data-[state=active]:!bg-secondary-base` | `data-[state=active]:bg-surface-highest` |
| Divider | `w-full px-3` holding `h-px w-full bg-outline-decorative` | the same, **without** `px-3` |
| Section | `flex w-full flex-col p-3` | the same |
| Section heading | `flex h-9 w-full items-center` | the same, plus `justify-center px-0` |
| Channel row | 44px tall | 44px tall |

The closed rail is the open rail with the labels dropped and the rows centred. The section
padding, the heading height and the row height do not change.

---

## 4. The player

The video fills the main column at 16:9. At a 1600 viewport that is 1004 by 565.

### 4.1 The 16:9 stage, measured on `kick.com/odablock` 27 July 2026

The player is two boxes, and the **inner one is what holds 16:9**:

```
div  relative block w-full shrink-0 overflow-hidden bg-black
     max-h-[calc(100vh-var(--navbar-height)-var(--channel-info-height))]
  div#injected-channel-player  relative m-auto aspect-video max-h-full max-w-full bg-black
    video  h-full w-full, object-fit: contain
```

The outer box takes the full column width. The inner box keeps 16:9 whatever that width is: the
`max-h-full` transfers through the aspect ratio into a maximum width, and `m-auto` centres what is
left. Black fills the rest.

**This is why the video does not change shape when the sidebar collapses.** A full bleed
`absolute inset-0` image with `object-cover` looks the same at one width and wrong at the next,
because it re-crops every time a panel opens or closes.

The same two boxes serve the 320px strip on a sub-page, Section 19. There the outer box is
`h-[320px]`, so the stage measures 569 by 320 at every column width.

### The control bar

It floats over the video. It has **no background plate**. It appears on hover.

| Part | Spec |
|---|---|
| Progress bar | Full bleed, edge to edge, **4px tall**, 56px above the video bottom. `aria-label="Loaded progress"` |
| Control row | 44px tall, inset 20px from each edge |
| Buttons | 44 by 44 hit area, transparent, icon only |
| Icons | **20px** (`size-5`), not the 16px the rest of the site uses |
| Cluster gap | **0.** Buttons touch. Only `Clip` carries `mx-2` |
| Left cluster | Play, volume, the elapsed time, then the live chip |
| Elapsed time | 14px weight **700**, `px-2`, line box 20px |
| Live chip | `px-2`, 6px gap, line box 20px |
| Volume | Button, then a 16px gap, then the slider. The slider stays collapsed until hover |
| `Clip` | No padding. Icon, a 4px gap, then the label. 50.4px wide |
| Right cluster | In this order: picture in picture, `Clip`, captions, theatre mode, full screen, settings |

Read from the live player on 27 July 2026, logged in, at 2560.

**A player button has no hover plate.** The state layer that every other button on kick.com carries
is not here. The background stays transparent, and a tooltip appears instead.

| Tooltip part | Spec |
|---|---|
| Plate | White, black text, 14px weight 500, 5px padding, 2px radius, no shadow, no border |
| Arrow | A 10 by 5 white triangle under the plate. It points down and pokes 3px over the button |
| Position | Above the button, a 2px gap, centred on the button, `z-index: 801` |
| Collision | It stays 20px inside the player. The play plate aligns start, the settings plate aligns end. **The arrow stays centred on the button either way** |
| Text | `Play (space)` `Pause (space)` `Mute (m)` `Unmute (m)` `Picture in Picture` `Clip (c)` `Captions (p)` `Theatre Mode (t)` `Fullscreen (f)` `Quality` |

The settings button says **`Quality`**, not `Settings`. The share and report buttons in the
channel bar carry the same tooltip, centred: `Share` and `Report`.

**KICK's live player already carries a 4px progress bar.** A thin timeline rail is not a new idea
bolted on. It is the bar KICK already draws.

### The seekbar

This is the detail that gives a copy away. Read from the live markup.

| Part | Spec |
|---|---|
| Track | `h-1`, so **4px**. It grows to `h-1.5`, so **6px**, on hover of the seekbar group |
| Buffer | `bg-white/50`, white at 50% |
| Rail under the fill | `#929EA6` at 50%, the `subtle` token. It is not white |
| Fill on a live stream | The full width. A live stream sits at the live edge, so no rail shows |
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

**Paused, or behind the live edge, only the dot changes.** Measured on the live player, paused,
27 July 2026. The text stays `LIVE` and stays white. The dot turns `#3F4448`, KICK's
`neon-highlight-base`. There is no `Go back live` label, no tooltip, no hover state, and a click
does nothing. The elapsed timer freezes while paused.

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

Everything below this line was read on **27 July 2026** from `kick.com/odablock`, live, **logged
in**, at 2560 by 1305. A logged out capture gives a skeleton here, so it can prove none of it.

### Structure, top to bottom

The panel is `#channel-chatroom`. Its rows are 50, 33, the list, and 118.

1. **Header.** `relative flex min-h-[38px] shrink-0 items-center justify-between border-b-2
   border-[#24272c] px-3 py-1.5`. 50px in practice. A 36px icon button at each end, each holding a
   16px icon. The word `Chat` is **absolutely centred**, not a flex item:
   `absolute left-1/2 -translate-x-1/2 text-sm font-bold lg:text-base`.
2. **Gifter leaderboard**, 33px. It scrolls. See below.
3. **The message list**, `#chatroom-messages`, which grows. It carries **no padding**, and it shows
   the 4px global scrollbar. Each row carries its own `px-2 lg:px-3`.
4. **The footer**, `#chatroom-footer`, 146px. Three rows. See below.

**There is an emote bar above the input.** It is empty until KICK loads the emote set, so a capture
taken too early shows a 118px footer and no bar. Wait for it before you measure.

### The gifter leaderboard

A marquee, not a static strip. Two identical tracks scroll left as one.

```
wrapper   overflow-hidden, shrink-0
inner     relative flex flex-col justify-end px-5 text-sm font-medium
button    flex w-full overflow-hidden border-y border-outline-decorative     34px
track     animate-leaderboards-marquee flex min-w-full shrink-0 flex-row     32px
entries   flex w-max min-w-full flex-row flex-nowrap items-center justify-center gap-4
          padding 6px 16px
entry     flex shrink-0 flex-row flex-nowrap items-center justify-center gap-1
```

`@keyframes leaderboards-marquee` is `0% translate(0)`, `55.556% translate(-100%)`,
`to translate(-100%)`, run as `9s ease-in-out 2s infinite`.

An entry is a 20px rank medal, then the name, then the amount. **The name colour is set by rank,
not by the user**, and the amount is always grey:

| Part | Rank 1 | Rank 2 | Rank 3 |
|---|---|---|---|
| Medal | `/img/gift-ranks/gift-rank-1.png` | `-2.png` | `-3.png` |
| Name, 14px weight 600 | `text-orange-300` `#FDC872` | `text-neutral` `#FFF` | `text-orange-500` `#FBA418` |
| Amount, 14px weight 400 | `text-neutral-500` `#808A93` | same | same |

The medals are served from `kick.com` itself, not from a CDN, so they cannot be downloaded.

### A message row

```
outer   group relative px-2 lg:px-3
inner   w-full min-w-0 shrink-0 break-words rounded-lg px-2
        padding 4px 8px   border-radius 8px   font-size 14px   height 30px
hover   betterhover:group-hover:bg-surface-highest, driven by the outer group
```

| Part | Spec |
|---|---|
| Timestamp | `text-neutral pr-1 font-semibold`, 12px. Hidden by default |
| Identity group | `inline-flex min-w-0 flex-nowrap items-baseline rounded transition-colors`, hover `#474F54`. It wraps the badges **and** the name, and it opens the user card |
| Badge row | `flex items-center gap-1 self-center pr-1` |
| One badge | `size-[calc(1em*(18/13))]`, so 19px at 14px text |
| Username | A `button`, `inline font-bold`, colour set inline from the identity set |
| Separator | `inline-flex font-bold`, a bold `: ` |
| Body | `font-normal leading-[1.55]` |
| Emotes | 30px, inline, aligned to the middle |

**There is no divider between rows.** Density comes from the 4px padding.

Badges are a mix. The global ones are inline SVG on a 32 grid, drawn in their own colours, not in
`currentColor`. The channel ones are images: `12-Month Subscriber`, `Level 35`, and the channel's
own art. `KICK Founder 22` is an image too.

### The footer

146px, inside `px-2 py-3 lg:px-5`, so **20px sides at desktop** and every row inside is 300 wide
in a 340 chat. It holds two blocks: the emote bar, then a `flex flex-col gap-2` stack with the
input and the bottom row.

```
footer    flex w-full shrink-0 flex-col px-2 py-3 lg:px-5    146
  slot    flex flex-col gap-1 pb-1 empty:hidden               32
    bar   overflow-hidden                                     28
  stack   flex flex-col gap-2
    input                                                     46
    row   flex shrink-0 grow-0 items-center gap-1             36
```

| Row | Spec |
|---|---|
| Emote bar, 28px | `flex h-7 max-h-7 w-full max-w-full flex-wrap items-center overflow-hidden empty:hidden`. Buttons are `h-full w-fit`, so 28 by 28, each holding a **24px** emote. The row clips to one line |
| Input, 46px | `flex w-full items-center rounded border-2 border-neutral-700 pl-2 pr-1 transition-colors duration-200 ease-in-out`, hover `border-neutral-400` |
| Bottom, 36px | Channel points and Kicks on the left, chat settings and `Chat` on the right |

Inside the input box, left to right:

| Part | Spec |
|---|---|
| Chat identity | A 26 by 30 button holding a 16px badge, `data-testid="identity-badge-chat_identity"` |
| Field | A contenteditable, `.editor-input`. **It grows with the text.** `min-height 42px`, `max-height 150px`, `overflow-y auto`, `white-space pre-wrap`, `word-break break-word`, padding `9px 10px`, line height 20px. Past 150px it scrolls, so the wrapper tops out at 154 and the footer at 254 |
| Placeholder | **Not the field's own placeholder.** A separate element, `pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 select-none pl-[1px] font-medium`, 14px weight 500 in `#768087`. It centres against the whole 46px wrapper, and measures y 15, x 46, height 16 inside it. A native `placeholder` centres against the field's line box instead, and sits high |
| Emotes | A 36px button holding a 16px icon. It opens the picker |

In the bottom row, left to right:

| Part | Spec |
|---|---|
| Channel points | 54 by 36, a 16px icon and the balance |
| Kicks | 49 by 36, the 16px gradient coin and the balance |
| Chat settings | 36 by 36, a 16px gear. Not the same gear as the settings page |
| Send | Labelled `Chat`. bg `#53FC18`, text `#0B0B0C`, 14px weight 600, padding 6px 12px, 32 by 56, radius 4px |

KICK's own emoji set is named `emojiAngry`, `emojiAstonished`, `emojiAngel` and so on, served as
**animated GIFs** from `files.kick.com/emotes/<id>/fullsize`.

### The emote picker

It opens above the input, 348px tall in a 340 chat. It is a search box, a tab row and a scrolling
list of labelled sections, **not a bare grid**.

```
#chat-emotes-picker-panel  z-popover absolute inset-x-0 bottom-full h-fit
  bg-surface-base relative rounded-t flex h-auto w-full flex-col overflow-hidden min-h-[50px]
    overflow-y-auto pt-1
      grid gap-1
        grid gap-4 pt-2.5 lg:pl-5 lg:pr-2 lg:pt-2          header
          flex items-center gap-2                           36   search, then a close button
          relative w-full max-w-full overflow-y-auto pr-3   40   the tab row
        pl-5 pr-2.5                                         body
          h-60 overflow-y-auto py-2 pr-2.5                 240
            grid gap-2                                            one child per section
```

| Part | Spec |
|---|---|
| Search field | 36px tall, `bg-surface-lowest` `#0B0B0C`, **1px** `border-outline-region`, radius 4px, 14px, `pl-8`. Placeholder `Search emotes` |
| Tab row | Five 40px buttons, `size-11 lg:size-10`. The first three are SVG (frequently used, collectibles, global), the last two are images (the channel avatar, and emotes) |
| Section label | `text-xs font-medium text-neutral-400`, so 12px weight 500 in `#9FA6AD` |
| Section grid | `grid grid-cols-8 justify-between gap-2` |
| One emote | A 36px button holding a **28px** emote, hover `bg-white/10` |

The section labels on a channel page read `Frequently Used`, `Collectibles`, `Global`, the channel
name, then `Emotes`.

**Clicking an emote in the picker writes it into the input.** It does not send. Only the quick
emote bar sends on click.

#### How it opens

The panel is a **sibling of the padded footer box**, not a child of it. The box carries
`overflow-hidden`, so a panel inside it would be clipped at the footer edge.

| Part | Spec |
|---|---|
| Position | `absolute inset-x-0 bottom-0 h-fit -translate-y-[103px]`, so its bottom edge sits 103px above the footer bottom, level with the top of the input box. **It covers the quick emote bar** |
| Slide | The inner panel animates `max-height` from its `min-h-[50px]` to `50vh`, over **350ms ease-out**. At 1305 tall that resolves to 652.5px, and the panel settles at 348 |
| Fade | The contents fade in over **300ms** on `cubic-bezier(0.14, 0.98, 0.49, 1)` |
| The footer behind it | The padded box takes `bg-surface-base` `#171A1C` while the panel is open, over `transition-all duration-300 ease-in-out`. The input row and the bottom row sit on the panel colour, not on the page colour |

Drive the slide with a CSS keyframe, not a mount effect. A `requestAnimationFrame` never fires in
a tab that is not compositing, which leaves the panel stuck at 50px.

### Collapsing the chat

The page root is `div.group/main` and it carries `data-chat`, `data-sidebar` and `data-theatre`.
The chat reads `data-chat`:

```
group-data-[chat=false]/main:opacity-0
group-data-[chat=false]/main:lg:w-0
group-data-[chat=true]/main:lg:w-[var(--chat-width)]
```

The computed transition is exactly
`width 0.3s cubic-bezier(0, 0, 0.2, 1), opacity 0.3s cubic-bezier(0, 0, 0.2, 1)`, so width and
opacity animate together over 300ms on ease out. Tailwind's plain `transition` does **not** cover
width, so it must be named.

When the chat is collapsed an expand button appears **over the player**, not in the page flow:
`z-controls absolute right-7 top-7 hidden transition-opacity group-data-[chat=false]/main:block`.
It holds the expand icon, which is the collapse icon mirrored.

A flex item with a width of 0 still measures at its content width unless it also carries
`min-w-0`, because a flex item defaults to `min-width: auto`.

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

---

## 19. The three cards, and the browse and following pages

**Source:** `kick.com/browse`, `/browse/categories`, `/browse/clips`, `/following`,
`/following/categories` and `/trainwreckstv`, read on 27 July 2026 at a 2560 by 1249 viewport,
**logged in**. The saved scrape cannot answer this section, because a logged out card is a
skeleton and a skeleton holds no text.

### 19.1 The pill rule. Read this first

**KICK does not show free-text topic tags on a card.** Every livestream card, on every page,
shows the same pill row in the same order:

```
category, language, and "18+" when the stream is mature
```

Ten cards in one row, no exceptions:

```
Slots & Casino / English / 18+      Old School RuneScape / English
IRL / English                       Tekken 8 / English
ASMR / English / 18+                Just Chatting / English
Movierooms / Chinese                Slots & Casino / Arabic / 18+
```

**The category is the first pill, not a green link.** The green category link belongs to the
channel bar under the player, Section 5, and nowhere else. A card that puts the category on its
own line in `#53FC18` is wrong.

The pill is one class everywhere:

```
rounded-full px-2 py-1 text-sm font-normal bg-secondary-base text-secondary-onSecondary
```

22px tall, `bg` `rgb(66,71,77)`, radius 9999. The row is
`mt-2 flex max-h-[22px] w-full flex-row flex-wrap gap-x-1 overflow-hidden`, so a long row clips
to one line.

Under the player the channel bar drops the category pill and keeps `English` and `18+`, because
the category is already a link beside them.

### 19.2 Livestream card, 320 by 270

```
div.group/card  relative flex w-full shrink-0 grow-0 flex-col gap-2 lg:gap-0
  a  relative aspect-video w-full select-none overflow-hidden rounded          320x180
    img  brightness-110 contrast-[110%] saturate-[110%]
    div  bg-surface-lowest absolute rounded px-1 text-sm font-semibold
         top-1.5 left-1.5 text-primary-base uppercase        -> LIVE           38x20
    div  bg-surface-lowest absolute rounded px-1 text-sm font-semibold
         bottom-1.5 left-1.5   -> <span>35.6K</span> watching                  114x20
  div  flex w-full flex-row flex-nowrap gap-2 lg:px-1.5 lg:py-2 tv:py-4 fhd:py-5
    a    img.size-11.rounded-full                                              44x44
    div  flex w-full min-w-0 flex-col items-start tv:gap-1 fhd:gap-1.5
      a    username, text-sm font-semibold, white, leading-5                   h20
      div  flex w-full flex-row flex-nowrap justify-between gap-2
        a  title, text-base font-normal, text-surface-onSurfaceSecondary       h24
      div  the pill row of 19.1                                                h22
  CornerMarks
```

Four facts that are easy to get backwards:

| Thing | Value |
|---|---|
| **LIVE badge** | `bg-surface-lowest`, so a dark chip, and the **text is green**. It is not a red chip |
| **Line 1** | the **username**, 14px weight 600, white |
| **Line 2** | the **session title**, 16px weight 400, `#9FA6AD`. The title is the quiet line |
| **Verified tick** | **not shown on a card**. It appears in the channel bar and the sidebar row |

Both thumbnail badges sit at `1.5`, not `2`, and both are `text-sm`, not `text-xs`.

### 19.3 Category card, 146 by 282

Poster `rounded-lg`, 146 by 195. Then
`flex flex-col gap-1 p-1 pt-0 lg:pb-3` holding the name at `text-base font-semibold` white, the
count at `text-sm font-normal` `#9FA6AD` reading **"172.2K watching"**, and a pill row of genre
tags: `IRL / Casual`, `Shooter / FPS`, `MOBA / Action`, `Strategy / Action`, `RPG / MMO`.

The word is **watching**, not "viewers". Grid gaps are `gap-x-2 gap-y-3 lg:gap-y-6`.

### 19.4 Clip card, 320 by 262

The same anatomy as the livestream card. Duration badge `top-1.5 left-1.5`, views badge
`bottom-1.5 left-1.5`, both the same `bg-surface-lowest` chip. Then avatar, username, title, and
a row holding the category pill and the age, for example `Slots & Casino  · 5 days ago`.

The username on a clip card is the **broadcaster**, not whoever cut the clip.

A clip grid uses the **same columns as a stream grid**. It does not get its own.

### 19.5 Corner marks are on all three cards

The green marks of Section 15 are on the livestream card, the category card **and** the clip card.
Two L shapes, bottom left and bottom right, a 12 by 4 bar and a 4 by 8 bar, `opacity-0` to
`opacity-100` on `group-hover/card`, gated by `betterhover`. There is no border, no ring and no
lift. A card that grows a border on hover is wrong.

### 19.6 Tabs and filters

| Page | Tabs | Filter row |
|---|---|---|
| `/browse` | Livestreams, Categories, Clips | left `Filter by:` + `Languages`, right `Sort by:` + `Recommended` |
| `/browse/categories` | the same three | **none** |
| `/browse/clips` | the same three | left `Sort by:` + `Views`, right `Filter by:` + `Last Week` |
| `/following` | **Live Channels**, Categories, Channels | **none** |
| `/following/channels` | the same three | **none**. It holds a card grid, Section 19.7a |

**There is no Leaderboard tab.** The only leaderboard on kick.com is the gifter strip in chat,
Section 6. **There is no search box on any browse tab**; the page search is the one in the navbar.

Options, read from the open menus:

- Livestreams, sort: `Featured`, `Recommended`, `Viewers (High to Low)`. Default `Recommended`.
- Clips, sort: `Views`, `Most Recent`. Filter: `Last Day`, `Last Week`, `Last Month`, `All Time`.

The filter control is a **`button[role=combobox]`**, not a `select`. It is
`inline-flex items-center justify-center gap-1.5`, it holds a `span` and the chevron `icon-10`,
and it takes its **width from its text**, so it has no fixed width. The chevron carries
`opacity-75 group-data-[state=open]:rotate-180`. The ids are `livestream_filter_by` and
`livestream_sort_by`.

The filter control is **32px** tall, `bg-secondary-base/20`, radius 4, `px-3 py-1.5`, 14px weight
600 white. `Languages` measures 118.63 by 32. Its label is 14px weight 600 white, `gap-2` from the
control. The row is
`flex w-full flex-row flex-wrap items-center justify-between gap-x-8 gap-y-4`, so one control sits
left and one sits right.

### 19.7 The Following page

```
h2  Following
tabs  Live Channels | Categories | Channels
div.flex.flex-col.gap-6.pb-20.lg:gap-8
  section.relative.flex.flex-col.gap-y-3.lg:gap-y-4
    div.flex.items-center.justify-between  ->  h2 "Live Channels"
    a stream grid, holding only followed channels that are live
  section.relative.flex.flex-col.gap-y-3.lg:gap-y-4
    div.flex.items-center.justify-between  ->  "Channels you might like" + "View all"
    a one row stream grid
```

The first tab reads **Live Channels**, not "Livestreams". A section heading is
`text-base font-bold text-white lg:text-2xl`, the same size as the page title. The section shape
is the same one the home page uses for `Streams For You`.

`/following/categories` follows it: a `Categories` heading and a category grid, no filters. When a
list is empty KICK shows the empty state, so there is nothing to preview and no toggle to preview
it with.

### 19.7a The Channels tab is a banner card grid, not a list

Measured on `kick.com/following/channels` on 27 July 2026, at 2560 by 1249, **logged in**. Logged
out this page holds the empty state, so the saved scrape shows no cards. Read it in the user's
Chrome, or you measure the empty state and call it the page.

The heading is **`Followed Channels`**. The page shape below the tabs is the one Section 19.7 gives.

```
section  relative flex flex-col gap-y-3 lg:gap-y-4
  div  flex items-center justify-between  ->  h2 "Followed Channels"
  div  grid grid-cols-[repeat(auto-fill,minmax(335px,1fr))] gap-5
    div  group relative flex w-full flex-col rounded
      a
        div  relative flex aspect-[1/0.53] min-h-[179px] w-full cursor-pointer flex-col rounded
             bg-cover bg-center        <- the channel banner, under a flat scrim
          div  flex grow flex-col items-center justify-center gap-2
            div  relative box-content rounded-full border-4 transition-all
                 betterhover:lg:group-hover:scale-110
              img  size-12 rounded-full lg:size-20
              div  absolute -bottom-1.5 right-1/2 flex w-10 translate-x-1/2 rounded-[2px]
                   bg-green-500 px-2 py-1 text-[10px] font-bold uppercase leading-3 text-[#070809]
            span  text-sm font-bold betterhover:hover:underline
      button  size-8 absolute bottom-2 left-2 hidden betterhover:group-hover:flex
              rounded bg-secondary-base text-secondary-onSecondary state-layer-surface
```

| Thing | Live value |
|---|---|
| Grid | `repeat(auto-fill, minmax(335px, 1fr))`, `gap: 20px`. At 2560 that gives 5 columns of 384px |
| Card | 384 by 204, radius 4. The banner **is** the card, and it holds the whole layout |
| Card ratio | `aspect-[1/0.53]`, floored by `min-h-[179px]` |
| Banner scrim | `linear-gradient(0deg, rgba(49,49,49,0.5), rgba(49,49,49,0.5))` over the image, `bg-cover bg-center` |
| Avatar | 80px at `lg` (`size-12 lg:size-20`), on a `box-content border-4` ring, so the ring box is 88px |
| Ring, live | `border-green-500` |
| Ring, offline | **`border-transparent`.** The ring box stays, so the card does not move |
| Live chip | 40 by 20, `bg-green-500` on `#070809`, 10px weight 700 uppercase, radius 2, `-bottom-1.5` |
| Name | 14px weight 700, **white on a live and on an offline card**, underlines on hover |
| Unfollow | 32px, `bg-secondary-base`, a **filled heart**, `aria-label="Unfollow"`, bottom left, 8px in |

Four details decide whether this reads as KICK:

- **An offline card is not dimmed.** No greyscale on the avatar, and the name stays white. Only the
  ring goes transparent and the chip goes away. This is the opposite of the sidebar row, Section 13.
- **The card carries no category and no viewer count.** The banner, the avatar, the chip and the
  name are all of it. There is no `Offline` label.
- **The unfollow button is hidden until the card is hovered**, `hidden betterhover:group-hover:flex`.
- **The avatar grows on hover**, `betterhover:lg:group-hover:scale-110`, and it is the only motion.

**The sidebar disagrees with this page on purpose.** On `/following/channels` an offline row in the
sidebar shows the username only: no category, no viewer count, the avatar dimmed and the name
`text-neutral-700`. The card for the same channel shows a full colour avatar and a white name. Do
not make one match the other.

### 19.8 A channel page is two different pages, and a live home page has no tabs

Measured on `kick.com/trainwreckstv` (live), `kick.com/trainwreckstv/videos` (live) and
`kick.com/eddie` (offline), 27 July 2026.

| URL | Live channel | Offline channel |
|---|---|---|
| `/slug` | The full player fills the column, then the channel bar. **No tabs.** The column does not scroll: `scrollHeight` equals `clientHeight` | Banner, channel header, **tabs**, then the Home content |
| `/slug/about`, `/slug/videos`, `/slug/clips` | A **320px black strip holding a small live card**, then the channel bar, then **tabs**, then the content | Banner, channel header, tabs, then the content |

**The player is the live home page.** Do not put a tab strip under it. KICK gives a live channel
its tabs only on the three sub-pages.

**The live card on a sub-page**, so a viewer can get back into the stream:

```
div  relative block h-[320px] w-full shrink-0 overflow-hidden bg-black
  div  the video layer, the 16:9 stage of Section 4.1, 569 by 320, centred
  div  [370x264] bg-surface-base flex flex-col items-start justify-center gap-4 rounded p-5
    div   [47x28] rounded bg-[#070809] px-2 py-0.5 text-green-400  -> LIVE, text-sm font-bold uppercase
    div   flex justify-between gap-4  -> title, line-clamp-2 font-bold, and a 32px mute button
    div   flex items-center gap-1 text-sm font-bold
          an icon, then "<span class=text-primary-base>30.7K</span> watching" in text-subtle
    button [330x40] Watch now, bg-primary-base, full card width
```

The viewer count in that card is **green**, and the word "watching" is subtle. The card sits at the
left of the strip and is centred in its 320px height.

**There is no link from a live home page to the tabs.** The channel name in the bar is an `h1` with
no href, and the only `/slug` links on the page are the sidebar rows. A viewer reaches
`/slug/videos` by URL, by search, or from a card menu elsewhere. Our demo makes the name and the
avatar in the channel bar link to `/slug/about`, which KICK does not do, so that the four tabs are
reachable by clicking. That is a deliberate divergence, recorded here so nobody 'corrects' it back.

### 19.9 The channel bar avatar, and the second line

Measured on `kick.com/sweatergxd/about`, a live channel, 27 July 2026. Read a **live** channel for
this. A channel that goes offline mid-read loses the ring and the badge, which is easy to misread
as "KICK does not draw one".

```
div  shrink-0
  button  inline-flex h-14 w-12 items-center justify-center border-0 !p-0 lg:h-[68px] lg:w-16
    div  [64x64] group relative flex aspect-square shrink-0 items-center size-12 lg:size-16
      div  [64x64] aspect-square w-full overflow-hidden rounded-full border-2 border-green-500 lg:border-4
        img  [56x56]
      span [34x20] absolute -bottom-1.5 left-1/2 -translate-x-1/2 transform rounded-sm bg-green-500
                   px-1.5 py-1 text-[10px] font-bold  ->  LIVE
```

| Thing | Value |
|---|---|
| Ring | A **4px solid border** on the avatar itself, `border-4 border-green-500`, `border-2` below `lg`. **Not** a `ring` with an offset. There is no dark gap between the picture and the green |
| Avatar box | 64 by 64. The picture inside is **56 by 56**, because the border eats 4px a side |
| LIVE badge | 34 by 20, `rounded-sm` (2px), `px-1.5 py-1`, 10px weight 700, ink `#171A1C` on `#53FC18`, **centred** on the bottom edge with `-bottom-1.5 left-1/2 -translate-x-1/2` |

**The second line of the channel bar changes with the page.**

| Page | Line 2 |
|---|---|
| Live home, the player page | The **session title**, 14px weight 600, white |
| A sub-page (`/about`, `/videos`, `/clips`) | **"84K followers"**, 14px weight 700, `#929EA6`. The number carries `text-primary-base lg:text-[unset]`, so it is green on a small screen and inherits on a large one |

Line 3 is the same on both: the green category link, then the pills, in a
`flex min-w-0 max-w-full flex-wrap items-center gap-2 overflow-hidden` row.

### 19.10 Our Home tab, a second deliberate divergence

KICK points the Home tab at `/slug`, which for a live channel is the full player. So the Home tab
puts a viewer back in the stream, and a live channel has no content page.

Our demo adds **`/slug/home`**. The Home tab of a live channel goes there, and that page shows the
live card of 19.8, the tabs, and the Stream Videos, Popular Clips and Recently Streamed Categories
sections. `/slug` stays the player, and only `Watch now` and a card click go to it. An offline
channel keeps Home on `/slug`, because there is no player to protect.

Recorded here with 19.8 so nobody 'corrects' either one back.

### 19.11 The live channel page scrolls, and the right cluster is two rows

Measured on `kick.com/adrienbroner`, a live channel, 27 July 2026.

**Correction to 19.8.** A live channel page **does** scroll, and it holds an About card and panels
under the channel bar. An earlier read said the column does not scroll. That read queried
`#channel-content`, which is **our** id, not KICK's. KICK's scroll container is `main`. Query the
live page by tag, never by an id our own build invented.

The column under the player is `padding: 20px 28px` with `gap: 24px`, holding, in order: the
channel bar, the About card, then the panels.

**The channel bar right cluster is two rows**, not one:

```
div  flex shrink-0 flex-col items-end gap-2                      [353x92]
  div  flex grow gap-2 lg:grow-0                                 [353x40]
    button [96x40]  Follow      bg #53FC18, ink #0B0B0C, r4, gap-1.5, px-3 py-2, 16px/600, icon 16
    button [116x40] Gift Subs   bg #42474D, white
    button [124x40] Subscribe   bg #42474D, white
  div  flex items-center gap-2 self-end py-0.5                   [223x44]
    div  flex items-center gap-1 text-sm font-bold               [127x20]
      svg [16x16] white
      span text-subtle  ->  "<span class=text-primary-base>3,012</span> watching"
    button [40x40]  share,  transparent, icon only
    button [40x40]  report, transparent, icon only
```

| Thing | Value |
|---|---|
| Share and report | **Transparent 40px icon buttons on the second row**, beside the viewer count. They are not filled buttons on the button row |
| Report | KICK has one, a warning triangle. A channel bar without it is incomplete |
| Viewer count | `3,012 watching`. The **number is green and comma grouped**, the word `watching` is `#929EA6`. It is not "3.0K viewers" in green |
| Follow | Widens to fit its label. It is not a fixed 96px |

**The About card**, first thing under the bar:

```
section  bg-surface-base flex h-fit grow flex-col gap-2 rounded-lg p-6      bg #171A1C, r8
  div  flex grow items-center justify-between gap-3
    div  text-base font-bold  ->  "About <name>" + a 16px verified tick
    span text-sm font-semibold #9FA6AD  ->  "<span green>189.8K</span> Followers"
  div  flex flex-wrap items-center gap-2 lg:gap-x-4 lg:gap-y-2
    a  min-h-9 max-w-[200px] rounded px-2 gap-1.5 text-sm font-semibold  ->  icon 16 + handle
  the bio, one short line
```

**Panels** sit under the About card, centred, as a wrapping row. On kick.com they are sponsor
images a streamer uploads. Not every channel has them, so the row hides when the list is empty.

**Panel size.** A panel is **340px wide**. The height follows the uploaded image, so it varies:
340 by 414 and 340 by 340 on one channel. `object-fit: fill`, no radius, `max-width: 100%`. Panels
are portrait or square, never a 16:9 landscape box. Each panel sits in its own `flex flex-col
gap-3`, and the row gap is 12px. Not every channel has panels, and the count varies.

---

## 20. The profile menu

**Source:** `kick.com`, read on 27 July 2026 at a 2560 by 1305 viewport, **logged in**. The saved
scrape cannot answer this section, because a logged out navbar has no avatar and no menu.

The menu opens under the navbar avatar. Its box is `316 by 655`, `bg-surface-highest` (#232629),
`rounded-lg`, and it sits at `right: 40px` under `--navbar-height`.

**Seven direct children, in this order, with `gap-1` between them.** Three of them are separators,
and the middle one is inset.

| # | Child | Class | Box, from the menu corner |
|---|---|---|---|
| 0 | Header | `flex flex-col gap-3 px-2` > `flex flex-col gap-4 px-4 py-4` | x0 y0 316 by 268 |
| 1 | Separator | `bg-outline-decorative h-px w-full` | x0 y272 316 by 1 |
| 2 | Account rows, 4 | `flex flex-col gap-1 px-2` | x0 y277 316 by 204 |
| 3 | Separator, **inset** | `bg-outline-decorative h-px mx-4 w-[calc(100%-32px)]` | x16 y485 284 by 1 |
| 4 | Settings rows, 2 | `flex flex-col gap-1 px-2` | x0 y490 316 by 100 |
| 5 | Separator | `bg-outline-decorative h-px w-full` | x0 y594 316 by 1 |
| 6 | Log out | `min-h-12 py-1 px-2 w-full gap-4 font-normal` | x0 y599 316 by 56 |

The menu has no bottom padding. The log out row is a wrapper, not a group, so it is 56 tall where
every other row is 48.

**The header**, inside `px-6 py-4`, is a centred column of `gap-4`. The first child is a
`max-w-[262px]` column of `gap-2`:

```
div  size-[50px] relative overflow-hidden          the level badge, a PNG from ext.cdn.kick.com
span text-lg font-bold leading-7                   the username, x24 y74
span text-xs leading-4 #9FA6AD, centred            the level blurb, 3 lines, x24 y110 262 by 48
div  flex w-full flex-col gap-1.5                  x24 y166 262 by 38
  div role=progressbar  mt-2 flex h-2 w-full items-center
    div  bg-outline-region relative h-2 min-w-px flex-1 rounded-lg
      div  bg-surface-onSurface absolute inset-y-0 left-0 rounded-lg
  span text-xs #9FA6AD  ->  "<span class='text-primary-base font-semibold'>41%</span> towards Level 12"
a  h-8 w-full bg-secondary-base rounded px-3 py-1.5 text-sm font-semibold   "View your channel"
```

| Thing | Value |
|---|---|
| Level badge | A per-level PNG, `50 by 50`, a rounded square. It is not a green circle and it is not the user avatar. See the badge note under this table |
| Progress track | `bg-outline-region` (#f0f1f266), **8px tall**, `rounded-lg` |
| Progress fill | `bg-surface-onSurface`, so **white, not green** |
| Progress label | Only the percentage is green and semibold. `towards Level 12` is `#9FA6AD` and regular |
| Button | 268 wide, so it is **wider than the 262 text column** |

**The level badge is not a flat colour.** Read at 7 times size from `ext.cdn.kick.com`, level 11:

| Part | Value, for a 50px badge |
|---|---|
| Ring | A 2px edge of the flat tier colour, `#FFD400`, on a `11px` radius |
| Face | Inside the ring, a vertical gradient, `#FFF6A8` at the top, `#FFE96B` at 45%, `#FFDA2E` at the bottom |
| Digits | Black, `22px`, weight 800, centred |

The gradient is what gives the badge its embossed look. A flat yellow square reads as wrong.

**A menu row** is `min-h-12 gap-4 px-4 py-1 text-base font-normal`, with `state-layer-surface` for
hover. Icons are **16px**, and the label starts at x56 from the menu corner.

The rows, in order: `Creator dashboard`, `Subscriptions`, `Drops & rewards`, `Collectibles`, then
the inset separator, then `Display language` and `Settings`, then a separator, then `Log out`.

**Two rows break the pattern:**

- **Collectibles** draws its icon at **20px**, not 16. Its viewBox is `0 0 21 16`, where every other
  menu icon is square.
- **Display language** is a `px-0 py-1` wrapper holding a `h-10 px-4` button. The label is 16px, the
  value `English` is 14px `#9FA6AD`, and the chevron after it is **12px**, not 16.

---

## 21. The settings pages, measured on kick.com 27 July 2026, logged in at 2560

Seven tabs exist. We build two of them, `/settings/profile` and `/settings/preferences`. The rest
render and do nothing. Logged out, both pages return an empty shell, so the saved HTML in
`demo/kick-reference/html/` holds nothing. Read these pages in the user's Chrome.

### 20.1 The shell, shared by every tab

```
h1 {2220x52}   "Settings"   text-2xl, line-height 32px, py-2.5
div            the tab rail, sticky, 48px tall, inset 2px shadow at the foot
div            the panel, max-w-844, mx-auto, gap-y-5, lg:pt-6
  div.p-2.5
    h2 {824x24}   the panel title, text-xl bold
  section        one card per group
```

**The tab rail sticks under the navbar.** KICK writes `sticky -top-3`, because their 12px top
padding sits on the **scroll container**. Our `PageShell` puts that padding on a div inside the
scroller, so we write `top-0` and the rail lands in the same place, 60px from the top.

The active tab is green (`#53fc18`) on a 1px green bottom border, plus a separate absolutely
positioned 2px underline at `bottom-[-2px]`.

### 20.2 A settings card

Every group is a `section`, and it is a card, not a divided list:

| Part | Value |
|---|---|
| Card | `bg-surface-base` `#171a1c`, radius 4px |
| Header | `p-4`, 2px bottom border `rgba(240,241,242,0.16)` |
| Header title | `h3`, 18px, weight 700, line-height 20px, white |
| Header help text | 14px, weight 400, line-height 21px, `#9fa6ad`, under the `h3` in a `gap-1` column |
| Body | `p-4` |

The help text sits **in the header**, under the title, not in the body.

### 20.3 A field, and why it is 68px tall

A field is a label then a control, and it measures **812 by 68** inside the 844 card:

- The `label` is **inline**, so its line box is the 24px body line-height, not its own 17px.
- The control carries an **8px top margin**, then its own 36px height.

KICK gets that margin from `space-y-2` on Tailwind v3. **Tailwind v4 changed `space-y-*` to a
bottom margin on every child but the last**, which an inline label ignores, so the same class
gives 60px here. Put `mt-2` on the control instead.

### 20.4 The buttons

| Button | Size | Fill |
|---|---|---|
| Save changes | 119x32 | `bg-primary-base`, `min-w-[10ch]` |
| Save, on the Social Media card | 92x32 | as above |
| Cancel | 71x32 | transparent |
| Update Banner image | 170x32 | `bg-secondary-base` |
| Edit Avatar | 89x36 | `bg-secondary-base` |

All are `px-3 py-1.5 text-sm`, weight 600, radius 4px. Disabled reads
`rgba(240,241,242,0.08)` on `rgba(240,241,242,0.24)`.

The Cancel and Save pair is **right aligned** at `lg`, in a
`flex w-full flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-end`. Cancel is `order-last`
on mobile and `order-first` at `lg`, so Save sits on top on a phone and on the right on a desktop.

### 20.5 `/settings/profile`, five cards

| Card | Height | What is in it |
|---|---|---|
| Profile Preview | 198 | The avatar and Edit Avatar in a `hidden lg:flex` left column, then "About <name>", the follower count and the description. **No banner in this card.** |
| Channel Banner | 239 | A frame at `aspect-[580/64]`, `max-w-[580px]`, `lg:w-3/4`, centred, then the button, then centred help text |
| Offline Stream Banner | 518 | The same, at `aspect-video` |
| Basic Details | 507 | Three forms: Username, Email, Bio |
| Social Media | 674 | One form, seven inputs, one Cancel and Save pair |

The panel totals **844 by 2303**.

**Each field in Basic Details is its own `form`** with its own Cancel and Save pair. Both start
disabled and enable when the field changes. Bio is a `textarea`, `rows=3`, `maxlength=500`, with a
2px `border-neutral-700`, unlike the 1px `border-outline-region` on an input.

**Social Media is one form for all seven.** The order is Club, Instagram, X, Facebook, YouTube,
Discord, TikTok. Every input reads "Enter social handle" and carries
`data-testid="profile-inline-edit-input-<name>"`. The button row adds `lg:pt-6`.

### 20.6 `/settings/preferences`, one card

One card, 844 by 247. The header is 79 tall and holds the title plus the help text. Then three
rows of 56, with **no border between them**.

The row label is 16px on a 24px line box. The three rows are "Hide Pools, Hot Tubs & Bikinis",
"Hide Slots & Casino" and "Hide VR Chat".

**The switch is 36 by 20**, `role="switch"`, and carries both `aria-checked` and `data-state`. The
knob is a 14 by 14 span, offset 4px from the left and 3px from the top, and it reads `data-state`
off itself, not off the parent. Unchecked the track is `#42474d` and the knob is white. Checked the
track is `#53fc18` and the knob turns `#171a1c`. Drive the styling from `data-state`.

---

## 22. The creator dashboard, a separate site

**Source:** the `/stream` page of the dashboard host, read on 27 July 2026 at 2560 by 1305 in the
user's own Chrome, **logged in**. The page needs a session, so it cannot be read logged out.
Baseline: `demo/kick-reference/measured/dashboard-stream-2560.json`.

The dashboard host is not the main site. It loads its own CSS chunks (`38u2r_w4u4dju.css`,
`2m7oyef7xpt18.css`), it shares the token layer, and it lays the page out a different way. Do not
reuse the main shell for it.

### The navbar

Same 60px height and same `#0b0b0c`, but the contents differ from the main site:

| Part | Main site | Dashboard |
|---|---|---|
| Padding | `pl-3 pr-10` | `pl-3 pr-10`, the same |
| Left | menu button, wordmark, search | menu button, wordmark. **No search** |
| Left gap | 8px | **10px** (`gap-2.5`) |
| Right | Get KICKs, chat, avatar | **Go live**, avatar |
| Right gap | 8px | **20px** (`gap-5`) |
| Menu icon | `collapse-sidebar` | the same three bars, `aria-label="Collapse sidebar"` |
| Wordmark | `kick-logo.svg`, 97 by 26 | the same file, byte for byte |

**Go live** is `h-9 px-2 gap-1.5 text-sm font-semibold`, `bg-primary-base` on
`text-primary-onPrimary`, and it carries **the KICK K glyph**, not a live dot
(`demo/src/kick/icons/kick-mark.svg`). The avatar is `size-8 rounded-full`. Measured at 2560, the
button lands at 2386,12 and the avatar at 2488,14.

### The frame

```
nav                              60px
sidebar   256px  --sidebar-expanded-width, bg-surface-lowest, ul.px-2
gutter    fills  bg-black, p-0.5              <- the page under the panels is pure black
rail      64px   bg-surface-base, rounded-l, px-3 py-2.5, gap-y-4
```

A sidebar item is `h-12 px-4 py-1 gap-x-4 rounded text-base font-semibold`, and the active one is
`!bg-secondary-base` (`#42474d`), not the green the main site uses. Each item carries a
`data-testid` of `dashboard-tab-<name>`, and Studio and Community are buttons that expand.

### The panel grid is percentages, never pixels

Every pane is a percentage of its parent, each pane has a 2px pad, and black shows through the
gaps. **Copy the percentage.** A pixel freezes one viewport.

| Column | Width | Rows |
|---|---|---|
| 1 | 50% | Session Info 22%, Stream Preview 50%, then a row at 28% holding Activity Feed and Mod Actions at 50% each |
| 2 | 30% | Chat, full height |
| 3 | 20% | Stream info 30%, Channel Actions 70% |

### A panel

```
div  flex h-full w-full flex-col
  div  h-[52px] items-center justify-between rounded-t border-b border-outline-decorative
       bg-surface-base py-2 pl-6 pr-4
    div  flex items-center gap-4 text-lg leading-none   ->  icon 16 + title 18px/700
    div  flex items-center gap-1                        ->  size-8 buttons, pop-out last
  div  flex flex-1 grow overflow-hidden rounded-b bg-surface-base
```

**The panel surface is `bg-surface-base` (`#171a1c`), not `surface-lowest`.** This is the opposite
of the main site, where one surface runs across the whole page. Here the panels are lighter and the
page under them is black. Getting this backwards is the fastest way to make the dashboard look
wrong.

Every panel header ends with the pop-out button. Activity Feed and Mod Actions add a filter button
before it, Stream info adds a pencil, and Stream Preview has none.

**An icon inside a button is sized by the button's font, not by a size class.** Every button
carries `[&_svg]:size-[1em]`, so the icon follows `text-sm` or `text-base` and a `size-4` on the
`svg` loses to it. Write the mechanism, never the pixel:

| Button | Font | Icon |
|---|---|---|
| Panel header action, `size-8` | `text-sm` | **14px** |
| Navbar menu, `size-10` | `text-base` | 16px |
| Go live, `h-9` | `text-sm` | 14px |
| Rail tool, `size-10` | `text-base` | 16px |
| Chat identity, `h-[30px] px-[5px]` | 16px through an inner `size-4` wrapper | 16px |
| Chat emote, `size-9` | `text-base` | 16px |

The leading icon beside a panel title is 16px, because it sits outside a button.

**Channel Actions is the one exception.** Its pop-out renders at **16px** where every other panel
renders 14px, on an identical 32px button at the same 14px font. Measured, not guessed. Copy the
exception.

A Channel Actions row ends in a **12px chevron**, or nothing at all when the row is disabled
(Raid Channel has no chevron). A row that opens another site ends in a **16px** external-link glyph
(`dash-external`), which is a plain box and arrow, **not** the dotted `dash-popout` the headers
use. Both sit 16px from the panel's right edge, so their right edges line up with the chevrons.

### Inside the panels

- **Session Info.** `flex w-full gap-1` holding five `w-full flex-col items-start gap-3 px-3 py-4`
  blocks, separated by `w-px h-full shrink-0 bg-outline-decorative`. **The divider needs
  `shrink-0`**, or it is crushed to zero by the `w-full` blocks beside it. Session shows a badge
  (`rounded-sm p-1 text-xs font-semibold uppercase bg-surfaceInverse-base`), the rest show a value.
  A border-top closes the row.
- **Stream Preview.** No `aspect-video`. The image fills the panel with `object-cover
  object-center`, and the offline card centres over it: `h-fit w-fit gap-4 rounded bg-surface-base
  p-5`, a `bg-[#F4F5F6] text-[#070809] px-1.5 py-1 text-[10px] uppercase` badge, then
  `text-base lg:text-2xl` "<name> is offline". The artwork is the default offline banner the
  dashboard host serves, 1764 by 993, 194 KB. It is stock artwork, so it is not ours to commit.
- **Stream info.** `p-4`, the title as `line-clamp-2 font-semibold`, then a category tile at
  `aspect-[164/219] h-[46px] rounded object-cover`, the category name, and a language pill
  (`rounded-full px-2 py-1 text-sm bg-secondary-base`).
- **Channel Actions.** `py-2` then `px-4 pt-2 gap-4`. Each group is a `pb-2 text-base font-bold`
  heading, its rows, and a `h-px w-full bg-outline-decorative` rule. A row is `min-h-11 py-2
  text-sm font-normal justify-between gap-4`, ending in a value plus a 12px chevron, or a switch.
- **The switch** is `h-5 w-[2.25rem] rounded-full`, `bg-secondary-base` off and `bg-primary-base`
  on. The knob is `h-[0.875rem] w-[0.875rem]`, `translate-x-[0.25rem]` off and
  `translate-x-[calc(2.25rem-0.25rem-0.875rem)]` on, which measures 4px to 18px.
- **Chat.** The same component the channel page runs, on a different surface and with a shorter
  button row. Read live on 28 July 2026 at 2560 by 1305, logged in. See the table below.

### The chat panel, against the channel page

Section 6 holds the chat itself. Only these four things change on the dashboard. Everything else,
the input row, the emote bar, the emote picker and the message rows, is the same markup.

| Part | Channel page | Dashboard |
|---|---|---|
| Chat root | `bg-surface-lowest` (`#0b0b0c`) | `!w-full bg-surface-base` (`#171a1c`) |
| Message list | `bg-surface-lowest` | `bg-surface-base` |
| Header and gifter leaderboard | both present | **neither.** The panel header is the only title |
| Left button group | channel points with a count, then Get KICKs with a count | **channel points only, and no count** |

**The dashboard points button carries two glyphs and no number.** It is
`state-layer-surface px-2 py-1.5 text-sm gap-1`, so it measures 56 by 32 where the channel page
button is `h-9`. Inside it sit the 16px channel-points glyph, then KICK's own **KICKs mark at
20px**. Both are white: the button is `text-white`, and each path takes `fill="current"`. The
KICKs mark reads as an infinity sign, and it is the same file the channel page uses for Get KICKs
(`demo/src/kick/icons/chat-kicks.svg`). There is no Get KICKs button on the dashboard.

Two values measured on both pages, which an earlier build had wrong on both:

- **The emote bar carries no gap.** It is
  `flex h-7 max-h-7 w-full max-w-full flex-wrap items-center overflow-hidden empty:hidden
  lg:justify-between`, so the row spreads itself. Each emote is a `h-full w-fit` div holding a
  `relative h-full shrink-0 rounded-sm p-0.5 aspect-square` button and a `h-full w-full` image.
  A wide emote takes `aspect-[2/1]` instead.
- **The input row wears a focus ring, not a border colour.** `focus-within:border-transparent
  focus-within:bg-[#070809] focus-within:outline-none focus-within:ring-1
  focus-within:ring-[#F4F5F6] focus-within:ring-offset-1 focus-within:hover:border-transparent`.

The button row is `flex shrink-0 grow-0 items-center gap-1 lg:w-full lg:gap-0`, holding
`flex gap-x-1 lg:w-full lg:gap-x-2` on the left and `ml-auto flex items-center gap-x-2` on the
right. The same on both pages.

**The emote bar was collapsed on the account we read.** Its wrapper held an inline
`height: 0px; opacity: 0; padding-bottom: 0px`, on the dashboard and on the channel page alike, so
both footers measured 118. Focus on the field does not open it, so it is a chat setting we could
not read. The bar itself is 28 tall, which is the 146 our footer measures with it open.

### The right rail

Ten `size-10` buttons in one 64px column: an info button, an edit button on
`bg-secondary-base/20`, a `h-px w-6` rule, seven tool buttons that each wear
`border border-primary-base` on a transparent fill, and a dots button. The icons are 16px. They
carry no `aria-label` on the live site, and the label comes from a tooltip.
