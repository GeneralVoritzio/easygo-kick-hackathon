import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Play, X, Zap, type LucideIcon } from 'lucide-react';
import type { RecapSegment, RecapSegmentKind } from '@shared/types';
import { formatElapsed } from './recap';

const SEGMENT_DURATION_MS = 5000;

const KIND_META: Record<RecapSegmentKind, { label: string; Icon: LucideIcon; background: string }> = {
  opening: { label: 'Opening', Icon: Play, background: 'from-kick/15 via-page to-page' },
  highlight: { label: 'Highlight', Icon: Zap, background: 'from-warn/15 via-page to-page' },
  closing: { label: "You're caught up", Icon: CheckCircle2, background: 'from-info/15 via-page to-page' },
};

interface RecapViewProps {
  segments: RecapSegment[];
  initialIndex?: number;
  onClose: () => void;
}

/** A stories-style takeover: one card per recap segment, auto-advancing on
 *  a fixed timer with a per-segment progress bar, tap zones to move back
 *  and forward. There's no real footage to seek to for these moments (the
 *  embed is a live-only Kick player, not a seekable VOD), so each segment
 *  is a generated summary card rather than a fake video frame. */
export function RecapView({ segments, initialIndex = 0, onClose }: RecapViewProps) {
  const [index, setIndex] = useState(initialIndex);

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= segments.length - 1) {
        onClose();
        return i;
      }
      return i + 1;
    });
  }, [segments.length, onClose]);

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));

  useEffect(() => {
    const timer = window.setTimeout(goNext, SEGMENT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [index, goNext]);

  const segment = segments[index];
  const meta = KIND_META[segment.kind];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex gap-1 p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        {segments.map((s, i) => (
          <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full bg-ink-bright"
              initial={false}
              animate={{ width: i < index ? '100%' : i === index ? '100%' : '0%' }}
              transition={i === index ? { duration: SEGMENT_DURATION_MS / 1000, ease: 'linear' } : { duration: 0 }}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close recap"
        className="absolute right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-raised/80 text-ink-bright backdrop-blur-sm"
      >
        <X size={18} strokeWidth={2.25} />
      </button>

      <div className={`relative flex-1 bg-gradient-to-b ${meta.background}`}>
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous moment"
          className="absolute inset-y-0 left-0 w-1/3"
        />
        <button
          type="button"
          onClick={goNext}
          aria-label="Next moment"
          className="absolute inset-y-0 right-0 w-2/3"
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={segment.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none flex h-full flex-col items-center justify-center gap-3 p-10 text-center"
          >
            <span className="flex items-center gap-1.5 rounded-full border border-line bg-page/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted backdrop-blur-sm">
              <meta.Icon size={13} strokeWidth={2.25} />
              {meta.label}
            </span>
            <span className="tabular text-xs text-ink-muted">{formatElapsed(segment.startSec)} the stream</span>
            <h2 className="text-2xl font-extrabold text-ink-bright">{segment.title}</h2>
            <p className="max-w-xs text-sm text-ink">{segment.caption}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
