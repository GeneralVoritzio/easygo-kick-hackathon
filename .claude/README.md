# What is in this folder

Everything we know about KICK. One folder, so one place to look.

Start with `CLAUDE.md`. It is the working agreement and it points at everything else.

## Sources of truth

| File | What it answers |
|---|---|
| `CLAUDE.md` | How we work, and where every file lives |
| `KICK-HACKATHON-BRIEF.md` 🔒 | The event: rules, judging, and Section 7 the Spec Test |
| `KICK-DESIGN-SYSTEM.md` 🔒 | Product UI: colour, type, spacing, components, and Section 9 the tokens |
| `KICK-BRAND-IDENTITY.md` | Media: voice, flood colour, display type, graphic devices, motion |
| `KICK-API-MAP.md` | The real API, read from `docs.kick.com` |
| `KICK-SITE-REFERENCE.md` | What kick.com looks like, measured from the live site |
| `KICK-API-CONVENTIONS.md` | How we name endpoints, events and mock data |
| `KICK-PITCH-DECK-MECHANICS.md` | Deck layout and mechanics, for `pitch/` only |
| `KICK-ASSETS.md` | Where every brand file came from, and where it lives now |

The two 🔒 files are locked. They are the inputs everything else derives from. Never edit them as a
side effect of another task.

## Folders

| Folder | What it holds |
|---|---|
| `reference/` | Machine-readable ground truth read from KICK. Today `kick-neon-tokens.css`, KICK own 282 design tokens |
| `research/` | Longer write-ups that are not a source of truth: specs, summaries, working notes |

## Which file do I read?

| Question | File |
|---|---|
| Is this idea allowed? | `KICK-HACKATHON-BRIEF.md` Section 7 |
| What colour, size or spacing? | `KICK-DESIGN-SYSTEM.md` Section 9 |
| How does this page lay out? | `KICK-SITE-REFERENCE.md` |
| What is the real markup? | `demo/kick-reference/trees/` |
| What does this class resolve to? | `demo/kick-reference/css/` |
| Which icon, and where from? | `demo/src/kick/icons/`, then `KICK-SITE-REFERENCE.md` Section 10 |
| Does the API expose this? | `KICK-API-MAP.md` |
| What do I call it? | `KICK-API-CONVENTIONS.md` |
| How should the deck look? | `KICK-BRAND-IDENTITY.md`, then `KICK-PITCH-DECK-MECHANICS.md` |

## What is not here

**The page scrape is not here.** It is a build input, not research, so it sits beside the code that
uses it, in `demo/kick-reference/`. That folder holds the raw HTML of nine kick.com pages, KICK's
four live CSS chunks, the DOM of each page as a tree, and the icon set.

**There is no root `assets/` folder and no `docs/` folder.** Every project holds its own fonts,
logos and icons. `KICK-ASSETS.md` records where each file went.
