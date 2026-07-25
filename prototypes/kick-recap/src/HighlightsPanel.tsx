import { motion } from 'framer-motion';
import { ChevronRight, Zap } from 'lucide-react';
import type { StreamHighlight } from '@shared/types';
import { formatElapsed } from './recap';

interface HighlightsPanelProps {
  highlights: StreamHighlight[];
  onSelect: (highlightId: string) => void;
  onClose: () => void;
}

/** The detected engagement spikes as a plain list — the same data `RecapView`
 *  turns into cards, just browsable directly. Tapping one jumps straight
 *  into the recap at that moment. */
export function HighlightsPanel({ highlights, onSelect, onClose }: HighlightsPanelProps) {
  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-page/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] rounded-t-2xl border-t border-line bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
        <h2 className="mb-3 text-sm font-extrabold text-ink-bright">Highlights this stream</h2>

        {highlights.length === 0 ? (
          <p className="py-6 text-center text-xs text-ink-muted">No spikes detected yet.</p>
        ) : (
          <div className="space-y-2">
            {highlights.map((highlight, i) => (
              <button
                key={highlight.id}
                type="button"
                onClick={() => onSelect(highlight.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-line p-2.5 text-left active:border-kick"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warn/15 text-warn">
                  <Zap size={16} strokeWidth={2.25} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-ink-bright">Highlight {i + 1}</div>
                  <div className="tabular truncate text-[11px] text-ink-muted">{formatElapsed(highlight.t)}</div>
                </div>
                <ChevronRight size={16} className="shrink-0 text-ink-muted" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </>
  );
}
