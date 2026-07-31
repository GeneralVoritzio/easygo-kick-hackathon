import type { CityPoint, ExploreCluster, GlobePoint, ZoomBand } from "./types";

// The hotspot green is --color-primary-base. THREE.Color cannot read a CSS variable, so the 3D
// layers take it from here.
export const HOTSPOT_COLOR = "#53fc18";

export const GLOBE_RADIUS = 1;

// The intro flight settles in the mid band, so the first screen shows every cluster.
export const INITIAL_CAMERA_DISTANCE = 2.2;
export const MIN_CAMERA_DISTANCE = 1.25;
// The zoom ceiling. The whole body must still fit a 40 degree fov, which needs more than 2.9, and
// the "keep zooming out to leave orbit" gesture must stay inside one trackpad flick.
export const MAX_CAMERA_DISTANCE = 3.4;

export const NEAR_BAND_MAX = 1.7;
export const MID_BAND_MAX = 2.9;

const DEG2RAD = Math.PI / 180;

// Matches the three.js SphereGeometry UV layout, so a dot lands on the correct spot of an
// equirectangular texture: latitude 90 to +Y, (0, 0) to +X, 90 East to -Z.
export function latLngToVector3(
  lat: number,
  lng: number,
  radius = GLOBE_RADIUS,
): [number, number, number] {
  const theta = (90 - lat) * DEG2RAD;
  return [
    radius * Math.cos(lng * DEG2RAD) * Math.sin(theta),
    radius * Math.cos(theta),
    -radius * Math.sin(lng * DEG2RAD) * Math.sin(theta),
  ];
}

// A dot keeps a constant screen size, so zooming in shrinks its world size and the dense near zoom
// points separate instead of merging into one unpickable blob.
export function pointScaleForDistance(distance: number): number {
  const scale = (distance - GLOBE_RADIUS) / (INITIAL_CAMERA_DISTANCE - GLOBE_RADIUS);
  return Math.min(1.4, Math.max(0.22, scale));
}

export function zoomBandForDistance(distance: number): ZoomBand {
  if (distance < NEAR_BAND_MAX) return "near";
  if (distance < MID_BAND_MAX) return "mid";
  return "far";
}

export function bordersForBand(
  band: ZoomBand,
): ("countries-coarse" | "countries-fine" | "admin1")[] {
  if (band === "far") return ["countries-coarse"];
  if (band === "mid") return ["countries-fine"];
  return ["countries-fine", "admin1"];
}

export const CITY_CANDIDATE_CAP = 400;

// The shortlist only. nearestCities then picks what is actually in view, so the DOM stays small
// while regional coverage stays dense.
export function citiesForView(
  cities: CityPoint[],
  band: ZoomBand,
  hasGeography: boolean,
  cap = CITY_CANDIDATE_CAP,
): CityPoint[] {
  if (!hasGeography || band !== "near") return [];
  return cities.slice(0, cap);
}

export const CITY_LABEL_CAP = 44;

// The cities worth a label for one view direction: those on the facing hemisphere, ranked by how
// centred and how big they are. A global top N leaves whole continents with one label.
export function nearestCities(
  cities: CityPoint[],
  viewDir: [number, number, number],
  cap = CITY_LABEL_CAP,
): CityPoint[] {
  const scored: { city: CityPoint; score: number }[] = [];
  for (const city of cities) {
    const [x, y, z] = latLngToVector3(city.lat, city.lng, 1);
    const facing = viewDir[0] * x + viewDir[1] * y + viewDir[2] * z;
    if (facing <= 0.3) continue;
    scored.push({ city, score: facing * 4 + Math.log10(Math.max(10, city.pop)) });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, cap).map((s) => s.city);
}

// One dot per cluster, at every zoom. A cluster is a whole country, so there is nothing to expand
// into: the map holds no position for a single channel, and zooming in must not invent one.
export function selectVisiblePoints(clusters: ExploreCluster[]): GlobePoint[] {
  return clusters.map((c) => ({
    key: c.id,
    clusterId: c.id,
    lat: c.lat,
    lng: c.lng,
    weight: c.total_viewer_count,
  }));
}
