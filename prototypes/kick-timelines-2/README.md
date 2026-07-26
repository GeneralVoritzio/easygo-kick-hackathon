# kick-timelines 2

The viewer view of the timeline. `kick-timelines` is a console the streamer
operates. This one has no console. The timeline lives in the player's own
scrubber, so the viewer never leaves the stream to use it.

The page is the **kick.com watch page**, rebuilt from the measurements in
`.claude/KICK-SITE-REFERENCE.md`: the 60px navbar, the 256px sidebar, the
player, the channel bar and the 340px chat. Our feature is then the only new
thing on the screen, which is the point.

Raw HTML, CSS and JavaScript. No build step and no dependencies.

## Copied assets

Each file is a copy, so this project runs on its own. Refresh a copy from the
source in the left column.

| Copy | Source |
|---|---|
| `assets/kick-logo.svg` | `assets/brand/kick-logo.svg` |
| `assets/fonts/inter-variable-latin.woff2` | `assets/fonts/inter/` |
| `assets/fonts/inter-OFL.txt` | `assets/fonts/inter/OFL.txt` |
| `js/icons.js` | `assets/icons/kick-inline/`, 22 files |
| `js/mock-api.js` | `prototypes/kick-timelines/js/mock-api.js` |
| `css/tokens.css` | Design System Section 9 |

## Run it

Open `index.html` in a browser. There is no server and no network call.

## What it does

**The rail.** KICK's live player already draws a 4px progress bar, full bleed,
56px above the video bottom (Site Reference Section 4). We put the timeline in
that bar. It carries a notch for each of the loudest moments and nothing else.
Hover the rail and it opens: the track grows to 6px, the notches grow, and the
hype curve fades in above. Hover near a notch and a card names the moment, the
time and the viewer count. Click or drag to go there.

The rail shows at most 8 notches, and it keeps 5 minutes between them, so a
busy hour cannot crowd the bar. A category change never takes a slot, because
it is a streamer decision and not a moment to rewatch.

**The overlay.** Press the Timeline button or `T`. A panel covers the video
frame, not the page. It holds the hype curve, a filter row and a card for each
moment. Click a card and the overlay closes at that point. `Esc` closes it.
The controls stay live under the overlay, so playback never stops.

**Before you joined.** The viewer joined this stream at 03:10:00. The overlay
opens with the three loudest moments from before that, so a late arrival can
catch up in three clicks.

**Reactions.** Each card has a heart. A viewer presses it once.

**Chat follows the playhead.** Rewind the stream and chat rewinds with it. Land
on the raid at 01:05:00 and chat is loud there. Land in the Slots block and it
turns salty. Every `kick chat.message.sent` event carries a timestamp against
`started_at`, so a recorder can replay the room as it was.

## Keyboard

| Key | Action |
|---|---|
| `T` | Open or close the timeline |
| `Esc` | Close the timeline |
| Space | Play or pause |
| `L` | Go to the live edge |
| Arrow keys | Move the playhead 30s, or 5 min with Shift |

## The data

The app runs on mock data. There is no live API call. It shares the seeded
3 hour 47 minute stream with `kick-timelines`: `js/mock-api.js` is a copy of
that prototype's file, so each prototype runs on its own.

Every endpoint carries a label. `kick` is surface that KICK publishes.
`fake-kick` is surface we invented. The `kick` labels are in `js/mock-api.js`
(`api.KICK_SOURCES`). The `fake-kick` labels are in `js/moments.js`
(`KT2.FAKE_SOURCES`). The page lists both under "Where this data comes from".

Real KICK surface used as the schema reference:

| Source | Used for |
|---|---|
| `kick GET /public/v1/channels` | Channel identity, `stream_title`, `started_at` |
| `kick GET /public/v2/livestreams` | `viewer_count` samples, the curve, every impact figure |
| `kick chat.message.sent` | Chat rate, and every peak |
| `kick kicks.gifted` | Gift moments |
| `kick channel.subscription.gifts` | Sub train moments |
| `kick livestream.metadata.updated` | Category changes, and the category on each card |

Surface we invented, named to KICK conventions (Conventions Part 2):

| Invented | Shape |
|---|---|
| `fake-kick GET /public/v1/timelines/{livestream_id}/window` | How far back the rail can go |
| `fake-kick GET /public/v1/timelines/{livestream_id}/markers` | Cursor paginated list of markers |
| `fake-kick POST /public/v1/timelines/markers/{marker_id}/reactions` | One reaction per viewer. Scope `timelines:write` |

`hype_score` is a derived meter, not an API field. `js/mock-api.js` blends chat
rate (0.45), kicks (0.25), follows (0.15) and subs (0.15), normalised across
the stream, so 100 is the loudest moment.

## The picture in the frame

KICK gives no video frames, so there is nothing to play. `js/stage.js` draws our
own scene on a canvas instead. Every element is a function of the playhead:

- The scene moves while the stream plays, so the frame is not a still image.
- Scrubbing shows the exact frame for that second, and it is reversible. The
  same playhead position always draws the same picture.
- The palette follows the category, so a category change is visible.
- The brightness follows the hype curve, so a loud moment is a brighter frame.

The player says what this is. Hover it and a caption reads "Synthetic scene,
drawn from the playhead. The API gives no video."

## What the API cannot do

KICK publishes no VOD endpoint, no DVR window and no seek. Rewinding a live
stream needs video frames, and the API boundary rules those out. The prototype
does not hide that:

- The seek is invented surface. It carries a `fake-kick` label in the UI.
- The player is a mock. Seeking moves the timeline and names the moment. It
  plays no video.
- A card shows the category at that point, and says "no frame, by design"
  where a thumbnail would sit.

The marker data itself is a real capability. Our recorder subscribes to
webhooks while the stream is live, timestamps each event against `started_at`,
and polls `viewer_count`. That is what keeps the idea past Spec Test B1.

## Files

| File | Contents |
|---|---|
| `js/mock-api.js` | `MockKickClient`. A copy of the file in `kick-timelines`, plus `LIVE_CHANNELS` for the sidebar |
| `js/icons.js` | KICK's icons. A copy of `assets/icons/kick-inline/` |
| `js/stage.js` | The picture in the frame. Drawn from the playhead, not a video |
| `js/player.js` | The playhead, the live edge and the follow rule |
| `js/moments.js` | Markers and peaks become one list of moments |
| `js/scrubber.js` | The rail, the notches and the hover card |
| `js/overlay.js` | The curve, the filters and the cards |
| `js/chat.js` | Chat, which follows the playhead |
| `js/app.js` | Wiring, the frame, the keyboard and the source list |
| `css/tokens.css` | Design System Section 9 tokens, copied without change |
| `css/kick.css` | The watch page chrome, from the Site Reference |
| `css/player.css` | The player, the rail and the overlay |

## Where this page differs from kick.com

Three differences, each on purpose.

- **The control bar never hides.** On kick.com it appears on hover. The rail is
  the thing we are demonstrating, so hiding it would hide the demo.
- **The timeline overlay stops above the control bar.** It covers the video
  frame and leaves the 56px control strip clear, so the viewer can keep
  scrubbing while the timeline is open.
- **Chat badges are coloured chips, not images.** KICK serves badge images from
  its CDN, and we never fetch an asset at run time.

## Known gaps

- `LiveKickClient` is not written. `MockKickClient` defines the interface it
  must match (Spec 2A.2).
- The reaction count is derived from `viewer_count` and `hype_score`, because
  no reaction data exists. A live build reads it from the reactions endpoint.
- The seeded stream is 3 hours 47 minutes long. The live edge then grows in
  real time while the page is open.
