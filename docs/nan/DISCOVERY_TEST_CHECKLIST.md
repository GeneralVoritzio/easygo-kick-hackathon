# Discovery 3D Globe — Manual Test Checklist

Covers the Discovery feature on `feature/explore-map-view` as specified in
[plans/DISCOVERY_PLAN.md](plans/DISCOVERY_PLAN.md), plus every behavior added or
fixed during implementation. Work through the sections in order — later
sections assume the earlier ones pass. Check items off as you verify them.

## 0 · Setup

- App lives in `prototypes/hypeprops/`: `cd prototypes/hypeprops && npm install && npm run dev`.
- Test in a Chromium-based browser at a desktop viewport (~1440×900). The mobile drawer is explicitly out of scope for this version.
- Geolocation prompts are needed twice (once allowed, once denied) — use two profiles/incognito windows, or reset the site permission in between.
- Network note: card thumbnails come from `picsum.photos` and live previews from `player.kick.com`. Offline, thumbnails must fall back to gradient blocks (that's a pass, not a failure).
- Only channels backed by the demo slug (`maxholloway`) can actually play video — e.g. HypeKing. Other channels showing a static poster during preview is **expected**.

## 1 · Navigation & entry

- [ ] Sidebar (on `/stream`) shows **both** entries: `Browse` (compass icon → `/browse`) and `Discovery` (globe icon → `/discovery`).
- [ ] `/browse` still renders the classic channel grid (9 tiles), independent of Discovery.
- [ ] `/discovery` renders: header (Kick logo · "Discovery" · "who's live right now, around the globe" chip · "← back to stream"), the globe canvas, filter pills at top-left, hint pill at bottom-left.

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

## 10 · Fallbacks & accessibility

- [ ] With WebGL disabled (e.g. `--disable-webgl` flags or a blocking extension): `/discovery` shows the region-grouped text list of all live channels with working `/stream?channel=` links instead of the canvas.
- [ ] Screen reader / DOM check: a visually-hidden `nav` ("Live channels by region") exists alongside the canvas and reflects the active filters.
- [ ] No console errors during any of the flows above (Kick iframe 403s for fake slugs excepted).

## Known limitations (do not file)

- Wheel-zoom requires the pointer over the canvas; over a burst it dismisses the burst first.
- The area covered by an open burst blocks globe dragging (that's the hit shield working as designed).
- Non-embeddable channels can't play real video anywhere (only `maxholloway`-backed channels embed).
- Full keyboard navigation (Tab through hotspots) and the mobile bottom-drawer are deferred by plan.
- Thumbnails depend on picsum.photos; offline they degrade to gradients.
