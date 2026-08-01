import { useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "../Icon";
import { useAudibleEmbed, useEmbedTarget } from "../events/EmbedLayer";
import { embedUrlFor } from "../events/embeds";
import { useEvent } from "../events/EventProvider";
import { StreamFootage } from "../events/StreamFootage";
import type { Livestream } from "../mock/api";
import type { KickEvent } from "../mock/events";
import { RaidStage } from "./RaidStage";

function formatElapsed(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
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

function liveSeconds(startedAt: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
}

export function ChannelPlayer({ stream, event }: { stream: Livestream; event?: KickEvent }) {
  const { openMultiview, liveEmbeds } = useEvent();
  const embedUrl = liveEmbeds ? embedUrlFor(stream.channel.slug, false) : undefined;
  const embedRef = useEmbedTarget(embedUrl ? stream.channel.slug : undefined);
  useAudibleEmbed(embedUrl ? stream.channel.slug : undefined);
  const [params] = useSearchParams();
  const startAt = Number(params.get("t"));
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    startAt > 0 ? startAt : liveSeconds(stream.started_at),
  );
  const [seek, setSeek] = useState(() =>
    startAt > 0 ? Math.min(100, (startAt / liveSeconds(stream.started_at)) * 100) : 100,
  );

  useEffect(() => {
    setElapsedSeconds(startAt > 0 ? startAt : liveSeconds(stream.started_at));
  }, [stream.started_at, startAt]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [playing]);

  const displayVolume = muted ? 0 : volume;

  return (
    <div className="relative block w-full shrink-0 overflow-hidden bg-black max-h-[calc(100vh-var(--navbar-height)-var(--channel-info-height))] supports-[height:100dvh]:max-h-[calc(100dvh-var(--navbar-height)-var(--channel-info-height))]">
      {/* The stills are graded down (saturate 0.42), so the glow puts it back to clear the black wrapper. */}
      <img
        src={stream.thumbnail}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-[64px] saturate-[2.2] brightness-[1.6]"
      />

      <div
        id="injected-channel-player"
        className={`group/player z-player relative m-auto aspect-video max-h-full max-w-full ${
          embedUrl ? "" : "bg-black"
        }`}
      >
      {embedUrl ? (
        <>
          {/* The z-player container paints above the embed layer, so the video
              area stays transparent and the frame shows through it. */}
          <div ref={embedRef} className="h-full w-full" />
          <RaidStage />
          <div className="z-controls absolute right-3 top-3">
            <button
              type="button"
              onClick={() => openMultiview(stream.channel.slug, event?.event_id)}
              className="flex items-center gap-1.5 rounded bg-surface-base/90 px-3 py-2 text-sm font-semibold text-white betterhover:hover:bg-surface-highest"
            >
              <Icon name="browse" className="size-4 fill-current" />
              Multiview
            </button>
          </div>
        </>
      ) : (
      <>
      <StreamFootage
        stream={stream}
        paused={!playing}
        muted={muted}
        className="h-full w-full object-contain brightness-125"
      />

      <RaidStage />

      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150 betterhover:group-hover/player:pointer-events-auto betterhover:group-hover/player:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100">
        <div className="z-controls absolute inset-x-0 bottom-0 flex h-11 flex-row items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent px-2 xl:px-5">
          <div className="group/seekbar absolute -top-7 left-0 flex h-5 w-full items-end">
            <div
              role="slider"
              aria-label="Loaded progress"
              aria-valuenow={Math.round(seek)}
              aria-valuemin={0}
              aria-valuemax={100}
              {...dragProps(setSeek)}
              className="relative h-1 w-full touch-none cursor-pointer overflow-visible bg-white/30 transition-[height] duration-150 betterhover:group-hover/seekbar:h-1.5"
            >
              <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-subtle/50" />
              <div
                className="pointer-events-none absolute inset-y-0 left-0 bg-primary-base"
                style={{ width: `${seek}%` }}
              />
              <div
                className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-base opacity-0 transition-opacity betterhover:group-hover/seekbar:opacity-100 before:absolute before:-inset-2 before:content-['']"
                style={{ left: `${seek}%` }}
              />
            </div>
          </div>

          <div className="flex min-w-0 items-center">
            <button
              type="button"
              aria-label={playing ? "Pause (space)" : "Play (space)"}
              onClick={() => setPlaying((p) => !p)}
              className={`tooltip-start ${controlButtonClass}`}
            >
              <Icon name={playing ? "pause" : "play"} />
            </button>

            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label={muted ? "Unmute (m)" : "Mute (m)"}
                onClick={() => setMuted((m) => !m)}
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
              {formatElapsed(elapsedSeconds)}
            </span>

            <div className="flex h-5 shrink-0 items-center gap-1.5 px-2">
              {/* Behind the live edge the dot goes grey, KICK's neon-highlight-base. The text stays LIVE. */}
              <span
                className={`size-2 shrink-0 rounded-full ${playing && seek >= 100 ? "bg-green-500" : "bg-[#3f4448]"}`}
              />
              <span className="text-sm font-semibold leading-none text-white">LIVE</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center">
            <button
              type="button"
              aria-label="Multiview"
              onClick={() => openMultiview(stream.channel.slug, event?.event_id)}
              className={controlButtonClass}
            >
              <Icon name="browse" />
            </button>
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
      </>
      )}
      </div>
    </div>
  );
}
