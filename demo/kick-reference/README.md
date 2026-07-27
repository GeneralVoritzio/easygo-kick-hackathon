# KICK page scrape

Reference copies of nine kick.com pages, read from the live site on 26 July 2026.
Read this before you rebuild a KICK page. It saves you from opening kick.com again.

This folder records what KICK ships. It does not contain our code.

## What is here

| Folder | What it holds |
|---|---|
| `html/` | The raw server response for each of the nine URLs, one file each |
| `css/` | KICK's four live CSS chunks, 239 KB in total. This is the complete style ground truth |
| `trees/` | The DOM of each page as an indented tree, with repeated siblings collapsed |
| `icons/` | 58 inline SVG icons, copied byte for byte from KICK's markup |

## How to answer a question here

Three steps, in order. Most questions stop at step 2.

1. **Find the element in `html/`.** Search for a word the page shows, or for a class you know.
   The banner came from a search for `Banner`. The grids came from a search for `grid-cols`.
2. **Resolve its class names in `css/`.** KICK's custom names live there and nowhere else.
   `grid-cols-auto-fill-category` is `repeat(auto-fill, minmax(139px, 1fr))`. The z-index scale is
   `z-absolute` 101, `z-player` 201, `z-controls` 202, `z-navbar` 301, `z-popover` 401. No amount
   of measuring by eye gives you either.
3. **Open a live page only for what is not here:** card content, hover and focus states, and any
   page behind a login.

A number you found here is a fact. A number you remembered is a guess.

## The one thing to know about `html/`

**KICK renders all page content on the client.** The server sends a shell with skeleton
placeholders (`ui-skeleton animate-pulse`) where every card, tile and row will later appear.

So the saved HTML gives you:

- ✅ The real navbar, sidebar, page grid and scroll containers, with real class names
- ✅ The real card geometry, because the skeleton uses the same wrapper and size classes
- ❌ No real card content, no titles, no viewer counts, no thumbnails

**A skeleton is a dimensional drawing.** It looks empty, but KICK sizes each placeholder to the
element it stands in for, so the numbers are real. `h-7 w-16` on the hero live badge,
`size-9 lg:size-14` on the hero avatar and `h-9 w-[100px]` on `Watch now` all came from skeletons,
and all held up against the live page. Do not skip a file because it has no text.

Five of the nine URLs need a login. Logged out they answer `307` and return a login shell with
no page markup at all. Their files are kept so the redirect behaviour is on record, but they
contain nothing to build from:

| URL | Saved HTML useful? |
|---|---|
| `/` | Yes, shell and skeletons |
| `/browse` | Yes, shell and skeletons |
| `/evscape` | Yes, shell and skeletons |
| `/evscape/clips` | Yes, shell and skeletons |
| `/following` | No, login shell |
| `/following/categories` | No, login shell |
| `/following/channels` | No, login shell |
| `/settings/profile` | No, login shell |
| `/settings/preferences` | No, login shell |

## `css/` is the most valuable folder

The four chunks hold every Tailwind utility KICK ships, all 561 custom properties, every
breakpoint and every hover and data-state rule. Any class name you find in `trees/` resolves
in these files. Match a class here rather than guessing a pixel value.

| File | Size | What it is |
|---|---|---|
| `0q3klze2l2fun.css` | 189 KB | The main Tailwind build |
| `01b4wt9l3jw-1.css` | 42 KB | Second chunk |
| `0ri9o4h_ohmpb.css` | 7 KB | Third chunk |
| `0l6u02xsmnjj-.css` | 1 KB | Fourth chunk |

## Icons: there is no icon package

We looked for one. The page markup contains no reference to Lucide, Heroicons, Phosphor,
Feather, Tabler, Remix or Iconify. KICK compiles each icon into its own React component inside
a Next.js chunk, and the component names are minified, so the bundle gives geometry with no
names attached.

This agrees with `.claude/KICK-SITE-REFERENCE.md` Section 10. The method stays the same:
**read the rendered DOM and key each icon by the `aria-label` of the button that holds it.**

`icons/` holds 58 files. Names come from three places:

1. A byte match against the 22 icons already in `demo/src/kick/icons/`.
2. The `aria-label` of the nearest button or link in the live DOM.
3. Files still called `icon-N.svg` are real KICK icons that no page labelled. Rename one when
   you find a page that labels it.

The set covers the navbar, the sidebar, the player control bar, the chat panel and the two
empty-state graphics. Some 32 by 32 files sized `calc(1em*(18/13))` are chat badges, not UI
icons.

## Viewport

Captured at 2560 by 1305 CSS pixels, which is above KICK's `xl` breakpoint, so the sidebar is
docked rather than overlaid. Chrome would not resize below this. Every breakpoint rule is in
`css/`, so narrower layouts are recoverable without measuring again.

`.claude/KICK-SITE-REFERENCE.md` was measured at 1600 by 900. Where the two disagree on a
column width, the difference is the breakpoint, not an error.

## How the trees were made

Each file in `trees/` is one line per element: tag, then class list, then the attributes that
affect layout or behaviour. Runs of identical siblings collapse to the first one plus a count,
so a grid of 50 cards reads as one card. `<svg :name>` points at a file in `icons/`.

## What `trees/` covers

| File | Source | Content |
|---|---|---|
| `home.logged-out.md` | Saved HTML | Shell and skeletons |
| `browse.logged-out.md` | Saved HTML | Shell and skeletons |
| `channel-evscape.logged-out.md` | Saved HTML | Shell and skeletons |
| `channel-evscape-clips.logged-out.md` | Saved HTML | Shell and skeletons |
| `settings.hydrated.md` | Live logged-in DOM | Both settings pages, with measurements |
| `following*.logged-out.md` | Saved HTML | Empty. The login shell has no markup |

## Gap

The three `/following` pages have their icons captured but not their DOM. They reuse the
`/browse` layout, so start from `browse.logged-out.md` and read the live page for the two
empty states, which use `icons/empty-livestreams.svg` and `icons/empty-categories.svg`.

Card and tile content on `/`, `/browse` and the channel pages is client rendered, so the saved
HTML shows the skeleton, not the filled card. The skeleton keeps the real wrapper and size
classes, so the geometry is correct and only the inner content needs reading from a live page.

## How to refresh this folder

**Not with `curl`.** kick.com answers 403 to every client that is not a real browser, and
`.claude/hooks/kick-browser-only.mjs` now blocks the attempt before it runs.

Use the `kick-page-clone` skill. It opens the page in the user's own Chrome, where their session
is already there, so the cards hold real data instead of the skeletons in `html/`.

`css/` is the exception. `assets.kick.com` answers a plain request, so the chunks download by
script:

```bash
node .claude/skills/kick-page-clone/scripts/fetch-css.mjs <url> <url> ...
```

The file names are content hashed, so a new name means KICK redeployed and our copy is stale.
**Checked on 27 July 2026: the four names here are the four the live page links, so this CSS is
current.**
