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

`js/mock-api.js` has moved away from the file it was copied from. It now also holds
`LIVE_CHANNELS` and `is_following` for the sidebar, `VIEWER_ME` for the signed in viewer, and
the 16 KICK identity colours in `colourFor`. One clip title changed: the clip at 02:01:06 sat
in the GTA V block and was named for a Counter-Strike map, which the live API could not
produce. Read the differences before you refresh the copy.

The clip card and the clip viewer copy two screenshots of `kick.com/browse/clips`, held in
`docs/matt/kick-timelines-references/`: `clip-display.png` and `clip-clicked-popup.png`.

## Run it

Open `index.html` in a browser. There is no server and no network call.

`node check.mjs` holds two lines that a reader cannot see on the screen. It fails on a
`font-size` off the KICK scale (Design System Section 2). It also fails if the clip preview
draws nothing, sizes a canvas more than once, or leaves the player frame blank. Sizing a
canvas clears it, so a preview that runs 60 times a second must size each canvas once.

## What it does

**A signed in viewer.** The page always renders logged in, because every feature here is a
viewer feature. The sidebar lists `Following` first and `Recommended` under it. The navbar
carries the account avatar in place of `Log In` and `Sign Up`. The viewer is
`bucket_hat_bailey`, and a message they send carries that handle.

**The chat handle drags.** The 4px strip between the main column and the chat is a real drag
handle, 280px to 460px, and it takes the arrow keys when it has focus (Site Reference
Section 1). It shows nothing at rest, and it turns green under the pointer.

**Every pane over the video is glass.** The timeline and the hover card use KICK's own glass,
ink at 64% behind an 8px frost, so the stream is never fully hidden. A glass pane floats: it
is inset from the video on every side, it has a light rim, a flare on KICK's own -45 degree
axis and a shadow, and its content is inset again from the glass. Section "Glass" below says
where every value comes from.

**The rail.** KICK's live player already draws a 4px progress bar, full bleed,
56px above the video bottom (Site Reference Section 4). We put the timeline in
that bar. It carries a notch for each of the loudest moments and nothing else.
Hover the rail and it opens: the track grows to 6px, the notches grow, and the
hype curve fades in above. Hover near a notch and a card names the moment, the
time and the viewer count. Click or drag to go there.

**A clip is a clip card.** Hover a clip on the rail and the card grows to 288px
and shows the card `kick.com/browse/clips` shows, copied from
`docs/matt/kick-timelines-references/clip-display.png`:

- A 16:9 still frame, with the length top left and the view count bottom left.
- Under it, the channel avatar, the channel name, the clip title, then the
  category as a chip and the age.

The age is minutes, not days, because the clip comes from the stream you are
watching. Nothing plays in the card. A press opens the clip viewer.

A 10px bridge under the card closes the gap to the rail, or the card would shut
on the way up. The card also waits 500ms after the pointer leaves the rail. It
sits above the control row, so it covers no button.

Three of the four clips hold a notch: 01:05:48, 02:01:06 and 02:25:12. The
fourth sits 24 seconds from the 5,000 kicks notch, which wins the hover.

**The clip viewer.** Press a clip card, or a clip card in the timeline, and the
clip opens over the page. Two panels with a 14px gap, not one box:

- **The clip**, 16:9, on the left. It names itself over the video, top left:
  `title • category` on the first line, then `Clipped by X • N Views • age`. The
  close button sits top right, and the player chrome sits at the bottom: play,
  mute, `MM:SS / MM:SS`, and full screen, with the remaining time centred over
  the bar. All of it appears on hover, the way the page player's does, and it is
  up when the viewer opens because focus lands inside.
- **The chat rail** on the right, at the chat width. The channel avatar, the
  channel name and the **stream** title, then `Follow` and share, then
  `Watch full video`, then the chat as it was, each row stamped from the start
  of the clip.

The bar is scrubbable, and it measures the track, not the padded box around it.
The `-MM:SS` over the bar is the time left **at the point under the pointer**, not
at the playhead, and a lighter fill runs out to meet it. That is what the
screenshot shows: the label reads `-02:13` at 25.9% of a 3:00 clip.

The clip loops for its `duration_seconds`. **The viewer never moves the
playhead**, so the scrim, the close button and `Esc` all put you back on the
same second of the same stream. Only `Watch full video` moves it.

Every other moment seeks instead of opening a viewer. A clip is a thing you
watch. A peak is a point in the stream.

The frame is the same scene `js/stage.js` draws in the player. It is not video.
The API gives no frames, and this is our own drawing.

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
| `Esc` | Close the clip viewer, then the timeline |
| Space | Play or pause |
| `L` | Go to the live edge |
| Arrow keys | Move the playhead 30s, or 5 min with Shift |
| Arrow keys | Resize the chat 16px, when the drag handle has focus |

## The data

The app runs on mock data. There is no live API call. It shares the seeded
3 hour 47 minute stream with `kick-timelines`: `js/mock-api.js` is a copy of
that prototype's file, so each prototype runs on its own.

Every endpoint carries a label. `kick` is surface that KICK publishes.
`fake-kick` is surface we invented. The `kick` labels are in `js/mock-api.js`
(`api.KICK_SOURCES`). The `fake-kick` labels are in `js/moments.js`
(`KT2.FAKE_SOURCES`).

**The page itself shows no labels.** Both sets stay in code, and the two tables
below are the record a reader can open. Nothing reads `FAKE_SOURCES` now, and it
stays because the working agreement asks the consuming code to hold the
`fake-kick` labels.

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

## What the API cannot do

KICK publishes no VOD endpoint, no DVR window and no seek. Rewinding a live
stream needs video frames, and the API boundary rules those out. The prototype
does not hide that:

- The seek is invented surface, named to KICK conventions.
- The player is a mock. Seeking moves the timeline and names the moment. It
  plays no video.
- A clip preview and a card thumbnail are our own drawing, not a video frame.

**The page carries no copy that explains itself, and it names no endpoint.** The
screen is the product, so the caption on the frame, the note under the chat
input, the line under the timeline and the `Where this data comes from` list are
all gone. This file is the record now. Say the rest out loud, and keep this open
when a judge asks.

The marker data itself is a real capability. Our recorder subscribes to
webhooks while the stream is live, timestamps each event against `started_at`,
and polls `viewer_count`. That is what keeps the idea past Spec Test B1.

## Files

| File | Contents |
|---|---|
| `js/mock-api.js` | `MockKickClient`. A copy of the file in `kick-timelines`, plus `LIVE_CHANNELS` for the sidebar |
| `js/icons.js` | KICK's icons. A copy of `assets/icons/kick-inline/` |
| `js/stage.js` | The picture in the frame, and every clip frame. Drawn from the playhead, not a video |
| `js/player.js` | The playhead, the live edge and the follow rule |
| `js/moments.js` | Markers and peaks become one list of moments |
| `js/scrubber.js` | The rail, the notches and the hover card |
| `js/clip.js` | The clip card, and the clip viewer |
| `js/overlay.js` | The curve, the filters and the cards |
| `js/chat.js` | Chat, which follows the playhead |
| `js/app.js` | Wiring, the frame, the keyboard and the chat drag handle |
| `check.mjs` | Fails on off-scale type, and on a clip preview that stops drawing |
| `css/tokens.css` | Design System Section 9 tokens, copied without change |
| `css/kick.css` | The watch page chrome, from the Site Reference |
| `css/player.css` | The player, the rail and the overlay |
| `css/clip.css` | The clip card and the clip viewer |

## Where this page differs from kick.com

Five differences, each on purpose.

- **The timeline overlay stops above the control bar.** It covers the video
  frame and leaves the 56px control strip clear, so the viewer can keep
  scrubbing while the timeline is open. The control bar therefore stays up while
  the overlay is open, and while the stream is paused.
- **Chat badges are coloured chips, not images.** KICK serves badge images from
  its CDN, and we never fetch an asset at run time.
- **Avatars are initials on an identity colour.** Same reason. kick.com serves
  the profile picture from its CDN.
- **The sidebar has no `About Kick` and no `Start Live`.** kick.com puts both at
  the bottom (Site Reference Section 3). They are dead links here, and a dead
  link is worse than a missing one.
- **The navbar has no notification bell.** The logged in navbar carries one. We
  do not hold the icon, and a hand drawn approximation gives the copy away
  faster than a missing button.
- **The clip viewer is missing four icons.** KICK's has a download and a kebab
  beside share, a heart in `Follow`, a chevron beside the stream title and an
  external link glyph in `Watch full video`. We hold none of them, and a hand
  drawn approximation gives the copy away faster than a missing button.
  `Follow` and share are chrome, the same as the two buttons in the channel bar.
- **No close button takes a fill on hover.** It brightens instead. A plate on
  glass reads as a solid patch, which is the one thing glass must not do.
- **Nothing on the page names an endpoint.** The `Where this data comes from`
  list is gone. The working agreement asks for a `kick` or `fake-kick` label in
  UI copy as well as in code and docs, so this page meets two of the three. The
  data section above carries the labels.

## Glass

A pane that sits over the video uses KICK's glass, not their surfaceOverlay.
KICK keeps the two apart, and the values come from
`assets/reference/kick-neon-tokens.css`, which is their own CSS.

| Ours | KICK token | Value |
|---|---|---|
| `--kick-glass` | `glass-base`, `color-dark-64` | `rgba(11,11,12,.64)` |
| `--kick-glass-frost` | `effect-glass-frost` | `8`, used as `blur(8px)` |
| `--kick-on-glass` | none. Ours 🔧 | `rgba(240,241,242,.08)` |
| `--kick-on-glass-strong` | none. Ours 🔧 | `rgba(240,241,242,.14)` |

The `.glass` class in `css/kick.css` carries the whole treatment, so a pane opts in with one
class. The flare is a `-45deg` gradient at 10% white, which follows KICK's
`effect-glass-angle: -45` and `effect-glass-intensity: 40`. The rim is a 1px inset white
highlight at 14%, over the `--border` token. Read from
`docs/matt/kick-timelines-references/dashboard-stream-glass-popup.png`.

Design System Section 9 carries no glass token, so these four sit in
`css/kick.css` beside the other values read from the live site, and not in
`css/tokens.css`, which stays a verbatim copy.

KICK publishes no token for a raised layer on glass, so the last two are ours.
They follow KICK's idiom, which builds a surface from light at a low alpha and
not from grey (Design System Section 1). Every tile inside the timeline uses
them, so the pane reads as one piece of glass and not as blocks stuck to it.

## Known gaps

- **The logged in chrome is 🔧 derived, not measured.**
  `.claude/KICK-SITE-REFERENCE.md` was read from `kick.com/xqc` logged out, so it
  does not cover the signed in navbar or the `Following` list. Measure the live
  page, correct the values, then add a logged in section to the Site Reference.
- `LiveKickClient` is not written. `MockKickClient` defines the interface it
  must match (Spec 2A.2).
- The reaction count is derived from `viewer_count` and `hype_score`, because
  no reaction data exists. A live build reads it from the reactions endpoint.
- The seeded stream is 3 hours 47 minutes long. The live edge then grows in
  real time while the page is open.
