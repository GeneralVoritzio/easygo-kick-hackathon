import { useState } from 'react';
import { Link } from 'react-router';
import { Pause, Play, Star } from 'lucide-react';
import type { FeaturedStreamer } from '../types';
import { usePinnedStreams } from '../context/PinnedStreamsContext';
import { StreamSurface } from './StreamSurface';
import { PinButton } from './PinButton';

interface FeaturedHeroProps {
  featured: FeaturedStreamer;
}

/** The homepage hero: one streamer featured for the whole week, rotating on
 *  a weekly cadence (see `mock/featured.ts`). This is the single
 *  highest-visibility slot on the page, so it always gets a real live
 *  embed rather than a placeholder.
 *
 *  Autoplays muted — there's no separate "Watch now" button, the video is
 *  just already playing. "Pausing" here means unmounting the live embed in
 *  favour of a static, dimmed frame (there's no postMessage API into a
 *  cross-origin Kick embed to actually pause it), and "Continue watching"
 *  remounts it — the same play/pause split every other browser video
 *  control has, just implemented as swapping what's mounted instead of
 *  calling `.pause()` on something we don't own. The video area itself is
 *  still a link through to the full watch page, same as any other card. */
export function FeaturedHero({ featured }: FeaturedHeroProps) {
  const { card, weekLabel, blurb } = featured;
  const { isPinned, togglePin, canPinMore } = usePinnedStreams();
  const [paused, setPaused] = useState(false);

  return (
    <section className="relative mx-4 mt-4 overflow-hidden rounded-2xl border border-line sm:mx-6 sm:mt-6">
      <Link to={`/watch/${card.id}`} className="relative block aspect-[21/9] w-full sm:aspect-[3/1]">
        <StreamSurface card={card} muted size="player" playing={!paused} />
        {paused && (
          <div className="absolute inset-0 flex items-center justify-center bg-page/60 backdrop-blur-sm">
            <span className="rounded-full border border-line bg-page/70 px-3 py-1 text-xs text-ink-muted">Paused</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-page via-page/40 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-page/80 via-transparent to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 sm:p-8">
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-kick/50 bg-page/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-kick backdrop-blur-sm">
            <Star size={12} strokeWidth={2.5} fill="currentColor" />
            Featured streamer · {weekLabel}
          </span>

          <h1 className="text-2xl font-extrabold text-ink-bright sm:text-4xl">{card.name}</h1>
          <p className="max-w-xl text-sm text-ink sm:text-base">{blurb}</p>

          <div className="flex items-center gap-3 pt-1">
            {paused ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setPaused(false);
                }}
                className="flex items-center gap-2 rounded-lg bg-kick px-4 py-2 text-sm font-bold text-page transition-colors hover:bg-kick-hover"
              >
                <Play size={16} strokeWidth={2.5} fill="currentColor" />
                Continue watching
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setPaused(true);
                }}
                className="flex items-center gap-2 rounded-lg border border-line bg-page/70 px-4 py-2 text-sm font-bold text-ink-bright backdrop-blur-sm transition-colors hover:bg-raised"
              >
                <Pause size={16} strokeWidth={2.5} fill="currentColor" />
                Pause
              </button>
            )}
            <PinButton
              pinned={isPinned(card.id)}
              disabled={!canPinMore}
              streamName={card.name}
              onToggle={() => togglePin(card.id)}
            />
          </div>
        </div>
      </Link>
    </section>
  );
}
