import { useEffect, type PointerEvent as ReactPointerEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "../Icon";
import { formatDuration, type Livestream } from "../mock/api";
import { useTimeline } from "../timeline/TimelineContext";
import { TimelineRail } from "../timeline/TimelineRail";

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

export function ChannelPlayer({ stream }: { stream: Livestream }) {
  const [params] = useSearchParams();
  const startAt = Number(params.get("t"));
  const {
    t,
    isPlaying,
    isFollowingLive,
    togglePlay,
    seek,
    muted,
    setMuted,
    volume,
    setVolume,
    highlightsOpen,
    toggleHighlights,
  } = useTimeline();

  useEffect(() => {
    if (startAt > 0) seek(startAt);
    // Applied once, from the URL this page mounted with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayVolume = muted ? 0 : volume;

  return (
    <div className="relative block w-full shrink-0 bg-black max-h-[calc(100vh-var(--navbar-height)-var(--channel-info-height))] supports-[height:100dvh]:max-h-[calc(100dvh-var(--navbar-height)-var(--channel-info-height))]">
      {/* The stills are graded down (saturate 0.42), so the glow puts it back to clear the black
          wrapper. Clipped in its own layer, not on the root: the root has to stay overflow-visible
          or the timeline's hover card (which pops up above the rail, inside #injected-channel-player)
          gets cut off by it whenever the video is short enough for the card to reach the top edge. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src={stream.thumbnail}
          alt=""
          aria-hidden
          className="h-full w-full scale-125 object-cover opacity-50 blur-[64px] saturate-[2.2] brightness-[1.6]"
        />
      </div>

      <div
        id="injected-channel-player"
        className="group/player z-player relative m-auto aspect-video max-h-full max-w-full bg-black"
      >
      <img
        src={stream.thumbnail}
        alt={stream.session_title}
        className="h-full w-full object-contain brightness-125"
      />

      {/* The Highlights panel forces this on regardless of hover, the same way pausing does,
          so the rail and its glowing notches stay on screen while a viewer is browsing
          highlights in the chat column rather than needing a hover on the video too. */}
      <div
        className={`absolute inset-0 transition-opacity duration-150 focus-within:pointer-events-auto focus-within:opacity-100 ${
          highlightsOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0 betterhover:group-hover/player:pointer-events-auto betterhover:group-hover/player:opacity-100"
        }`}
      >
        <div className="z-controls absolute inset-x-0 bottom-0 flex h-11 flex-row items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent px-2 xl:px-5">
          <TimelineRail />

          <div className="flex min-w-0 items-center">
            <button
              type="button"
              aria-label={isPlaying ? "Pause (space)" : "Play (space)"}
              onClick={togglePlay}
              className={`tooltip-start ${controlButtonClass}`}
            >
              <Icon name={isPlaying ? "pause" : "play"} />
            </button>

            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label={muted ? "Unmute (m)" : "Mute (m)"}
                onClick={() => setMuted(!muted)}
                className={controlButtonClass}
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
                  setMuted(v === 0);
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
            </div>

            <span className="shrink-0 px-2 text-sm font-bold leading-5 text-white">
              {formatDuration(Math.round(t))}
            </span>

            <div className="flex h-5 shrink-0 items-center gap-1.5 px-2">
              {/* Behind the live edge the dot goes grey, KICK's neon-highlight-base. The text stays LIVE. */}
              <span
                className={`size-2 shrink-0 rounded-full ${isPlaying && isFollowingLive ? "bg-green-500" : "bg-[#3f4448]"}`}
              />
              <span className="text-sm font-semibold leading-none text-white">LIVE</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center">
            <button type="button" aria-label="Picture in Picture" className={controlButtonClass}>
              <Icon name="pip" />
            </button>
            <button
              type="button"
              aria-label="Clip (c)"
              className="tooltip-top mx-2 flex h-11 shrink-0 items-center gap-1 rounded text-sm font-semibold text-white [&_svg]:size-5 [&_svg]:fill-current"
            >
              <Icon name="clip" />
              Clip
            </button>
            <button
              type="button"
              aria-pressed={highlightsOpen}
              aria-label="Highlights (t)"
              onClick={toggleHighlights}
              className={`tooltip-top mx-2 flex h-11 shrink-0 items-center gap-1 rounded text-sm font-semibold [&_svg]:size-5 [&_svg]:fill-current ${
                highlightsOpen ? "text-primary-base" : "text-white"
              }`}
            >
              <Icon name="timeline" />
              Highlights
            </button>
            <button type="button" aria-label="Captions (p)" className={controlButtonClass}>
              <Icon name="closed-captions" />
            </button>
            <button type="button" aria-label="Theatre Mode (t)" className={controlButtonClass}>
              <Icon name="theatre" />
            </button>
            <button type="button" aria-label="Fullscreen (f)" className={controlButtonClass}>
              <Icon name="fullscreen" />
            </button>
            <button type="button" aria-label="Quality" className={`tooltip-end ${controlButtonClass}`}>
              <Icon name="settings" />
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
