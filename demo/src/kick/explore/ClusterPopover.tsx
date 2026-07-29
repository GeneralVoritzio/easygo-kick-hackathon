import { useEffect, useState } from "react";
import { ClusterStreamCard } from "./ClusterStreamCard";
import { useExplore } from "./exploreStore";
import type { ExploreChannel, ExploreCluster } from "./types";

const MAX_CARDS = 5;
const CARD_WIDTH = 186;

type Props = {
  cluster: ExploreCluster;
  // Exactly what this hotspot stands for: the whole city at cluster zoom, or the one channel whose
  // own dot the pointer is on at near zoom.
  channels: ExploreChannel[];
  onPointerStay: () => void;
  onPointerAway: () => void;
};

// The channel cards burst radially from the hovered hotspot, each on an ellipse with a connector
// line back to the centre. The wrapper is pointer transparent, so the globe stays draggable between
// the cards.
export function ClusterPopover({ cluster, channels: source, onPointerStay, onPointerAway }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const setSelectedChannel = useExplore((s) => s.setSelectedChannel);

  // A different hotspot means a fresh stack, so do not carry a stale hover across.
  useEffect(() => setHoveredId(null), [cluster.id, source]);

  const channels = source.slice(0, MAX_CARDS);
  const count = channels.length;

  // An elliptical spread, because the cards are wide. The first card sits at 12 o'clock.
  const rx = count <= 3 ? 180 : 225;
  const ry = count <= 3 ? 135 : 165;
  const spots = channels.map((_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / count;
    return { x: rx * Math.cos(angle), y: ry * Math.sin(angle) };
  });

  const svgW = rx * 2 + CARD_WIDTH;
  const svgH = ry * 2 + CARD_WIDTH;

  return (
    <div
      className="pointer-events-none relative text-primary-base"
      onMouseOver={onPointerStay}
      onMouseMove={onPointerStay}
      onMouseLeave={onPointerAway}
      // OrbitControls listens on the shared canvas container, so a press on a card would bubble up
      // as a grab and fold the popover away, which swallows the click.
      onPointerDown={(e) => e.stopPropagation()}
      // A scroll over a card means "get out of my way", so fold the burst up and let the next wheel
      // tick zoom the globe.
      onWheel={() => useExplore.getState().setFocusedCluster(null)}
    >
      {/* The hit shield gives the gaps between the cards to the popover. Without it, crossing a gap
          hovers an unrelated dot underneath and yanks the burst to another cluster. */}
      <div
        className="pointer-events-auto absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
        style={{ width: svgW, height: svgH }}
        onClick={() => useExplore.getState().setFocusedCluster(null)}
      />

      <svg
        width={svgW}
        height={svgH}
        viewBox={`${-svgW / 2} ${-svgH / 2} ${svgW} ${svgH}`}
        className="pointer-events-none absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        {spots.map((p, i) => (
          <line
            key={channels[i].id}
            x1={0}
            y1={0}
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            strokeOpacity={0.45}
          />
        ))}
        <circle r={4} fill="currentColor" />
      </svg>

      <div className="pointer-events-auto absolute left-0 top-0 -translate-x-1/2 translate-y-3 whitespace-nowrap rounded-full border border-outline-decorative bg-surface-base/95 px-2.5 py-1 shadow-lg backdrop-blur-sm">
        <span className="text-xs font-bold text-white">{cluster.city}</span>
        {/* A Sun pocket's country is the privacy note, not a place. */}
        <span
          className={`ml-1 text-[11px] text-surface-onSurfaceSecondary ${
            cluster.body === "sun" ? "italic" : ""
          }`}
        >
          {cluster.country}
        </span>
        <span className="ml-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-base">
          <span className="h-1.5 w-1.5 animate-pulse-fast rounded-full bg-primary-base" />
          {count} live
        </span>
      </div>

      {channels.map((channel, i) => (
        <div
          key={channel.id}
          className="pointer-events-auto absolute"
          style={{
            left: spots[i].x,
            top: spots[i].y,
            width: CARD_WIDTH,
            transform: "translate(-50%, -50%)",
            zIndex: hoveredId === channel.id ? 10 : undefined,
          }}
        >
          {/* The entrance animation sits on this inner div, so its transform never fights the
              positioning translate above it or the card's own hover scale. */}
          <div className="animate-pop" style={{ animationDelay: `${i * 45}ms` }}>
            <ClusterStreamCard
              channel={channel}
              hovered={hoveredId === channel.id}
              onHoverStart={() => setHoveredId(channel.id)}
              onHoverEnd={() => setHoveredId((id) => (id === channel.id ? null : id))}
              onSelect={() => setSelectedChannel(channel.id)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
