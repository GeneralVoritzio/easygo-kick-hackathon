import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { LiveStream } from '@shared/types';
import { StreamSurface } from './StreamSurface';
import { AudioFocusButton } from './AudioFocusButton';
import { useHypeMeter } from './useHypeMeter';
import { HypeIndicator } from './HypeIndicator';

interface PinnedDockProps {
  streams: LiveStream[];
  audioActiveId: string | null;
  active: boolean;
  onTapAudio: (id: string) => void;
  onOpen: (stream: LiveStream) => void;
  onUnpin: (id: string) => void;
}

/** The side strip of pinned channels — each keeps playing (muted, unless it
 *  currently has audio focus) while the discovery feed continues in the
 *  rest of the screen. Tap a thumbnail to open it fullscreen with chat; the
 *  speaker button moves audio focus here without leaving discovery, and the
 *  X unpins it. New pins slide in from the discovery side rather than a
 *  literal shared-element flight: iframes reflow badly mid-animation, so
 *  this reads as "snapping into place" without fighting the embed's own
 *  layout. */
export function PinnedDock({ streams, audioActiveId, active, onTapAudio, onOpen, onUnpin }: PinnedDockProps) {
  if (streams.length === 0) return null;

  return (
    <div className="flex h-full w-28 shrink-0 touch-pan-x flex-col gap-1.5">
      <AnimatePresence>
        {streams.map((stream) => (
          <PinnedThumbnail
            key={stream.id}
            stream={stream}
            isAudioActive={audioActiveId === stream.id}
            active={active}
            onTapAudio={() => onTapAudio(stream.id)}
            onOpen={() => onOpen(stream)}
            onUnpin={() => onUnpin(stream.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface PinnedThumbnailProps {
  stream: LiveStream;
  isAudioActive: boolean;
  active: boolean;
  onTapAudio: () => void;
  onOpen: () => void;
  onUnpin: () => void;
}

function PinnedThumbnail({ stream, isAudioActive, active, onTapAudio, onOpen, onUnpin }: PinnedThumbnailProps) {
  const isHyping = useHypeMeter(stream.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.4, x: -32 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.4 }}
      transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
      className="relative min-h-0 flex-1 overflow-hidden rounded-md border border-line"
      onTap={onOpen}
    >
      <StreamSurface stream={stream} muted={!isAudioActive} active={active} />

      <img
        src={stream.avatarUrl}
        alt={stream.name}
        className="pointer-events-none absolute bottom-1 left-1 h-6 w-6 rounded-full border-2 border-page/70 object-cover"
      />

      {!isAudioActive && isHyping && (
        <HypeIndicator size="sm" className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2" />
      )}

      <AudioFocusButton
        isAudioActive={isAudioActive}
        streamName={stream.name}
        onFocus={onTapAudio}
        size="sm"
        className="absolute left-1 top-1"
      />
      <button
        type="button"
        onPointerDownCapture={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onUnpin();
        }}
        aria-label={`Unpin ${stream.name}`}
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-page/70 text-ink"
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </motion.div>
  );
}
