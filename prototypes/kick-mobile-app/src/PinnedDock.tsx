import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { LiveStream } from '@shared/types';
import { StreamSurface } from './StreamSurface';
import { AudioFocusButton } from './AudioFocusButton';

interface PinnedDockProps {
  streams: LiveStream[];
  audioActiveId: string | null;
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
export function PinnedDock({ streams, audioActiveId, onTapAudio, onOpen, onUnpin }: PinnedDockProps) {
  if (streams.length === 0) return null;

  return (
    <div className="flex h-full w-28 shrink-0 touch-pan-x flex-col gap-1.5">
      <AnimatePresence>
        {streams.map((stream) => {
          const isAudioActive = audioActiveId === stream.id;
          return (
            <motion.div
              key={stream.id}
              layout
              initial={{ opacity: 0, scale: 0.4, x: -32 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
              className="relative min-h-0 flex-1 overflow-hidden rounded-md border border-line"
              onTap={() => onOpen(stream)}
            >
              <StreamSurface stream={stream} muted={!isAudioActive} />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-page/70 px-1 py-0.5 text-[9px] font-bold text-ink-bright">
                {stream.name}
              </div>

              <AudioFocusButton
                isAudioActive={isAudioActive}
                streamName={stream.name}
                onFocus={() => onTapAudio(stream.id)}
                size="sm"
                className="absolute left-1 top-1"
              />
              <button
                type="button"
                onPointerDownCapture={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onUnpin(stream.id);
                }}
                aria-label={`Unpin ${stream.name}`}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-page/70 text-ink"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
