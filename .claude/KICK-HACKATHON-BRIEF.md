# KICK Hackathon — Team Brief

**Easygo Mini Hackathon, Powered by KICK**
Saturday 1 August 2026 · Fortress Melbourne (Shop 25/23 Caledonian Ln) · In-person

> This is our source of truth for what we're allowed to build and what wins. Every idea gets run against **Section 7 The Spec Test** before it gets a minute of build time.
>
> **Sourcing:** everything here is taken from the Devpost overview, rules page and resources page unless tagged `[MIXER]` (told to us verbally, not published) or `[TEAM]` (our own self-imposed constraint). Treat `[MIXER]` items as unconfirmed until we get them in writing.

---

## 1. Event at a glance

| | |
|---|---|
| **Format** | One day, in-person, **4–5 hours of focused hacking** |
| **Teams** | 3–5 engineers, assigned by Easygo at its sole discretion |
| **Mentors** | KICK engineers on-site |
| **Judging** | Live presentation to Easygo and KICK Engineering Managers |
| **Prize** | AUD $50,000 per winning challenge, split equally between team members |
| **Judges** | Zeb Khan (EM, KICK), Juan Carlos Yu (EM, KICK), Jeremy Brown (EM, KICK), Sami Alakus (Staff DevOps, KICK) |
| **Submission** | Email to `events@easygo.io`, then delete all local copies |
| **Platform** | KICK Public API — https://docs.kick.com |

**Two published challenges.** Challenge 1 (Hype Tracker / Stream Companion Overlay) and Challenge 2 (Chat Insights Engine). Teams are allocated to **one** challenge by Easygo. We are on Challenge 1.

> ⚠️ **Open item:** get written confirmation we're locked to Challenge 1. Clause 3(e) gives Easygo sole discretion over challenge allocation, and clause 3(b) lets them reshuffle teams at any time.

**The single most important operational fact:** detailed challenge specifications, technical requirements and datasets are **released on the day**. What follows is the published framing, not the final brief. Our concept must be robust to a more specific spec landing on the morning of 1 August.

---

## 2. Challenge 1 — what we're building

> **Hype Tracker – Stream Companion Overlay**
> *How might we build a real-time overlay or companion UI that enhances a live KICK stream?*

That's the entire published statement. It is deliberately wide. Two viable shapes:

- **Overlay** — a visual layer rendered on or over the stream. Either a browser source the streamer adds to OBS, or a layer in the KICK player itself.
- **Companion UI** — a surface *alongside* the stream. Second screen, side panel, dashboard, mobile. Consumed by viewers, the streamer, or moderators.

"Hype Tracker" in the title is a **hint, not a requirement**. The challenge statement itself never mentions hype metrics. We are not obliged to build a hype meter — and per `[TEAM]` uniqueness rules we should assume half the room will.

### What "enhances" has to mean

The requirements force a specific interpretation. It must be **real-time**, **interactive**, and solve a **named user's real problem**. That rules out:

- Static dashboards and post-stream analytics
- Anything that only makes sense after the stream ends
- Concept pitches, mockups, slideware
- Read-only displays with nothing to interact with

### Mandatory requirements (verbatim)

All teams are expected to:

1. Build a working prototype **during the hackathon**
2. Solve a **clear, defined user problem** for streamers, viewers, or both
3. Create an **interactive experience** (not a static concept)
4. Deliver a solution that **reflects real-time stream behaviour**
5. Be **demo-ready** for judging

---

## 2A. Data strategy — mocked `[TEAM]`

**Decision: we run on mocked data, not live API calls or live webhooks. The KICK Public API is our schema reference, not our runtime dependency.**

This is the right call. It removes the single biggest demo risk (see Section 2A.3) and buys us total control over the demo timeline. But it comes with three obligations we have to be disciplined about.

### 2A.1 Mock the volume, never the capability

**This is the rule that matters most.** We may mock the *shape, timing and volume* of data the real API could genuinely produce. We may **not** mock a capability the API doesn't have.

The judges are four KICK engineering managers and a staff DevOps engineer. They know exactly what their own API exposes. If we demo an overlay reading the game score off the video feed, they will know within two seconds that no such endpoint exists, and Technical Execution and Product Thinking both collapse — we'd be pitching a product that can never ship.

| ✅ Fair to mock | ❌ Not fair to mock |
|---|---|
| 400 chat messages/min when we have no audience | Anything derived from video or audio frames |
| A raid of 3,000 viewers landing on cue | Game state — score, K/D, rank, inventory |
| A stream dropping offline mid-demo | Per-viewer telemetry for non-authed viewers |
| Kicks gifted, subs, follows at any rate | Emote or reaction events (the API has none) |
| Months of channel history we don't have | Anything from a non-KICK platform |

The ten ideas killed in **Section 7 of the Idea Bank stay killed.** Mocking doesn't revive them — it just hides the problem until a judge asks.

### 2A.2 Clause 3(g) — the compliance risk

> **3(g)** — Participants **must use** the public API available at docs.kick.com.

A pure mock with no real API integration is arguably non-compliant. Three mitigations, all cheap:

1. **Adapter layer.** One interface, two implementations: `MockKickClient` and `LiveKickClient`. The app never knows which it's talking to. This is good engineering anyway, and it makes the compliance answer trivially demonstrable.
2. **Real OAuth, wired and working.** Log in against KICK for real, hit at least one live endpoint (`GET /channels` is enough), and show it. That's genuine API usage.
3. **Say it out loud in the pitch.** "Same interface, live client behind it — we run the demo on a deterministic fixture so we can show you a 3,000-person raid on cue." That framing reads as engineering judgement, not as a shortcut. Trying to pass mocks off as live reads as the opposite, and clause 5(a) requires good faith.

### 2A.3 What this buys us

- **Demo risk multiplier goes to ×1.0 for almost every idea.** Nothing depends on a live socket holding up in a room with 50 people on the venue wifi.
- **It sidesteps the webhook trap.** Kick retries a webhook 3 times then *auto-unsubscribes the event* — one hiccup mid-pitch and we're silently disconnected with no error on screen. Not our problem any more.
- **We control the timeline.** Scripted beats, triggered on cue, pausable, repeatable, rehearsable. Matt's brief asked for exaggeration and ease of demo — this is how we get it.
- **Gate C6 is satisfied by construction.** No dependency on real viewers turning up.

### 2A.4 Obligations this creates

- **Payload fidelity is now a scored surface.** Our fixtures must match the real payload shapes — `chat.message.sent` with its `identity` object, `replies_to` and `created_at`; `kicks.gifted` with `pinned_time_seconds`; and so on. A mock that mirrors the real schema is evidence of technical thinking. A mock with invented field names looks lazy, and these judges will read it.
- **The mock generator is now our most valuable pre-build asset.** It's already on the safe-to-build-this-week list in Section 5.1. It should be someone's named job by Monday.
- **It must still be interactive and real-time.** Requirement 3 and 4 don't relax. A scripted fixture replayed on a timeline is fine; a static JSON blob rendered once is not. The system must genuinely react to events as they arrive.
- **Build the scrubber.** A demo timeline we can pause, rewind and jump within is worth real points under Presentation, and takes about twenty minutes.

---

## 3. Wildcard track `[MIXER]`

Not on Devpost. Per the mixer briefing: a second, open-ended build targeting **anything on the KICK platform** — discovery and recommendations, profile customisation, achievements, rewards, and so on.

**Because it isn't published, we don't know:**

- Whether it's judged on the same six criteria or separately
- Whether it's scored at all, or is a tiebreaker / bonus
- Whether the real-time requirement in Section 2 applies to it
- How much of our 4–5 hours it's expected to consume

**Working assumptions until confirmed** — deliberately conservative:

- Same judging criteria apply
- The five mandatory requirements in Section 2 apply, **including real-time**. If the wildcard idea isn't real-time, we're gambling.
- It gets **no more than 20% of build time**. Challenge 1 is where $50,000 is. A half-finished wildcard that damages the main demo is a net loss.
- It must be demoable in **under 60 seconds** as a coda to the main pitch.

> ⚠️ **Open item:** ask Easygo directly how the wildcard is scored and how much time they expect on it. This materially changes our plan.

---

## 4. Judging criteria

| Weight | Criterion | What they ask |
|---:|---|---|
| **25%** | **Problem Solving & Product Thinking** | Does the solution provide meaningful value to streamers or viewers? Is the approach practical and well thought out? |
| **25%** | **Creativity & Innovation** | How original and creative is the idea? Does it stand out from typical approaches? Is there a unique or unexpected angle? Does it go beyond a basic implementation? |
| **20%** | **Technical Execution** | How well was it built within the time constraints? Does it work reliably? Is the implementation appropriate for a hackathon build? Is the complexity well handled? |
| **10%** | **Presentation & Demo** | Is the idea explained clearly? Is the demo engaging and easy to follow? |
| **10%** | **Collaboration & Teamwork** | Clear collaboration? **Evidence of a contribution from every team member?** Good communication and coordination? |
| **10%** | **User Experience & Design** | Is the UI clean and easy to navigate? Simple to understand? Does it feel polished for a prototype? |

### How this shapes our week

**50% is decided before we arrive.** Problem Solving and Creativity are properties of the *concept*, not the build. Concept selection is the highest-leverage work we do, and it happens this weekend — not on 1 August.

**30% is preparation, not invention.** Presentation, Collaboration and UX are idea-independent. They're a checklist. Most teams will spend the last hour debugging and drop all thirty points. See Section 8.

**Only 20% rewards ambitious code**, and it explicitly rewards *appropriateness* to a hackathon build and *reliability* — not scope. "Does the solution work reliably" is a warning about over-reach.

**"Evidence of a contribution from every team member" is a scoreable instruction.** Commit history under individual names is that evidence. Everyone speaks in the demo.

---

## 5. Rules & T&Cs that affect building

Full terms: https://easygo-mini-hackathon.devpost.com/rules

### 5.1 The pre-building constraint — read carefully

Three clauses interact:

- **Requirements:** "Build a working prototype **during the hackathon**"
- **Clause 9:** we warrant the content submitted "will be Yours and Your teammates' original work, created solely by You and your teammates", and "will not incorporate, in whole or in part, any material from pre-existing works, unless such material is in the public domain or You have obtained all necessary licences"
- **Clause 5(a):** we must "act in good faith at all times" and refrain from anything "misleading… or otherwise intended to deceive Easygo"

Arriving with a finished product is a rules risk *and* a strategic one — the real spec drops on the day, and a pre-built solution is harder to pivot than an empty repo.

**`[TEAM]` line we're drawing:**

| ✅ Build this week | ❌ Build on the day |
|---|---|
| Repo boilerplate, tooling, deploy target | The feature itself — all of it |
| KICK API auth working end-to-end | Any judged functionality |
| Mock-data generator that fakes a live stream | The UI that gets demoed |
| Design system: dark base, `#53fc18`, type scale, components | |
| Pitch narrative, roles, speaking order | |

If asked at judging what we built beforehand, we should be able to answer honestly and have it sound like good engineering hygiene rather than a head start.

### 5.2 Platform and content

- **3(g)** — we **must** use the public API at https://docs.kick.com, plus anything Easygo expressly provides. Anything else needs their sign-off.
- **5(a)** — submissions must comply with [KICK Terms of Service](https://kick.com/terms-of-service), [Community Guidelines](https://kick.com/community-guidelines) and the [KICK API Terms](https://dev.kick.com/terms-of-service).
- **5(b), 7(f), 9** — no copyrighted or third-party-licensed material we can't sublicense onward to KICK. Check the licence on every dependency, font, icon set and asset. Anything with a restrictive licence needs written approval from Easygo *before* we use it.

### 5.3 IP — know what we're giving up

- **7(c)** — we retain IP in our submission, *subject to* the below.
- **7(d)** — KICK gets a non-exclusive, royalty-free, worldwide, perpetual, irrevocable, transferable, sub-licensable licence to use, modify, commercialise and create derivative works from our submission.
- **7(e)** — improvements or modifications to KICK's own materials are owned **solely by KICK**, unless we can demonstrate they're separable and independent.
- **7(h)** — KICK holds a right of first refusal on any transfer or licence of our rights.

Fine for a hackathon. **Don't bring an idea we intended to commercialise ourselves.**

### 5.4 Team and submission logistics

- **3(a)–(c)** — Easygo forms teams and may amend them at any time. Our plan should survive losing or gaining a person.
- **3(f)** — one submission per team.
- **3(h)** — final submission emailed to `events@easygo.io`, and we must delete every local copy afterwards. **Build the packaging step into the run sheet** — don't let it eat demo prep time.
- **8** — photography, videography and publicity release. Opt out explicitly if anyone objects.

---

## 6. Resources

**Primary**

- KICK developer portal — https://dev.kick.com/
- KICK API docs — https://docs.kick.com/
- Apps setup / getting started — https://docs.kick.com/getting-started/kick-apps-setup
- Community projects — https://docs.kick.com/how-do-i-contribute/community-projects

**Supporting**

- Unofficial API notes (gist) — https://gist.github.com/ACPixel/bd71dc716126153e04e41700e8a8820e
- Better Auth KICK provider — https://better-auth.com/docs/authentication/kick
- How to stream on KICK — https://help.kick.com/en/articles/7066931-how-to-stream-on-kick-com

**Pre-work `[TEAM]`:** before Friday, someone needs to have read the API docs end to end and written down *exactly* which events, webhooks and data we can actually get in real time. Our concept can only be as real-time as the API allows, and discovering that at 10am on 1 August is fatal. Assume the on-the-day dataset supplements this, but don't count on it.

---

## 7. The Spec Test

**Run every idea through this before it gets build time. Any ❌ in Part A or B kills it.**

### Part A — Published requirements (non-negotiable)

| # | Test | Source |
|---|---|---|
| A1 | Can a **working prototype** be built during the hackathon? | Requirements |
| A2 | Is there a **clear, defined user problem**, with a named user — streamer, viewer, or both? | Requirements |
| A3 | Is it **interactive**, not a static concept? | Requirements |
| A4 | Does it **reflect real-time stream behaviour**? | Requirements |
| A5 | Is it **demo-ready** — can we show it live, reliably? | Requirements |
| A6 | Is it **an overlay or companion UI** that enhances a live KICK stream? | Challenge 1 |

### Part B — Rules compliance (non-negotiable)

| # | Test | Source |
|---|---|---|
| B1 | **Modelled on a real KICK API capability** — every data point we mock must be something the live API could actually produce. See Section 2A.1. | 3(g) |
| B1b | Runs through the **adapter layer**, with real OAuth wired and at least one live endpoint demonstrable? | 3(g), Section 2A.2 |
| B2 | Complies with KICK **ToS and Community Guidelines**? | 5(a) |
| B3 | Every dependency, asset and font **licensable onward to KICK**? | 5(b), 7(f) |
| B4 | Original work by our team, no pre-existing material we can't license? | 9 |
| B5 | Nothing we want to keep and commercialise ourselves? | 7(d), 7(e) |

### Part C — Team constraints `[TEAM]`

| # | Test |
|---|---|
| C1 | **Unique** — not on the generic-idea blocklist, and not one obvious hop from it |
| C2 | **Fun, energetic, loud** — matches KICK's brand, not enterprise-SaaS energy |
| C3 | **Non-intrusive** — does not touch, break or compete with the streamer's existing overlays and alerts |
| C4 | **Cross-platform aware** — works for a streamer simulcasting to other platforms. No KICK-only audio unless it's an overlay source the streamer explicitly adds |
| C5 | **KICK-native UI** — dark base, `#53fc18`, matching type and spacing |
| C6 | **Demoable on mock data** — no dependency on real viewers turning up on cue |
| C7 | **4-hour core loop** — the demoable core, riskiest part first. Not the full vision |
| C8 | **Parallelisable** across 4–5 people without blocking |
| C9 | Has a **reason and a purpose** we can articulate: who it's for, why it exists, how it improves engagement, and how we'd know |

### Part D — Then score it

Ideas that pass A, B and C go into the **KICK Hackathon Idea Scorer** artifact for weighted scoring against the six judging criteria. Ship above 75, keep prototyping 60–75, kill below 60.

---

## 8. The 30% that's free

Idea-independent. Tick every box and we bank 30 points while other teams debug.

**Presentation & Demo (10)**

- A written 90-second story: who it's for, the moment it hurts, the fix, the proof
- One "wow" beat, triggered live at a known point in the demo
- Interactive throughout — never a slideshow
- Rehearsed twice, timed, with the real build

**Collaboration & Teamwork (10)**

- Every member commits under their own name — that's the "evidence" the criterion asks for
- Every member speaks during the demo, even briefly
- Roles named out loud in the pitch

**User Experience & Design (10)**

- KICK-native styling throughout
- Empty, loading and error states exist — this is what "polished for a prototype" means
- Zero explanation needed to use it. If we have to narrate the UI, redesign the UI

---

## 9. Open items

| Item | Owner | Needed by |
|---|---|---|
| Written confirmation we're allocated to Challenge 1 | | Sun 26 Jul |
| How the wildcard is scored, and expected time budget | | Sun 26 Jul |
| Full read of the KICK API — what's actually available in real time | | Wed 29 Jul |
| Confirm run sheet for the day: build cutoff, packaging, submission time | | Fri 31 Jul |

---

*Compiled from the Devpost overview, rules and resources pages, 25 July 2026. Re-check the Updates page before 1 August — the detailed spec drops on the day.*
