# Kick Web Redesign

A redesign of the Kick homepage and browse experience: a weekly featured streamer, infinite horizontal discovery rails instead of nested category pages, pinning streams into a multi-stream watch party, and a proper watch page with chat.

This is a standalone prototype. It does not share code with `prototypes/hypeprops`, `prototypes/kick-mobile-app`, `prototypes/kick-battles`, or `prototypes/kick-recap`. It runs on its own port.

## Requirements

Node 20 or newer. This project uses Vite 8, which needs Node 20 at minimum.

```bash
node --version
```

## Quickstart

```bash
cd prototypes/kick-web-redesign
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5183`).

## Layout

A persistent left **sidebar** (`Following` + `Communities`, collapsible to an icon rail) sits next to the page content, above the router — it's for jumping back to channels you already know, a different job from the discovery rails below, which are for finding something new. Followed streamers show live/offline at a glance; tapping a live one opens its watch page directly.

## The three pages

- **Home (`/`)** — the week's featured streamer as a hero banner, then "Live Now" (mixed tiers) and "Rising Talent" (small streamers only), then an infinite vertical list of category rows — scroll down and a new category (Valorant, Minecraft, Chess, and so on) keeps appearing, each with its own rail, cycling through the catalog's categories rather than requiring a click into a category page.
- **Watch (`/watch/:id`)** — video left, chat right (stacks on narrow screens). Reached by clicking any card, anywhere in the app.
- **Multiview (`/multiview`)** — every pinned stream in one grid, up to 9 at once. Tap a tile's speaker icon to move audio there (only one plays at a time); tap the tile to open its full watch page.

Every rail (named or category) scrolls horizontally in **two rows**, not one — a CSS grid with `grid-auto-flow: column` and 2 fixed rows, so card 0 and 1 form the first column, 2 and 3 the next, and so on, the whole grid scrolling as one horizontal unit.

Pins persist across all three pages (`PinnedStreamsContext`, above the router) — pin something on Home, it is still pinned when you get to Multiview.

## Hover to play

Rail thumbnails are static by default — hovering (or tabbing to) a card starts playing it after a 350ms delay, so a quick mouse sweep across a rail doesn't load a dozen live embeds at once. A real channel gets its actual live embed; a fictional card gets a subtle animated gradient pan instead, since there's no real footage to play (see `StreamSurface`'s `playing` prop).

## Keyboard shortcuts

Press **?** (or click the keyboard icon in the navbar) for the full list, grouped by where each one applies. The short version:

| Key | Where | Does |
|---|---|---|
| `?` | Everywhere | Toggle this list |
| `H` | Everywhere | Go to Home |
| `V` | Everywhere | Go to Multiview |
| `Tab` | Everywhere | Move between streams, buttons, links |
| `Enter` | A focused stream card | Open it |
| `P` | A focused card, or the watch page | Pin or unpin |
| `M` | The watch page | Toggle audio |
| `1`–`9` | Multiview | Switch audio to that tile |

`src/keyboard.ts` is the single source of truth — the help overlay reads the same `SHORTCUTS` list the actual key handlers reference, so the two can't drift apart. Every shortcut also has a visible, clickable equivalent (the pin button, the speaker icon, the keyboard icon in the navbar) — nothing here is keyboard-only. Shortcuts never fire while a text field (like the chat input) has focus.

## Discoverability: small streamers vs. big streamers

The actual intervention is in `src/mock/catalog.ts`, `interleaveForDiscovery`: a pure viewer-count sort always buries small streamers at the bottom of an infinite rail nobody scrolls that far into, so instead every 4th card slot in the "Live Now" rail is guaranteed to be a rising-tier streamer, regardless of viewer count. "Rising Talent" is a second, dedicated rail for anyone who wants to browse small streamers directly rather than encounter them incidentally.

Verified this holds up over repeated runs (see the interleave test in the build history) — the every-4th-slot placement is deterministic by position, only which specific card lands there is randomized.

## Real video vs. mock catalog

Six real Kick channels (`maxholloway`, `adinross`, `xqc`, `amouranth`, `trainwreckstv`, `n3on`) get real live embeds via `player.kick.com`, same shape as `prototypes/kick-battles` and `prototypes/kick-recap`. The rest of the ~82-card catalog is fictional — there is no way to know real small streamers' names without live API access, so the "rising" tier especially has to be invented, in the KICK-streamer-flavour style the working agreement asks for. Every category in `CATEGORY_POOL` gets topped up to at least 7 cards by a combinatorial handle generator (`generateFillerTemplates` in `mock/catalog.ts`) so the category rows have real depth instead of 1-2 lonely cards; the generator is weighted toward rising/growing, since most streamers in any real category are small.

Fictional cards never fake a video feed. On a discovery card that is normal (every real site shows a static thumbnail there, live or not). On the watch page or in Multiview, where a viewer expects actual moving video, a fictional card says so plainly ("No live broadcast — demo profile") over its placeholder art, rather than silently showing nothing or pretending.

The featured hero always picks from the six real channels, since it is the single highest-visibility slot on the page and deserves a real embed over a placeholder. It rotates weekly, deterministically (see `mock/featured.ts`), not on every page load.

## Design tokens

Colors and radius follow `.claude/KICK-DESIGN-SPEC.md` §9 in the repo root. Icons use `lucide-react`, per §5. This is product UI, not an OBS overlay, so the §7 overlay-specific rules do not apply here.

## File layout

```
src/
  App.tsx                    router + PinnedStreamsProvider + Navbar/Sidebar shell
  context/
    PinnedStreamsContext.tsx  pinned ids + audio focus, shared across all 3 pages
  pages/
    HomePage.tsx              hero + named rails + infinite vertical category list
    WatchPage.tsx             video + chat
    MultiviewPage.tsx         the pinned-streams grid
  components/
    FeaturedHero.tsx          the weekly hero banner
    DiscoveryRail.tsx         the infinite, 2-row horizontal strip
    StreamCardTile.tsx        one card in a rail
    MosaicGrid.tsx            1-9 tile grid for Multiview
    StreamSurface.tsx         real Kick embed or styled placeholder
    AudioFocusButton.tsx      the speaker toggle, used in Multiview
    PinButton.tsx             the pin toggle, used everywhere a card appears
    Navbar.tsx                persistent top nav, pinned-count badge on Multiview, shortcuts trigger
    Sidebar.tsx               Following / Communities, collapsible
    ShortcutsHelp.tsx         the "?" overlay, reads straight from keyboard.ts
  mock/
    catalog.ts                the ~82-card catalog, filler generator, interleaveForDiscovery, groupByCategory
    featured.ts                weekly featured-streamer rotation
    chat.ts                    mock chat message generator
    sidebar.ts                 followed-streamer list + community list
  hooks/
    useLiveChat.ts             mock chat polling, used by WatchPage
    useGlobalShortcuts.ts      H / V / ? / Esc, wired in App.tsx
  keyboard.ts                 the shortcut registry + isTypingTarget/shouldIgnoreShortcut guards
```

## Known gaps

- `npm install` reports one high-severity advisory in `react-router` (an RSC-mode CSRF bypass). Not applicable here — this app is a plain client-side SPA with `BrowserRouter`, no server actions or RSC involved. Left as-is rather than force-upgrading to the breaking v8 release without being asked.
- Both the horizontal rails and the vertical category list "loop" a fixed mock catalog rather than fetching new data — there is no backend. Both have a generous safety cap (`MAX_CYCLES` in `DiscoveryRail.tsx`, `MAX_CATEGORY_ROWS` in `HomePage.tsx`) so a very long scroll session doesn't grow the DOM without bound; no real session reaches either cap.
- Multiview caps at 9 pinned streams (`MAX_PINS` in `PinnedStreamsContext.tsx`).
- The sidebar's `Communities` rows are informational only — there's no community page yet in this prototype to link them to.
