import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { LiveStream } from '@shared/types';
import { ChannelBadge } from '@shared/components';
import { StreamSurface } from './StreamSurface';
import { AudioFocusButton } from './AudioFocusButton';
import { StreamSignalLabel } from './StreamSignalLabel';
import { StreamTagPills } from './StreamTagPills';
import { useLongPress } from './useLongPress';

const SWIPE_THRESHOLD = 70;
const PIN_HOLD_MS = 500;

interface DiscoveryTileProps {
  stream: LiveStream;
  isAudioActive: boolean;
  canPin: boolean;
  onPin: () => void;
  onNext: () => void;
  onPrev: () => void;
  onTapAudio: () => void;
  onOpen: () => void;
}

/** The full-screen "browse" tile: swipe up/down (drag) to move to the
 *  next/previous live channel, tap to open it fullscreen with chat,
 *  press-and-hold to pin the current channel to the side dock without
 *  leaving discovery, and the 🔊/🔇 button to move audio focus here without
 *  leaving discovery either. Keyed by `stream.id` at the call site so a
 *  fresh tile (and fresh drag/hold state) mounts on every swipe/pin rather
 *  than reusing stale gesture state for a new stream.
 *
 *  Framer's `onTap` doesn't automatically get cancelled by a `drag` gesture
 *  on the same element — a swipe that ends near the release point can still
 *  register as a tap. `draggedRef` tracks whether *any* drag happened during
 *  the current press so `onTap` can ignore it; it only resets on the next
 *  `onPointerDown`, so it stays true for the whole gesture even after
 *  `dragSnapToOrigin` animates the tile back to center.
 *
 *  `touch-pan-x` (not `touch-none`) on the root: it disables native
 *  pinch-zoom and vertical panning here (so our own `drag="y"` owns vertical
 *  swipes) while still letting a horizontal swipe starting on this tile fall
 *  through natively to the tab pager above it. */
export function DiscoveryTile({ stream, isAudioActive, canPin, onPin, onNext, onPrev, onTapAudio, onOpen }: DiscoveryTileProps) {
  const draggedRef = useRef(false);
  const { holding, cancel, handlers } = useLongPress(() => {
    if (canPin) onPin();
  }, PIN_HOLD_MS);

  return (
    <motion.div
      className="relative h-full w-full touch-pan-x overflow-hidden rounded-lg border border-line"
      drag="y"
      dragElastic={0.5}
      dragSnapToOrigin
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragStart={() => {
        cancel();
        draggedRef.current = true;
      }}
      onDragEnd={(_, info) => {
        if (info.offset.y < -SWIPE_THRESHOLD) onNext();
        else if (info.offset.y > SWIPE_THRESHOLD) onPrev();
      }}
      onTap={() => {
        if (!draggedRef.current) onOpen();
      }}
      onPointerDown={(e) => {
        draggedRef.current = false;
        handlers.onPointerDown(e);
      }}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerLeave={handlers.onPointerLeave}
      onPointerCancel={handlers.onPointerCancel}
    >
      <StreamSurface stream={stream} muted={!isAudioActive} />

      <motion.div
        className="pointer-events-none absolute inset-0 rounded-lg ring-4 ring-kick"
        initial={{ opacity: 0 }}
        animate={{ opacity: holding ? 1 : 0 }}
        transition={{ duration: holding ? PIN_HOLD_MS / 1000 : 0.15, ease: holding ? 'easeOut' : 'easeIn' }}
      />
      {holding && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
          <span className="rounded-full bg-page/80 px-3 py-1 text-xs font-bold text-kick">
            Hold to pin…
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-page/80 to-transparent p-3">
        <ChannelBadge channel={stream} />
        <AudioFocusButton
          isAudioActive={isAudioActive}
          streamName={stream.name}
          onFocus={onTapAudio}
          className="pointer-events-auto"
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-page/85 to-transparent p-3">
        <StreamTagPills tags={stream.tags} />
        {stream.signal && <StreamSignalLabel signal={stream.signal} className="mt-1 text-xs" />}
        <div className="mt-1 text-[10px] text-ink-muted">
          Tap to watch · speaker icon for audio · Swipe up for next{canPin ? ' · Hold to pin' : ''}
        </div>
      </div>
    </motion.div>
  );
}
