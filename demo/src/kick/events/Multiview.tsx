import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../Icon";
import { formatViewers, livestreams, liveStreamFor, type Livestream } from "../mock/api";
import { embedUrlFor } from "./embeds";
import { ironCup, isInEvent, MULTIVIEW_CAP } from "./events";
import { useEvent } from "./EventProvider";

function gridCols(count: number) {
  if (count <= 1) return "grid-cols-1";
  if (count <= 4) return "grid-cols-2";
  return "grid-cols-3";
}

function SearchRow({ stream, onPin, full }: { stream: Livestream; onPin: () => void; full: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded px-2 py-1.5 state-layer-surface">
      <img src={stream.channel.avatar} alt="" className="size-7 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-white">
          {stream.channel.username}
        </span>
        <span className="block truncate text-xs text-surface-onSurfaceSecondary">
          {stream.category.name}
        </span>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-white">
        <span className="size-1.5 rounded-full bg-green-500" />
        {formatViewers(stream.viewer_count)}
      </span>
      <button
        type="button"
        disabled={full}
        onClick={onPin}
        className="h-7 shrink-0 rounded bg-secondary-base px-2 text-xs font-semibold text-secondary-onSecondary disabled:bg-disabled-base disabled:text-disabled-onSurface"
      >
        Pin
      </button>
    </div>
  );
}

function MultiviewSearch() {
  const { multiview, pin } = useEvent();
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState(true);
  const [open, setOpen] = useState(false);
  const full = multiview.slots.length >= MULTIVIEW_CAP;

  const pool = livestreams
    .filter((s) => !multiview.slots.includes(s.channel.slug))
    .filter((s) => (eventFilter ? isInEvent(s.channel.slug) : true))
    .filter((s) =>
      query ? s.channel.username.toLowerCase().includes(query.toLowerCase()) : true,
    );

  return (
    <div className="relative z-10 flex items-center gap-2 bg-black/80 p-2">
      <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded border border-neutral-700 bg-surface-lowest px-2 focus-within:border-neutral-400">
        <Icon name="picker-search" className="size-4 shrink-0 text-surface-onSurfaceSecondary" />
        {eventFilter && (
          <button
            type="button"
            onClick={() => setEventFilter(false)}
            title="Remove the event filter"
            className="flex shrink-0 items-center gap-1 rounded-full bg-secondary-base px-2 py-0.5 text-xs font-semibold leading-4 text-secondary-onSecondary"
          >
            {ironCup.name}
            <Icon name="close" className="size-2.5" />
          </button>
        )}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search streamers"
          aria-label="Search streamers"
          className="h-full w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-surface-onSurfaceSecondary"
        />
      </div>
      <span className="shrink-0 text-xs font-semibold tabular-nums text-surface-onSurfaceSecondary">
        {multiview.slots.length} of {MULTIVIEW_CAP}
      </span>
      {open && (
        <div className="absolute inset-x-2 top-full max-h-72 overflow-y-auto rounded-b bg-surface-base p-1 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
          {pool.length === 0 && (
            <span className="block px-2 py-2 text-sm text-surface-onSurfaceSecondary">
              {eventFilter ? "Everyone in the event is in your grid." : "No streamer matches."}
            </span>
          )}
          {pool.map((s) => (
            <SearchRow
              key={s.id}
              stream={s}
              full={full}
              onPin={() => pin(s.channel.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
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
  const { unpin, liveEmbeds } = useEvent();
  const navigate = useNavigate();
  const embedUrl = liveEmbeds ? embedUrlFor(stream.channel.slug, true) : undefined;

  return (
    <button
      type="button"
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(index);
      }}
      onClick={() => !selected && navigate(`/${stream.channel.slug}`)}
      className={`group/tile relative overflow-hidden bg-black text-left ${
        selected ? "ring-2 ring-inset ring-primary-base" : ""
      }`}
    >
      {embedUrl ? (
        // pointer-events-none keeps the tile's click and drag, and the tile is
        // muted in the URL, so the embed is motion only.
        <iframe
          src={embedUrl}
          title={stream.session_title}
          allow="autoplay; fullscreen"
          className="pointer-events-none h-full w-full"
        />
      ) : (
        <img
          src={stream.thumbnail}
          alt={stream.session_title}
          className="h-full w-full object-cover brightness-110"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/80 to-transparent p-1.5 pt-4">
        <span className="min-w-0 truncate text-xs font-bold text-white">
          {stream.channel.username}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1 text-xs font-semibold text-white">
          <span className="size-1.5 rounded-full bg-green-500" />
          {formatViewers(stream.viewer_count)}
        </span>
        <Icon
          name={selected ? "volume" : "mute"}
          className="size-3.5 shrink-0 fill-white"
        />
      </div>
      <span
        onClick={(e) => {
          e.stopPropagation();
          unpin(stream.channel.slug);
        }}
        title="Remove from multiview"
        className="absolute right-1 top-1 hidden size-6 cursor-pointer items-center justify-center rounded bg-black/70 text-white group-hover/tile:flex"
      >
        <Icon name="close" className="size-3" />
      </span>
    </button>
  );
}

export function MultiviewGrid({ stream }: { stream: Livestream }) {
  const { multiview, closeMultiview, reorder, liveEmbeds, setLiveEmbeds } = useEvent();
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
      <MultiviewSearch />
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
      <div className="flex items-center justify-between bg-black/80 px-2 py-1.5">
        <span className="text-xs text-surface-onSurfaceSecondary">
          Click a stream to watch it. Arrow keys move left and right. Drag tiles to re-order.
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setLiveEmbeds(!liveEmbeds)}
            className="h-7 rounded bg-secondary-base px-2 text-xs font-semibold text-secondary-onSecondary"
          >
            Live embeds {liveEmbeds ? "on" : "off"}
          </button>
          <button
            type="button"
            onClick={closeMultiview}
            className="h-7 rounded bg-secondary-base px-2 text-xs font-semibold text-secondary-onSecondary"
          >
            Close multiview
          </button>
        </div>
      </div>
    </div>
  );
}
