import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Icon } from "../Icon";
import { formatDuration, formatViewers } from "../mock/api";
import { chatters, chatHypeLines, chatLines } from "../mock/chatIdentities";
import { useTimeline } from "./TimelineContext";
import { BUCKET_SECONDS, SHARE_PAD_SECONDS, categoryAt, type Moment, type Timeline } from "./data";
import { useStagePreview } from "./useStagePreview";

/*
  The clip viewer. Every point on the rail or the Highlights panel opens this, a recorded clip
  or a point built on the spot alike (TimelineContext.openClip / fromPoint). A recap plays a
  list of moments stories-style, one segmented bar per moment, auto-advancing. Opening it never
  pauses the main stream: TimelineContext already moved audio focus onto it before this mounts.
  Ported from kick-timeline-with-recap/js/clip.js.
*/

const SEGMENT_MS = 5000;
const FALLBACK_SECONDS = 30;

function pick<T>(list: T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

function replayRows(timeline: Timeline, from: number, span: number) {
  const rows: { id: number; username: string; content: string; stamp: string }[] = [];
  let id = 0;
  for (let i = 0; i < span && rows.length < 60; i++) {
    const bucket = timeline.bucketAt(from + i);
    const rate = bucket.messages_count / BUCKET_SECONDS;
    const count = Math.round(rate);
    for (let k = 0; k < count && rows.length < 60; k++) {
      const pool = bucket.hype_score > 70 ? chatHypeLines : chatLines;
      rows.push({ id: id++, username: pick(chatters).username, content: pick(pool), stamp: formatDuration(i) });
    }
  }
  return rows;
}

function ageText(liveEdge: number, t: number) {
  const minutes = Math.round((liveEdge - t) / 60);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
}

export function ClipViewer() {
  const { clipView, closeClip, stream, timeline, liveEdge, react, hasReacted, reactionsFor } =
    useTimeline();

  if (!clipView) return null;
  return (
    <ClipViewerInner
      clipView={clipView}
      closeClip={closeClip}
      stream={stream}
      timeline={timeline}
      liveEdge={liveEdge}
      react={react}
      hasReacted={hasReacted}
      reactionsFor={reactionsFor}
    />
  );
}

function ClipViewerInner({
  clipView,
  closeClip,
  stream,
  timeline,
  liveEdge,
  react,
  hasReacted,
  reactionsFor,
}: {
  clipView: { kind: "single"; moment: Moment } | { kind: "sequence"; moments: Moment[] };
  closeClip: () => void;
  stream: ReturnType<typeof useTimeline>["stream"];
  timeline: Timeline;
  liveEdge: number;
  react: (id: string) => void;
  hasReacted: (id: string) => boolean;
  reactionsFor: (m: Moment) => number;
}) {
  const sequence = clipView.kind === "sequence" ? clipView.moments : null;
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const clip = clipView.kind === "sequence" ? clipView.moments[sequenceIndex] : clipView.moment;
  const span = clip.duration || FALLBACK_SECONDS;

  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setElapsed(0);
    setPlaying(true);
    closeButtonRef.current?.focus();
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
    if (!sequence) return;
    const timer = window.setTimeout(() => {
      setSequenceIndex((i) => {
        if (i >= sequence.length - 1) {
          closeClip();
          return i;
        }
        return i + 1;
      });
    }, SEGMENT_MS);
    return () => window.clearTimeout(timer);
  }, [sequence, sequenceIndex, closeClip]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useStagePreview(canvasRef, timeline, clip.t + elapsed);

  const rows = useMemoRows(timeline, clip.t, span);
  const category = categoryAt(timeline, clip.t);
  const centre = clip.center ?? clip.t;
  const progress = (elapsed / span) * 100;

  function ratioFrom(clientX: number) {
    const box = trackRef.current?.getBoundingClientRect();
    if (!box) return 0;
    return Math.max(0, Math.min(1, (clientX - box.left) / box.width));
  }

  function onSeekDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setElapsed(ratioFrom(e.clientX) * span);
  }
  function onSeekMove(e: ReactPointerEvent<HTMLDivElement>) {
    const ratio = ratioFrom(e.clientX);
    setHoverRatio(ratio);
    if (e.buttons === 1) setElapsed(ratio * span);
  }

  function share() {
    const url = new URL(window.location.href);
    url.searchParams.set("clip_start", String(Math.max(0, Math.round(centre - SHARE_PAD_SECONDS))));
    url.searchParams.set("clip_end", String(Math.round(centre + SHARE_PAD_SECONDS)));
    navigator.clipboard?.writeText(url.toString()).then(() => {
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    });
  }

  function goPrev() {
    if (!sequence) return;
    setSequenceIndex((i) => Math.max(0, i - 1));
  }
  function goNext() {
    if (!sequence) return;
    if (sequenceIndex >= sequence.length - 1) {
      closeClip();
      return;
    }
    setSequenceIndex((i) => i + 1);
  }

  const liked = hasReacted(clip.id);

  return (
    <div className="fixed inset-0 z-popover flex items-center justify-center bg-black/75">
      <div
        onClick={closeClip}
        className="absolute inset-0"
        aria-hidden
      />
      <div className="relative flex h-[70vh] max-w-[92vw] overflow-hidden rounded-lg border border-light-16 bg-surface-lowest shadow-2xl">
        <div className="group/clip relative aspect-video h-full bg-black">
          <canvas ref={canvasRef} className="h-full w-full" />

          {sequence && (
            <div className="absolute inset-x-3 top-3 flex gap-1">
              {sequence.map((_, i) => (
                <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                  <span
                    className="block h-full bg-white transition-[width]"
                    style={{
                      width:
                        i < sequenceIndex ? "100%" : i === sequenceIndex ? `${progress}%` : "0%",
                    }}
                  />
                </span>
              ))}
            </div>
          )}

          {sequence && (
            <>
              <button
                type="button"
                aria-label="Previous"
                onClick={goPrev}
                className="absolute inset-y-0 left-0 w-1/3"
              />
              <button
                type="button"
                aria-label="Next"
                onClick={goNext}
                className="absolute inset-y-0 right-0 w-2/3"
              />
            </>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-1 bg-gradient-to-b from-black/80 to-transparent px-4 py-3 text-white">
            <div className="flex items-center gap-1.5 text-sm font-bold">
              <span>{clip.title}</span>
              <span>•</span>
              <span>{category.name}</span>
            </div>
            <div className="text-xs font-medium text-white/80">
              {clip.byline} • {formatViewers(clip.view_count ?? clip.viewer_count)} Views •{" "}
              {ageText(liveEdge, clip.t)}
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close"
            onClick={closeClip}
            className="pointer-events-auto absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded bg-black/50 text-white"
          >
            <Icon name="close" className="size-4" />
          </button>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 opacity-0 transition-opacity duration-150 group-hover/clip:pointer-events-auto group-hover/clip:opacity-100">
            <div
              ref={trackRef}
              role="slider"
              aria-label="Seek"
              aria-valuenow={Math.round(progress)}
              onPointerDown={onSeekDown}
              onPointerMove={onSeekMove}
              onPointerLeave={() => setHoverRatio(null)}
              className="group/seek relative -top-5 h-4 w-full cursor-pointer touch-none"
            >
              <span className="absolute bottom-0 left-0 h-1 w-full bg-white/30 group-hover/seek:h-1.5">
                <span className="absolute h-full bg-primary-base" style={{ width: `${progress}%` }} />
                {hoverRatio !== null && (
                  <span
                    className="absolute h-full bg-white/40"
                    style={{ width: `${hoverRatio * 100}%` }}
                  />
                )}
              </span>
              {hoverRatio !== null && (
                <span
                  className="absolute bottom-2 -translate-x-1/2 rounded bg-black/70 px-1 text-[11px] font-semibold tabular-nums text-white"
                  style={{ left: `${hoverRatio * 100}%` }}
                >
                  -{formatDuration(Math.round(span - hoverRatio * span))}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent px-2 py-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={playing ? "Pause" : "Play"}
                  onClick={() => setPlaying((p) => !p)}
                  className="flex size-9 items-center justify-center rounded text-white [&_svg]:size-4"
                >
                  <Icon name={playing ? "pause" : "play"} />
                </button>
                <button
                  type="button"
                  aria-label={muted ? "Unmute" : "Mute"}
                  onClick={() => setMuted((m) => !m)}
                  className="flex size-9 items-center justify-center rounded text-white [&_svg]:size-4"
                >
                  <Icon name={muted ? "mute" : "volume"} />
                </button>
                <span className="text-xs font-semibold tabular-nums text-white">
                  {formatDuration(Math.round(elapsed))} / {formatDuration(span)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-[340px] shrink-0 flex-col gap-3 bg-surface-base p-3.5">
          <div className="flex items-center gap-3">
            <span
              className="flex size-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-black"
              style={{ background: "var(--color-primary-base)" }}
            >
              {stream.channel.username.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="truncate text-base font-bold text-white">
                {stream.channel.username}
              </div>
              <div className="truncate text-sm text-white/80">{stream.session_title}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Share"
              onClick={share}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded bg-secondary-base text-sm font-semibold text-white"
            >
              <Icon name="share" className="size-4" />
              {shareCopied ? "Copied" : "Share"}
            </button>
            <button
              type="button"
              aria-label={liked ? "Liked" : "Like this clip"}
              aria-pressed={liked}
              onClick={() => react(clip.id)}
              className={`flex h-9 items-center justify-center gap-1.5 rounded bg-secondary-base px-3 text-sm font-semibold ${liked ? "text-red-400" : "text-white"}`}
            >
              <Icon name={liked ? "heart-filled" : "heart"} className="size-4" />
              {reactionsFor(clip).toLocaleString()}
            </button>
          </div>

          <hr className="border-t-2 border-t-[#24272C]" />

          <div className="no-scrollbar flex min-h-0 grow flex-col gap-0.5 overflow-y-auto text-sm">
            {rows.map((row) => (
              <div key={row.id} className="break-words rounded-lg px-2 py-1">
                <span className="pr-1 font-semibold tabular-nums text-white/60">{row.stamp}</span>
                <span className="font-bold text-white">{row.username}</span>
                <span className="font-bold text-white">: </span>
                <span className="font-normal text-white/90">{row.content}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function useMemoRows(timeline: Timeline, from: number, span: number) {
  const ref = useRef<{ from: number; span: number; rows: ReturnType<typeof replayRows> } | null>(
    null,
  );
  if (!ref.current || ref.current.from !== from || ref.current.span !== span) {
    ref.current = { from, span, rows: replayRows(timeline, from, span) };
  }
  return ref.current.rows;
}
