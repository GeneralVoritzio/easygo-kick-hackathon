# KICK Hackathon — Working Agreement

Easygo Mini Hackathon powered by KICK · Saturday 1 August 2026 · Challenge 1 (Hype Tracker / Stream Companion Overlay).

## Repository layout

### `.claude/` — sources of truth.

| File | What it is | Editable? |
|---|---|---|
| `.claude/KICK-HACKATHON-BRIEF.md` | The event: rules, T&Cs, judging criteria, data strategy, and **§7 The Spec Test** | 🔒 Locked |
| `.claude/KICK-DESIGN-SYSTEM.md` | The KICK design system for **product UI**: colour, type, spacing, components, motion, and **§9 drop-in tokens** | 🔒 Locked |
| `.claude/KICK-BRAND-IDENTITY.md` | What KICK looks like, sounds like and believes, for **media**: values, voice, flood colour, display type, graphic devices, motion feel, footage rules | ✍️ Extend as we learn |
| `.claude/KICK-API-MAP.md` | The real KICK API: every object, endpoint, webhook event and scope, from a sweep of `docs.kick.com`. Ground truth for what the API does and does not have | 🔄 Only from the live docs |
| `.claude/KICK-API-CONVENTIONS.md` | Our API style guide: use KICK's real endpoint/field/event names, name invented endpoints the same way, and the mock-data naming rules | ✍️ Extend as we learn |
| `.claude/KICK-PITCH-DECK-MECHANICS.md` | Deck mechanics only: stack (React + Vite + Reveal.js + Motion One), Reveal rules, slide components, the deck type scale, the run sheet. The look comes from the Brand Identity. **Applies only to files in `pitch/`** | ✍️ Extend as we learn |

The two **locked** files are the inputs everything else is derived from. **Never edit, rewrite, reformat or "improve" them as a side effect of another task.** If something in them is wrong or has been superseded, say so and wait for an explicit instruction to change it — then change only what was asked.

Any docs we generate go in the `docs/` folder — never into `.claude/`. The API map is the one
exception: it is a source of truth, so it lives in `.claude/`. Change it only to match the live
docs at `docs.kick.com`, and record the date you checked.

### `assets/`: every brand file and font, committed

`assets/README.md` names every file, its source URL, the date we read it, and its licence. Take
fonts, the KICK wordmark and the pattern plates from here. Never fetch one at build time.
`assets/reference/kick-neon-tokens.css` holds KICK own 282 design tokens, read from their live CSS.
It is read-only ground truth, and Brand Identity §3 lists what it corrects.

## How to work

- **Every idea gets run against the Spec Test** (`.claude/KICK-HACKATHON-BRIEF.md` §7) before it gets build time. Any ❌ in Part A (published requirements) or Part B (rules compliance) kills the idea. Then score it: ship above 75, keep prototyping 60–75, kill below 60.
- **Know whether you are building UI or media.** If a user operates it, it is UI, and `.claude/KICK-DESIGN-SYSTEM.md` rules. If a user watches it, it is media, and `.claude/KICK-BRAND-IDENTITY.md` rules. Our overlay is UI. The pitch deck is media. A screenshot of our overlay inside the deck is still UI. KICK runs the same split: kick.com loads Inter only, and about.kick.com loads its display face on top.
- **Every UI uses the design tokens** from `.claude/KICK-DESIGN-SYSTEM.md` §9 verbatim. Dark base, `#53fc18` used sparingly — the green stays under 10% of visible pixels.
- **Every media surface follows the Brand Identity.** In media the green floods, the display type is ALL CAPS on leading of 1.0, and the copy sounds like chat. Run the finished thing against Brand Identity §10.
- **Respect the API boundary.** No video/audio frames, no game state, no per-viewer telemetry, no emote events, no injection into the KICK player. We run on mocked data, but every mocked data point must be something the live API could actually produce.
- **Follow KICK's API conventions** (`.claude/KICK-API-CONVENTIONS.md`). Use real KICK names for anything the API exposes; name and shape invented endpoints/events/fields the same way. Mock data uses real, creative names (KICK-streamer flavour + funny handles) — **never placeholders**.
- **Label every endpoint and event.** `kick` for surface KICK publishes, `fake-kick` for surface we invented: `kick GET /public/v2/livestreams`, `fake-kick POST /public/v1/timelines/markers`. The label goes in front of the verb and path, and in front of an event name. Use it in code, in docs and in UI copy, so a reader can tell the two apart at a glance. Keep the two sets in separate places: a mock API file holds the `kick` labels only, and the code that consumes it holds the `fake-kick` labels.
- **Anything in `pitch/` follows the Deck Mechanics file** (`.claude/KICK-PITCH-DECK-MECHANICS.md`) for how the deck is built, and the Brand Identity for how it looks. The Deck Mechanics file does not restate the brand rules. Outside `pitch/`, ignore it.
- **Cite the source file when you derive from it** — quote the section (e.g. "Design System §3") so claims are traceable back to a locked source rather than invented.
- Confidence tags in the Design System and the Brand Identity (✅ verified / 🟡 high confidence / 🔧 derived) carry meaning. Don't promote a 🔧 value to a fact.

## Coding style

- **Keep it simple.** Write the most obvious version that works. No speculative abstraction, no clever one-liners, no layers that exist only in case we need them later.
- **Make it readable.** Clear names, short functions, flat control flow. The code explains itself, so a reader does not need the author.
- **Reuse before you rewrite.** If a component, helper, token or type already exists, use it. If you write the same thing twice, extract it.
- **No comments unless they are essential.** Only comment a non-obvious constraint, a workaround, or a reason that the code cannot show. Never narrate what the code does. Never add file, function or section banner comments. If you want to add a comment to explain a name or a step, rename the thing or split the step instead.
- **No em dashes in code, comments, docs or commit messages.** Use a comma, a colon, a full stop or brackets. Em dashes read as machine written.
- **Write all prose in ASD-STE100 Simplified Technical English.** This covers docs, comments, commit messages, PR text and UI copy. Follow the STE rules: one topic per sentence, active voice, present tense, an approved word in one approved meaning, no synonyms for the same idea, and instructions of about 20 words or less.

