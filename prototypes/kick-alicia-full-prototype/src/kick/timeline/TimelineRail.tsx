import { useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Icon, type KickIconName } from "../Icon";
import { formatDuration, formatViewers } from "../mock/api";
import { useTimeline } from "./TimelineContext";
import { fromPoint, GROUP_ICON, type Moment, type MomentGroup } from "./data";
import { useStagePreview } from "./useStagePreview";

/*
  The rail. KICK's live player already draws a 4px progress bar, full bleed, above the video
  bottom. This puts the timeline in that bar: a notch for each of the loudest moments, every
  bookmark and every live search hit. Hover opens it — the track grows, the notches grow, and
  a live picture-in-the-frame preview shows under a card naming the moment. Ported from
  kick-timeline-with-recap/js/scrubber.js.
*/

const HOVER_GRAB_SECONDS = 90;

// The 16 KICK identity colours a group's notch is filled with, same as
// kick-timeline-with-recap/css/player.css's .notch--* (each group's background is its own glow
// colour, read verbatim off its tokens.css).
const GLOW: Record<MomentGroup, string> = {
  peak: "#75fd45",
  clip: "#45adfc",
  raid: "#d8a0fe",
  kicks: "#fcb645",
  poll: "#18fbb0",
  category_change: "#9fa6ad",
  search_moment: "#18e9fb",
  search_chat: "#eacdfe",
  bookmark: "#fedaa0",
};

/*
  A notch's own colour is always on; the glow is what tells a viewer "look here". Exactly one
  of two things can make a notch glow: the single tile a viewer is hovering in the Highlights
  panel (is-linked, scale 1.5, pulses fast), or every notch of the filter group that panel has
  active (also is-linked, no dimming of anything else). A search hit pulses on its own the whole
  time the Search tab is showing, a little slower, and that pulse — and only that pulse — turns
  off while a different tile is being hovered (is-dimmed), so hovering one result doesn't leave
  every other one still flashing. Nothing here ever dims a notch's own colour: only the glow
  toggles. Ported from the same file's notch--*, is-linked, is-search-active and is-dimmed rules.
*/
function notchVisual(
  m: Moment,
  linkedId: string | null,
  linkedGroup: MomentGroup | "all" | null,
  searchActive: boolean,
) {
  const isSearch = m.group === "search_moment" || m.group === "search_chat";
  const isLinked = linkedId ? m.id === linkedId : linkedGroup ? m.group === linkedGroup : false;
  const isDimmed = linkedId !== null && m.id !== linkedId;
  const searchPulsing = isSearch && searchActive && !isDimmed;

  const className = [
    "absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-black transition-transform",
    isLinked ? "scale-150" : isSearch ? "scale-[1.2] hover:scale-150" : "hover:scale-[1.4]",
    isLinked
      ? "animate-[notch-glow_1s_ease-in-out_infinite]"
      : searchPulsing
        ? "animate-[notch-glow_1.4s_ease-in-out_infinite]"
        : "",
  ].join(" ");

  const style = { backgroundColor: GLOW[m.group], "--notch-glow": GLOW[m.group] } as CSSProperties;

  return { className, style };
}

export function TimelineRail() {
  const {
    timeline,
    t,
    liveEdge,
    bookmarks,
    bookmarkAt,
    toggleBookmark,
    search,
    linkedId,
    linkedGroup,
    searchActive,
    seek,
    openClip,
  } = useTimeline();

  const railRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lingerRef = useRef<number | undefined>(undefined);

  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hoverT, setHoverT] = useState<number | null>(null);
  const [cardShown, setCardShown] = useState(false);
  const [cardLeft, setCardLeft] = useState(0);

  const extra = useMemo(() => bookmarks.concat(search.results), [bookmarks, search.results]);
  // Every moment gets a notch, not just the loudest few, so a row in the Highlights panel
  // always has a matching point on the rail to glow when hovered.
  const picks = useMemo(
    () => timeline.moments.concat(extra).sort((a, b) => a.t - b.t),
    [timeline, extra],
  );

  const near = hoverT !== null ? timeline.nearest(hoverT, HOVER_GRAB_SECONDS, extra) : null;
  const isClip = near?.group === "clip";
  const previewT = hoverT ?? t;
  useStagePreview(canvasRef, timeline, previewT);

  function pct(time: number) {
    return liveEdge > 0 ? (time / liveEdge) * 100 : 0;
  }

  function timeFromEvent(e: ReactPointerEvent<HTMLDivElement>) {
    const box = railRef.current?.getBoundingClientRect();
    if (!box) return 0;
    const ratio = (e.clientX - box.left) / box.width;
    return Math.max(0, Math.min(1, ratio)) * liveEdge;
  }

  function positionCard(clientX: number) {
    const box = railRef.current?.getBoundingClientRect();
    if (!box) return;
    setCardLeft(Math.max(0, Math.min(box.width, clientX - box.left)));
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const time = timeFromEvent(e);
    setHoverT(time);
    positionCard(e.clientX);
    window.clearTimeout(lingerRef.current);
    setCardShown(true);
    if (dragging) seek(time);
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    setDragging(true);
    railRef.current?.setPointerCapture(e.pointerId);
    seek(timeFromEvent(e));
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    setDragging(false);
    railRef.current?.releasePointerCapture(e.pointerId);
  }

  // setPointerCapture (below) locks every further pointer event, including the eventual
  // pointerup/click, to the rail for the rest of the gesture — scrub, then keep holding while
  // sliding up onto the hover card's bookmark button, and the release would fire on the rail
  // instead of the button, so the click there would never register. Ending the drag the moment
  // the pointer actually leaves the rail avoids that: the rest of the gesture (moving onto the
  // card, releasing over the bookmark icon) then behaves like any ordinary, uncaptured click.
  function onPointerLeaveRail(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragging) {
      railRef.current?.releasePointerCapture(e.pointerId);
      setDragging(false);
    }
    closeRail();
    releaseCard();
  }

  function releaseCard() {
    window.clearTimeout(lingerRef.current);
    lingerRef.current = window.setTimeout(() => setCardShown(false), 500);
  }

  function openRail() {
    setOpen(true);
  }
  function closeRail() {
    if (!dragging) setOpen(false);
  }

  const bookmarkPointT = near ? near.t : hoverT;
  const existingBookmark = bookmarkPointT !== null ? bookmarkAt(bookmarkPointT) : undefined;

  function handleCardClick() {
    if (bookmarkPointT === null) return;
    const toOpen = isClip && near ? near : fromPoint(timeline, bookmarkPointT, near);
    setCardShown(false);
    openClip(toOpen);
  }

  return (
    <div className="absolute -top-9 left-0 flex h-9 w-full flex-col justify-end overflow-visible">
      {open && (
        <svg viewBox="0 0 1000 24" preserveAspectRatio="none" className="mb-1 h-6 w-full opacity-70">
          <path
            d={sparkPath(timeline, liveEdge)}
            fill="none"
            stroke="var(--color-primary-base)"
            strokeWidth={2}
          />
        </svg>
      )}

      <div
        ref={railRef}
        role="slider"
        aria-label="Stream timeline"
        aria-valuemin={0}
        aria-valuemax={Math.round(liveEdge)}
        aria-valuenow={Math.round(t)}
        aria-valuetext={formatDuration(Math.round(t))}
        tabIndex={0}
        onPointerEnter={openRail}
        onFocus={openRail}
        onPointerLeave={onPointerLeaveRail}
        onBlur={() => {
          closeRail();
          releaseCard();
        }}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className={`relative w-full cursor-pointer touch-none overflow-visible bg-white/30 transition-[height] duration-150 ${open ? "h-1.5" : "h-1"}`}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-subtle/50" />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 bg-primary-base"
          style={{ width: `${pct(t)}%` }}
        />
        <div
          className={`pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-base transition-all ${open ? "size-4 opacity-100" : "size-0 opacity-0"}`}
          style={{ left: `${pct(t)}%` }}
        />
        {picks.map((m) => {
          const { className, style } = notchVisual(m, linkedId, linkedGroup, searchActive);
          return (
            <span
              key={m.id}
              title={`${formatDuration(m.t)} ${m.title}`}
              className={`${className} ${open ? "size-4" : "size-3"}`}
              style={{ ...style, left: `${pct(m.t)}%` }}
            >
              <Icon name={GROUP_ICON[m.group] as KickIconName} className="size-2" />
            </span>
          );
        })}
      </div>

      {cardShown && hoverT !== null && (
        <div
          onPointerEnter={() => window.clearTimeout(lingerRef.current)}
          onPointerLeave={releaseCard}
          onClick={handleCardClick}
          style={{ left: cardLeft }}
          className="absolute bottom-full z-popover mb-2 w-[220px] -translate-x-1/2 cursor-pointer rounded-lg border border-light-16 bg-dark-64 p-2 text-white shadow-lg backdrop-blur-[8px]"
        >
          <div className="relative mb-2 aspect-video w-full overflow-hidden rounded">
            <canvas ref={canvasRef} className="h-full w-full" />
            {isClip && near?.duration !== undefined && (
              <span className="absolute left-1 top-1 rounded bg-black/70 px-1 text-[11px] font-semibold">
                {formatDuration(near.duration)}
              </span>
            )}
            {isClip && near?.view_count !== undefined && (
              <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[11px] font-semibold">
                {formatViewers(near.view_count)} views
              </span>
            )}
          </div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {near && (
                <em className="not-italic text-[11px] font-semibold uppercase text-primary-base">
                  {near.label}
                </em>
              )}
              <div className="truncate text-xs font-bold">
                {near ? near.title : formatDuration(Math.round(hoverT))}
              </div>
              <div className="text-[11px] text-subtle">
                {near ? formatDuration(near.t) : null} {formatViewers((near ?? timeline.bucketAt(hoverT)).viewer_count)} watching
              </div>
            </div>
            <button
              type="button"
              aria-label={existingBookmark ? "Remove bookmark" : "Bookmark this point"}
              aria-pressed={Boolean(existingBookmark)}
              onClick={(e) => {
                e.stopPropagation();
                if (bookmarkPointT !== null) toggleBookmark(bookmarkPointT, near?.title);
              }}
              className={`flex size-6 shrink-0 items-center justify-center rounded ${existingBookmark ? "text-primary-base" : "text-white/70"}`}
            >
              {/* pointer-events-none so the SVG's own painted-area hit-testing (nothing registers
                  over the ribbon's notch or its corners) never wins over the button — every pixel
                  of the button's box always counts as a click, not just the drawn shape. */}
              <Icon name="bookmark" className="pointer-events-none size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function sparkPath(timeline: ReturnType<typeof useTimeline>["timeline"], liveEdge: number) {
  const rows = timeline.buckets;
  const step = Math.max(1, Math.floor(rows.length / 240));
  const pts: [number, number][] = [];
  for (let i = 0; i < rows.length; i += step) {
    pts.push([(rows[i].t / Math.max(1, liveEdge)) * 1000, 24 - (rows[i].hype_score / 100) * 22]);
  }
  if (!pts.length) return "";
  return "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L");
}
