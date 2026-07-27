import { sunSpiralPlacement } from './bodies'
import type { BodyId, DiscoveryChannel, DiscoveryCluster } from './types'

/** channels per privacy pocket on the Sun — the surface has no geography, so
 * hidden streamers are grouped only so the card burst has something to show */
export const SUN_GROUP_SIZE = 4

/** how far channels sit from their pocket centre, in degrees */
const SUN_RING_DEGREES = 3.2

const wrapLng = (lng: number) => ((((lng + 180) % 360) + 360) % 360) - 180
const clampLat = (lat: number) => Math.max(-89.5, Math.min(89.5, lat))

/**
 * Is this channel showing on the Sun? The seeded flag is the default; a UI
 * toggle can override it either way, which is what makes "hide my location" a
 * live, reversible demo rather than a fixed dataset.
 */
export function isLocationHidden(channel: DiscoveryChannel, overrides: Record<string, boolean>): boolean {
  return overrides[channel.id] ?? channel.location_hidden
}

const totals = (channels: DiscoveryChannel[]) => channels.reduce((sum, ch) => sum + ch.viewers, 0)

/**
 * Project the catalog onto one body.
 *
 * Earth/Moon/Mars: their own clusters, minus anyone currently hiding.
 * Sun: derived — every hidden channel from anywhere, regrouped into privacy
 * pockets with positions from a deterministic spiral. Nothing is mutated; the
 * Sun's channels are copies carrying solar coordinates, so a channel can move
 * back to its real location the moment the toggle flips.
 */
export function clustersForBody(
  clusters: DiscoveryCluster[],
  body: BodyId,
  overrides: Record<string, boolean> = {},
): DiscoveryCluster[] {
  if (body === 'sun') {
    // stable order regardless of which clusters they came from, so the layout
    // doesn't reshuffle when one channel toggles
    const hidden = clusters
      .flatMap((c) => c.channels)
      .filter((ch) => isLocationHidden(ch, overrides))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

    if (hidden.length === 0) return []

    const pockets = Math.ceil(hidden.length / SUN_GROUP_SIZE)
    return Array.from({ length: pockets }, (_, gi) => {
      const seat = sunSpiralPlacement(gi, pockets)
      const members = hidden.slice(gi * SUN_GROUP_SIZE, (gi + 1) * SUN_GROUP_SIZE)
      const channels = members.map((ch, i) => {
        const angle = (i / members.length) * Math.PI * 2
        return {
          ...ch,
          lat: clampLat(seat.lat + SUN_RING_DEGREES * Math.cos(angle)),
          lng: wrapLng(seat.lng + SUN_RING_DEGREES * Math.sin(angle)),
        }
      })
      return {
        id: `sun-pocket-${gi}`,
        // no geography on the Sun — the popover shows this instead of a city
        city: 'Private',
        country: 'location hidden',
        body: 'sun' as const,
        lat: seat.lat,
        lng: seat.lng,
        channels,
        totalViewers: totals(channels),
      }
    })
  }

  const result: DiscoveryCluster[] = []
  for (const cluster of clusters) {
    if (cluster.body !== body) continue
    const channels = cluster.channels.filter((ch) => !isLocationHidden(ch, overrides))
    if (channels.length === 0) continue
    // identity-preserving when nobody in this cluster is hiding, so memoized
    // consumers downstream don't churn
    result.push(channels.length === cluster.channels.length ? cluster : { ...cluster, channels, totalViewers: totals(channels) })
  }
  return result
}

/**
 * What a hovered hotspot actually stands for. A cluster dot represents the whole
 * city; once clusters have expanded at near zoom, each dot is a single channel,
 * so listing its siblings would misrepresent what you're pointing at.
 * Falls back to the whole cluster if the channel has since been filtered away.
 */
export function channelsForFocus(cluster: DiscoveryCluster, focusedChannelId: string | null): DiscoveryChannel[] {
  if (!focusedChannelId) return cluster.channels
  const one = cluster.channels.find((ch) => ch.id === focusedChannelId)
  return one ? [one] : cluster.channels
}

/** live channel count per body, for the switcher badges and system view */
export function channelCountsByBody(
  clusters: DiscoveryCluster[],
  overrides: Record<string, boolean> = {},
): Record<BodyId, number> {
  const counts: Record<BodyId, number> = { earth: 0, moon: 0, mars: 0, sun: 0 }
  for (const cluster of clusters) {
    for (const ch of cluster.channels) {
      if (isLocationHidden(ch, overrides)) counts.sun++
      else counts[cluster.body]++
    }
  }
  return counts
}
