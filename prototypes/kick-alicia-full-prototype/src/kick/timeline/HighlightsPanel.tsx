import { useEffect, useRef, useState } from "react";
import { Icon, type KickIconName } from "../Icon";
import { formatDuration, formatViewers } from "../mock/api";
import { useTimeline } from "./TimelineContext";
import { categoryAt, fromPoint, GROUP_ICON, type Moment, type MomentGroup, type Timeline } from "./data";
import { useStagePreview } from "./useStagePreview";

/*
  The Highlights panel. It lives in the chat column, swapping places with chat itself
  (ChannelShell renders this instead of ChannelChat while open) — the video's own box never
  changes size through any of it. A filter row, a search field (visible on every tab, not just
  Search), an inline mini player right under it, and a single column of compact rows. Ported
  from kick-timeline-with-recap/js/overlay.js, minus the Expedition-widget interplay it also
  had to account for.

  Unlike the rail's own hover card (which still opens the full-screen ClipViewer), a row or the
  recap tile here opens a small inline player in this same panel instead: autoplay, muted by
  default, a manual unmute.
*/

const HOVER_PREVIEW_SECONDS = 40;
const SEGMENT_MS = 5000;

type Filter = MomentGroup | "all" | "bookmarks" | "search";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "peak", label: "Peaks" },
  { id: "clip", label: "Clips" },
  { id: "raid", label: "Raids" },
  { id: "kicks", label: "Gifts" },
  { id: "poll", label: "Polls" },
  { id: "category_change", label: "Category" },
  { id: "bookmarks", label: "Bookmarks" },
  { id: "search", label: "Search" },
];

function groupForFilter(f: Exclude<Filter, "all" | "search">): MomentGroup {
  return f === "bookmarks" ? "bookmark" : f;
}

function headingFor(filter: Filter, list: Moment[], hasRun: boolean, scope: "moments" | "chat") {
  if (filter === "all") return `${list.length} highlights so far`;
  if (filter === "bookmarks") return `${list.length} ${list.length === 1 ? "bookmark" : "bookmarks"}`;
  if (filter === "search") {
    if (!hasRun) return "Type a query above to search";
    const noun = list.length === 1 ? "match" : "matches";
    return `${list.length} ${noun}${scope === "chat" ? " in chat" : ""}`;
  }
  const label = FILTERS.find((f) => f.id === filter)?.label ?? filter;
  return `${list.length} ${label} highlights`;
}

export function HighlightsPanel({ onClose }: { onClose: () => void }) {
  const {
    timeline,
    bookmarks,
    search,
    joinedAt,
    highlightMoment,
    highlightGroupNotches,
    clearHighlight,
    setSearchNotchesActive,
    react,
    hasReacted,
    reactionsFor,
    searchFocusToken,
  } = useTimeline();

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [playing, setPlaying] = useState<Moment[] | null>(null);
  const [playingIndex, setPlayingIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const firstFocusToken = useRef(searchFocusToken);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (searchFocusToken === firstFocusToken.current) return;
    setFilter("search");
    searchInputRef.current?.focus();
  }, [searchFocusToken]);

  useEffect(() => {
    setSearchNotchesActive(filter === "search");
    if (filter === "all" || filter === "search") clearHighlight();
    else highlightGroupNotches(groupForFilter(filter));
  }, [filter, clearHighlight, highlightGroupNotches, setSearchNotchesActive]);

  function applyFilterGlow() {
    setSearchNotchesActive(filter === "search");
    if (filter === "all" || filter === "search") clearHighlight();
    else highlightGroupNotches(groupForFilter(filter));
  }

  function runSearch() {
    search.run(query);
    setFilter("search");
  }

  function onQueryChange(next: string) {
    setQuery(next);
    if (search.hasRun && next !== search.query) search.clear();
  }

  const list: Moment[] =
    filter === "search"
      ? search.results
      : filter === "bookmarks"
        ? bookmarks
        : filter === "all"
          ? timeline.moments.concat(bookmarks).sort((a, b) => a.t - b.t)
          : timeline.byGroup(filter);
  // Loudest first everywhere, except All: the whole-stream tab reads start to end, the way a
  // viewer would actually watch back through what happened before they joined.
  const sorted = list.slice().sort((a, b) => (filter === "all" ? a.t - b.t : b.hype - a.hype));

  const missed = timeline.missed(joinedAt, 3);
  const showMissed = filter === "all" && missed.length > 0;

  function openRow(m: Moment) {
    const toOpen = m.group === "clip" ? m : fromPoint(timeline, m.t, m);
    setPlaying([toOpen]);
    setPlayingIndex(0);
  }

  function openRecap() {
    setPlaying(missed);
    setPlayingIndex(0);
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-surface-lowest">
      <div className="relative flex min-h-[38px] shrink-0 items-center justify-between border-b-2 border-[#24272c] px-3 py-1.5">
        <span className="absolute left-1/2 -translate-x-1/2 text-sm font-bold lg:text-base">
          Highlights
        </span>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close Highlights"
          onClick={onClose}
          className="state-layer-surface ml-auto flex size-9 shrink-0 items-center justify-center rounded text-white"
        >
          <Icon name="close" className="size-4" />
        </button>
      </div>

      <div className="no-scrollbar flex shrink-0 gap-1.5 overflow-x-auto px-3 py-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
              filter === f.id ? "bg-primary-base text-primary-onPrimary" : "bg-secondary-base text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2 px-3 pb-2">
        <div className="relative grow">
          <Icon
            name="search"
            className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-subtle"
          />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch();
            }}
            placeholder="Search moments, or @chat query"
            className="h-8 w-full rounded border border-outline-region bg-surface-lowest pl-7 pr-7 text-xs text-white outline-none"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onQueryChange("")}
              className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center text-subtle"
            >
              <Icon name="clear-search" className="size-3" />
            </button>
          )}
        </div>
      </div>

      {playing && (
        <InlinePlayer
          moments={playing}
          index={playingIndex}
          onIndexChange={setPlayingIndex}
          onClose={() => setPlaying(null)}
          timeline={timeline}
        />
      )}

      <div className="shrink-0 px-3 pb-2 text-xs font-semibold text-subtle">
        {headingFor(filter, sorted, search.hasRun, search.scope)}
      </div>

      <div className="no-scrollbar flex min-h-0 grow flex-col gap-1 overflow-y-auto px-3 pb-3">
        {showMissed && (
          <button
            type="button"
            onClick={openRecap}
            className="flex items-center gap-2 rounded-lg bg-secondary-base p-2 text-left text-white"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-base text-primary-onPrimary">
              <Icon name="play" className="size-3.5" />
            </span>
            <span className="min-w-0">
              <div className="text-sm font-bold">Catch up on what you missed</div>
              <div className="text-xs text-white/70">
                {missed.length} {missed.length === 1 ? "highlight" : "highlights"} before you joined
              </div>
            </span>
          </button>
        )}

        {sorted.map((m) => (
          <HighlightRow
            key={m.id}
            moment={m}
            timeline={timeline}
            liked={hasReacted(m.id)}
            reactions={reactionsFor(m)}
            onOpen={() => openRow(m)}
            onReact={() => react(m.id)}
            onHover={() => highlightMoment(m.id)}
            onLeave={applyFilterGlow}
          />
        ))}
      </div>
    </div>
  );
}

// Autoplay, muted by default, one manual unmute. A list of more than one moment (the recap)
// plays stories-style: a segmented bar, auto-advancing every SEGMENT_MS, tap the left third of
// the frame to go back and the right two thirds to skip ahead.
function InlinePlayer({
  moments,
  index,
  onIndexChange,
  onClose,
  timeline,
}: {
  moments: Moment[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  timeline: Timeline;
}) {
  const { openClipSequence } = useTimeline();
  const clip = moments[index];
  const span = clip.duration || 30;
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setElapsed(0);
  }, [clip.id]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    function step(now: number) {
      const delta = (now - last) / 1000;
      last = now;
      setElapsed((e) => (e + delta) % span);
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, span, clip.id]);

  useEffect(() => {
    if (moments.length < 2 || !playing) return;
    const timer = window.setTimeout(() => {
      if (index >= moments.length - 1) onClose();
      else onIndexChange(index + 1);
    }, SEGMENT_MS);
    return () => window.clearTimeout(timer);
  }, [moments, index, playing, onClose, onIndexChange]);

  useStagePreview(canvasRef, timeline, clip.t + elapsed);
  const category = categoryAt(timeline, clip.t);

  function enlarge() {
    openClipSequence(moments);
    onClose();
  }

  return (
    <div className="relative mx-3 mb-2 shrink-0 overflow-hidden rounded-lg bg-black">
      <div className="aspect-video w-full">
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>

      {moments.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => onIndexChange(Math.max(0, index - 1))}
            className="absolute inset-y-0 left-0 w-1/3"
          />
          <button
            type="button"
            aria-label="Next"
            onClick={() => (index >= moments.length - 1 ? onClose() : onIndexChange(index + 1))}
            className="absolute inset-y-0 right-0 w-2/3"
          />
        </>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-2 pr-9 text-white">
        <div className="truncate text-xs font-bold">
          {clip.title} · {category.name}
        </div>
        <div className="truncate text-[11px] text-white/80">{clip.byline}</div>
      </div>

      {/* Top right, the way a viewer expects to close any overlay-ish surface, not tucked
          in beside the transport controls at the bottom. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-1.5 top-1.5 z-10 flex size-7 items-center justify-center rounded text-white [&_svg]:size-3.5"
      >
        <Icon name="close" />
      </button>

      {/* The timeline sits at the bottom, the same place a normal video player puts its
          seek bar — a segment per moment for the recap, one bar for a single clip. */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent pt-3">
        <div className="flex gap-0.5 px-1.5">
          {moments.map((_, i) => (
            <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <span
                className="block h-full bg-primary-base"
                style={{ width: i < index ? "100%" : i === index ? `${(elapsed / span) * 100}%` : "0%" }}
              />
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-1 p-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={playing ? "Pause" : "Play"}
              onClick={() => setPlaying((p) => !p)}
              className="flex size-7 items-center justify-center rounded text-white [&_svg]:size-3.5"
            >
              <Icon name={playing ? "pause" : "play"} />
            </button>
            <button
              type="button"
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={() => setMuted((m) => !m)}
              className="flex size-7 items-center justify-center rounded text-white [&_svg]:size-3.5"
            >
              <Icon name={muted ? "mute" : "volume"} />
            </button>
          </div>
          <button
            type="button"
            aria-label="Enlarge"
            onClick={enlarge}
            className="flex size-7 items-center justify-center rounded text-white [&_svg]:size-3.5"
          >
            <Icon name="fullscreen" />
          </button>
        </div>
      </div>
    </div>
  );
}

function HighlightRow({
  moment,
  timeline,
  liked,
  reactions,
  onOpen,
  onReact,
  onHover,
  onLeave,
}: {
  moment: Moment;
  timeline: Timeline;
  liked: boolean;
  reactions: number;
  onOpen: () => void;
  onReact: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovering, setHovering] = useState(false);
  const [previewOffset, setPreviewOffset] = useState(0);

  // Hovering scrubs a 40 second window instead of showing one still frame, so a row previews
  // like a real hover-scrub thumbnail rather than a static picture.
  useEffect(() => {
    if (!hovering) {
      setPreviewOffset(0);
      return;
    }
    let raf = 0;
    let last = performance.now();
    function step(now: number) {
      const delta = (now - last) / 1000;
      last = now;
      setPreviewOffset((o) => (o + delta) % HOVER_PREVIEW_SECONDS);
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [hovering]);

  useStagePreview(canvasRef, timeline, moment.t + previewOffset, { thumbnail: true });

  return (
    <article
      onMouseEnter={() => {
        onHover();
        setHovering(true);
      }}
      onMouseLeave={() => {
        onLeave();
        setHovering(false);
      }}
      className="flex items-center gap-2 rounded-lg p-1.5 betterhover:hover:bg-surface-highest"
    >
      <button type="button" onClick={onOpen} className="flex min-w-0 grow items-center gap-2 text-left">
        <span className="relative h-12 w-[85px] shrink-0 overflow-hidden rounded bg-black">
          <canvas ref={canvasRef} className="h-full w-full" />
          <span
            className={`absolute bottom-0 right-0 flex size-4 items-center justify-center rounded-tl text-black ${
              moment.group === "bookmark" ? "bg-white" : "bg-primary-base"
            }`}
          >
            <Icon name={GROUP_ICON[moment.group] as KickIconName} className="size-2.5" />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-white">{moment.title}</div>
          <div className="truncate text-xs text-subtle">{moment.byline}</div>
          <div className="text-[11px] tabular-nums text-subtle">
            {formatDuration(moment.t)} · {formatViewers(moment.viewer_count)}
          </div>
        </span>
      </button>
      <button
        type="button"
        aria-pressed={liked}
        aria-label={liked ? "Liked" : "React"}
        onClick={onReact}
        className={`flex shrink-0 items-center gap-1 rounded px-1.5 py-1 text-xs font-semibold ${liked ? "text-red-400" : "text-white/70"}`}
      >
        <Icon name={liked ? "heart-filled" : "heart"} className="size-3.5" />
        {reactions.toLocaleString()}
      </button>
    </article>
  );
}
