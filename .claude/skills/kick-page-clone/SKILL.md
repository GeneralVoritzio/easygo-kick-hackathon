---
name: kick-page-clone
description: Fetch a kick.com page in Chrome, take its real HTML and CSS, and rebuild it exactly in demo/. Also checks a page we already built is still current, by measuring kick.com again and by comparing the two pages on screen. Use when asked to clone, copy, replicate, verify or fix the fidelity of any kick.com page, or to add a KICK page, component or icon.
---

# Clone a kick.com page

Rebuild a kick.com surface so it reads as native. The rule that decides success: **a number you
read is a fact, a number you remember is a guess.** Every fidelity fault we have shipped came
from a guess.

Work in four phases. Do not skip Phase 1, and do not report done before Phase 4. Phase 4 proves
the copy matches with two passes, a measured one and a visual one, and the same two passes check
that a page we built earlier is still current.

**If the user names a feature, that feature is the job.** Review it first, compare it on its own,
and give it the detail. The rest of the page comes after.

---

## Phase 1. Do not capture what we already hold

`demo/kick-reference/` holds nine kick.com pages, KICK's four live CSS chunks and their icon set.
Look there first.

```bash
ls demo/kick-reference/html demo/kick-reference/css
```

If the page is already there, go to Phase 2. Re-capturing costs time and adds nothing.

**Open kick.com in the user's own Chrome, then take the source out of the page.** This is not a
preference, and a hook enforces it. `.claude/hooks/kick-browser-only.mjs` fails any `Bash` or
`WebFetch` call that names a `kick.com` URL, because:

- Cloudflare answers **403** to `curl`, to Node and to `WebFetch`. They check the client, not the
  cookie, so no header fixes it.
- A logged out page returns **skeleton placeholders instead of cards**, so even a reply you can read
  has no content in it.

The user's Chrome solves both at once. Their session is already open, so `/following`,
`/settings/*` and `dashboard.kick.com` render in full, and every card holds real data.

1. **Open the page** with `mcp__claude-in-chrome__navigate`. The Browser pane
   (`mcp__Claude_Browser__*`) works for a public page, but it is logged out, so prefer Chrome.
2. **Scroll the page to the bottom** with `scripts/in-page/scroll.js`, before you capture anything.
   **A capture taken at the top holds the first screen only.** KICK loads each row as you reach it,
   and `body` is `overflow: hidden`, so the page does not scroll as one document and nothing below
   the fold exists yet. The script finds the real scroller, walks it down until the height stops
   growing, returns to the top, and reports the section list with a count for each one. Read that
   list. If it names sections you have not seen, you were about to copy a fraction of the page.
3. **Find the part you want** with `scripts/in-page/tree.js` in `javascript_tool`. Set `ROOT`. It
   returns the structure with every class name, the `data-testid` of each component, the text of
   each leaf, the path count of each icon, and the stylesheet URLs. A whole page is 700 KB, so
   never read one raw.
4. **Take its source** with `scripts/in-page/source.js`. Set `SELECTOR` to what the tree showed you.
   It returns the real `outerHTML` with the icons replaced by placeholders. The navbar comes to
   6 KB. **This is the markup you port.** It carries what a tree drops, such as the `box-shadow`
   the navbar wears instead of a bottom border.
5. **Take its CSS** with `scripts/in-page/css.js`. Set `FROM` to the same selector and it collects
   every class the subtree uses, then reports what each one does. `assets.kick.com` is open, so the
   chunks also download when you want them greppable:

```bash
node .claude/skills/kick-page-clone/scripts/fetch-css.mjs <url> <url> ...
```

Icons come one at a time. Find the `<svg>` in the tree, read its `outerHTML`, and save it under
`demo/src/kick/icons/` named after the `aria-label` of the button that holds it.

**This runs in the user's real, signed in browser, so it is a read-only errand.**

- Never type a password, and never create an account. If a page needs a login the user does not
  already hold, stop and say so.
- Never buy, subscribe, gift or claim anything, and never spend KICKs.
- Never post, send, follow, unfollow or change a setting to see what it does. Read the state that
  is there. If you need to see a variation, build it in the clone, not on their account.
- Reading is free. Everything that writes needs the user to say yes first.

Write down the URL, the date, the viewport and whether the session was logged in. Every later
number depends on those four facts.

---

## Phase 2. Read the capture, in this order

1. **Find the element** in the tree, or in `html/` for a page we already hold. Search for a word
   the page shows, or a class you already know. `data-testid` names most components for you.
2. **Resolve its class names.** Two ways, and the first one always works:
   - **Probe it in the page.** Paste `scripts/in-page/css.js` into `javascript_tool` with the class
     names in `NAMES`. It applies each class to a bare element and reports what changed, including
     `::before` and `::after`. This reads through a cross origin stylesheet, which the rules API
     cannot.
   - **Grep `css/`** for the same name once the chunks are downloaded.

   This is how you learn that `grid-cols-auto-fill-category` is
   `repeat(auto-fill, minmax(139px, 1fr))` and that `z-navbar` is 301. No amount of measuring by
   eye gives you either.
3. **Read the live page only for what a capture cannot hold:** card content, hover and focus
   states, and any page behind a login.

**KICK renders all content on the client, and a skeleton is a dimensional drawing.** The saved HTML
shows `ui-skeleton animate-pulse` placeholders instead of cards. They look empty, but KICK sizes
each one to the element it stands in for, so the numbers are real. `h-7 w-16` gave the hero live
badge, `h-9 w-[100px]` gave `Watch now`, `size-9 lg:size-14` gave the hero avatar. All three held
up against the live page. Never skip a file because it has no text.

**Do not read a whole page into context.** A kick.com page is over 700 KB. Grep with a window
around the match, or distil a page we already hold:

```bash
node .claude/skills/kick-page-clone/scripts/distill.mjs demo/kick-reference/html/browse.logged-out.html
```

The distiller collapses identical sibling subtrees, so a grid of 50 cards reads as one card, and it
pulls every inline SVG into `icons/` keyed by its path data. A 1780 element page comes out at about
850 lines.

---

## Phase 3. Rebuild

### Reuse before you write

Read `demo/src/kick/components/` and `demo/src/kick/pages/` before you add a file. The shell,
the navbar, the sidebar, the cards, the tabs, the switches and the profile menu already exist.

Extract a component when the same block appears on a second page, not before. Name it after
KICK's own `data-testid` or `aria-label`, so the name survives the next capture.

### Copy the class names, not the pixels

`demo/src/kick/theme.css` carries KICK's token layer with KICK's names. Paste KICK's classes and
they mostly work. Add a missing token to `theme.css` rather than inlining a hex value.

A custom utility needs `@utility` in Tailwind v4. A plain class inside `@layer utilities` gets no
variants, so `lg:my-utility` compiles to nothing and fails in silence.

### Copy the mechanism, not the pixel it produced

**A measured pixel is an output. Copy the rule that produced it.** This is the difference between a
page that holds at one size and a page that holds at every size.

KICK uses a fixed pixel only where the value is a constant, and they keep those in tokens:
`--navbar-height: 60px`, `--sidebar-expanded-width: 256px`, `--chat-width: 340px`,
`--channel-info-height: 132px`. Copy those as they are, through the token, never as a literal.

Everywhere else KICK is relative, and so are we:

- **The viewport, minus the chrome.** Their player is
  `max-h-[calc(100vh-var(--navbar-height)-var(--channel-info-height))]`, with a
  `supports-[height:100dvh]` twin for mobile. They do not set a height.
- **A ratio.** `aspect-video` with `m-auto`, so the box centres itself and the side margins fall
  out of the arithmetic. Never write the margin you measured.
- **A fraction.** `w-[calc((100%-24px)/3)]`, `1fr`, `repeat(auto-fill, minmax(139px, 1fr))`.
- **Their viewport utilities.** `h-xvh` and `w-xvw`, not `h-screen` and `w-screen`.

**If you write a pixel the page could work out for itself, you have frozen one viewport.** Our
player was 1960 by 1103 against their 1879 by 1057 for exactly this reason: we said
`aspect-video w-full` and let the width win, where KICK caps the height first and fits the ratio
inside it.

**A breakpoint is a measured value too.** Read it, do not assume the name. Ours fired `tv:` at 2560
where KICK's did not, which put 16px of padding on every stream card instead of 8px.

### The rules that decide whether it reads as KICK

Full detail, with the measured tables, is in `reference/kick-rules.md`. The short list:

- **Never draw an icon.** Take it from the markup. KICK ships no icon package, so key each one by
  the `aria-label` of the button that holds it. Nav icons come in pairs, outline when inactive and
  filled when active, swapped on `data-state`.
- **One background colour** across the navbar, the sidebar, the main column and the chat. Panels do
  not get a lighter surface. This is the most common way a copy looks wrong.
- **Read the spacing off the page you are building.** KICK does not share one shell. Home and
  browse disagree on column gap, on top padding and on whether a section wraps.
- **The chrome state changes the content grid.** The page root carries `data-sidebar`, and the
  grids read it with `group-data-[sidebar=false]/main:` to add a column when the sidebar collapses.
- **Anything that is a control on kick.com stays a control here.** Keep the hover, the cursor and
  the press state even when the click does nothing. A dead link must not navigate to a blank route.
- **Copy what a click does, not the button only.** If it opens a menu, switches a tab, slides a
  drawer, moves a switch or shows a modal on kick.com, it does the same here. A button that looks
  right and does nothing is the fault a screenshot cannot show.
- **Show no scrollbar that kick.com does not show.** They hide them with `.no-scrollbar`, and a
  scroll line down a pane, a row or a menu is the clearest sign that a page is not theirs.
- **Keep their alignment.** Centred stays centred, and a shared baseline stays shared. Alignment
  measures as valid whichever way it goes, so it survives Pass 1 and only Pass 2 finds it.
- **Carry KICK's `data-testid` onto our component.** They name every component, the measure script
  reads those names, and a component with no name cannot be compared with theirs at all.
- **Never fetch an asset at build time or at run time.** Commit it, or draw it locally.
- **Copy the structure, not the marketing artwork.** The wordmark, the icons and Inter are ours to
  commit. A campaign plate holds licensed third party work and is not.
- **Layout fidelity and content fidelity are separate jobs.** Never rename a section to make its
  layout match. If our mock data cannot fill KICK's layout, say so and ask.

### Fill the page, do not copy every card

**Copy every section. Do not copy every card in it.** A live kick.com page holds hundreds of
streams and categories. We need the page to read as full, and nothing more.

- **A row that KICK clips to one row needs one row, plus two cards.** The extra two prove the row
  clips, and they cost nothing.
- **A grid that wraps needs about two full rows** at the widest viewport we demo at.
- **Every section KICK shows, we show.** Dropping a section changes the layout. Dropping a card
  does not.

More mock data than that is work with no result on screen, and each card needs a committed avatar
or still. A shorter grid is not a fault, and `compare.mjs` expects it.

---

## Phase 4. Prove it matches, by measuring and by looking

**Two passes, and you need both.** Measurement catches a number. It does not catch a card that
looks wrong. Neither pass replaces the other, and a report that gives one pass only is not done.

The same two passes answer three questions, so they are written once here:

| Question | What to diff |
|---|---|
| Does the new page match kick.com? | the live page against the clone |
| Does a page we built earlier still match? | the live page against the clone |
| Has kick.com changed since we copied it? | the live page against the baseline in `demo/kick-reference/measured/` |

Build first, `npx tsc -b && npx vite build` from `demo/`. Then start the dev server with
`preview_start`, and open kick.com and the clone at the same viewport.

### Pass 1. Measure

Scroll both pages with `scripts/in-page/scroll.js`, then run `scripts/in-page/measure.js` on each
one. It returns the rect and the computed box of every target you name, plus a spread of the
components that carry a `data-testid`. The box holds the border, the shadow, the blend mode, the
filter and the object fit, because those are the properties a fault hides in.

**Measure kick.com in Chrome, and the clone in the Browser pane.** Chrome truncates a reply at
about 1000 characters, so keep the result on `window` and read it in 850 character slices. The
Browser pane returns the whole string in one call.

**The default targets describe a grid page.** A channel page, a settings page and a following list
page each need their own set. `demo/kick-reference/measured/README.md` lists the ones we use, and
each baseline records what did not fit.

```bash
# run scripts/in-page/measure.js on kick.com, save the JSON as kick-browse.json
# run the same script on the clone, save it as clone-browse.json
node .claude/skills/kick-page-clone/scripts/compare.mjs kick-browse.json clone-browse.json
```

`compare.mjs` prints only what differs, and exits 1 when anything does. Keep each baseline under
`demo/kick-reference/measured/<page>.json` with the date and the viewport in the file, so the next
check has something to diff against. **Write the baseline on the first clone of a page.** A drift
check with nothing to diff against reports nothing.

Measuring kick.com at 1440 gives the browse grid as 4 columns with `gap: 24px 16px`, and the page
column as `gap: 12px`. The clone must give the same three numbers.

Read the report before you read the numbers. `found in neither file` means the selector does not
fit this page and **nothing was checked**, so fix the selector and run it again.

### Pass 2. Look

**Screenshot both pages at the same viewport, and compare them region by region.** Take the top of
the page, then scroll and take the rest. A screenshot of the first screen proves the first screen.

**If the user named a feature, review that feature first, and in detail.** They are telling you
where to look. Compare it on its own, at each state it has, before you look at the rest of the
page. A general sweep that mentions their feature in one line is not the review they asked for.

Compare the navbar, then the sidebar, then each section down the page. For each one, ask the seven
questions below. Every one of them describes a fault we have shipped, and no number catches any of
them:

1. **Is the colour there at all?** A token that resolves to nothing renders as transparent, and
   transparent on a dark page looks deliberate. Check the surface, the border and the text.
2. **Does an edge that KICK draws exist here, and the other way round?** A missing border reads as
   the wrong spacing. A border we invented reads as a panel KICK does not have.
3. **Does the overlay sit right?** KICK puts gradients, live badges, viewer counts and durations on
   top of a thumbnail. Check the stack order, the padding from the corner, and that the gradient
   fades the way theirs does.
4. **Does the image fill its frame?** A still that letterboxes, stretches or crops differently gives
   the copy away, and `objectFit` alone does not prove it.
5. **Is a scrollbar visible that kick.com does not show?** KICK hides them with `.no-scrollbar`, so
   any bar, track or scroll line we show is ours and is wrong. Check each pane, each row and each
   menu, not the page only.
6. **Is everything aligned the way theirs is?** Centred stays centred, and a baseline that KICK
   shares stays shared. Check the text in a button, the icon against its label, the count against
   the two lines beside it, and the edge each column starts on.
7. **Does the page feel as full as theirs?** Fewer cards is by design. An empty row is not.

Then **click the controls.** A screenshot proves the page at rest, and half a page is not at rest:

- **Anything that responds to a click on kick.com responds here.** A menu opens, a tab switches, a
  drawer slides, a switch moves, a modal appears. Read what it does on kick.com, then do the same.
- **Hover and press states are part of the copy.** A control with no hover reads as an image of a
  control.
- A click we cannot support does nothing and says nothing. It never navigates to a blank route, and
  it never throws in the console.

Fix what you see, then run both passes again.

Then run the finished page against `.claude/KICK-SITE-REFERENCE.md` Section 12.

### Two things that are not faults

- **A different row count.** Our mock data holds fewer cards, so a grid's height and its
  `gridTemplateRows` differ by design. Compare the column count, the gaps and the card size.
- **A different viewport.** `compare.mjs` warns and keeps going, but the numbers are noise. Measure
  both at the same size.

Everything else is a fault. A 4px drift is a fault, not a rounding error.

**Say what you did.** "Measured" means you read values off the running page. "Looked at" means you
saw it render. If the Browser pane is not displayed, screenshots fail, Pass 2 cannot run, and you
say so rather than reporting the page as done.

---

## When you learn something new

A measured fact about kick.com goes in `.claude/KICK-SITE-REFERENCE.md`, and every other file
points at it. A decision that is ours, or a fault we hit, goes in `.claude/KICK-DEMO-NOTES.md`,
which you create if it is not there yet. A rule that changes how the next clone is built goes in
`reference/kick-rules.md` in this skill.

The same table in two files means one of them is already stale. Write it once, and link to it.
