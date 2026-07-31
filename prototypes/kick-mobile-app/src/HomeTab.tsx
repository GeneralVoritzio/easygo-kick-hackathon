import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useLiveStreams } from '@shared/hooks/useLiveStreams';
import type { LiveStream } from '@shared/types';
import { DiscoveryTile } from './DiscoveryTile';
import { DiscoveryVideoRing } from './DiscoveryVideoRing';
import { PinnedDock } from './PinnedDock';
import { MosaicGrid } from './MosaicGrid';
import { StreamSurface } from './StreamSurface';
import { AudioFocusButton } from './AudioFocusButton';
import { usePinchGesture } from './usePinchGesture';
import { useHypeMeter } from './useHypeMeter';
import { HypeIndicator } from './HypeIndicator';

const MAX_PINS = 4;
const MIN_PINS_FOR_FOCUS = 2;

type Mode = 'discovery' | 'focus';

interface HomeTabProps {
  onOpenStream: (stream: LiveStream) => void;
  /** Whether the Home tab is actually the one on screen — false while
   *  scrolled to a different tab or behind a fullscreen Stream View. Gates
   *  every stream tile's `<iframe>` so up to five real Kick embeds aren't
   *  all decoding video somewhere the viewer can't even see. */
  active: boolean;
  /** Set by the Discover tab when a trending multiview is tapped: pins that
   *  exact combo and jumps to the focus mosaic. `nonce` forces the effect to
   *  re-run even if the same combo is tapped twice in a row. */
  presetFocus?: { streamIds: string[]; nonce: number } | null;
  /** Bumped by the app shell when the Home tab bar icon is tapped while
   *  already on Home — backs out of the focus mosaic to discovery. */
  exitFocusSignal?: number;
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
export function HomeTab({ onOpenStream, active, presetFocus, exitFocusSignal }: HomeTabProps) {
  const { streams, loading } = useLiveStreams();
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [discoveryIndex, setDiscoveryIndex] = useState(0);
  const [pinnedAudioId, setPinnedAudioId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('discovery');
  const appliedFocusNonceRef = useRef<number | null>(null);
  const lastExitSignalRef = useRef(exitFocusSignal);

  useEffect(() => {
    if (exitFocusSignal === undefined || exitFocusSignal === lastExitSignalRef.current) return;
    lastExitSignalRef.current = exitFocusSignal;
    setMode('discovery');
  }, [exitFocusSignal]);

  useEffect(() => {
    if (!presetFocus || streams.length === 0) return;
    if (appliedFocusNonceRef.current === presetFocus.nonce) return;
    appliedFocusNonceRef.current = presetFocus.nonce;

    const validIds = presetFocus.streamIds.filter((id) => streams.some((s) => s.id === id)).slice(0, MAX_PINS);
    if (validIds.length === 0) return;

    setPinnedIds(validIds);
    setPinnedAudioId(null);
    setMode(validIds.length >= MIN_PINS_FOR_FOCUS ? 'focus' : 'discovery');
  }, [presetFocus, streams]);

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
                  tiles={pinnedStreams.map((s) => (
                    <FocusTile
                      key={s.id}
                      stream={s}
                      isAudioActive={audioActiveId === s.id}
                      active={active}
                      onOpen={() => handleOpen(s)}
                      onTapAudio={() => focusAudio(s.id)}
                    />
                  ))}
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
                <div className="relative min-w-0 flex-1">
                  <DiscoveryVideoRing
                    streams={discoveryQueue}
                    currentStreamId={currentDiscoveryStream.id}
                    audioActiveId={audioActiveId}
                    active={active}
                  />
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
                  active={active}
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

interface FocusTileProps {
  stream: LiveStream;
  isAudioActive: boolean;
  active: boolean;
  onOpen: () => void;
  onTapAudio: () => void;
}

function FocusTile({ stream, isAudioActive, active, onOpen, onTapAudio }: FocusTileProps) {
  const isHyping = useHypeMeter(stream.id);

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="relative h-full w-full overflow-hidden rounded-lg border border-line"
      onTap={onOpen}
    >
      <StreamSurface stream={stream} muted={!isAudioActive} active={active} />
      <img
        src={stream.avatarUrl}
        alt={stream.name}
        className="pointer-events-none absolute bottom-1 left-1 h-7 w-7 rounded-full border-2 border-page/70 object-cover"
      />
      {!isAudioActive && isHyping && (
        <HypeIndicator className="pointer-events-none absolute left-1 top-1" />
      )}
      <AudioFocusButton
        isAudioActive={isAudioActive}
        streamName={stream.name}
        onFocus={onTapAudio}
        className="absolute right-1 top-1"
      />
    </motion.div>
  );
}
