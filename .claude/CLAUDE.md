# KICK Hackathon — Working Agreement

Easygo Mini Hackathon powered by KICK · Saturday 1 August 2026 · Challenge 1 (Hype Tracker / Stream Companion Overlay).

## Repository layout

There are two kinds of document here, and they are governed differently.

### `.claude/` — locked sources of truth. Do not edit.

| File | What it is |
|---|---|
| `.claude/KICK-HACKATHON-SPEC.md` | The event: rules, T&Cs, judging criteria, data strategy, and **§7 The Spec Test** |
| `.claude/KICK-DESIGN-SPEC.md` | The KICK design system: colour, type, spacing, components, motion, and **§9 drop-in tokens** |

These two files are the inputs everything else is derived from. **Never edit, rewrite, reformat or "improve" them as a side effect of another task.** If something in them is wrong or has been superseded, say so and wait for an explicit instruction to change it — then change only what was asked.

### `idea-docs/` — generated and working files. Freely editable.

| File | What it is |
|---|---|
| `idea-docs/KICK-C_1.MD` | Concept spec for the selected concept — Stream Timeline & Decision Engine. The live working doc |
| `idea-docs/KICK-IDEA-BANK.md` | 100 scored alternative concepts, white-space analysis, and the API reality check |
| `idea-docs/hackathon-scorer.html` | Idea Scorer — weighted scoring tool for the six judging criteria |
| `idea-docs/KICK-O_1.HTM` | Onboarding page built purely from the design spec tokens, as a proof the system holds together |

New ideas, concepts, scoring, pitches and prototypes go here or in new folders — never into `.claude/`.

## How to work

- **Every idea gets run against the Spec Test** (`.claude/KICK-HACKATHON-SPEC.md` §7) before it gets build time. Any ❌ in Part A (published requirements) or Part B (rules compliance) kills the idea. Then score it: ship above 75, keep prototyping 60–75, kill below 60.
- **Every UI uses the design tokens** from `.claude/KICK-DESIGN-SPEC.md` §9 verbatim. Dark base, `#53fc18` used sparingly — the green stays under 10% of visible pixels.
- **Respect the API boundary.** No video/audio frames, no game state, no per-viewer telemetry, no emote events, no injection into the KICK player. See `idea-docs/KICK-IDEA-BANK.md` §1 for the verified capability list. We run on mocked data, but every mocked data point must be something the live API could actually produce.
- **Cite the spec when you derive from it** — quote the section (e.g. "Design Spec §3") so claims are traceable back to a locked source rather than invented.
- Confidence tags in the design spec (✅ verified / 🟡 high confidence / 🔧 derived) carry meaning. Don't promote a 🔧 value to a fact.
