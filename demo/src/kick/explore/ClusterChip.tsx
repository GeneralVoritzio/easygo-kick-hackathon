import type { ExploreCluster } from "./types";

// What a hovered country says about itself. It is pointer transparent on purpose: the globe stays
// draggable underneath, and the click that opens the channel list lands on the hotspot, not on this.
export function ClusterChip({ cluster }: { cluster: ExploreCluster }) {
  return (
    <div className="pointer-events-none -translate-x-1/2 translate-y-3 whitespace-nowrap rounded-full border border-outline-decorative bg-surface-base/95 px-2.5 py-1 shadow-lg backdrop-blur-sm">
      <span className="text-xs font-bold text-white">{cluster.place}</span>
      {/* A Sun pocket's region is the privacy note, not a place. */}
      <span
        className={`ml-1 text-[11px] text-surface-onSurfaceSecondary ${
          cluster.body === "sun" ? "italic" : ""
        }`}
      >
        {cluster.region}
      </span>
      <span className="ml-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-base">
        <span className="size-1.5 animate-pulse-fast rounded-full bg-primary-base" />
        {cluster.channels.length} live
      </span>
    </div>
  );
}
