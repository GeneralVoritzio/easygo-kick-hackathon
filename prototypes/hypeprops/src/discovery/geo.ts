import type { CityPoint, DiscoveryCluster, GlobePoint, ZoomBand } from './types'

/** globe mesh radius — everything else (camera limits, point offsets) is relative to it */
export const GLOBE_RADIUS = 1

/** camera distance the intro flight settles at — lands in the 'mid' band so the
 * first screen shows every cluster (~72 hotspots per the discovery plan) */
export const INITIAL_CAMERA_DISTANCE = 2.2
export const MIN_CAMERA_DISTANCE = 1.25
/** zoom ceiling. Sized so the whole body still fits a 40° fov (needs > ~2.9)
 * while keeping the "keep zooming out to leave orbit" gesture within a single
 * trackpad flick rather than twenty-odd wheel clicks. */
export const MAX_CAMERA_DISTANCE = 3.4

/** band edges, as camera distance from globe center */
export const NEAR_BAND_MAX = 1.7
export const MID_BAND_MAX = 2.9

/** at far zoom only the busiest clusters stay lit */
export const FAR_CLUSTER_CAP = 48

const DEG2RAD = Math.PI / 180

/**
 * Lat/lng → point on the sphere, matching three.js SphereGeometry UV layout so
 * dots land on the correct spot of an equirectangular texture:
 * lat 90 → +Y, (0°, 0°) → +X, 90°E → −Z.
 */
export function latLngToVector3(lat: number, lng: number, radius = GLOBE_RADIUS): [number, number, number] {
  const theta = (90 - lat) * DEG2RAD
  return [
    radius * Math.cos(lng * DEG2RAD) * Math.sin(theta),
    radius * Math.cos(theta),
    -radius * Math.sin(lng * DEG2RAD) * Math.sin(theta),
  ]
}

/**
 * World-space hotspot scale for a camera distance. Dots keep a roughly
 * constant *screen* size: zooming in shrinks their world size, so the denser
 * near-zoom points separate instead of merging into one unpickable blob.
 * 1.0 at the landing distance; clamped so extremes stay visible/clickable.
 */
export function pointScaleForDistance(distance: number): number {
  const scale = (distance - GLOBE_RADIUS) / (INITIAL_CAMERA_DISTANCE - GLOBE_RADIUS)
  return Math.min(1.4, Math.max(0.22, scale))
}

export function zoomBandForDistance(distance: number): ZoomBand {
  if (distance < NEAR_BAND_MAX) return 'near'
  if (distance < MID_BAND_MAX) return 'mid'
  return 'far'
}

/** which border datasets to draw at a zoom band — coarse far out, then the fine
 * outlines, then state/province lines only once you're close enough to read them */
export function bordersForBand(band: ZoomBand): ('countries-coarse' | 'countries-fine' | 'admin1')[] {
  if (band === 'far') return ['countries-coarse']
  if (band === 'mid') return ['countries-fine']
  return ['countries-fine', 'admin1']
}

/**
 * Candidate pool for city labels: the band gate plus a global population cut.
 * This is only the *shortlist* — `nearestCities` then picks what's actually in
 * view, so the DOM stays small while regional coverage stays dense.
 */
export const CITY_CANDIDATE_CAP = 400

export function citiesForView(cities: CityPoint[], band: ZoomBand, cap = CITY_CANDIDATE_CAP): CityPoint[] {
  if (band !== 'near') return []
  // the dataset is pre-sorted biggest-population-first by build-geo.mjs
  return cities.slice(0, cap)
}

/** how many labels are ever in the DOM at once */
export const CITY_LABEL_CAP = 44

/**
 * The cities worth labelling for a given view direction: those on the facing
 * hemisphere, ranked by how centred they are and how big they are. Without
 * this, a global top-N leaves whole continents with one label on them.
 * `viewDir` is the camera's direction from the body's centre (unit length).
 */
export function nearestCities(
  cities: CityPoint[],
  viewDir: [number, number, number],
  cap = CITY_LABEL_CAP,
): CityPoint[] {
  const scored: { city: CityPoint; score: number }[] = []
  for (const city of cities) {
    const [x, y, z] = latLngToVector3(city.lat, city.lng, 1)
    const facing = viewDir[0] * x + viewDir[1] * y + viewDir[2] * z
    // behind the limb: never a candidate
    if (facing <= 0.3) continue
    // centredness dominates; population only breaks ties between neighbours
    scored.push({ city, score: facing * 4 + Math.log10(Math.max(10, city.pop)) })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, cap).map((s) => s.city)
}

/**
 * Camera distance → which hotspots render. Far: top clusters by viewers.
 * Mid (the landing zoom): every cluster. Near: clusters expand into their
 * individual channels. Pure — unit tested in geo.test.ts.
 */
export function selectVisiblePoints(clusters: DiscoveryCluster[], distance: number): GlobePoint[] {
  const band = zoomBandForDistance(distance)

  if (band === 'near') {
    return clusters.flatMap((cluster) =>
      cluster.channels.map((ch) => ({
        key: ch.id,
        clusterId: cluster.id,
        channelId: ch.id,
        lat: ch.lat,
        lng: ch.lng,
        weight: ch.viewers,
      })),
    )
  }

  const asPoint = (c: DiscoveryCluster): GlobePoint => ({
    key: c.id,
    clusterId: c.id,
    lat: c.lat,
    lng: c.lng,
    weight: c.totalViewers,
  })

  if (band === 'mid') return clusters.map(asPoint)

  return [...clusters]
    .sort((a, b) => b.totalViewers - a.totalViewers)
    .slice(0, FAR_CLUSTER_CAP)
    .map(asPoint)
}
