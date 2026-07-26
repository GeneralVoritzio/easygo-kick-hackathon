---
name: kick-page-clone
description: Fetch a kick.com page in Chrome, take its real HTML and CSS, and rebuild it exactly in demo/. Also checks a page we already built is still current, by measuring kick.com again and diffing. Use when asked to clone, copy, replicate, verify or fix the fidelity of any kick.com page, or to add a KICK page, component or icon.
---

# Clone a kick.com page

Rebuild a kick.com surface so it reads as native. The rule that decides success: **a number you
read is a fact, a number you remember is a guess.** Every fidelity fault we have shipped came
from a guess.

Work in four phases. Do not skip Phase 1, and do not report done before Phase 4. Phase 5 runs the
same tools backwards, to check a page we already built is still current.

---

## Phase 1. Do not capture what we already hold

`demo/kick-reference/` holds nine kick.com pages, KICK's four live CSS chunks and their icon set.
Look there first.

```bash
ls demo/kick-reference/html demo/kick-reference/css
```

If the page is already there, go to Phase 2. Re-capturing costs time and adds nothing.

**Fetch the page in a browser, then take the source out of it.** Open kick.com in Chrome, read the
markup and the styles off the live page, and build from what you took. An HTTP request is not an
option: `kick.com` answers **403** to `curl` and to Node, because Cloudflare rejects any client that
is not a real browser.

1. **Open the page.** Use the user's own Chrome (`mcp__claude-in-chrome__*`) whenever the page needs
   their session: `/following`, `/settings/*` and `dashboard.kick.com` show a login shell to anyone
   else. The Browser pane (`mcp__Claude_Browser__*`) is enough for a public page.
2. **Find the part you want** with `scripts/in-page/tree.js` in `javascript_tool`. Set `ROOT`. It
   returns the structure with every class name, the `data-testid` of each component, the text of
   each leaf, the path count of each icon, and the stylesheet URLs. A whole page is 700 KB, so
   never read one raw.
3. **Take its source** with `scripts/in-page/source.js`. Set `SELECTOR` to what the tree showed you.
   It returns the real `outerHTML` with the icons replaced by placeholders. The navbar comes to
   6 KB. **This is the markup you port.** It carries what a tree drops, such as the `box-shadow`
   the navbar wears instead of a bottom border.
4. **Take its CSS** with `scripts/in-page/css.js`. Set `FROM` to the same selector and it collects
   every class the subtree uses, then reports what each one does. `assets.kick.com` is open, so the
   chunks also download when you want them greppable:

```bash
node .claude/skills/kick-page-clone/scripts/fetch-css.mjs <url> <url> ...
```

Icons come one at a time. Find the `<svg>` in the tree, read its `outerHTML`, and save it under
`demo/src/kick/icons/` named after the `aria-label` of the button that holds it.

Rules for a live account, always:

- Never type a password, and never create an account. If a page needs a login the user does not
  already hold, stop and say so.
- Never buy, subscribe, gift or claim anything. This is a read-only errand.

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
- **Never fetch an asset at build time or at run time.** Commit it, or draw it locally.
- **Copy the structure, not the marketing artwork.** The wordmark, the icons and Inter are ours to
  commit. A campaign plate holds licensed third party work and is not.
- **Layout fidelity and content fidelity are separate jobs.** Never rename a section to make its
  layout match. If our mock data cannot fill KICK's layout, say so and ask.

---

## Phase 4. Prove it matches

Build first. `npx tsc -b && npx vite build` from `demo/`.

Then start the dev server with `preview_start` and run **the same script on both pages**:
`scripts/in-page/measure.js`, once on kick.com and once on the clone, at the same viewport. It
returns the rect and the computed box of every element you name, so the two runs compare line by
line. A 4px drift is a fault, not a rounding error.

Measuring kick.com at 1440 gives the browse grid as 4 columns with `gap: 24px 16px`, and the page
column as `gap: 12px`. The clone must give the same three numbers.

Then run the finished page against `.claude/KICK-SITE-REFERENCE.md` Section 12.

**Say what you did.** "Measured" means you read values off the running page. "Looked at" means you
saw it render. If the Browser pane is not displayed, screenshots fail and only measurement is
available. Say which one backs your claim.

---

## Phase 5. Use the same tools to check a page is still current

The skill runs in reverse as a drift check. Two questions, one method.

**Has kick.com changed since we copied it?** Measure the live page again and diff it against the
baseline we saved. A changed number means KICK shipped something, and our copy is now stale.

**Does our copy still match?** Measure both and diff them.

```bash
# run scripts/in-page/measure.js on kick.com, save the JSON as kick-browse.json
# run the same script on the clone, save it as clone-browse.json
node .claude/skills/kick-page-clone/scripts/compare.mjs kick-browse.json clone-browse.json
```

`compare.mjs` prints only what differs, and exits 1 when anything does. Keep each baseline under
`demo/kick-reference/measured/<page>.json` with the date and the viewport in the file, so the next
check has something to diff against.

Two things that are not faults:

- **A different row count.** Our mock data holds fewer cards, so a grid's height and its
  `gridTemplateRows` differ by design. Compare the column count, the gaps and the card size.
- **A different viewport.** `compare.mjs` warns and keeps going, but the numbers are noise. Measure
  both at the same size.

Everything else is a fault. A 4px drift is a fault, not a rounding error.

---

## When you learn something new

A measured fact about kick.com goes in `.claude/KICK-SITE-REFERENCE.md`, and every other file
points at it. A decision that is ours, or a fault we hit, goes in `.claude/KICK-DEMO-NOTES.md`,
which you create if it is not there yet. A rule that changes how the next clone is built goes in
`reference/kick-rules.md` in this skill.

The same table in two files means one of them is already stale. Write it once, and link to it.
