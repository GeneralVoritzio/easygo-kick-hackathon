# KICK Hackathon — Working Agreement

Easygo Mini Hackathon powered by KICK · Saturday 1 August 2026 · Challenge 1 (Hype Tracker / Stream Companion Overlay).

## Repository layout

### `.claude/` — sources of truth.

| File | What it is | Editable? |
|---|---|---|
| `.claude/KICK-HACKATHON-BRIEF.md` | The event: rules, T&Cs, judging criteria, data strategy, and **Section 7 The Spec Test** | 🔒 Locked |
| `.claude/KICK-DESIGN-SYSTEM.md` | The KICK design system for **product UI**: colour, type, spacing, components, motion, and **Section 9 drop-in tokens** | 🔒 Locked |
| `.claude/KICK-BRAND-IDENTITY.md` | What KICK looks like, sounds like and believes, for **media**: values, voice, flood colour, display type, graphic devices, motion feel, footage rules | ✍️ Extend as we learn |
| `.claude/KICK-API-MAP.md` | The real KICK API: every object, endpoint, webhook event and scope, from a sweep of `docs.kick.com`. Ground truth for what the API does and does not have | 🔄 Only from the live docs |
| `.claude/KICK-SITE-REFERENCE.md` | What kick.com actually looks like, measured from the live site: the page grid, the navbar, the sidebar, the player, the channel bar and the chat panel. Read it before you build any page that must look like KICK | 🔄 Only from the live site |
| `.claude/KICK-API-CONVENTIONS.md` | Our API style guide: use KICK's real endpoint/field/event names, name invented endpoints the same way, and the mock-data naming rules | ✍️ Extend as we learn |
| `.claude/KICK-PITCH-DECK-MECHANICS.md` | **Deck layout and mechanics only, no theming.** It must look like slides and not a website: the slide frame, the deck type scale, mock product elements, Reveal rules, the slide sequence, delivery. Colour, type styling, texture and motion feel come from the Brand Identity. **Applies only to files in `pitch/`** | ✍️ Extend as we learn |
| `.claude/KICK-ASSETS.md` | Where every brand file came from: source URL, date read, licence. Read it before you add or replace an asset | ✍️ Extend as we learn |
| `.claude/skills/` | Skills that Claude Code loads on demand. Today `kick-page-clone`, which captures a kick.com page and rebuilds it in `demo/` | ✍️ Extend as we learn |
| `.claude/reference/` | Machine-readable ground truth read from KICK, today `kick-neon-tokens.css` | 🔄 Only from the live source |
| `.claude/research/` | Longer write-ups that are not a source of truth: specs, summaries, working notes | ✍️ Extend as we learn |

The two **locked** files are the inputs everything else is derived from. **Never edit, rewrite, reformat or "improve" them as a side effect of another task.** If something in them is wrong or has been superseded, say so and wait for an explicit instruction to change it — then change only what was asked.

**All research lives in `.claude/`. There is no `docs/` folder.** Anything we read, measure or
work out about KICK goes here, so one folder answers every question. Longer write-ups that are not
a source of truth go in `.claude/research/`. Raw machine-readable ground truth goes in
`.claude/reference/`.

Two files track a live source and are not written by us: the **API map**, which tracks
`docs.kick.com`, and the **site reference**, which tracks `kick.com`. Change either one only to
match the live source, and record the date you checked.

**Page snapshots are not research, they are build inputs, so they live with the build.**
`demo/kick-reference/` holds the scrape of kick.com: the raw HTML, KICK's own CSS, the DOM trees
and the icon set. It sits beside the code that consumes it.


**A page that must look like KICK starts with the `kick-page-clone` skill.** It holds the capture
method, the class and token mapping, the icon rules, the grid and spacing numbers, and the
measurement pass that proves the copy matches. It also holds the scripts, so nobody writes the
capture again.

### Assets: every project owns its own files

**There is no root `assets/` folder.** A project that needs a font, a logo or a plate **holds that
file in its own folder** and imports it locally. Never point a build at a path that climbs out of
the project.

- A relative path out of a project breaks the dev server, because a bundler only serves its own root.
- A project that owns its files stays runnable on its own, and it stays easy to move.
- **Keep the licence file with the asset.** An OFL font without its `OFL.txt` is a rules problem.
- Say in the project README which file each copy came from, so a reader can refresh it.

`.claude/KICK-ASSETS.md` records where every brand file came from, its source URL, the date we read
it, and its licence. Read it before you add or replace an asset.

`.claude/reference/kick-neon-tokens.css` holds KICK own 282 design tokens, read from their live CSS.
It is read-only ground truth, and Brand Identity Section 3 lists what it corrects.

Never fetch an asset from the network at build time or at run time.

## How to work

- **Every idea gets run against the Spec Test** (`.claude/KICK-HACKATHON-BRIEF.md` Section 7) before it gets build time. Any ❌ in Part A (published requirements) or Part B (rules compliance) kills the idea. Then score it: ship above 75, keep prototyping 60–75, kill below 60.
- **Know whether you are building UI or media.** If a user operates it, it is UI, and `.claude/KICK-DESIGN-SYSTEM.md` rules. If a user watches it, it is media, and `.claude/KICK-BRAND-IDENTITY.md` rules. Our overlay is UI. The pitch deck is media. A screenshot of our overlay inside the deck is still UI. KICK runs the same split: kick.com loads Inter only, and about.kick.com loads its display face on top.
- **Every UI uses the design tokens** from `.claude/KICK-DESIGN-SYSTEM.md` Section 9 verbatim. Dark base, `#53fc18` used sparingly — the green stays under 10% of visible pixels.
- **A page that must look like KICK copies the real page.** Read `.claude/KICK-SITE-REFERENCE.md` and rebuild the surface KICK already ships: the same grid, the same chrome, the same component metrics. Our feature is then the only new thing on the screen, which is what makes it read as native. Do not invent a layout when KICK has one. If the reference does not cover the page you need, measure the live site, build from what you measured, and add a section to the reference so nobody measures it twice. Run the finished page against Site Reference Section 12.
- **Copy KICK's assets. Never draw an approximation.** The wordmark (`demo/src/kick/brand/kick-logo.svg`), the icon set (`demo/src/kick/icons/`) and Inter (`demo/src/kick/fonts/`) are committed. A hand-drawn icon, a wordmark set in a font, or a stroked outline icon set gives the copy away faster than any layout error. If you need an icon KICK has and we do not hold, read it from the live markup and add it to `demo/src/kick/icons/`. If KICK has no such icon, draw it on their grid and record it as ours in `.claude/KICK-ASSETS.md`.
- **Every media surface follows the Brand Identity.** In media the green floods, the display type is ALL CAPS on leading of 1.0, and the copy sounds like chat. Run the finished thing against Brand Identity Section 10.
- **Respect the API boundary.** No video/audio frames, no game state, no per-viewer telemetry, no emote events, no injection into the KICK player. We run on mocked data, but every mocked data point must be something the live API could actually produce.
- **Follow KICK's API conventions** (`.claude/KICK-API-CONVENTIONS.md`). Use real KICK names for anything the API exposes; name and shape invented endpoints/events/fields the same way. Mock data uses real, creative names (KICK-streamer flavour + funny handles) — **never placeholders**.
- **Label every endpoint and event.** `kick` for surface KICK publishes, `fake-kick` for surface we invented: `kick GET /public/v2/livestreams`, `fake-kick POST /public/v1/timelines/markers`. The label goes in front of the verb and path, and in front of an event name. Use it in code, in docs and in UI copy, so a reader can tell the two apart at a glance. Keep the two sets in separate places: a mock API file holds the `kick` labels only, and the code that consumes it holds the `fake-kick` labels.
- **Anything in `pitch/` follows the Deck Mechanics file** (`.claude/KICK-PITCH-DECK-MECHANICS.md`) for how the deck is built, and the Brand Identity for how it looks. The Deck Mechanics file does not restate the brand rules. Outside `pitch/`, ignore it.
- **Cite the source file when you derive from it** — quote the section (e.g. "Design System Section 3") so claims are traceable back to a locked source rather than invented.
- Confidence tags in the Design System and the Brand Identity (✅ verified / 🟡 high confidence / 🔧 derived) carry meaning. Don't promote a 🔧 value to a fact.

## Coding style

- **Keep it simple.** Write the most obvious version that works. No speculative abstraction, no clever one-liners, no layers that exist only in case we need them later.
- **Make it readable.** Clear names, short functions, flat control flow. The code explains itself, so a reader does not need the author.
- **Reuse before you rewrite.** If a component, helper, token or type already exists, use it. If you write the same thing twice, extract it.
- **No comments unless they are essential.** Only comment a non-obvious constraint, a workaround, or a reason that the code cannot show. Never narrate what the code does. Never add file, function or section banner comments. If you want to add a comment to explain a name or a step, rename the thing or split the step instead.
- **No em dashes in code, comments, docs or commit messages.** Use a comma, a colon, a full stop or brackets. Em dashes read as machine written.
- **Write "Section", never the section symbol.** Use "Design System Section 3", not the symbol and a number. Capitalise it. This covers code, comments, docs, commit messages, PR text and UI copy. The symbol is hard to type, it reads as legal boilerplate, and it does not always render.
- **Write all prose in ASD-STE100 Simplified Technical English.** This covers docs, comments, commit messages, PR text and UI copy. Follow the STE rules: one topic per sentence, active voice, present tense, an approved word in one approved meaning, no synonyms for the same idea, and instructions of about 20 words or less.

