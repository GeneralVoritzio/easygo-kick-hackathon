# KICK Hackathon — Working Agreement

Easygo Mini Hackathon powered by KICK · Saturday 1 August 2026 · Challenge 1 (Hype Tracker / Stream Companion Overlay).

## Repository layout

### `.claude/` — sources of truth.

| File | What it is | Editable? |
|---|---|---|
| `.claude/KICK-HACKATHON-SPEC.md` | The event: rules, T&Cs, judging criteria, data strategy, and **§7 The Spec Test** | 🔒 Locked |
| `.claude/KICK-DESIGN-SPEC.md` | The KICK design system: colour, type, spacing, components, motion, and **§9 drop-in tokens** | 🔒 Locked |
| `.claude/KICK-API-CONVENTIONS.md` | Our API style guide: use KICK's real endpoint/field/event names, name invented endpoints the same way, and the mock-data naming rules | ✍️ Extend as we learn |

The two **locked** specs are the inputs everything else is derived from. **Never edit, rewrite, reformat or "improve" them as a side effect of another task.** If something in them is wrong or has been superseded, say so and wait for an explicit instruction to change it — then change only what was asked.

Any docs we generate go in the `docs/` folder — never into `.claude/`.

## How to work

- **Every idea gets run against the Spec Test** (`.claude/KICK-HACKATHON-SPEC.md` §7) before it gets build time. Any ❌ in Part A (published requirements) or Part B (rules compliance) kills the idea. Then score it: ship above 75, keep prototyping 60–75, kill below 60.
- **Every UI uses the design tokens** from `.claude/KICK-DESIGN-SPEC.md` §9 verbatim. Dark base, `#53fc18` used sparingly — the green stays under 10% of visible pixels.
- **Respect the API boundary.** No video/audio frames, no game state, no per-viewer telemetry, no emote events, no injection into the KICK player. We run on mocked data, but every mocked data point must be something the live API could actually produce.
- **Follow KICK's API conventions** (`.claude/KICK-API-CONVENTIONS.md`). Use real KICK names for anything the API exposes; name and shape invented endpoints/events/fields the same way. Mock data uses real, creative names (KICK-streamer flavour + funny handles) — **never placeholders**.
- **Cite the spec when you derive from it** — quote the section (e.g. "Design Spec §3") so claims are traceable back to a locked source rather than invented.
- Confidence tags in the design spec (✅ verified / 🟡 high confidence / 🔧 derived) carry meaning. Don't promote a 🔧 value to a fact.
