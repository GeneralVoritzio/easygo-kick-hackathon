# kick-timelines

A companion UI for a live KICK stream. It records the stream as it happens, and
it draws a timeline of it.

Prototype at `prototypes/kick-timelines/`. Raw HTML, CSS and JavaScript. No
build step and no dependencies. Open `index.html` in a browser.

Written 25 July 2026.

---

## 1. The problem it solves

A KICK stream makes a lot of signal while it is live. That signal then
disappears.

- The streamer cannot tell you which decision cost them viewers.
- A viewer who opens a 4 hour VOD cannot tell you where the good parts are.
- A mod who saw a good moment cannot mark it in a way that stays after the
  stream.

The app puts all of that in one timeline. It serves two users on one surface:

- **Viewers** find the peaks, and go to them.
- **Streamers** see the effect of each decision on the room.

## 2. Why it fits the brief

Challenge 1 asks for a real time overlay or companion UI. This is a companion
UI. The timeline grows while you watch it, so it meets requirement 4 (it
reflects real time stream behaviour). It is not post stream analytics, which
Hackathon Spec 2 rules out. It is interactive at all times: scrub, hover,
filter, clip, vote and spin.

**Spec Test result:** passes A1 to A6 and B1 to B5. B1b (real OAuth, plus one
live endpoint) is still open. That task covers the whole repo. It is not a gap
in this prototype.

## 3. What it does

| Feature | Description |
|---|---|
| Peak curve | Shows one metric across the stream. Select hype, viewers, chat, follows, subs or kicks. The app pins the 8 highest peaks to the curve. |
| Markers | Shows clips, polls, category changes, raids and large gifts on the track. Hover for a preview. Click to go there. Each layer has a toggle. |
| Previews | A peak preview shows the chat from that 15 second window, so you see the cause. A decision preview shows the viewer impact. |
| Clips | Use the flag button, the `C` key, or `!clip` in chat. The app records who flagged each clip. |
| Polls | The poll opens in chat and takes votes from chat. The streamer then selects the method. |
| Roulette | This is the chance method. The wheel turns for 5 seconds. The odds are an even split, or they match the vote share. |
| Decisions and impact | Shows each category change with the viewer, follow and sub delta on both sides. Polls show as a decision tree. The app marks the chosen branch. |
| Go live exports | Gives five overlay elements. Each element is opt in. Each element is a separate browser source. |
| Demo triggers | Fires six scripted beats at the live edge, on cue. |

## 4. The decisions worth knowing about

### The timeline is a recording, not a fetch

The KICK public API has no VOD resource, no clips resource and no polls
surface. An app that claims to read a VOD timeline from KICK fails Spec Test
B1. The judges wrote that API, so they will know.

The app therefore builds the timeline. It subscribes to webhooks while the
stream is live. It gives each event an offset from `started_at`. It also polls
`viewer_count`. All of that is a real capability. It is a better answer on
stage, and it is how the product ships. The Data sources tab states this in the
UI. It also marks which rows are real KICK surface, and which rows are ours.

### Polls and clips are our features

The poll runs in our app. It posts the question to chat with `chat:write`. It
counts the votes from `chat.message.sent`. A clip is a time range that this app
owns. The app does not claim to create a resource on the KICK side.

### The wheel is a readout, not the random number generator

The app draws the winner before the animation starts. The wheel then turns to
that result. The result is therefore reproducible from `poll.resolved`. A
browser source that reloads during the spin still lands on the same answer.
Design Spec 7 requires this behaviour.

### The demo data contains a story

The seeded stream is not noise. It has three beats:

| Time | Event | Effect |
|---|---|---|
| 01:05 | Raid from Ac7ionMan | The room doubles |
| 02:41 | Category changes to Slots and Casino | Viewers drop 15.3%. The follow rate drops by two thirds |
| 03:29 | Gift of 5,000 kicks | The loudest moment of the stream |

This gives the pitch a start, a lesson and a peak. Nobody has to narrate the
UI.

### The green stays scarce

The accent shows on the hype curve, the playhead, the primary buttons and the
active state. It shows nowhere else. Each other metric has its own hue. Only
one metric shows at a time.

## 5. Data sources

The app runs on mock data. It makes no live API call. The KICK API is the
schema reference (Hackathon Spec 2A).

Every endpoint and event carries a label. `kick` is surface that KICK
publishes. `fake-kick` is surface we invented. The Data sources tab shows the
same labels.

Real KICK surface:

| Source | Used for |
|---|---|
| `kick GET /public/v2/livestreams` | `viewer_count` samples, the viewer curve, each impact figure |
| `kick GET /public/v1/channels` | Channel identity, `stream_title`, `started_at` |
| `kick chat.message.sent` | Chat rate, `!clip`, `!vote`, raid detection |
| `kick channel.followed` | Follow curve |
| `kick channel.subscription.new`, `.gifts`, `.renewal` | Sub curve, sub train markers |
| `kick kicks.gifted` | Kicks curve, gift markers, `pinned_time_seconds` |
| `kick livestream.metadata.updated` | Category changes, the decision layer |
| `kick livestream.status.updated` | Stream start, and the anchor for all offsets |

Invented surface, named to KICK conventions (KICK-API-CONVENTIONS Part 2):

| Invented | Shape |
|---|---|
| `fake-kick GET /public/v1/timelines/{livestream_id}/markers` | Cursor paginated marker list |
| `fake-kick POST /public/v1/timelines/markers` | Creates a marker. Emits `timeline.marker.created`. Scope `timelines:write` |
| `fake-kick POST /public/v1/polls` | Creates a poll. Emits `poll.created`, then `poll.resolved`. Scope `polls:write` |
| `fake-kick POST /public/v1/timelines/exports` | Opt in for each overlay element. Scope `timelines:write` |

`hype_score` is a derived meter. It is not an API field. It blends chat rate
(0.45), kicks (0.25), follows (0.15) and subs (0.15). The app normalises it
across the stream, so 100 is the loudest moment.

## 6. Files

```
prototypes/kick-timelines/
  index.html
  css/tokens.css     Design Spec 9 tokens, copied without change
  css/app.css        components
  js/mock-api.js     MockKickClient. Seeds and serves the recorded stream
  js/engine.js       Live generator. Rates scale with viewer_count
  js/timeline.js     Curve, peaks, markers, hover preview
  js/roulette.js     Weighted wheel
  js/app.js          Wiring, chat, polls, clips, panels
  README.md
```

The four invented endpoints and the poll object are recorded in
`.claude/KICK-API-CONVENTIONS.md` Part 2. That file asks for new surface to go
there.

## 7. Still open

- The player is a mock surface. It shows the category, not video. The API gives
  no video frames.
- `LiveKickClient` is not written. `MockKickClient` defines the interface that
  it must match (Hackathon Spec 2A.2).
- Screenshots were not available in the build session. The build was verified
  through the DOM. Look at the UI before you show it to other people.
