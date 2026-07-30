import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { formatViewers, liveStreamFor } from "../mock/api";

// An achievement-style toast, top-centre. Stays up until the streamer dismisses it or jumps
// into the stream themselves, so nobody has to read it against a clock. Section 4: the raid
// reminder's own X sits top-right of its card, this one sits left because the card ends in a
// call to action (Jump in) instead, and that stays the right-hand anchor.
export function BackFromBreakToast({
  message,
  slug,
  onDone,
}: {
  message: string;
  slug: string;
  onDone: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const stream = liveStreamFor(slug);

  function dismiss() {
    setLeaving(true);
    setTimeout(onDone, 300);
  }

  return (
    <div className="z-popover fixed inset-x-0 top-[calc(var(--navbar-height)+16px)] flex justify-center px-4">
      <div
        className={`relative flex w-full max-w-md items-center gap-1 overflow-hidden rounded-2xl border border-primary-base/30 bg-surface-base p-2 shadow-2xl transition-all duration-300 ${
          leaving ? "-translate-y-2 scale-95 opacity-0" : "animate-toast-in opacity-100"
        }`}
      >
        <div className="animate-pick-glow pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(83,252,24,0.45),transparent_75%)]" />
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="state-layer-surface relative flex size-7 shrink-0 items-center justify-center rounded-full text-surface-onSurfaceSecondary"
        >
          <Icon name="close" className="size-3" />
        </button>

        <Link
          to={`/${slug}`}
          onClick={dismiss}
          className="group/toast state-layer-base relative flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 transition-transform duration-200 betterhover:hover:scale-[1.015]"
        >
          <div className="relative aspect-video h-12 w-auto shrink-0 overflow-hidden rounded-lg bg-black ring-2 ring-primary-base/50">
            {stream && (
              <img src={stream.thumbnail} alt="" className="h-full w-full object-cover" />
            )}
            <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-black/70 px-1 py-0.5 text-[7px] font-bold uppercase leading-none text-primary-base">
              <span className="size-1 shrink-0 animate-pulse rounded-full bg-primary-base" />
              Live
            </span>
            {stream && !stream.hide_viewer_count && (
              <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[7px] font-bold leading-none text-white">
                {formatViewers(stream.viewer_count)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase leading-none tracking-wide text-primary-base">
              5.5K+ Watching Now
            </span>
            <span className="mt-1.5 block text-sm font-semibold leading-snug text-white">{message}</span>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary-base py-2 pl-4 pr-3 text-xs font-bold text-primary-onPrimary shadow-[0_0_16px_-2px_rgba(83,252,24,0.7)] transition-transform duration-200 betterhover:group-hover/toast:translate-x-0.5">
            Jump in
            <Icon
              name="chevron-right"
              className="size-2.5 shrink-0 transition-transform duration-200 betterhover:group-hover/toast:translate-x-0.5"
            />
          </span>
        </Link>
      </div>
    </div>
  );
}
