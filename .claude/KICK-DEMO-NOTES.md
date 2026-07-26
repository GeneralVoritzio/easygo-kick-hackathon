# KICK demo, working notes

What we measured, what we decided, and what is still wrong. Read this with
`.claude/KICK-SITE-REFERENCE.md`, which holds the measured facts about kick.com. This file holds
the **decisions and the open list** for the clone in `demo/`.

Update this file whenever the brief changes. Add the date.

---

## 1. Standing instructions

These come from the user. Follow them without being asked again.

| Rule | Why |
|---|---|
| **Measure the live site, do not guess.** Open the page, read the DOM, take the numbers | Every mismatch so far came from guessing |
| **Scroll the whole page and click things before saying it is done** | Faults were found below the fold and behind clicks |
| **Never pay for anything, never subscribe, never buy KICKs** | Verification only |
| **If a link goes nowhere, do not navigate.** Render the control, keep the hover, do nothing on click | A dead route that renders blank looks broken |
| **Anything that is a control on the real site stays a control here.** Hover, cursor, press state, all present, even when the action is a no-op | |
| **Placeholder content must look like kick.com.** Real category names, real streamer-flavour handles, adult-audience tone | It must not read as a children's product |
| **No asset is fetched from the network**, at build time or at run time | Working agreement. Also removes picsum and dicebear |
| **Copy KICK's icons from the live DOM.** Never draw an approximation | A wrong glyph gives the copy away faster than layout |

---

## 2. Measured values, confirmed from the live site

Recorded on 26 July 2026 at a 2560 by 1305 viewport, logged in. Site Reference Sections 13 and 14
carry the sidebar row and the scrape layout.

### The navbar

| Thing | Value |
|---|---|
| Height, padding | 60px, `0 40px 0 12px` |
| Sidebar toggle | **40 by 40**, radius 4, transparent |
| Wordmark | 97 by 26, at x 62. That follows from the 40px toggle plus a 10px gap |
| Search field | 450 by 32, transparent, 1px `outline-region` border |
| Right cluster | `gap-8px`. Daily reward **36 by 36 on `#42474D`**, Get KICKs **107 by 36 on `#42474D`** with `0 8px` padding, avatar 32 |
| Get KICKs icon | KICK's own gem, **ten linear gradients**. Not the loot crate glyph |

### The sidebar

| Thing | Value |
|---|---|
| Expanded, collapsed | 256px, **56px** |
| Toggle behaviour | Collapses to the 56px rail. **It does not hide the sidebar** |
| Collapsed rail | Icons only. Section headings become icons. Each channel row becomes its 28px avatar |
| Channel row | See Site Reference Section 13. Count uses **`self-start`**, dot is a plain 8px `div` |

### The profile menu

Opens from the avatar. `w-[316px]`, `bg-surface-highest` (`#232629`), `rounded-lg`, `gap-1`.

| Row | Height | Goes to |
|---|---|---|
| View your channel | 32, on `#42474D` | the user's channel |
| Creator dashboard | 48 | `dashboard.kick.com/stream` |
| Subscriptions | 48 | a subscriptions page |
| Drops & rewards | 48 | `/drops` |
| Collectibles | 48 | `/collectibles` |
| Display language | **40** | opens a submenu, shows `English` |
| Settings | 48 | `/settings/profile` |
| Log out | 48 | |

Header holds a level badge, the username, the level blurb, a progress bar and the percentage
towards the next level.

### The offline channel page

| Thing | Value |
|---|---|
| Banner | 134px, `--channel-desktop-banner-height`, image is `absolute` inside it |
| Offline card | **A card over the banner**, not a heading under it. 294 by 72 at 28px in from the banner top and left. `bg-surface-base`, radius 4, padding 20, gap 16 |
| Offline pill | 66 by 28, ink on white, radius 2, padding 4, 14px weight 700, uppercase |
| Offline heading | 24px weight 700, line height 32 |
| Avatar | **64px** on this page, not the 56px of the live channel bar |
| Tabs | `Home` `About` `Videos` `Clips`, 48 tall, active in green |
| Gift Subs, Subscribe | 116 by 40 on `#42474D`, 124 by 40 on `#53FC18` |
| Sections | Stream Videos, Popular Clips, Recently Streamed Categories, each with `View all` |

### The creator dashboard

`dashboard.kick.com/stream`. Its own shell, no search field.

| Thing | Value |
|---|---|
| Navbar | 60px, same padding as the main site. `Go live` in green, then the avatar |
| Sidebar item | **240 by 48**, padding `4px 16px`, 16px weight 600, radius 4, active on `#42474D` |
| Sidebar items | Stream, Stream URL & Key, Revenue, Achievements, Studio, Moderation, Community, Drops & rewards. Studio and Community expand |
| Panel title | 18px weight 700 |
| Stat label | 14px weight 600 |
| Chat send | 56 by 32 on `#53FC18`, padding `6px 12px` |
| Panels | Session Info, Stream Preview, Activity Feed, Mod Actions, Chat, Stream info, Channel Actions |
| Stream Preview | Uses the same offline card as the channel page |

---

## 3. Icons

**KICK ships no icon package.** No Lucide, Heroicons, Phosphor, Feather, Tabler, Remix or Iconify
appears in the markup. Each icon is a compiled React component with a minified name, so the bundle
gives geometry with no names. Read the rendered DOM and key each icon by the `aria-label` of the
button that holds it.

`demo/src/kick/icons/` holds 87 files. `demo/src/kick/icons.ts` is generated from that folder.

**The nav icons come in pairs.** KICK renders two SVGs per nav item and swaps them on
`data-state`: an **outline** icon when inactive, a **filled** icon when active. Rendering the
filled one in both states is a mistake we already made once. The pairs are `nav-home`,
`nav-browse`, `nav-following`, each with an `-active` partner.

Files still named `icon-N.svg` are real KICK icons that no page labelled. Rename one when a page
labels it.

Two known confirmations: `Creator dashboard` and `Revenue` share one bar-chart glyph, and
`Drops & rewards` is the same glyph in the profile menu and the dashboard sidebar.

---

## 4. Artwork

`demo/src/kick/art/` holds generated SVG scenes, because nothing may be fetched from the network
and third party game art must not be committed.

**The first pass was too bright and read as a children's product.** The direction is dark, muted
and cinematic: low value backgrounds, restrained saturation, vignette, the look of a video still
rather than a flat cartoon. Category names and stream titles stay real.

A stream's thumbnail matches its own category.

---

## 5. Mistakes already made, do not repeat

1. **Guessing hash values instead of deriving them.** Mislabelled five icons, including turning
   `youtube.svg` into `search.svg`. Always derive a name from real path data or a real `aria-label`.
2. **Rendering the filled nav icon in both states.** See Section 3.
3. **Centring the sidebar viewer count.** KICK uses `self-start`. See Site Reference Section 13.
4. **Treating the offline state as a heading.** It is a card over the banner.
5. **`[&_svg]:size-4` did not apply** in the sidebar, so icons drew at 8 by 16. Size the `Icon`
   directly with a `className`.
6. **Tailwind resets `button` to `cursor: default`,** which made every no-op control feel dead.
   `theme.css` now restores the pointer.
7. **picsum and dicebear were fetched at run time,** which broke the no-network rule.
8. **Reading React state immediately after a click in the same evaluation** returns the old value.
   Read it in a separate call.

---

## 6. Open list

Raised on 26 July 2026 and not yet done.

| # | Item | State |
|---|---|---|
| 1 | Dashboard colours and spacing do not match. Needs a scroll and click pass per panel | **Open** |
| 2 | The home banner must be the one kick.com actually shows, not our stand-in | **Open** |
| 3 | Artwork must be reworked to the darker direction in Section 4 | **Open** |
| 4 | Dead links must stop navigating. Category links, channel `About`/`Videos`/`Chat`, settings tabs other than Profile and Preferences, dashboard items other than Stream | **Partly done** |
| 5 | Collapsing the rail shifts things oddly, and expanding shows selection borders | **Open** |
| 6 | Live channel page `Follow`, `Gift Subs`, `Subscribe` are wrong. Check the followed state too, then unfollow | **Open** |
| 7 | The live ring around the channel avatar is wrong. The collapsed rail avatars need the green ring | **Open** |
| 8 | Following and settings pages have never been checked against the live site | **Open** |
| 9 | No bell icon. KICK has one next to the heart on a channel page | **Open** |
| 10 | Video cards have no `⋮` overflow control | **Open** |

---

## 7. Where things are

| Thing | Path |
|---|---|
| The pages | `demo/src/kick/pages/` |
| Shared components | `demo/src/kick/components/` |
| Tokens and base CSS | `demo/src/kick/theme.css` |
| Icons, and the generated map | `demo/src/kick/icons/`, `demo/src/kick/icons.ts` |
| Generated artwork | `demo/src/kick/art/` |
| Mock data | `demo/src/kick/mock/` |
| The page scrape | `docs/kick-page-scrape/`, moving to `demo/kick-reference/` |

Routes match kick.com, so the clone and the real page can be compared side by side. The old Vite
starter sits at `/demo`. The creator dashboard is at `/dashboard/stream`.
