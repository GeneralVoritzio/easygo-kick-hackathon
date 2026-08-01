import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../Icon";
import { formatViewers, liveStreamFor, type Livestream } from "../mock/api";
import { useAudibleEmbed, useEmbedTarget } from "./EmbedLayer";
import { embedUrlFor } from "./embeds";
import { formatBoostLeft } from "./events";
import { useBoostLeft, useEvent } from "./EventProvider";
import { HypeStars } from "./HypeStars";

function formatElapsed(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function liveSeconds(startedAt: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
}

function trackPercent(e: ReactPointerEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  return Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
}

function dragProps(apply: (percent: number) => void) {
  return {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      apply(trackPercent(e));
    },
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.buttons === 1) apply(trackPercent(e));
    },
  };
}

const controlButtonClass =
  "tooltip-top flex size-11 shrink-0 items-center justify-center rounded bg-transparent text-white [&_svg]:size-5 [&_svg]:fill-current";

// The grid is never more than three columns, so up/down and left/right both have a shared
// notion of rows to walk. gridColsClass keeps the literal class names Tailwind's scanner needs.
function columnsFor(count: number) {
  if (count <= 1) return 1;
  if (count <= 4) return 2;
  return 3;
}

function gridColsClass(count: number) {
  const cols = columnsFor(count);
  if (cols === 1) return "grid-cols-1";
  if (cols === 2) return "grid-cols-2";
  return "grid-cols-3";
}

function Tile({
  stream,
  selected,
  paused,
  onTogglePause,
  index,
  dragging,
  dragOver,
  onHover,
  onRegisterRef,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
}: {
  stream: Livestream;
  selected: boolean;
  paused: boolean;
  onTogglePause: () => void;
  index: number;
  dragging: boolean;
  dragOver: boolean;
  onHover: (stream: Livestream, x: number, y: number) => void;
  onRegisterRef: (slug: string, el: HTMLDivElement | null) => void;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
  onDrop: (index: number) => void;
}) {
  const { unpin, closeMultiview, liveEmbeds, audibleSlug, setAudible, hypeTiers } = useEvent();
  const hypeTier = hypeTiers[stream.channel.slug] ?? 0;
  const navigate = useNavigate();
  const boostLeft = useBoostLeft(stream.channel.slug);
  const embedUrl = liveEmbeds ? embedUrlFor(stream.channel.slug, true) : undefined;
  const holderRef = useEmbedTarget(embedUrl ? stream.channel.slug : undefined);
  const audible = audibleSlug === stream.channel.slug;
  useAudibleEmbed(embedUrl && selected ? stream.channel.slug : undefined);

  return (
    <div
      ref={(el) => onRegisterRef(stream.channel.slug, el)}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(index);
      }}
      onMouseMove={(e) => onHover(stream, e.clientX, e.clientY)}
      className={`group/tile relative overflow-hidden bg-black transition-[opacity,transform] duration-150 ${
        dragging ? "opacity-40" : "opacity-100"
      }`}
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
      {dragOver && !dragging && (
        <span className="pointer-events-none absolute inset-0 z-[3] bg-white/10 ring-2 ring-inset ring-white" />
      )}
      {paused && (
        <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-black/60">
          <Icon name="pause" className="size-8 fill-white/80" />
        </div>
      )}
      <div className="absolute left-1.5 top-1.5 z-[2] flex items-center gap-1 rounded bg-black/60 px-1.5 py-1 text-xs font-semibold leading-none text-white/90">
        <span className="size-1.5 rounded-full bg-green-500" />
        {formatViewers(stream.viewer_count)}
        {boostLeft !== null && (
          <span
            aria-label={`Streamer is Boosted, ${formatBoostLeft(boostLeft)} left`}
            className="tooltip-bottom tooltip-start cursor-default text-[11px] leading-none"
          >
            🔥
          </span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 z-[2] flex items-center gap-1 bg-gradient-to-t from-black/80 to-transparent p-1.5 pt-4">
        <span className="min-w-0 truncate text-xs font-bold text-white">
          {stream.channel.username}
        </span>
        {hypeTier > 0 && <HypeStars tier={hypeTier} size="size-3" />}
      </div>
      {/* The switch lives behind an explicit button, so a stray click on the
          tile never moves the main stream. */}
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
          <Icon name="eye" className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`${paused ? "Resume" : "Pause"} ${stream.channel.username}`}
          onClick={onTogglePause}
          className="tooltip-top flex size-8 items-center justify-center rounded bg-black/70 text-white/80 betterhover:hover:bg-black/90 betterhover:hover:text-white [&_svg]:fill-current"
        >
          <Icon name={paused ? "play" : "pause"} className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`${audible ? "Mute" : "Unmute"} ${stream.channel.username}`}
          onClick={() => {
            if (audible) {
              setAudible(undefined);
              return;
            }
            // Turning audio on makes this the active tile too: the green ring and the
            // loud tile should never disagree about which stream you're watching.
            setAudible(stream.channel.slug);
            if (!selected) navigate(`/${stream.channel.slug}`);
          }}
          className="tooltip-top flex size-8 items-center justify-center rounded bg-black/70 text-white/80 betterhover:hover:bg-black/90 betterhover:hover:text-white [&_svg]:fill-current"
        >
          <Icon name={audible ? "volume" : "mute"} className="size-4" />
        </button>
        {!selected && (
          <button
            type="button"
            aria-label="Remove from multiview"
            onClick={() => unpin(stream.channel.slug)}
            className="tooltip-top flex size-8 items-center justify-center rounded bg-black/70 text-white/80 betterhover:hover:bg-black/90 betterhover:hover:text-white"
          >
            <Icon name="close" className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function MultiviewGrid({ stream }: { stream: Livestream }) {
  const { multiview, closeMultiview, reorder, audibleSlug, setAudible } = useEvent();
  const navigate = useNavigate();
  const dragFrom = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevRects = useRef<Map<string, DOMRect>>(new Map());
  const currentSlug = stream.channel.slug;
  const streams = multiview.slots
    .map((slug) => liveStreamFor(slug))
    .filter((s): s is Livestream => Boolean(s));
  const [paused, setPaused] = useState<Set<string>>(new Set());
  const [fullscreen, setFullscreen] = useState(false);
  const [hover, setHover] = useState<{ stream: Livestream; x: number; y: number } | null>(null);
  const [volume, setVolume] = useState(80);
  const [draggingSlug, setDraggingSlug] = useState<string | null>(null);
  const [dragOverSlug, setDragOverSlug] = useState<string | null>(null);
  // True outside fullscreen: hover alone (the existing CSS group-hover/grid rules) decides
  // whether the close button and the bottom bar show. In fullscreen the mouse sits over the
  // grid the whole time, so hover cannot tell "watching" from "idle" any more: this flag
  // takes over there, and forces both hidden a few seconds after the last mouse move.
  const [controlsVisible, setControlsVisible] = useState(true);
  const idleTimer = useRef<number | null>(null);
  // The elapsed clock and the LIVE badge follow the selected tile, the one the ring
  // highlights: it is the closest thing this grid has to "the" stream.
  const [elapsedSeconds, setElapsedSeconds] = useState(() => liveSeconds(stream.started_at));
  const muted = audibleSlug === undefined;
  const displayVolume = muted ? 0 : volume;

  const slotOrderKey = streams.map((s) => s.channel.slug).join("|");

  // FLIP: a tile keeps its DOM node across a reorder (same key), so the grid alone would just
  // snap it to the new cell. Measure every tile before this render's positions land, then once
  // they have, offset each one back to where it was and transition that offset away to zero.
  useLayoutEffect(() => {
    const nextRects = new Map<string, DOMRect>();
    for (const s of streams) {
      const el = tileRefs.current.get(s.channel.slug);
      if (el) nextRects.set(s.channel.slug, el.getBoundingClientRect());
    }

    for (const s of streams) {
      const el = tileRefs.current.get(s.channel.slug);
      const prev = prevRects.current.get(s.channel.slug);
      const next = nextRects.get(s.channel.slug);
      if (!el || !prev || !next) continue;
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (dx === 0 && dy === 0) continue;
      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = "transform 250ms cubic-bezier(0.2, 0, 0.2, 1)";
        el.style.transform = "";
      });
    }

    prevRects.current = nextRects;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on slot order, not identity
  }, [slotOrderKey]);

  const togglePause = (slug: string) =>
    setPaused((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current?.requestFullscreen();
  };

  const toggleMute = () => setAudible(muted ? currentSlug : undefined);

  useEffect(() => {
    function onChange() {
      setFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Idle-hide only runs in fullscreen. Leaving fullscreen always hands control back to hover.
  useEffect(() => {
    if (!fullscreen) {
      setControlsVisible(true);
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      idleTimer.current = null;
      return;
    }

    function wake() {
      setControlsVisible(true);
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => {
        setControlsVisible(false);
        setHover(null);
      }, 3000);
    }

    wake();
    window.addEventListener("mousemove", wake);
    return () => {
      window.removeEventListener("mousemove", wake);
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      idleTimer.current = null;
    };
  }, [fullscreen]);

  useEffect(() => {
    setElapsedSeconds(liveSeconds(stream.started_at));
  }, [stream.started_at]);

  useEffect(() => {
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // The arrow keys walk the grid two dimensionally: left/right stay in the row, up/down
  // move a full row, both wrapping at the edge. Escape leaves. Enter opens the selected tile
  // solo, the same place the eye button on that tile sends you. A digit is the tile's own
  // position in the grid, one to nine, and toggles who is loud. P pauses the selected tile,
  // F toggles fullscreen.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key === "Escape") {
        closeMultiview();
        return;
      }

      if (e.key === "Enter") {
        closeMultiview();
        return;
      }

      if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
        return;
      }

      if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown"
      ) {
        const total = multiview.slots.length;
        const index = multiview.slots.indexOf(currentSlug);
        if (index < 0 || total < 2) return;
        const cols = columnsFor(total);
        const rows = Math.ceil(total / cols);
        const row = Math.floor(index / cols);
        const col = index % cols;
        let nextRow = row;
        let nextCol = col;
        if (e.key === "ArrowRight") nextCol = (col + 1) % cols;
        else if (e.key === "ArrowLeft") nextCol = (col - 1 + cols) % cols;
        else if (e.key === "ArrowDown") nextRow = (row + 1) % rows;
        else if (e.key === "ArrowUp") nextRow = (row - 1 + rows) % rows;
        const next = (nextRow * cols + nextCol) % total;
        navigate(`/${multiview.slots[next]}`);
        return;
      }

      if (e.key >= "1" && e.key <= "9") {
        const tile = streams[Number(e.key) - 1];
        if (!tile) return;
        if (audibleSlug === tile.channel.slug) {
          setAudible(undefined);
        } else {
          setAudible(tile.channel.slug);
          if (tile.channel.slug !== currentSlug) navigate(`/${tile.channel.slug}`);
        }
        return;
      }

      if (e.key === "p" || e.key === "P") {
        togglePause(currentSlug);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [multiview.slots, currentSlug, navigate, closeMultiview, streams, audibleSlug, setAudible]);

  return (
    <div
      ref={containerRef}
      className={`group/grid relative flex w-full shrink-0 flex-col overflow-hidden bg-black ${
        fullscreen
          ? "h-screen max-h-screen"
          : "max-h-[calc(100vh-var(--navbar-height)-var(--channel-info-height))] supports-[height:100dvh]:max-h-[calc(100dvh-var(--navbar-height)-var(--channel-info-height))]"
      } ${fullscreen && !controlsVisible ? "cursor-none" : ""}`}
    >
      <div
        onMouseLeave={() => setHover(null)}
        className={`grid min-h-0 w-full gap-0.5 ${fullscreen ? "h-full" : "aspect-video"} ${gridColsClass(streams.length)}`}
      >
        {streams.map((s, i) => (
          <Tile
            key={s.channel.slug}
            stream={s}
            index={i}
            selected={s.channel.slug === currentSlug}
            paused={paused.has(s.channel.slug)}
            dragging={draggingSlug === s.channel.slug}
            dragOver={dragOverSlug === s.channel.slug}
            onTogglePause={() => togglePause(s.channel.slug)}
            onHover={(hoveredStream, x, y) => setHover({ stream: hoveredStream, x, y })}
            onRegisterRef={(slug, el) => {
              if (el) tileRefs.current.set(slug, el);
              else tileRefs.current.delete(slug);
            }}
            onDragStart={(index) => {
              dragFrom.current = index;
              setDraggingSlug(s.channel.slug);
            }}
            onDragEnter={(index) => {
              if (dragFrom.current !== null && dragFrom.current !== index) {
                setDragOverSlug(s.channel.slug);
              }
            }}
            onDragEnd={() => {
              dragFrom.current = null;
              setDraggingSlug(null);
              setDragOverSlug(null);
            }}
            onDrop={(index) => {
              if (dragFrom.current !== null && dragFrom.current !== index)
                reorder(dragFrom.current, index);
              dragFrom.current = null;
              setDraggingSlug(null);
              setDragOverSlug(null);
            }}
          />
        ))}
      </div>
      {/* Fixed, not absolute: the grid clips absolutely positioned children at its own edge,
          and a card that follows the cursor needs to cross tile boundaries freely. */}
      {hover && controlsVisible && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-popover flex w-72 items-start gap-2 rounded bg-surface-highest p-2 shadow-lg ring-1 ring-outline-decorative"
          style={{
            left: Math.min(hover.x + 18, window.innerWidth - 296),
            top: Math.min(hover.y + 18, window.innerHeight - 160),
          }}
        >
          <img
            src={hover.stream.channel.avatar}
            alt=""
            className="size-8 shrink-0 rounded-full"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-semibold leading-snug text-white">
              {hover.stream.session_title}
            </span>
            <span className="text-xs font-normal leading-tight text-white/70">
              {hover.stream.channel.username} &middot; {hover.stream.category.name}
            </span>
          </div>
        </div>
      )}
      {/* The tooltip class carries position relative, so the placement lives on
          a wrapper and never fights it. Same show-on-hover treatment as the bottom bar,
          plus the fullscreen idle override: it should never just sit there. */}
      <div
        className={`pointer-events-none absolute right-2 top-2 z-[2] flex items-center gap-1 opacity-0 transition-opacity duration-150 betterhover:group-hover/grid:pointer-events-auto betterhover:group-hover/grid:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100 ${
          !controlsVisible ? "!pointer-events-none !opacity-0" : ""
        }`}
      >
        <button
          type="button"
          aria-label="Close multiview"
          onClick={closeMultiview}
          className="tooltip-bottom tooltip-end flex size-8 items-center justify-center rounded bg-black/70 text-white betterhover:hover:bg-surface-highest"
        >
          <Icon name="close" className="size-3.5" />
        </button>
      </div>

      {/* The same bottom bar the single stream player uses, minus the timeline and the
          play/pause button: a grid has no one stream to scrub or pause. Scoped to its own
          h-11 strip, not inset-0: an invisible full-size layer would out-rank every tile
          underneath it the moment the mouse enters the grid, and swallow their clicks. */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex h-11 flex-row items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent px-2 opacity-0 transition-opacity duration-150 betterhover:group-hover/grid:pointer-events-auto betterhover:group-hover/grid:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100 xl:px-5 ${
          !controlsVisible ? "!pointer-events-none !opacity-0" : ""
        }`}
      >
        <div className="flex min-w-0 items-center">
          <button
            type="button"
            aria-label={muted ? "Unmute (m)" : "Mute (m)"}
            onClick={toggleMute}
            className={`tooltip-start ${controlButtonClass}`}
          >
            <Icon name={muted ? "mute" : "volume"} />
          </button>

          <div
            role="slider"
            aria-label="Volume"
            aria-valuenow={displayVolume}
            aria-valuemin={0}
            aria-valuemax={100}
            {...dragProps((percent) => {
              const v = Math.round(percent);
              setVolume(v);
              setAudible(v === 0 ? undefined : currentSlug);
            })}
            className="relative h-1 w-20 shrink-0 cursor-pointer touch-none rounded-full bg-white/30"
          >
            <div
              className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-white"
              style={{ width: `${displayVolume}%` }}
            />
            <div
              className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
              style={{ left: `${displayVolume}%` }}
            />
          </div>

          <span className="shrink-0 px-2 text-sm font-bold leading-5 text-white">
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            aria-label="Clip (c)"
            className="tooltip-top mx-2 flex h-11 shrink-0 items-center gap-1 rounded text-sm font-semibold text-white [&_svg]:size-5 [&_svg]:fill-current"
          >
            <Icon name="clip" />
            Clip
          </button>
          <button type="button" aria-label="Captions (p)" className={controlButtonClass}>
            <Icon name="closed-captions" />
          </button>
          <button
            type="button"
            aria-label={fullscreen ? "Exit fullscreen (f)" : "Fullscreen (f)"}
            onClick={toggleFullscreen}
            className={controlButtonClass}
          >
            <Icon name="fullscreen" />
          </button>
          <button type="button" aria-label="Quality" className={`tooltip-end ${controlButtonClass}`}>
            <Icon name="settings" />
          </button>
        </div>
      </div>
    </div>
  );
}
