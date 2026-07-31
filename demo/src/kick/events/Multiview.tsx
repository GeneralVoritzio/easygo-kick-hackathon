import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../Icon";
import { formatViewers, liveStreamFor, type Livestream } from "../mock/api";
import { useAudibleEmbed, useEmbedTarget } from "./EmbedLayer";
import { embedUrlFor } from "./embeds";
import { formatBoostLeft } from "./events";
import { useBoostLeft, useEvent } from "./EventProvider";

function gridCols(count: number) {
  if (count <= 1) return "grid-cols-1";
  if (count <= 4) return "grid-cols-2";
  return "grid-cols-3";
}

function Tile({
  stream,
  selected,
  index,
  onDragStart,
  onDrop,
}: {
  stream: Livestream;
  selected: boolean;
  index: number;
  onDragStart: (index: number) => void;
  onDrop: (index: number) => void;
}) {
  const { unpin, closeMultiview, liveEmbeds } = useEvent();
  const navigate = useNavigate();
  const boostLeft = useBoostLeft(stream.channel.slug);
  const embedUrl = liveEmbeds ? embedUrlFor(stream.channel.slug, true) : undefined;
  const holderRef = useEmbedTarget(embedUrl ? stream.channel.slug : undefined);
  useAudibleEmbed(embedUrl && selected ? stream.channel.slug : undefined);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(index);
      }}
      className="group/tile relative overflow-hidden bg-black"
    >
      {embedUrl ? (
        <div ref={holderRef} className="h-full w-full bg-black" />
      ) : (
        <img
          src={stream.thumbnail}
          alt={stream.session_title}
          className="h-full w-full object-cover brightness-110"
        />
      )}
      {selected && (
        <span className="pointer-events-none absolute inset-0 z-[2] ring-2 ring-inset ring-primary-base" />
      )}
      <div className="absolute left-1.5 top-1.5 z-[2] flex items-center gap-1 rounded bg-black/60 px-1.5 py-1 text-xs font-semibold leading-none text-white/90">
        <span className="size-1.5 rounded-full bg-green-500" />
        {formatViewers(stream.viewer_count)}
        <Icon name={selected ? "volume" : "mute"} className="size-3 shrink-0 fill-white/70" />
        {boostLeft !== null && (
          <span
            aria-label={`Streamer is Boosted, ${formatBoostLeft(boostLeft)} left`}
            className="tooltip-bottom tooltip-start cursor-default text-[11px] leading-none"
          >
            🔥
          </span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 z-[2] flex items-center bg-gradient-to-t from-black/80 to-transparent p-1.5 pt-4">
        <span className="min-w-0 truncate text-xs font-bold text-white">
          {stream.channel.username}
        </span>
      </div>
      {/* The switch lives behind an explicit button, so a stray click on the
          tile never moves the main stream. */}
      {!selected && (
        <div className="absolute inset-0 z-[2] flex items-center justify-center gap-2 opacity-0 transition-opacity duration-150 group-hover/tile:opacity-100">
          <button
            type="button"
            aria-label={`Watch ${stream.channel.username}`}
            onClick={() => {
              closeMultiview();
              navigate(`/${stream.channel.slug}`);
            }}
            className="tooltip-top flex size-8 items-center justify-center rounded bg-black/70 text-white/80 betterhover:hover:bg-black/90 betterhover:hover:text-white [&_svg]:fill-current"
          >
            <Icon name="play" className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Remove from multiview"
            onClick={() => unpin(stream.channel.slug)}
            className="tooltip-top flex size-8 items-center justify-center rounded bg-black/70 text-white/80 betterhover:hover:bg-black/90 betterhover:hover:text-white"
          >
            <Icon name="close" className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function MultiviewGrid({ stream }: { stream: Livestream }) {
  const { multiview, closeMultiview, reorder } = useEvent();
  const navigate = useNavigate();
  const dragFrom = useRef<number | null>(null);
  const currentSlug = stream.channel.slug;
  const streams = multiview.slots
    .map((slug) => liveStreamFor(slug))
    .filter((s): s is Livestream => Boolean(s));

  // The spec asks for keyboard controls on the array index, left and right only.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      const index = multiview.slots.indexOf(currentSlug);
      if (index < 0 || multiview.slots.length < 2) return;
      const step = e.key === "ArrowRight" ? 1 : -1;
      const next = (index + step + multiview.slots.length) % multiview.slots.length;
      navigate(`/${multiview.slots[next]}`);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [multiview.slots, currentSlug, navigate]);

  return (
    <div className="relative flex w-full shrink-0 flex-col overflow-hidden bg-black max-h-[calc(100vh-var(--navbar-height)-var(--channel-info-height))] supports-[height:100dvh]:max-h-[calc(100dvh-var(--navbar-height)-var(--channel-info-height))]">
      <div className={`grid aspect-video min-h-0 w-full gap-0.5 ${gridCols(streams.length)}`}>
        {streams.map((s, i) => (
          <Tile
            key={s.channel.slug}
            stream={s}
            index={i}
            selected={s.channel.slug === currentSlug}
            onDragStart={(index) => {
              dragFrom.current = index;
            }}
            onDrop={(index) => {
              if (dragFrom.current !== null && dragFrom.current !== index)
                reorder(dragFrom.current, index);
              dragFrom.current = null;
            }}
          />
        ))}
      </div>
      {/* The tooltip class carries position relative, so the placement lives on
          a wrapper and never fights it. */}
      <div className="absolute right-2 top-2 z-[2]">
        <button
          type="button"
          aria-label="Close multiview"
          onClick={closeMultiview}
          className="tooltip-bottom tooltip-end flex size-8 items-center justify-center rounded bg-black/70 text-white betterhover:hover:bg-surface-highest"
        >
          <Icon name="close" className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
