# The rules and the numbers

Everything here was read from kick.com's own markup, CSS, or DOM. Nothing is estimated.
Dates and viewports are on each section. `.claude/KICK-SITE-REFERENCE.md` is the wider record.

---

## 1. Icons

**KICK ships no icon package.** No Lucide, Heroicons, Phosphor, Feather, Tabler, Remix or Iconify
appears in the markup. Each icon is a compiled React component with a minified name, so the bundle
gives geometry with no names.

The method, and there is no other:

1. Take the SVG out of the rendered markup.
2. Name it from the `aria-label` of the button or link that holds it.
3. If nothing labels it, keep it as `icon-N.svg` and rename it when a page does.

`demo/src/kick/icons/` holds the set. `demo/src/kick/icons.ts` is generated from the folder, and
`Icon.tsx` renders one by name.

**Nav icons come in pairs.** KICK renders two SVGs per nav item and swaps them on `data-state`:
outline when inactive, filled when active. Rendering the filled one in both states is a fault we
have already shipped once.

Icons are filled, never stroked, and 16px unless the button says otherwise. A hand drawn icon, or a
wordmark set in a font, gives the copy away faster than any layout error.

---

## 2. The page frame

| KICK variable | Value |
|---|---|
| `--navbar-height` | `60px` |
| `--sidebar-expanded-width` | `256px` |
| `--sidebar-collapsed-width` | `56px` |
| `--chat-width` | `340px`, and it is a drag handle, not a constant |

- **Every column is the same colour.** Separation comes from borders and spacing, never from a
  lighter panel.
- The navbar has no bottom border.
- The sidebar toggle collapses to the 56px rail. It does not hide the sidebar.
- `body` is `overflow: hidden`. The page does not scroll as one document. The main column scrolls
  with `.no-scrollbar`.

Navbar metrics, read logged in at 2560 by 1305 on 26 July 2026:

| Thing | Value |
|---|---|
| Height, padding | 60px, `0 40px 0 12px` |
| Sidebar toggle | 40 by 40, radius 4, transparent |
| Wordmark | 97 by 26, at x 62, which follows from the 40px toggle plus a 10px gap |
| Search field | 450 by 32, transparent, 1px `outline-region` border |
| Right cluster | `gap-8px`. Daily reward 36 by 36 on `#42474D`, Get KICKs 107 by 36 on `#42474D`, avatar 32 |

---

## 3. The page column, and the grids

Read from the saved markup on 27 July 2026, and confirmed against the running clone.

**Two pages, two sets of spacing.** A shared shell with one set of values is wrong on one of them.

| Thing | Home | Browse |
|---|---|---|
| Scroll container | no top padding | `pt-3 lg:pt-6` |
| Column | `gap-y-5 pt-3 lg:gap-y-7 lg:pt-0` | `gap-y-3` |

Both share `px-4 lg:px-8 xl:px-10`, then `m-auto flex max-w-[125rem] flex-col`.

**Home sections hold one row. Browse sections wrap.** KICK holds a section to one row with
`grid-rows-1` and `auto-rows-[0]`, so every card after the first row collapses to zero height, and
`overflow-y-hidden` clips it. Below `lg` the same section becomes a horizontal snap scroller,
`-mx-4 px-4 snap-x snap-mandatory scroll-ps-4`, with a fixed child width: 268px for a stream, 108px
for a category.

Stream grid columns, the same on both pages:

```
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6
group-data-[sidebar=false]/main:xl:grid-cols-5
group-data-[sidebar=false]/main:2xl:grid-cols-6
group-data-[sidebar=false]/main:3xl:grid-cols-7
```

Gaps are `gap-x-4 gap-y-5 lg:gap-y-6`.

Category grid columns: `grid-cols-2 sm:grid-cols-4 md:grid-cols-5`, then
`repeat(auto-fill, minmax(139px, 1fr))` from `lg`. The column gap is **8px**, not 16px, and the
card gap is 4px. A category grid is not a stream grid with narrower cards.

---

## 4. The sidebar channel row

The row has **two children, not three.** The viewer count is not a third column.

```
a           flex h-11 w-full flex-row items-center gap-2 rounded px-1.5 py-1
  div       the avatar, size-7, rounded-full
  div       flex min-w-0 max-w-full shrink grow flex-col gap-0.5
    span    the username, text-sm font-bold leading-[1.2], white
    span    the category, text-xs font-bold leading-normal, #929EA6
  div       flex w-fit shrink-0 flex-nowrap items-center gap-x-1 self-start
    div     the live dot, h-2 w-2 rounded-full bg-green-500
    span    the count, text-sm font-semibold, white
```

Two details decide whether this reads as KICK:

- **The count uses `self-start`.** Centring it across both lines is the common mistake.
- **The dot is a plain 8px `div`, not an SVG.** An icon gives the wrong size and colour.

An offline row dims the avatar with `mix-blend-luminosity grayscale` and sets the username to
`text-neutral-700`.

---

## 5. Buttons and states

- The primary button is ink on `#53FC18`. The secondary is white on `#42474D`.
- KICK puts a state layer on both: `state-layer-base` darkens, `state-layer-surface` lightens.
- On a **live** channel, `Follow` is 96 by 40 in green with a heart, `Gift Subs` is 116 by 40 grey,
  and `Subscribe` is 124 by 40 **grey**. On an **offline** channel `Subscribe` is green. The
  arrangement inverts, so read the state you are building.
- Once following, `Follow` collapses to a 40 by 40 heart button.
- Tailwind resets `button` to `cursor: default`. Restore the pointer, or every no-op control feels
  dead.

---

## 6. The offline channel

| Thing | Value |
|---|---|
| Banner | 134px, `--channel-desktop-banner-height` |
| Offline card | **A card over the banner**, not a heading under it. 294 by 72, 28px in from the top and left, `bg-surface-base`, radius 4, padding 20, gap 16 |
| Offline pill | 66 by 28, ink on white, radius 2, 14px weight 700, uppercase |
| Heading | 24px weight 700, line height 32 |
| Avatar | 64px here, against 56px on the live channel bar |

---

## 7. The z-index scale

| Class | Value |
|---|---|
| `z-absolute` | 101 |
| `z-player` | 201 |
| `z-controls` | 202 |
| `z-navbar` | 301 |
| `z-popover` | 401 |

**The navbar does not use `z-navbar`.** The live `nav` element carries `z-[402]`, and the sidebar
wrapper carries `z-[401]`, both as arbitrary values. Read the element, not the scale, before you
correct one of them. A scale of 300, 400 and 500 is invented and works until two invented layers
meet.

---

## 8. Build gotchas, each one paid for

0. **`curl` and Node get 403 from kick.com.** Cloudflare rejects every client that is not a real
   browser. Capture through the browser. `assets.kick.com` is open, so the CSS still downloads.
1. **Guessing a hash instead of deriving it** mislabelled five icons, including turning
   `youtube.svg` into `search.svg`. Derive a name from real path data or a real `aria-label`.
2. **`[&_svg]:size-4` does not always apply.** Size the `Icon` directly with a `className`.
3. **A custom utility in `@layer utilities` gets no variants** in Tailwind v4. Use `@utility`.
4. **Tailwind scans everything under the Vite root**, including a saved kick.com page, which
   generates a utility per class in their markup. Exclude it with `@source not`.
5. **Reading React state in the same evaluation as the click** returns the old value. Read it in a
   second call.
6. **An outside-click handler that does not exclude its own trigger** makes a menu impossible to
   open, because `mousedown` closes it before `click` toggles it.
7. **A long class string can read as an opaque token** to a content filter. Return arrays of short
   tokens when you dump markup.
8. **The Browser pane must be displayed to composite frames.** If it is not, screenshots time out
   and `getBoundingClientRect` is the only evidence available.
