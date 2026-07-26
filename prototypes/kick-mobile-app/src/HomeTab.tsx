import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useLiveStreams } from '@shared/hooks/useLiveStreams';
import type { LiveStream } from '@shared/types';
import { DiscoveryTile } from './DiscoveryTile';
import { PinnedDock } from './PinnedDock';
import { MosaicGrid } from './MosaicGrid';
import { StreamSurface } from './StreamSurface';
import { AudioFocusButton } from './AudioFocusButton';
import { usePinchGesture } from './usePinchGesture';

const MAX_PINS = 4;
const MIN_PINS_FOR_FOCUS = 2;

type Mode = 'discovery' | 'focus';

interface HomeTabProps {
  onOpenStream: (stream: LiveStream) => void;
}

/** Progressive Mosaic Discovery, the Home tab: start in a full-screen
 *  swipeable feed of live channels; hold a tile to pin it to a side dock
 *  without losing your place browsing (the freed main area just reveals the
 *  next channel); build up to 4 pins, then pinch to fill the screen with
 *  all of them at once (pinch out, or the floating button, to go back).
 *
 *  Audio focus defaults to whichever stream is currently showing in
 *  discovery, following along automatically as the viewer swipes — until
 *  they explicitly move it to a pinned stream via that stream's 🔊 button,
 *  at which point it sticks there (even as discovery keeps changing
 *  underneath) until explicitly moved again. `pinnedAudioId` is that
 *  override; `null` means "follow discovery".
 *
 *  Tapping a stream card always opens it fullscreen with chat, everywhere
 *  (discovery, dock, focus mosaic) — audio focus is always the separate
 *  🔊/🔇 button, never the card tap itself. */
export function HomeTab({ onOpenStream }: HomeTabProps) {
  const { streams, loading } = useLiveStreams();
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [discoveryIndex, setDiscoveryIndex] = useState(0);
  const [pinnedAudioId, setPinnedAudioId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('discovery');

  const discoveryQueue = useMemo(() => streams.filter((s) => !pinnedIds.includes(s.id)), [streams, pinnedIds]);
  const currentDiscoveryStream: LiveStream | null =
    discoveryQueue.length > 0
      ? discoveryQueue[((discoveryIndex % discoveryQueue.length) + discoveryQueue.length) % discoveryQueue.length]
      : null;
  const pinnedStreams = pinnedIds
    .map((id) => streams.find((s) => s.id === id))
    .filter((s): s is LiveStream => !!s);

  const audioActiveId = pinnedAudioId ?? currentDiscoveryStream?.id ?? null;

  // If the pinned stream currently holding audio focus gets unpinned, fall
  // back to following discovery again rather than pointing at nothing.
  useEffect(() => {
    if (pinnedAudioId && !pinnedIds.includes(pinnedAudioId)) setPinnedAudioId(null);
  }, [pinnedAudioId, pinnedIds]);

  // If the last pin gets removed while focused, there's nothing left to show.
  useEffect(() => {
    if (mode === 'focus' && pinnedStreams.length === 0) setMode('discovery');
  }, [mode, pinnedStreams.length]);

  const pinch = usePinchGesture(
    () => {
      if (pinnedStreams.length >= MIN_PINS_FOR_FOCUS) setMode('focus');
    },
    () => setMode('discovery')
  );

  const handlePin = () => {
    if (!currentDiscoveryStream || pinnedIds.length >= MAX_PINS) return;
    setPinnedIds((prev) => [...prev, currentDiscoveryStream.id]);
  };

  const handleUnpin = (id: string) => {
    setPinnedIds((prev) => prev.filter((p) => p !== id));
  };

  // Moves audio focus to `streamId` — unless it's the current discovery
  // stream, in which case that's just "follow discovery" again.
  const focusAudio = (streamId: string) => {
    setPinnedAudioId(streamId === currentDiscoveryStream?.id ? null : streamId);
  };

  const handleOpen = (stream: LiveStream) => {
    focusAudio(stream.id);
    onOpenStream(stream);
  };

  return (
    <div
      className="relative flex h-full touch-pan-x flex-col"
      onTouchStart={pinch.onTouchStart}
      onTouchMove={pinch.onTouchMove}
      onTouchEnd={pinch.onTouchEnd}
      onTouchCancel={pinch.onTouchCancel}
    >
      <div className="min-h-0 flex-1 p-1.5">
        {loading || !currentDiscoveryStream ? (
          <div className="flex h-full items-center justify-center text-xs text-ink-muted">
            Loading live streams…
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {mode === 'focus' ? (
              <motion.div
                key="focus"
                className="h-full"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
              >
                <MosaicGrid
                  tiles={pinnedStreams.map((s) => {
                    const isAudioActive = audioActiveId === s.id;
                    return (
                      <motion.div
                        key={s.id}
                        whileTap={{ scale: 0.97 }}
                        className="relative h-full w-full overflow-hidden rounded-lg border border-line"
                        onTap={() => handleOpen(s)}
                      >
                        <StreamSurface stream={s} muted={!isAudioActive} />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-page/85 to-transparent p-2">
                          <span className="truncate text-xs font-bold text-ink-bright">{s.name}</span>
                        </div>
                        <AudioFocusButton
                          isAudioActive={isAudioActive}
                          streamName={s.name}
                          onFocus={() => focusAudio(s.id)}
                          className="absolute right-1 top-1"
                        />
                      </motion.div>
                    );
                  })}
                />
              </motion.div>
            ) : (
              <motion.div
                key="discovery"
                className="flex h-full gap-1.5"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
              >
                <div className="min-w-0 flex-1">
                  <DiscoveryTile
                    key={currentDiscoveryStream.id}
                    stream={currentDiscoveryStream}
                    isAudioActive={audioActiveId === currentDiscoveryStream.id}
                    canPin={pinnedIds.length < MAX_PINS}
                    onPin={handlePin}
                    onNext={() => setDiscoveryIndex((i) => i + 1)}
                    onPrev={() => setDiscoveryIndex((i) => i - 1)}
                    onTapAudio={() => focusAudio(currentDiscoveryStream.id)}
                    onOpen={() => handleOpen(currentDiscoveryStream)}
                  />
                </div>
                <PinnedDock
                  streams={pinnedStreams}
                  audioActiveId={audioActiveId}
                  onTapAudio={focusAudio}
                  onOpen={handleOpen}
                  onUnpin={handleUnpin}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Pinch is touch-only — this button gives mouse/trackpad users (and
       *  anyone who hasn't discovered the gesture) the same toggle. */}
      {pinnedStreams.length >= MIN_PINS_FOR_FOCUS && (
        <button
          type="button"
          onClick={() => setMode((m) => (m === 'focus' ? 'discovery' : 'focus'))}
          aria-label={mode === 'focus' ? 'Back to discovery' : 'Focus all pinned streams'}
          className="absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-kick/50 bg-page/80 text-kick backdrop-blur-sm"
        >
          {mode === 'focus' ? <Minimize2 size={16} strokeWidth={2.25} /> : <Maximize2 size={16} strokeWidth={2.25} />}
        </button>
      )}
    </div>
  );
}
