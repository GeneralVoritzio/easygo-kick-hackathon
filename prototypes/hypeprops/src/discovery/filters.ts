import type { DiscoveryChannel, DiscoveryCluster, DiscoveryFilters, ViewerTier } from './types'

export const EMPTY_FILTERS: DiscoveryFilters = { category: null, language: null, badges: [], viewerTier: null }

export const VIEWER_TIERS: Record<ViewerTier, { label: string; min: number; max: number }> = {
  small: { label: '< 500', min: 0, max: 499 },
  mid: { label: '500–2k', min: 500, max: 1999 },
  large: { label: '2k+', min: 2000, max: Infinity },
}

export function hasActiveFilters(filters: DiscoveryFilters): boolean {
  return filters.category !== null || filters.language !== null || filters.badges.length > 0 || filters.viewerTier !== null
}

export function channelMatchesFilters(channel: DiscoveryChannel, filters: DiscoveryFilters): boolean {
  if (filters.category && channel.category !== filters.category) return false
  if (filters.language && channel.language !== filters.language) return false
  // AND semantics — every chosen badge must be present
  if (filters.badges.some((badge) => !channel.interaction.badges.includes(badge))) return false
  if (filters.viewerTier) {
    const tier = VIEWER_TIERS[filters.viewerTier]
    if (channel.viewers < tier.min || channel.viewers > tier.max) return false
  }
  return true
}

/**
 * Project the catalog through the active filters: clusters keep only matching
 * channels (with viewer totals recomputed) and clusters left empty disappear
 * from the globe entirely. Identity-preserving when nothing is active, so
 * memoized consumers don't churn.
 */
export function applyDiscoveryFilters(clusters: DiscoveryCluster[], filters: DiscoveryFilters): DiscoveryCluster[] {
  if (!hasActiveFilters(filters)) return clusters
  const result: DiscoveryCluster[] = []
  for (const cluster of clusters) {
    const channels = cluster.channels.filter((ch) => channelMatchesFilters(ch, filters))
    if (channels.length === 0) continue
    result.push({ ...cluster, channels, totalViewers: channels.reduce((sum, ch) => sum + ch.viewers, 0) })
  }
  return result
}
