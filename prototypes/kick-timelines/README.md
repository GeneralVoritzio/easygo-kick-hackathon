# kick-timelines

A companion UI for a live KICK stream. It records the stream as it happens and
draws a timeline of it. Viewers use the timeline to find the best moments.
Streamers use it to see what each decision did to the room.

Raw HTML, CSS and JavaScript. No build step and no dependencies.

## Run it

Open `index.html` in a browser. There is no server and no network call.

## What it does

**Peaks.** The track shows a curve of one metric across the stream. Select the
metric with the chips: hype, viewers, chat, follows, subs or kicks. The app
finds the 8 highest peaks and puts a pin on each one. Hover a pin to see the
viewer count, the hype score and the chat from that moment. Click to go there.

**Markers.** Clips, polls, category changes, raids and large gifts sit along the
bottom of the track. Hover for a preview. Click to go to that point. Use the
checkboxes to show or hide each layer.

**Clips.** Press the flag button, press `C`, or type `!clip` in chat. The app
records a 45 second range that ends at the playhead. Mods can flag clips too.
The Clips tab lists every clip with the person who flagged it.

**Polls.** Open a poll from the demo drawer. It appears in the chat panel and
votes come in from chat. The streamer then selects one of two methods:

- **Viewers decide.** The option with the most votes wins.
- **Leave it to chance.** A wheel spins for 5 seconds. The odds are an even
  split, or they match the vote share. A 90/10 vote split makes a 90/10 wheel.

The streamer can also opt the poll out of the timeline before it resolves.

**Decisions and impact.** For each category change, the app compares the
`viewer_count` samples from the 10 minutes before with the 10 minutes after. In
the seeded stream the switch to Slots and Casino at 02:41 costs 15% of the room
and cuts the follow rate by two thirds. Polls appear as a decision tree, with
the chosen branch marked and the odds shown.

**Go live exports.** Each overlay element is opt in. Each one is a separate
browser source that the streamer adds to OBS, so it reaches every platform they
stream to. The background is transparent, there is no audio, and no element
sits in the lower third (Design Spec 7).

## Keyboard

| Key | Action |
|---|---|
| Space | Play or pause |
| `C` | Flag a clip at the playhead |
| `L` | Go to the live edge |
| `,` and `.` | Previous and next marker |
| Arrow keys | Move the playhead 30s, or 5 min with Shift |

## The data

The app runs on mock data. There is no live API call.

KICK has no VOD endpoint, no clips resource and no polls surface. The app
therefore does not read a timeline from KICK. It **builds** one: it subscribes
to webhooks while the stream is live, timestamps each event against
`started_at`, and polls `viewer_count`. That is a real capability, so the
prototype passes Spec Test B1.

Every endpoint and event carries a label. `kick` is surface that KICK
publishes. `fake-kick` is surface we invented. The labels are in
`js/mock-api.js` (`api.KICK_SOURCES`) and in `js/app.js` (the `FAKE_` values).

Real KICK surface used as the schema reference:

| Source | Used for |
|---|---|
| `kick GET /public/v2/livestreams` | `viewer_count` samples, the viewer curve, every impact figure |
| `kick GET /public/v1/channels` | Channel identity, `stream_title`, `started_at` |
| `kick chat.message.sent` | Chat rate, `!clip`, `!vote`, raid detection |
| `kick channel.followed` | Follow curve |
| `kick channel.subscription.new`, `.gifts`, `.renewal` | Sub curve, sub train markers |
| `kick kicks.gifted` | Kicks curve, gift markers, `pinned_time_seconds` |
| `kick livestream.metadata.updated` | Category changes, the decision layer |
| `kick livestream.status.updated` | Stream start, and the anchor for all offsets |

Surface we invented, named to KICK conventions (Part 2):

| Invented | Shape |
|---|---|
| `fake-kick GET /public/v1/timelines/{livestream_id}/markers` | Cursor paginated list of markers |
| `fake-kick POST /public/v1/timelines/markers` | Creates a marker. Emits `timeline.marker.created`. Scope `timelines:write` |
| `fake-kick POST /public/v1/polls` | Creates a poll. Emits `poll.created` and `poll.resolved`. Scope `polls:write` |
| `fake-kick POST /public/v1/timelines/exports` | Opt in per overlay element. Scope `timelines:write` |

`hype_score` is a derived meter, not an API field. It is a weighted blend of
chat rate (0.45), kicks (0.25), follows (0.15) and subs (0.15), normalised
across the stream, so 100 is the loudest moment.

## Demo triggers

The drawer fires scripted beats at the live edge: a raid, a 5,000 kick gift, a
poll, a chance resolution, a category change and a sub train. Each one is a
payload the real API can deliver. Use the chance resolution as the one loud
beat in the pitch.

## Files

| File | Contents |
|---|---|
| `js/mock-api.js` | `MockKickClient`. Seeds the recorded stream and serves it |
| `js/engine.js` | Live event generator. Rates scale with `viewer_count` |
| `js/timeline.js` | The curve, the peaks, the markers and the hover preview |
| `js/roulette.js` | The weighted wheel |
| `js/app.js` | Wiring, chat, polls, clips and the panels |
| `css/tokens.css` | Design Spec 9 tokens, copied without change |
| `css/app.css` | Components |

## Known gaps

- The player is a mock surface. It shows the category, not video. The API gives
  no video frames, so the prototype does not pretend to have them.
- `LiveKickClient` is not written. `MockKickClient` defines the interface it
  must match (Spec 2A.2).
- The seeded stream is 3 hours 47 minutes long. The live edge then grows in
  real time while the page is open.
