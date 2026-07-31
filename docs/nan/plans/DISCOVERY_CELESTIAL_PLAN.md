# Discovery — Celestial Expansion — Implementation Plan

> Extends the Earth-only Discovery already delivered in [DISCOVERY_PLAN.md](DISCOVERY_PLAN.md) with the Moon, Mars and the Sun, and upgrades Earth from a coarse texture to zoomable vector geography.

## Background & Goals

Two things:

1. **Grow Discovery from "a globe" into "four worlds"** — the Moon and Mars carry Kick channels that relay agency imagery; the Sun is where every streamer who hides their location ends up. That's both the demo's "whoa" moment and a home for a real privacy feature.
2. **Replace Earth's coarse 2048×1024 texture with vector geography** — zoom in and see country borders, state/province borders and city labels, crisp at any zoom level.

## Confirmed Product Decisions

1. **Travel: zoom out to the solar system + a quick switcher** — keep scrolling out from Earth and you hand off to a solar-system view where each body carries a live-channel badge; click one to fly in. A switcher dock stays available for fast jumps.
2. **Earth detail: country + state/province borders + city labels** — vector lines, revealed progressively by zoom band.
3. **Moon/Mars cameras: Kick channels relaying agency signals** — framed as channels run by space enthusiasts restreaming already-published probe imagery, with a `relay` badge. They are explicitly **not** presented as official NASA broadcasts, per the project rule against claiming capabilities the API doesn't have.
4. **The Sun: with an interactive toggle** — ~12% of channels are seeded as location-private; HypeKing additionally gets a "hide my location" switch that moves it from Earth to the Sun live.

## Asset Feasibility (verified)

| Asset | Size | Licence |
|---|---|---|
| `countries-110m.json` (TopoJSON, coarse) | 108KB | world-atlas, public domain (Natural Earth derivative) |
| `countries-50m.json` (TopoJSON, fine) | 756KB | as above |
| `ne_50m_admin_1_states_provinces_lines.geojson` | 882KB | Natural Earth, public domain |
| `ne_50m_populated_places_simple.geojson` | 851KB | as above |
| `moonmap1k.jpg` / `marsmap1k.jpg` / `sunmap.jpg` | 404/525/281KB | threex.planets, MIT |

After preprocessing (§ below) the committed output is 87KB + 448KB + 90KB + 67KB.

**The key trade-off: city boundaries aren't possible.** There is no usable lightweight global vector dataset for city administrative boundaries (they run to hundreds of MB). This plan uses state/province borders plus city point labels — the closest to "city level" that real data allows, and what real map products do at this zoom.

> ⚠️ The 110m states/provinces file covers **only the USA** (51 features). Global coverage needs the 50m `_lines` variant — border lines rather than polygons, so shared edges aren't drawn twice.

## Product Definition

### View modes

Two modes, held in `viewMode`:

| Mode | Contents |
|---|---|
| `body` | One celestial body fills the viewport; hotspots, popovers and the confirm layer behave exactly as the Earth-only version |
| `system` | The solar-system overview — four bodies on orbits, each with a live-channel badge, click to fly in |

**Entering/leaving:** in `body` mode, pull the camera to `MAX_CAMERA_DISTANCE` and keep zooming out to hand off to `system`; clicking a body in `system` flies into its `body` mode. The switcher dock is present in both modes.

**The solar-system scale is deliberately compressed** — at true scale the Sun would swallow the viewport and Mars would be a few pixels. The view says so in its caption rather than pretending to astronomical accuracy.

### Body definitions

`src/discovery/bodies.ts` describes each body: texture, surface tint (plus a brighter `systemTint` for the small solar-system render), accent colour, atmosphere, whether it has vector borders, hotspot style, and its solar-system placement.

### Data model

`DiscoveryChannel` gains three fields:

```
body: HomeBody              // 'earth' | 'moon' | 'mars' — never 'sun'
location_hidden: boolean    // true → rendered on the Sun, no place ever shown
relay?: { agency, instrument }   // Moon/Mars channels only
```

**The Sun is a projection, not seeded data.** Hidden channels stay in their home cluster in the catalog, flagged but not moved; `clustersForBody(clusters, 'sun', overrides)` derives the Sun's privacy pockets at render time, assigning solar coordinates to *copies*. This is what makes the privacy toggle reversible in both directions — a channel that hides keeps its real coordinates and can come straight back.

- **Moon**: 8 real sites (Mare Tranquillitatis, Shackleton Crater, Copernicus, Tycho, Oceanus Procellarum, Mare Imbrium, Aristarchus, Mare Serenitatis), 1–3 relay channels each.
- **Mars**: 6 real sites (Jezero, Gale, Olympus Mons, Valles Marineris, Utopia Planitia, Hellas Planitia).
- Relay channels name a real agency (NASA/ESA/JAXA/ISRO/CNSA/Roscosmos) and a real published instrument, are categorised `Science & Technology`, and are **never embeddable** — there is no live feed from the Moon to pretend to play.
- **The Sun**: hidden channels grouped into pockets of 4, placed by a deterministic Fibonacci-lattice spiral so every demo run looks identical.

### Earth vector geography

**Author-time preprocessing** (`scripts/build-geo.mjs`) fetches the sources above and emits compact polyline JSON into `public/geo/`. Doing it here rather than at runtime means no TopoJSON decoder in the bundle, a fraction of the download, and an offline-capable demo since the output is committed. Ramer–Douglas–Peucker simplification (0.03–0.08°) cuts the fine border set from ~1MB to 448KB with no visible loss at achievable zoom levels.

Output format is flat: `{ lengths: [n1, n2, …], coords: [lat, lng, …] }`, so the runtime builds one `BufferGeometry` per dataset — a single draw call.

**LOD by zoom band:**

| Zoom | Borders | Cities |
|---|---|---|
| far | coarse countries | none |
| mid | fine countries | none |
| near | fine countries + state/province lines | nearest ~44 labels |

City labels are picked by **view direction**, not global population: `nearestCities` ranks the facing hemisphere by centredness (with population as a tiebreak), re-picked on a throttle. A global top-N would leave whole continents with one label on them.

**Colour constraint:** borders are a desaturated slate, never green. The design spec keeps `#53fc18` under 10% of visible pixels, so the green stays reserved for live hotspots.

### Per-body rendering

- **Earth**: existing dark texture + vector borders + green atmosphere.
- **Moon**: grey texture, no atmosphere.
- **Mars**: rust texture with a faint orange atmosphere.
- **Sun**: procedural — the texture sampled twice at different scrolling rates and multiplied, so the surface convects instead of sitting still, plus an additive corona.
- On the pale bodies (Moon/Mars/Sun) hotspots need a **dark backing disc** or the green core washes out. It must be a flat circle tangent to the surface and pushed slightly inward — a backing *sphere* of that size pokes out in front of the core and swallows it.

### Privacy narrative (the Sun)

Framed as a real feature, not a joke:

> **The Sun** — streamers who keep their location private. No coordinates, no city, no country. Just the show.

- Cards and the confirm panel show `location private` instead of a place.
- HypeKing's panel carries a **Hide my location** switch. Flipping it removes HypeKing from San Francisco, travels to the Sun, and updates both counts — the demo's key beat.

### Filters across bodies

- Filters apply within the active body; the count chip reflects that body.
- If the active body has zero matches but another does, the count chip is joined by "**Mars has 3 →**", which travels there with the filter intact — stitching filtering and interplanetary navigation together.

### Out of scope

Real orbital mechanics, true relative sizes, city boundary polygons (data unavailable), lunar/martian elevation maps, other planets, dedicated mobile layouts.

## Implementation Steps

1. **Body abstraction** — `bodies.ts` (definitions + system layout + `sunSpiralPlacement`), type extensions, unit tests.
2. **Celestial mock data** — `body`/`location_hidden`/`relay` on channels, Moon and Mars relay sites, tests. (Latitude clamping and longitude wrapping are required: a ring around Shackleton Crater at −89.9° otherwise steps over the pole.)
3. **Earth vector borders** — `scripts/build-geo.mjs`, `geoData.ts` lazy loaders, `BorderLayer.tsx`, `CityLabelLayer.tsx`, `bordersForBand`/`citiesForView`/`nearestCities` + tests.
4. **Multi-body rendering** — `BodySurface.tsx` (textured + procedural Sun + parameterised atmosphere), globe generalised to any body.
5. **Solar system + navigation** — `SolarSystemView.tsx`, `BodySwitcher.tsx`, store gains `activeBody`/`viewMode`/per-body cameras/`hiddenOverrides`, plus the zoom-out handoff.
6. **Privacy toggle + panel adaptations** — the switch, relay disclosure, `location private` labelling, cross-body filter hint.
7. **Verification** — build/test/lint, Playwright over travel both ways, border and label LOD, all four bodies, the privacy toggle, per-body cameras and cross-body filters; update `docs/nan/DISCOVERY_TEST_CHECKLIST.md`.

## Notes from Implementation

- `MAX_CAMERA_DISTANCE` was lowered from 4 to 3.4: from the landing zoom, reaching the old ceiling took ~22 wheel clicks before the "leave orbit" gesture could even arm. 3.4 still fits the whole body in a 40° fov.
- The zoom-out handoff can only be detected as an *attempt* (OrbitControls clamps at the ceiling), so it listens for two consecutive zoom-out ticks while parked at maximum distance — one overshoot shouldn't launch you into space.
- `drei`'s `Html` wrapper must not carry `opacity: 0`: the inner node is what the per-frame fade drives, and a zero on the wrapper overrides it permanently.
