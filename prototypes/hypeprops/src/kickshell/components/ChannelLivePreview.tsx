import { useState } from "react";
import { Link } from "react-router";
import { Icon } from "../Icon";
import { formatViewers, type Livestream } from "../mock/api";

export function ChannelLivePreview({ stream }: { stream: Livestream }) {
  const [muted, setMuted] = useState(true);

  return (
    <div className="relative block h-[320px] w-full shrink-0 overflow-hidden bg-black">
      <div className="relative m-auto aspect-video max-h-full max-w-full bg-black">
        <img
          src={stream.thumbnail}
          alt={stream.session_title}
          className="h-full w-full object-contain opacity-60"
        />
      </div>
      <div className="absolute left-4 top-7 flex h-[264px] w-[370px] flex-col items-start justify-center gap-4 overflow-hidden rounded bg-surface-base p-5">
        <div className="rounded bg-[#070809] px-2 py-0.5 text-green-400">
          <span className="text-sm font-bold uppercase leading-[1.2]">Live</span>
        </div>

        <div className="flex w-full justify-between gap-4">
          <span className="line-clamp-2 overflow-hidden text-ellipsis font-bold leading-[1.2] text-white">
            {stream.session_title}
          </span>
          <button
            type="button"
            aria-label={muted ? "Unmute" : "Mute"}
            onClick={() => setMuted((v) => !v)}
            className="flex size-8 shrink-0 items-center justify-center rounded text-white state-layer-surface"
          >
            <Icon name={muted ? "mute" : "volume"} className="size-3.5 fill-current" />
          </button>
        </div>

        <div className="flex items-center gap-1 text-sm font-bold">
          <Icon name="chatters" className="size-4 shrink-0 text-subtle" />
          <span className="text-subtle">
            <span className="text-primary-base">{formatViewers(stream.viewer_count)}</span> watching
          </span>
        </div>

        <Link
          to={`/${stream.channel.slug}`}
          className="inline-flex h-10 w-full select-none items-center justify-center gap-1.5 whitespace-nowrap rounded bg-primary-base text-base font-semibold text-primary-onPrimary transition-all state-layer-base betterhover:active:scale-[0.98]"
        >
          <Icon name="play" className="size-4 fill-current" />
          Watch now
        </Link>
      </div>
    </div>
  );
}
