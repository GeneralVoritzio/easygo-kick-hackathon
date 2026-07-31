import type { LiveStream } from '@shared/types';
import { StreamSurface } from './StreamSurface';

interface DiscoveryVideoRingProps {
  /** The discovery queue, in swipe order. */
  streams: LiveStream[];
  currentStreamId: string;
  audioActiveId: string | null;
  active: boolean;
}

/** Keeps the discovery queue's immediate neighbours (one swipe back, one
 *  swipe forward) preloaded in hidden `StreamSurface`s, so swiping to them
 *  shows an already-loaded video instead of mounting a cold `<iframe>` and
 *  showing the loading gradient again. Every surface here is keyed by
 *  stream id and stays mounted for as long as it's within one step of
 *  current, so a stream that was "next" a moment ago and just became
 *  current never remounts — it's the same `<iframe>`, just now visible.
 *  `DiscoveryTile` itself owns no video for exactly this reason: it remounts
 *  on every swipe (deliberately, to reset its gesture state), which would
 *  throw away any preloading done inside it. */
export function DiscoveryVideoRing({ streams, currentStreamId, audioActiveId, active }: DiscoveryVideoRingProps) {
  const currentIndex = streams.findIndex((s) => s.id === currentStreamId);
  if (currentIndex === -1) return null;

  const neighbours = [-1, 0, 1].map(
    (offset) => streams[((currentIndex + offset) % streams.length + streams.length) % streams.length]
  );
  const seen = new Set<string>();
  const uniqueWindow: LiveStream[] = [];
  for (const s of neighbours) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    uniqueWindow.push(s);
  }

  return (
    <>
      {uniqueWindow.map((s) => {
        const isCurrent = s.id === currentStreamId;
        return (
          <div
            key={s.id}
            className={`pointer-events-none absolute inset-0 ${isCurrent ? '' : 'opacity-0'}`}
            aria-hidden={!isCurrent}
          >
            <StreamSurface stream={s} muted={audioActiveId !== s.id} active={active} />
          </div>
        );
      })}
    </>
  );
}
