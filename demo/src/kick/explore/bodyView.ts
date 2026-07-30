import { sunSpiralPlacement } from "./bodies";
import type { BodyId, ExploreChannel, ExploreCluster } from "./types";

// The Sun has no geography, so a hidden streamer joins a pocket only to give the card burst
// something to show.
export const SUN_GROUP_SIZE = 4;

// The seeded flag is the default, and a UI toggle can override it either way, which is what makes
// "hide my location" a live and reversible demo instead of a fixed dataset.
export function isLocationHidden(
  channel: ExploreChannel,
  overrides: Record<string, boolean>,
): boolean {
  return overrides[channel.id] ?? channel.location_hidden;
}

const totals = (channels: ExploreChannel[]) =>
  channels.reduce((sum, ch) => sum + ch.stream.viewer_count, 0);

// Earth, the Moon and Mars keep their own clusters, minus anyone who hides. The Sun is derived: it
// regroups every hidden channel into privacy pockets on a deterministic spiral. Nothing is mutated,
// so a channel returns to its real location the moment the toggle flips.
export function clustersForBody(
  clusters: ExploreCluster[],
  body: BodyId,
  overrides: Record<string, boolean> = {},
): ExploreCluster[] {
  if (body === "sun") {
    // A stable order, so the layout does not reshuffle when one channel toggles.
    const hidden = clusters
      .flatMap((c) => c.channels)
      .filter((ch) => isLocationHidden(ch, overrides))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    if (hidden.length === 0) return [];

    const pockets = Math.ceil(hidden.length / SUN_GROUP_SIZE);
    return Array.from({ length: pockets }, (_, gi) => {
      const seat = sunSpiralPlacement(gi, pockets);
      const channels = hidden.slice(gi * SUN_GROUP_SIZE, (gi + 1) * SUN_GROUP_SIZE);
      return {
        id: `sun-pocket-${gi}`,
        place: "Private",
        region: "location hidden",
        body: "sun" as const,
        lat: seat.lat,
        lng: seat.lng,
        channels,
        total_viewer_count: totals(channels),
      };
    });
  }

  const result: ExploreCluster[] = [];
  for (const cluster of clusters) {
    if (cluster.body !== body) continue;
    const channels = cluster.channels.filter((ch) => !isLocationHidden(ch, overrides));
    if (channels.length === 0) continue;
    // Identity preserving when nobody in this cluster hides, so the memoized consumers downstream
    // do not churn.
    result.push(
      channels.length === cluster.channels.length
        ? cluster
        : { ...cluster, channels, total_viewer_count: totals(channels) },
    );
  }
  return result;
}

export function channelCountsByBody(
  clusters: ExploreCluster[],
  overrides: Record<string, boolean> = {},
): Record<BodyId, number> {
  const counts: Record<BodyId, number> = { earth: 0, moon: 0, mars: 0, sun: 0 };
  for (const cluster of clusters) {
    for (const ch of cluster.channels) {
      if (isLocationHidden(ch, overrides)) counts.sun++;
      else counts[cluster.body]++;
    }
  }
  return counts;
}
