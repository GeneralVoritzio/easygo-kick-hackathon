import type { ExploreChannel, ExploreCluster, ExploreFilters, ViewerTier } from "./types";

export const EMPTY_FILTERS: ExploreFilters = {
  category: null,
  language: null,
  badges: [],
  viewerTier: null,
};

export const VIEWER_TIERS: Record<ViewerTier, { label: string; min: number; max: number }> = {
  small: { label: "under 500", min: 0, max: 499 },
  mid: { label: "500 to 2K", min: 500, max: 1999 },
  large: { label: "2K and up", min: 2000, max: Infinity },
};

export function hasActiveFilters(filters: ExploreFilters): boolean {
  return (
    filters.category !== null ||
    filters.language !== null ||
    filters.badges.length > 0 ||
    filters.viewerTier !== null
  );
}

export function channelMatchesFilters(channel: ExploreChannel, filters: ExploreFilters): boolean {
  if (filters.category && channel.stream.category.name !== filters.category) return false;
  if (filters.language && channel.stream.language !== filters.language) return false;
  // AND semantics: every chosen badge must be present.
  if (filters.badges.some((badge) => !channel.interaction.badges.includes(badge))) return false;
  if (filters.viewerTier) {
    const tier = VIEWER_TIERS[filters.viewerTier];
    if (channel.stream.viewer_count < tier.min || channel.stream.viewer_count > tier.max) {
      return false;
    }
  }
  return true;
}

// A cluster keeps only its matching channels, and a cluster left empty leaves the globe. Identity
// preserving when nothing is active, so the memoized consumers do not churn.
export function applyExploreFilters(
  clusters: ExploreCluster[],
  filters: ExploreFilters,
): ExploreCluster[] {
  if (!hasActiveFilters(filters)) return clusters;
  const result: ExploreCluster[] = [];
  for (const cluster of clusters) {
    const channels = cluster.channels.filter((ch) => channelMatchesFilters(ch, filters));
    if (channels.length === 0) continue;
    result.push({
      ...cluster,
      channels,
      total_viewer_count: channels.reduce((sum, ch) => sum + ch.stream.viewer_count, 0),
    });
  }
  return result;
}
