import type { InteractionBadgeKey } from '../engine/ack'

/** Interaction-engine profile for a discovery channel — seeded mock stats in
 * the same shape the live engine measures ("1 in N" response odds + badges). */
export type ChannelInteraction = {
  /** response odds denominator: "1 in N" — lower is more responsive */
  oddsDenominator: number
  badges: InteractionBadgeKey[]
}

export type BodyId = 'earth' | 'moon' | 'mars' | 'sun'

/**
 * Where a channel actually is. The Sun is never a home: it is a *view* over
 * everyone whose location is hidden, derived at render time — which is what
 * makes the privacy toggle reversible in both directions.
 */
export type HomeBody = 'earth' | 'moon' | 'mars'

/** `body` = one celestial body fills the viewport; `system` = the solar-system
 * overview you reach by pulling the camera back past the zoom ceiling. */
export type ViewMode = 'body' | 'system'

export type SystemPlacement = {
  orbitRadius: number
  angleDeg: number
  /** compressed, legibility-first size — not physical scale */
  displayScale: number
  satelliteOf?: BodyId
  /** [along-orbit, vertical] nudge from the host body, when a satellite */
  satelliteOffset?: [number, number]
}

export type CelestialBody = {
  id: BodyId
  name: string
  tagline: string
  texture: string
  /** RGB multiplier on the texture; >1 brightens (values are legal on Color) */
  surfaceTint: [number, number, number]
  /** override tint for the solar-system view, where the body is small and needs
   * more lift to read against black; defaults to `surfaceTint` */
  systemTint?: [number, number, number]
  accent: string
  atmosphere: string | null
  hasVectorBorders: boolean
  /** `solid` on dark surfaces, `outlined` on pale ones (Moon/Mars/Sun) */
  hotspotStyle: 'solid' | 'outlined'
  emptyLabel: string
}

/** A Kick channel relaying published agency imagery. These are ordinary Kick
 * channels run by space enthusiasts — **not** an official agency broadcast, and
 * not a capability we claim the API provides. */
export type RelaySource = {
  agency: string
  instrument: string
}

/** A single live channel plotted on a body. Coordinates are mock demo data —
 * they position the hotspot, they do not claim the streamer's physical location. */
export type DiscoveryChannel = {
  id: string
  /** display name, also the key into SIM_CHANNEL_STATS for odds/badges */
  name: string
  kickSlug: string
  category: string
  /** broadcast language, Kick-style native display name (e.g. "Español") */
  language: string
  viewers: number
  /** the body this channel actually broadcasts from (never 'sun') */
  body: HomeBody
  /** true → the streamer keeps their location private, so they show on the Sun
   * and no city/country is ever displayed for them */
  location_hidden: boolean
  relay?: RelaySource
  lat: number
  lng: number
  /** poster shown before (and behind) any live preview */
  thumbnail: {
    /** picsum seed for the static "stream screenshot" placeholder */
    seed: string
    /** offline fallback + avatar backdrop, same format as the browse grid */
    gradient: string
    initials: string
  }
  /** true → hovering the card may mount a real Kick iframe for this slug */
  embeddable: boolean
  interaction: ChannelInteraction
}

export type ViewerTier = 'small' | 'mid' | 'large'

/** Active Discovery filters — null/empty means "no restriction" on that axis.
 * Badge selection is AND semantics: a channel must carry every chosen badge. */
export type DiscoveryFilters = {
  category: string | null
  language: string | null
  badges: InteractionBadgeKey[]
  viewerTier: ViewerTier | null
}

/** A city/region aggregation point — one green dot at far/mid zoom that
 * expands into its 3–5 channels when the camera gets close. */
export type DiscoveryCluster = {
  id: string
  city: string
  country: string
  /** 'sun' only on the derived privacy pockets, never in the seeded catalog */
  body: BodyId
  lat: number
  lng: number
  channels: DiscoveryChannel[]
  totalViewers: number
}

/** Camera-distance bands driving hotspot density (see geo.ts). */
export type ZoomBand = 'far' | 'mid' | 'near'

/** One renderable hotspot: a whole cluster at far/mid zoom, or a single
 * channel once the cluster has expanded at near zoom. */
export type GlobePoint = {
  key: string
  clusterId: string
  channelId?: string
  lat: number
  lng: number
  /** viewer count backing this point — scales dot size/glow */
  weight: number
}

/** packed polylines from `scripts/build-geo.mjs`: segment lengths alongside a
 * flat [lat, lng, lat, lng, …] coordinate run */
export type PackedLines = {
  lengths: number[]
  coords: number[]
}

export type CityPoint = {
  name: string
  lat: number
  lng: number
  pop: number
}

export type GeoStatus = 'idle' | 'locating' | 'granted' | 'denied'

export type DiscoveryOrigin = {
  lat: number
  lng: number
  label: string
  /** true when this is the clearly-labelled default region, not the user's position */
  isFallback: boolean
}

export type SavedCamera = {
  position: [number, number, number]
  target: [number, number, number]
}
