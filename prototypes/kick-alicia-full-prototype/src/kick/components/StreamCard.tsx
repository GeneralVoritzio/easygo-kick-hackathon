import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CornerMarks, PillRow, ThumbBadge } from "./CardBits";
import { oneRowGrid } from "./Layout";
import { formatViewers, streamPills, type Livestream } from "../mock/api";
import { usePinnedStreams } from "../expedition/PinnedStreamsContext";
import { PinButton } from "../expedition/PinButton";

// Long enough that a quick mouse sweep across a rail doesn't kick off a preview on every card
// it passes over, short enough that it still reads as "hovering this one."
const HOVER_PREVIEW_DELAY_MS = 350;

export function StreamCard({ stream }: { stream: Livestream }) {
  const { isPinned, togglePin, canPinMore } = usePinnedStreams();
  // KICK gives no way to embed a channel's real video outside its own player, and every stream
  // here is mocked (StopPreview.tsx's own reasoning) — "playing a snippet" on hover is a slow pan
  // across the still thumbnail, not a fake video feed.
  const [previewing, setPreviewing] = useState(false);
  const hoverTimer = useRef<number | undefined>(undefined);

  function startHover() {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setPreviewing(true), HOVER_PREVIEW_DELAY_MS);
  }

  function endHover() {
    window.clearTimeout(hoverTimer.current);
    setPreviewing(false);
  }

  return (
    <div
      onMouseEnter={startHover}
      onMouseLeave={endHover}
      onFocus={startHover}
      onBlur={endHover}
      className="group/card relative flex w-full shrink-0 grow-0 flex-col gap-2 will-change-transform lg:gap-0"
    >
      <div className="relative">
        <Link
          to={`/${stream.channel.slug}`}
          className="relative block aspect-video w-full select-none overflow-hidden rounded"
        >
          <img
            src={stream.thumbnail}
            alt={stream.session_title}
            className={`aspect-video w-full object-cover brightness-110 contrast-[110%] saturate-[110%] ${
              previewing ? "animate-hover-preview" : ""
            }`}
          />
          <ThumbBadge corner="top-left" className="uppercase text-primary-base">
            Live
          </ThumbBadge>
          <ThumbBadge corner="bottom-left">
            <span>{formatViewers(stream.viewer_count)}</span> watching
          </ThumbBadge>
        </Link>
        <PinButton
          pinned={isPinned(stream.channel.slug)}
          disabled={!canPinMore}
          streamName={stream.channel.username}
          onToggle={() => togglePin(stream.channel.slug)}
          size="sm"
          className="absolute right-1.5 top-1.5"
        />
      </div>

      <div className="flex w-full flex-row flex-nowrap gap-2 lg:px-1.5 lg:py-2 tv:py-4 fhd:py-5">
        <Link to={`/${stream.channel.slug}`} className="shrink-0">
          <img
            src={stream.channel.avatar}
            alt={stream.channel.username}
            className="size-11 shrink-0 rounded-full"
          />
        </Link>
        <div className="flex w-full min-w-0 flex-col items-start tv:gap-1 fhd:gap-1.5">
          <Link
            to={`/${stream.channel.slug}`}
            className="max-w-full truncate text-sm font-semibold leading-5 text-white"
          >
            {stream.channel.username}
          </Link>
          <Link
            to={`/${stream.channel.slug}`}
            className="max-w-full truncate text-base font-normal leading-6 text-surface-onSurfaceSecondary"
          >
            {stream.session_title}
          </Link>
          <PillRow pills={streamPills(stream)} />
        </div>
      </div>
      <CornerMarks />
    </div>
  );
}

export const streamColumns =
  "h-full grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 group-data-[sidebar=false]/main:xl:grid-cols-5 group-data-[sidebar=false]/main:2xl:grid-cols-6 group-data-[sidebar=false]/main:3xl:grid-cols-7";

export function StreamGrid({ streams, oneRow }: { streams: Livestream[]; oneRow?: boolean }) {
  return (
    <section className={`${streamColumns} ${oneRow ? `${oneRowGrid} [&>div]:w-[268px]` : "grid gap-y-5 lg:gap-y-6"}`}>
      {streams.map((s) => (
        <StreamCard key={s.id} stream={s} />
      ))}
    </section>
  );
}
