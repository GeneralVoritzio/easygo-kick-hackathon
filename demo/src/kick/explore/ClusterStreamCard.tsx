import { formatViewers } from "../mock/api";
import { ThumbBadge } from "../components/CardBits";
import type { ExploreChannel } from "./types";

type Props = {
  channel: ExploreChannel;
  hovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onSelect: () => void;
};

// One channel card in the cluster popover. The name stays visible in every state, and the card grows
// and glows green while the pointer is on it.
export function ClusterStreamCard({
  channel,
  hovered,
  onHoverStart,
  onHoverEnd,
  onSelect,
}: Props) {
  const { stream } = channel;

  return (
    <button
      type="button"
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      onClick={onSelect}
      className={`relative block w-full overflow-hidden rounded-lg text-left transition-all duration-200 ease-out ${
        hovered
          ? "z-10 scale-[1.15] shadow-[0_0_28px_rgba(83,252,24,0.4)] ring-2 ring-primary-base"
          : "ring-1 ring-outline-decorative"
      }`}
    >
      <div className="relative aspect-video w-full bg-surface-lowest">
        <img
          src={stream.thumbnail}
          alt=""
          loading="lazy"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 z-10 flex flex-col justify-between">
          <div className="relative h-6">
            <ThumbBadge corner="top-left" className="text-green-400">
              LIVE
            </ThumbBadge>
            <span className="absolute right-1.5 top-1.5 rounded bg-surface-lowest px-1 text-xs font-semibold leading-5 text-white">
              {formatViewers(stream.viewer_count)}
            </span>
          </div>
          <div className="bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 pb-1.5 pt-4 leading-tight">
            <div className="truncate text-xs font-bold text-white">{stream.channel.username}</div>
            <div className="truncate text-[10px] text-surface-onSurfaceSecondary">
              {channel.relay ? `${channel.relay.agency} relay` : stream.category.name}, replies 1 in{" "}
              {channel.interaction.odds_denominator}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
