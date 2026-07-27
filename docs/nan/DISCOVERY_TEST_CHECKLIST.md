# Discovery 3D Globe — Manual Test Checklist

Covers the Discovery feature on `feature/explore-map-view` as specified in
[plans/DISCOVERY_PLAN.md](plans/DISCOVERY_PLAN.md) and
[plans/DISCOVERY_CELESTIAL_PLAN.md](plans/DISCOVERY_CELESTIAL_PLAN.md), plus
every behaviour added or fixed during implementation. Work through the sections
in order — later sections assume the earlier ones pass. Check items off as you
verify them.

## 0 · Setup

- App lives in `prototypes/hypeprops/`: `cd prototypes/hypeprops && npm install && npm run dev`.
- Test in a Chromium-based browser at a desktop viewport (~1440×900). The mobile drawer is explicitly out of scope for this version.
- Geolocation prompts are needed twice (once allowed, once denied) — use two profiles/incognito windows, or reset the site permission in between.
- Network note: card thumbnails come from `picsum.photos` and live previews from `player.kick.com`. Offline, thumbnails must fall back to gradient blocks (that's a pass, not a failure).
- Only channels backed by the demo slug (`maxholloway`) can actually play video — e.g. HypeKing. Other channels showing a static poster during preview is **expected**. Moon and Mars relay channels are *never* playable by design.
- Vector geography and the Moon/Mars/Sun textures are committed under `public/geo/` and `public/textures/`, so no network is needed for them. To regenerate the geography: `node scripts/build-geo.mjs`.
- Expected census on a clean load: **Earth 235 · Moon 14 · Mars 12 · Sun 37** (298 channels total).

## 1 · Navigation & entry

- [ ] Sidebar (on `/stream`) shows **both** entries: `Browse` (compass icon → `/browse`) and `Discovery` (globe icon → `/discovery`).
- [ ] `/browse` still renders the classic channel grid (9 tiles), independent of Discovery.
- [ ] `/discovery` renders: header (Kick logo · "Discovery" · "who's live right now, across the system" chip · "← back to stream"), the globe canvas, filter pills at top-left, the body switcher at top-right, hint pill at bottom-left.

## 2 · Globe rendering & camera

- [ ] Dark globe with subtle land texture, soft green atmosphere rim, sparse stars; green pulsing hotspots on the lit hemisphere.
- [ ] Drag rotates with smooth damping; scroll zooms (pointer must be over the canvas); pan is disabled.
- [ ] Zoom limits hold: cannot zoom inside the globe or infinitely far out.
- [ ] **Rotate speed scales with zoom**: fully zoomed in, a ~100px drag moves the view a fraction of a screen — not multiple screens (regression: drag used to fling the camera into empty ocean).

## 3 · Geolocation

- [ ] **Allow**: entering `/discovery` prompts for location; after grant, camera flies from the far view down to your area; chip reads `exploring from your area` (bottom-right).
- [ ] While resolving, chip reads `finding your area…` with a pulsing dot.
- [ ] **Deny** (fresh profile): camera flies to the labeled default instead; chip reads `exploring from San Francisco (default region)`.
- [ ] Grabbing the globe mid-flight cancels the intro flight immediately.
- [ ] The intro flight runs only once per session — navigating away and back does not replay it.

## 4 · Zoom levels (LOD) & hotspots

- [ ] Landing zoom (mid): roughly 70 cluster dots worldwide; dot size scales with viewer count.
- [ ] Zoom far out: only the busiest clusters stay lit (fewer dots than mid).
- [ ] Zoom close in: clusters expand into **individual channel dots arranged in a ring** around each city — visibly separated, never stacked into one blob.
- [ ] **Dots keep a roughly constant screen size at every zoom** (they don't balloon as you zoom in) and each ring dot can be hovered individually (regression: fixed-size dots used to overlap and be unpickable).
- [ ] Hotspots on the far side of the globe cannot be hovered through the planet.

## 5 · Hover popover (radial burst)

- [ ] Hovering a dot bursts open 3–5 channel cards **arranged radially around the dot**, with green connector rays from the center and a staggered pop-in animation.
- [ ] A city chip (`City · Country · n live`) sits just under the hotspot.
- [ ] At near zoom, the burst is anchored to the **exact dot you hovered**, not the cluster's center ~1° away.
- [ ] Moving from the dot onto a card keeps the burst open (250ms grace; regression: it used to close instantly because the popover spawns under the resting pointer).
- [ ] **Hit shield**: wandering through the gaps *between* cards never switches the popover to another cluster's dots beneath (regression), and clicking an empty gap dismisses the burst.
- [ ] Scrolling the wheel over the burst folds it up (next wheel tick zooms the globe); starting a drag on the globe also folds it.
- [ ] Hovering a different dot switches the burst to that cluster.

## 6 · Preview cards

- [ ] Every card always shows: LIVE badge, viewer count, thumbnail (or gradient fallback), **channel name pinned in all states**, category + `replies 1 in N` odds line.
- [ ] Hovering a card: scales up (~1.15×), bright green ring + glow.
- [ ] Hovering an embeddable card (e.g. HypeKing in the San Francisco cluster): a **muted** Kick live preview starts inside the card; the name stays visible over it; exactly **one** iframe exists at a time (check DevTools if in doubt).
- [ ] Moving to another card unmounts the previous preview; non-embeddable cards keep their static poster (expected).
- [ ] Clicking a card — including a **slow, human-speed press on a card that is actively playing its preview** — opens the confirm panel (two separate regressions lived here; both click paths must work).

## 7 · Confirm panel (live details)

- [ ] Desktop: right-side half-screen panel slides up; the globe stays visible behind a dimmed backdrop. (Narrow window: bottom sheet.)
- [ ] Panel contents: LIVE NOW header, player area (embeddable → live Kick player; otherwise poster + "live preview unavailable for this demo channel"), avatar + name, `category · language · viewers · City, Country` line, odds/badges box.
- [ ] **Live chat feed** streams in real time — new messages appear every few seconds, colored usernames, auto-scrolls to the newest, KICKBot lines included.
- [ ] Dismissal: `Keep exploring` button, ✕ button, clicking the backdrop, and Escape all close the panel; camera and the expanded burst are untouched afterwards.

## 8 · Watch live & state restore

- [ ] `Watch live` navigates to `/stream?channel={slug}`; for HypeKing the stream page plays `maxholloway`'s Kick feed.
- [ ] Non-embeddable channels: `Watch live` still navigates, but the Kick player 403s (black frame) — **known limitation, not a failure**.
- [ ] Returning to Discovery (sidebar link): camera position/zoom, the expanded burst, **and the open confirm panel** are all restored exactly.
- [ ] Escape peels layers one at a time: first press closes the panel, second closes the burst.

## 9 · Filters

- [ ] Four dropdown pills top-left — `Category`, `Language`, `Interaction`, `Viewers` — plus an always-visible `n live` count chip.
- [ ] Only one menu opens at a time; click-away closes it; **Escape closes the menu without also folding an open burst** (capture-phase handling).
- [ ] Category: 2-column panel, single-select, closes on pick; the pill lights up green showing the selection (`Valorant ▾`); dots shrink to matches and the count drops (~19 for Valorant).
- [ ] Language: 15 native-name options; picking `Português` leaves only Brazil/Portugal clusters (~5 live).
- [ ] **Auto-fly**: if the current view has no matches (e.g. pick `Português` while over the Pacific), the camera flies to the busiest matching cluster instead of showing an empty globe.
- [ ] Interaction: multi-select with AND semantics — adding `💬 Responsive` on top of `Valorant` shrinks the count further (19 → ~10); the menu stays open for multi-picking.
- [ ] Viewers: `< 500` / `500–2k` / `2k+` single-select tiers.
- [ ] Filtered state: hovering a surviving dot shows **only matching channels** in the burst; if a filter change empties the currently-open cluster, the burst closes itself.
- [ ] `Clear all` appears only while any filter is active and restores the full count (~280 live).
- [ ] Filters survive a round-trip: filter → open a channel → Watch live → return to Discovery → same filters and count.

## 9b · Celestial bodies & travel

- [ ] Body switcher (top-right) lists **Earth · Moon · Mars · The Sun · System** with live counts matching the census above; the active body is highlighted with its own accent colour.
- [ ] Clicking a body in the switcher travels there immediately; the hint and the bottom-right chip both update (Moon/Mars say "relay channels pointed at the …surface", the Sun says "streamers who keep their location private").
- [ ] **Zoom-out gesture**: from Earth, keep scrolling out — once parked at the ceiling, two more zoom-out ticks hand off to the solar-system view. (A single overshoot must *not* trigger it.)
- [ ] Solar-system view shows the Sun centred, Earth with the Moon beside it, Mars further out, two dashed orbit rings, and a live-count badge under each body. Nothing overlaps.
- [ ] The caption reads "sizes and distances are compressed for browsing" — the view must **not** imply astronomical accuracy.
- [ ] Hovering a body in the system view grows it slightly; clicking either the body or its label flies into that body.
- [ ] `Escape` from the system view returns to the body view (after the confirm layer and popover have been peeled).
- [ ] **Per-body cameras**: rotate Earth to a distinctive spot, switch to Mars, switch back — Earth is where you left it, and Mars keeps its own vantage point independently.
- [ ] Moon/Mars/Sun open showing the *whole* body (not cropped at the edges).
- [ ] Hotspots on the Moon, Mars and the Sun render with a dark backing disc so the green core stays readable against the pale surface (regression: a backing *sphere* used to poke out in front and swallow the dot).
- [ ] The Sun's surface visibly churns (two texture layers scrolling at different rates), not a still image.

## 9c · Earth geography (vector borders & cities)

- [ ] Far zoom: coarse country outlines only.
- [ ] Mid zoom (the landing zoom): finer country outlines.
- [ ] Near zoom: fine country outlines **plus state/province borders** — US states, Mexican states, etc. are clearly drawn.
- [ ] Near zoom: **city name labels** appear (e.g. over the US West: San Francisco, San Jose, Sacramento, Los Angeles, San Diego, Las Vegas, Phoenix, Denver). Labels fade out towards the limb and never appear on the far hemisphere.
- [ ] Rotating the globe re-picks the labels for the new view — you should always see cities near the centre of the screen, not just a handful of the world's biggest.
- [ ] Borders stay crisp at every zoom level (they're vector lines, not a texture) and are a muted slate colour — **not** green. The Kick green stays reserved for live hotspots.
- [ ] Borders and labels appear on **Earth only** — never on the Moon, Mars or the Sun.
- [ ] Zooming in the first time briefly downloads the finer border set; the previous borders stay on screen while it loads (no blank flash).

## 9d · Relay channels (Moon & Mars)

- [ ] Moon has 8 named sites (Mare Tranquillitatis, Shackleton Crater, Copernicus, Tycho, Oceanus Procellarum, Mare Imbrium, Aristarchus, Mare Serenitatis); Mars has 6 (Jezero, Gale, Olympus Mons, Valles Marineris, Utopia Planitia, Hellas Planitia).
- [ ] A relay card's second line reads "*Agency* relay · replies 1 in N" (e.g. "ESA relay") instead of a game category.
- [ ] The confirm panel for a relay shows a **Relay** badge, the agency, the instrument being restreamed, and the disclaimer "A viewer-run channel, not an official *Agency* broadcast." — this must never claim to be an official agency feed.
- [ ] Relay channels always show the static poster with "live preview unavailable for this demo channel" — hovering never mounts an iframe.
- [ ] Filtering by category **Science & Technology** surfaces the relays.

## 9e · The Sun (location privacy)

- [ ] The Sun is populated with ~37 channels grouped into privacy pockets, spread evenly over the surface (no clumping, no channels at the exact poles).
- [ ] A Sun popover header reads **Private** + *location hidden* in italics — never a city or country.
- [ ] A Sun channel's confirm panel shows "· location private" instead of a place, plus a **Location private** explainer box.
- [ ] Every channel on the Sun is genuinely absent from Earth — pick a name from the Sun and confirm it appears nowhere on the Earth map.
- [ ] **Privacy toggle** (the demo's centrepiece): open HypeKing's panel on Earth → tick **Hide my location** → HypeKing leaves San Francisco, the view travels to the Sun, the Earth count drops by one and the Sun count rises by one (235→234, 37→38), and the panel switches to "location private".
- [ ] Un-ticking it puts HypeKing back in San Francisco with the original coordinates — the move is reversible in both directions.

## 9f · Filters across bodies

- [ ] Filters apply **within the active body**; the count chip reflects that body only.
- [ ] Filtering a body down to zero shows a cross-body hint — e.g. on Mars with `Valorant` selected: "**Earth has 19 →**". Clicking it travels to Earth with the filter still applied.
- [ ] When no body has a match, the hint is replaced by that body's own empty-state message (e.g. "no martian relays match — clear a filter").
- [ ] Filters survive body switching and a round-trip to `/stream`.

## 10 · Fallbacks & accessibility

- [ ] With WebGL disabled (e.g. `--disable-webgl` flags or a blocking extension): `/discovery` shows a text list of all live channels **grouped by body** with working `/stream?channel=` links instead of the canvas. Relay entries name their agency and instrument; Sun entries are headed "Location private".
- [ ] Screen reader / DOM check: a visually-hidden `nav` ("Live channels by location") exists alongside the canvas, covering all four bodies.
- [ ] No console errors during any of the flows above (Kick iframe 403s for fake slugs excepted).

## Known limitations (do not file)

- Wheel-zoom requires the pointer over the canvas; over a burst it dismisses the burst first.
- Reaching the zoom ceiling from the landing zoom takes ~20 wheel clicks (one trackpad flick). The two extra ticks to leave orbit are deliberate friction so you can't fall out of orbit by accident.
- Solar-system sizes, distances and angles are compressed and fixed — no orbital mechanics, and the bodies never move.
- City *boundary* polygons don't exist as usable global vector data; state/province borders plus city point labels are the closest real data allows.
- The area covered by an open burst blocks globe dragging (that's the hit shield working as designed).
- Non-embeddable channels can't play real video anywhere (only `maxholloway`-backed channels embed).
- Full keyboard navigation (Tab through hotspots) and the mobile bottom-drawer are deferred by plan.
- Thumbnails depend on picsum.photos; offline they degrade to gradients.
