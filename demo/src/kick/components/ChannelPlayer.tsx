import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Icon } from "../Icon";
import type { Livestream } from "../mock/api";

function formatElapsed(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function trackPercent(e: ReactMouseEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  return Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
}

const controlButtonClass =
  "flex size-11 shrink-0 items-center justify-center rounded bg-transparent text-white state-layer-surface [&_svg]:size-4 [&_svg]:fill-current";

export function ChannelPlayer({ stream }: { stream: Livestream }) {
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [seek, setSeek] = useState(92);
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.now() - new Date(stream.started_at).getTime()) / 1000)),
  );

  useEffect(() => {
    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - new Date(stream.started_at).getTime()) / 1000)));
  }, [stream.started_at]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [playing]);

  const displayVolume = muted ? 0 : volume;

  return (
    <div className="group/player z-player relative aspect-video w-full shrink-0 overflow-hidden bg-black">
      <img
        src={stream.thumbnail}
        alt={stream.session_title}
        className="h-full w-full object-cover"
      />

      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150 betterhover:group-hover/player:pointer-events-auto betterhover:group-hover/player:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100">
        <div className="group/seek absolute inset-x-0 bottom-14 flex h-4 items-center">
          <div
            role="slider"
            aria-label="Loaded progress"
            aria-valuenow={Math.round(seek)}
            aria-valuemin={0}
            aria-valuemax={100}
            onClick={(e) => setSeek(trackPercent(e))}
            className="relative h-1 w-full cursor-pointer rounded-full bg-white/20 transition-[height] duration-150 betterhover:group-hover/seek:h-1.5"
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 w-full rounded-full bg-white/50" />
            <div
              className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-primary-base"
              style={{ width: `${seek}%` }}
            />
            <div
              className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-base opacity-0 transition-opacity betterhover:group-hover/seek:opacity-100 before:absolute before:-inset-2 before:content-['']"
              style={{ left: `${seek}%` }}
            />
          </div>
        </div>

        <div className="absolute inset-x-5 bottom-5 flex h-11 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              aria-label={playing ? "Pause" : "Play"}
              onClick={() => setPlaying((p) => !p)}
              className={controlButtonClass}
            >
              <Icon name={playing ? "pause" : "play"} />
            </button>

            <button
              type="button"
              aria-label={muted ? "Unmute" : "Mute"}
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
              onClick={(e) => {
                const v = Math.round(trackPercent(e));
                setVolume(v);
                setMuted(v === 0);
              }}
              className="relative h-1 w-20 shrink-0 cursor-pointer rounded-full bg-white/30"
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

            <span className="ml-1 shrink-0 text-sm font-semibold leading-none text-white">
              {formatElapsed(elapsedSeconds)}
            </span>

            <div className="ml-2 flex shrink-0 items-center gap-1.5">
              <span className="size-2 shrink-0 rounded-full bg-green-500" />
              <span className="text-sm font-semibold leading-none text-white">LIVE</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button type="button" aria-label="Picture in picture" className={controlButtonClass}>
              <Icon name="pip" />
            </button>
            <button
              type="button"
              aria-label="Clip"
              className="flex h-11 shrink-0 items-center gap-1.5 rounded px-3 text-sm font-semibold text-white state-layer-surface [&_svg]:size-4 [&_svg]:fill-current"
            >
              <Icon name="clip" />
              Clip
            </button>
            <button type="button" aria-label="Theatre mode" className={controlButtonClass}>
              <Icon name="theatre" />
            </button>
            <button type="button" aria-label="Full screen" className={controlButtonClass}>
              <Icon name="fullscreen" />
            </button>
            <button type="button" aria-label="Settings" className={controlButtonClass}>
              <Icon name="settings" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
