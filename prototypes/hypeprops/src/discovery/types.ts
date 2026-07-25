import type { InteractionBadgeKey } from '../engine/ack'

/** Interaction-engine profile for a discovery channel — seeded mock stats in
 * the same shape the live engine measures ("1 in N" response odds + badges). */
export type ChannelInteraction = {
  /** response odds denominator: "1 in N" — lower is more responsive */
  oddsDenominator: number
  badges: InteractionBadgeKey[]
}

/** A single live channel plotted on the globe. Coordinates are mock demo data —
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
