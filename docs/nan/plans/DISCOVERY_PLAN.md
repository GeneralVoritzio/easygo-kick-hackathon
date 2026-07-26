# Discovery 3D Globe — Implementation Plan

## Background & Goals

Upgrade the existing channel directory into a standalone **Discovery** experience: users discover live channels from an interactive 3D globe instead of browsing a plain grid list.

The experience borrows StoryTerra's exploration rhythm of "pick on the map → content card expands → media keeps playing", with the map's content objects replaced by live channels.

## Confirmed Project Foundations

- The project already ships `three`, `@react-three/fiber` and `@react-three/drei`, so the 3D globe can be built directly without adding a new 3D rendering stack.
- The existing `/browse` is a static channel directory.
- The existing real live source uses the Kick Player iframe: `https://player.kick.com/{channel}?autoplay=true&muted=true`.
- The default Kick channel is managed by Zustand's `kickChannel`, currently `maxholloway`.
- The map can use mocked geo and channel metadata; hovering a channel card reuses the existing Kick Player form for a muted preview.

## Recommended Product Definition

### Information Architecture

- Rename the sidebar's **Browse** entry to **Discovery**, with `/discovery` as its route.
- Keep `/browse` and redirect it to `/discovery` so existing links don't break.
- V1 focuses on "discovering who is live, here and now" — it does not take on full search, following, or directory filtering.

### Core Experience Flow

```text
Enter Discovery
  → Request browser location permission
  → Globe rotates to the user's current location (falls back to a default city on denial)
  → Show ~70 nearby green live hotspots
  → Drag/zoom to explore
  → Closer zoom levels load more hotspots
  → Hover a hotspot to expand 3–5 channel cards
  → Hover a card: it scales up, gets a bright green outline, and starts a muted live preview
  → Click a card to open a half-screen live confirmation layer
  → "Watch live" enters the existing /stream player
  → "Keep exploring" returns to the original camera position and map state
```

### Map & Data Rules

- Initial positioning calls the browser Geolocation API; coordinates are used only to aim the local camera — never written to a backend, and the precise location is never persisted.
- When positioning fails or the user declines, use a clearly labelled default exploration region.
- The first screen shows 50–100 interactive hotspots; the recommended default is 72.
- Load data by camera distance: at close range, aggregation points expand into more channel hotspots; never render every channel globally at once.
- Prepare roughly 200–300 mock channels distributed across city/region clusters; each location aggregates 3–5 live channels.
- Each channel record contains: `id`, streamer name, Kick slug, category, viewer count, coordinates, static thumbnail config, and whether a real iframe is playable.
- The demo defaults to reusing the existing `maxholloway` playback source; mock channels without a guaranteed-valid Kick slug still demo fine with a static preview.

### Visual & Interaction Details

- The globe uses a black/dark-gray base, understated land texture or outlines, Kick neon-green `#53fc18` hotspots, and green glows.
- Support drag-to-rotate, wheel/two-finger zoom, and damped animation; the initial camera aims at the user's location, after which the whole globe is freely explorable.
- Hovering a hotspot scales it up and shows a floating layer with a connector line; the layer is capped at 3–5 cards to avoid covering the map.
- Keep a ~250ms close delay when moving from the hotspot to the floating layer, so the cards don't flicker away.
- Every channel card must show a static stream screenshot and a clearly visible channel name; category and viewer count may appear as secondary info.
- Cards start as static screenshots; when the mouse enters a card:
  - the card scales up by roughly 1.12–1.18×;
  - a green border and glow appear;
  - only that card mounts and plays a Kick iframe;
  - the channel name stays pinned while playing, so the user always knows which stream they're previewing;
  - the autoplay preview stays muted, per browser autoplay rules;
  - on leave, it returns to the static image and the iframe unmounts.
- Clicking a card opens a right-side half-screen confirmation layer on desktop, or a bottom half-screen layer on mobile, with the map kept in the background.
- The confirmation layer contains the player, channel info, a primary "Watch live" button, a secondary "Keep exploring" button, and a close button.
- "Watch live" navigates to `/stream?channel={kickSlug}`; the Stream page reads the parameter, switches to the Kick feed and loads that channel.
- Returning from Stream to Discovery restores the camera position, zoom level, expanded hotspot and selection state.

## Implementation Plan

### 1. Set up the Discovery route and navigation

- Add `/discovery` in `src/App.tsx` and redirect `/browse` to it.
- Update the entry name and path in `src/stream/Sidebar.tsx`.
- Keep the existing `BrowsePage` for at least one release cycle to avoid breaking undiscovered internal entry points.

### 2. Define the mock geo live catalog

- Add `src/data/discoveryChannels.ts`.
- Add `src/discovery/types.ts` defining channels, geo aggregation points, zoom levels and preview state.
- Generate stable data from a fixed seed so every demo shows identical hotspots and channels.
- Migrate the current Browse mock channels (HypeKing, NovaStrikes, etc.), keeping their interaction odds and badge info.

### 3. Build the 3D globe and the LOD hotspot layer

- Add `src/discovery/DiscoveryGlobe.tsx` and `src/discovery/LivePointLayer.tsx`.
- Use the existing React Three Fiber + Drei for the camera, orbit controls and render loop.
- Convert latitude/longitude to spherical coordinates; render hotspots with instancing to avoid large numbers of React DOM nodes.
- Implement the "camera distance → data density" pure function and unit-test it.
- Handle positioning success, positioning denial, loading states and a no-WebGL fallback UI.

### 4. Build the exploration popover and channel card interaction

- Add `src/discovery/StreamClusterPopover.tsx` and `src/discovery/StreamPreviewCard.tsx`.
- Project 3D hotspots to screen coordinates and show an HTML card layer next to the hotspot.
- Implement the card-selection experience of "static image + channel name → single-card playback on hover → scale-up and highlight"; the channel name stays visible in every card state.
- Play at most one iframe preview at a time; all other cards keep their poster, bounding network and CPU cost.

### 5. Reuse the player and build the confirmation layer

- Extract a reusable Kick Player component from `src/face/FaceStage.tsx`, shared by the Stream page and Discovery previews.
- Add `src/discovery/StreamPreviewPanel.tsx` implementing the half-screen confirmation layer.
- Modify `src/stream/StreamView.tsx` to read the `channel` parameter and call the existing `setFeedMode('kick')` and `setKickChannel()`.
- Add a lightweight Discovery Zustand store holding the camera, selected location and opened card, to support restore-on-return.

### 6. Polish and verification

- Keyboard support: Tab into a hotspot-equivalent list, Enter to open a channel, Escape to close cards and the confirmation layer one level at a time.
- Responsive: floating layer plus right-side half screen on desktop; a draggable bottom drawer on mobile while keeping globe gestures.
- Provide a semantic "live channels in the current region" alternative entry for the canvas.
- Verify `npm run build` and `npm run lint`.
- Manually cover: positioning success/denial, more hotspots on zoom-in, hover playback, exit-and-restore, channel navigation, and iframe failure fallback.

## Product Decisions Requiring Confirmation

1. V1 recommends "Google Maps-style 3D globe interaction" without integrating Google map tiles or satellite imagery. This avoids API keys, billing and licensing dependencies; if a real satellite basemap or 3D buildings are needed, explicitly choose Google Maps or Mapbox and provide the corresponding credentials.
2. "Near the user's current location" is defined as: the camera initially focuses on the current location, with mock live-density points appearing nearby — without implying those streamers' real physical locations. This definition suits the demo and is easy to later wire to real data.
