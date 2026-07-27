import type { BodyId, CelestialBody, SystemPlacement } from './types'

/**
 * The four bodies Discovery can explore. Earth is the ground truth; the Moon
 * and Mars carry Kick channels relaying published agency imagery; the Sun is
 * where streamers who keep their location private are shown.
 */
export const BODIES: Record<BodyId, CelestialBody> = {
  earth: {
    id: 'earth',
    name: 'Earth',
    tagline: "everyone broadcasting from the ground",
    texture: '/textures/earth-dark.jpg',
    /** the shipped texture is very dark — lift it above the black backdrop */
    surfaceTint: [1.7, 1.75, 1.7],
    systemTint: [3.4, 3.6, 3.4],
    accent: '#53fc18',
    atmosphere: '#3ddf12',
    hasVectorBorders: true,
    /** dark surface → solid green dots read fine */
    hotspotStyle: 'solid',
    emptyLabel: 'nobody live in view — zoom out or clear a filter',
  },
  moon: {
    id: 'moon',
    name: 'Moon',
    tagline: 'relay channels pointed at the lunar surface',
    texture: '/textures/moon.jpg',
    surfaceTint: [0.62, 0.64, 0.68],
    systemTint: [1, 1.02, 1.06],
    accent: '#c9d3dc',
    atmosphere: null,
    hasVectorBorders: false,
    /** pale surface → hollow dots with a dark core, or they vanish */
    hotspotStyle: 'outlined',
    emptyLabel: 'no lunar relays match — clear a filter',
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    tagline: 'relay channels pointed at the martian surface',
    texture: '/textures/mars.jpg',
    surfaceTint: [0.78, 0.6, 0.5],
    systemTint: [1.05, 0.82, 0.7],
    accent: '#e07a4a',
    atmosphere: '#c2603a',
    hasVectorBorders: false,
    hotspotStyle: 'outlined',
    emptyLabel: 'no martian relays match — clear a filter',
  },
  sun: {
    id: 'sun',
    name: 'The Sun',
    tagline: 'streamers who keep their location private',
    /** procedural: the texture is only a base layer under animated turbulence */
    texture: '/textures/sun.jpg',
    surfaceTint: [1.5, 1.05, 0.55],
    accent: '#f5a623',
    atmosphere: '#ff9b1f',
    hasVectorBorders: false,
    hotspotStyle: 'outlined',
    emptyLabel: 'nobody is hiding right now',
  },
}

export const BODY_ORDER: BodyId[] = ['earth', 'moon', 'mars', 'sun']

/**
 * Solar-system layout. Distances and sizes are **deliberately compressed** —
 * at true scale the Sun would swallow the viewport and Mars would be a few
 * pixels. The view says so out loud rather than implying astronomical accuracy.
 * Angles are fixed (no orbital mechanics) so the layout is stable to click.
 */
const PLACEMENTS: Record<BodyId, SystemPlacement> = {
  sun: { orbitRadius: 0, angleDeg: 0, displayScale: 1.15 },
  earth: { orbitRadius: 3.2, angleDeg: -28, displayScale: 0.7 },
  // shown as Earth's satellite: same orbit, nudged far enough along it that the
  // two discs and their labels never overlap
  moon: { orbitRadius: 3.2, angleDeg: -28, displayScale: 0.26, satelliteOf: 'earth', satelliteOffset: [1.25, 0.55] },
  mars: { orbitRadius: 5.2, angleDeg: 46, displayScale: 0.52 },
}

/** where a body sits in the system view, in scene units on the XZ-ish plane */
export function systemPosition(id: BodyId): [number, number, number] {
  const p = PLACEMENTS[id]
  if (p.satelliteOf && p.satelliteOffset) {
    const host = systemPosition(p.satelliteOf)
    return [host[0] + p.satelliteOffset[0], host[1] + p.satelliteOffset[1], host[2]]
  }
  const rad = (p.angleDeg * Math.PI) / 180
  return [Math.cos(rad) * p.orbitRadius, Math.sin(rad) * p.orbitRadius * 0.42, 0]
}

export function systemPlacement(id: BodyId): SystemPlacement {
  return PLACEMENTS[id]
}

/** distinct orbit radii that get a guide ring drawn (satellites share a host's) */
export function orbitRings(): number[] {
  const radii = BODY_ORDER.map((id) => PLACEMENTS[id]).filter((p) => !p.satelliteOf && p.orbitRadius > 0).map((p) => p.orbitRadius)
  return [...new Set(radii)].sort((a, b) => a - b)
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const RAD2DEG = 180 / Math.PI

/**
 * Deterministic even spread over a sphere (Fibonacci lattice) — the Sun has no
 * geography, so hidden-location channels are placed by index instead. Same
 * input always gives the same layout, so every demo run looks identical.
 */
export function sunSpiralPlacement(index: number, total: number): { lat: number; lng: number } {
  if (total <= 1) return { lat: 0, lng: 0 }
  // stay off the exact poles: they read as crowded and clip the pin geometry
  const y = 1 - ((index + 0.5) / total) * 2
  const clampedY = Math.max(-0.92, Math.min(0.92, y))
  const radius = Math.sqrt(Math.max(0, 1 - clampedY * clampedY))
  const theta = GOLDEN_ANGLE * index
  const x = Math.cos(theta) * radius
  const z = Math.sin(theta) * radius
  return {
    lat: Math.asin(clampedY) * RAD2DEG,
    // inverse of latLngToVector3: x = cos(lng)·sinθ, z = −sin(lng)·sinθ
    lng: Math.atan2(-z, x) * RAD2DEG,
  }
}
