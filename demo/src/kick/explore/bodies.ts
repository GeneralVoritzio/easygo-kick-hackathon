import type { BodyId, CelestialBody, SystemPlacement } from "./types";

export const BODIES: Record<BodyId, CelestialBody> = {
  earth: {
    id: "earth",
    name: "Earth",
    tagline: "everyone broadcasting from the ground",
    texture: "earth-dark",
    // The shipped texture is very dark, so lift it above the black backdrop.
    surfaceTint: [1.7, 1.75, 1.7],
    systemTint: [3.4, 3.6, 3.4],
    accent: "#53fc18",
    atmosphere: "#3ddf12",
    hasVectorBorders: true,
    hotspotStyle: "solid",
    emptyLabel: "nobody live in view, zoom out or clear a filter",
  },
  moon: {
    id: "moon",
    name: "Moon",
    tagline: "relay channels pointed at the lunar surface",
    texture: "moon",
    surfaceTint: [0.62, 0.64, 0.68],
    systemTint: [1, 1.02, 1.06],
    accent: "#c9d3dc",
    atmosphere: null,
    hasVectorBorders: false,
    // A pale surface needs a hollow dot with a dark core, or the dot vanishes.
    hotspotStyle: "outlined",
    emptyLabel: "no lunar relays match, clear a filter",
  },
  mars: {
    id: "mars",
    name: "Mars",
    tagline: "relay channels pointed at the martian surface",
    texture: "mars",
    surfaceTint: [0.78, 0.6, 0.5],
    systemTint: [1.05, 0.82, 0.7],
    accent: "#e07a4a",
    atmosphere: "#c2603a",
    hasVectorBorders: false,
    hotspotStyle: "outlined",
    emptyLabel: "no martian relays match, clear a filter",
  },
  sun: {
    id: "sun",
    name: "The Sun",
    tagline: "streamers who keep their location private",
    // Procedural: the texture is only a base layer under animated turbulence.
    texture: "sun",
    surfaceTint: [1.5, 1.05, 0.55],
    accent: "#f5a623",
    atmosphere: "#ff9b1f",
    hasVectorBorders: false,
    hotspotStyle: "outlined",
    emptyLabel: "nobody is hiding right now",
  },
};

export const BODY_ORDER: BodyId[] = ["earth", "moon", "mars", "sun"];

// The distances and the sizes are compressed on purpose. At true scale the Sun swallows the
// viewport and Mars is a few pixels. The angles are fixed, so the layout is stable to click.
const PLACEMENTS: Record<BodyId, SystemPlacement> = {
  sun: { orbitRadius: 0, angleDeg: 0, displayScale: 1.15 },
  earth: { orbitRadius: 3.2, angleDeg: -28, displayScale: 0.7 },
  // The Moon shares Earth's orbit, nudged far enough along it that the two discs and their labels
  // never overlap.
  moon: {
    orbitRadius: 3.2,
    angleDeg: -28,
    displayScale: 0.26,
    satelliteOf: "earth",
    satelliteOffset: [1.25, 0.55],
  },
  // Mars sits on the far side of the Sun from Earth. Earth carries the Moon, so both of them are on
  // one side, and a Mars on the same side leaves half the view empty.
  mars: { orbitRadius: 5.2, angleDeg: 134, displayScale: 0.52 },
};

export function systemPosition(id: BodyId): [number, number, number] {
  const p = PLACEMENTS[id];
  if (p.satelliteOf && p.satelliteOffset) {
    const host = systemPosition(p.satelliteOf);
    return [host[0] + p.satelliteOffset[0], host[1] + p.satelliteOffset[1], host[2]];
  }
  const rad = (p.angleDeg * Math.PI) / 180;
  return [Math.cos(rad) * p.orbitRadius, Math.sin(rad) * p.orbitRadius * 0.42, 0];
}

export function systemPlacement(id: BodyId): SystemPlacement {
  return PLACEMENTS[id];
}

export function orbitRings(): number[] {
  const radii = BODY_ORDER.map((id) => PLACEMENTS[id])
    .filter((p) => !p.satelliteOf && p.orbitRadius > 0)
    .map((p) => p.orbitRadius);
  return [...new Set(radii)].sort((a, b) => a - b);
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const RAD2DEG = 180 / Math.PI;

// The Sun has no geography, so a hidden channel is placed by index on a Fibonacci lattice. The same
// input always gives the same layout, so every demo run looks identical.
export function sunSpiralPlacement(index: number, total: number): { lat: number; lng: number } {
  if (total <= 1) return { lat: 0, lng: 0 };
  // Stay off the exact poles. They read as crowded and they clip the pin geometry.
  const y = 1 - ((index + 0.5) / total) * 2;
  const clampedY = Math.max(-0.92, Math.min(0.92, y));
  const radius = Math.sqrt(Math.max(0, 1 - clampedY * clampedY));
  const theta = GOLDEN_ANGLE * index;
  const x = Math.cos(theta) * radius;
  const z = Math.sin(theta) * radius;
  return {
    lat: Math.asin(clampedY) * RAD2DEG,
    // The inverse of latLngToVector3, where x = cos(lng) sin(theta) and z = -sin(lng) sin(theta).
    lng: Math.atan2(-z, x) * RAD2DEG,
  };
}
