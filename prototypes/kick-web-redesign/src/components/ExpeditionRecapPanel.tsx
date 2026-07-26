import { motion } from 'framer-motion';
import type { Expedition } from '../types';

interface ExpeditionRecapPanelProps {
  expedition: Expedition;
  onClose: () => void;
}

/** The itinerary so far, in the same bottom-sheet shape as
 *  `prototypes/kick-recap`'s `HighlightsPanel` — every stop, which one is
 *  current, which are already behind. */
export function ExpeditionRecapPanel({ expedition, onClose }: ExpeditionRecapPanelProps) {
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
        className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
        <h2 className="mb-3 text-sm font-extrabold text-ink-bright">{expedition.name} — itinerary</h2>

        <div className="space-y-1">
          {expedition.stops.map((card, i) => {
            const state = i < expedition.stopIndex ? 'Visited' : i === expedition.stopIndex ? 'Now' : 'Upcoming';
            return (
              <div key={card.id} className="flex items-center gap-3 rounded-lg p-2 text-xs">
                <span className="tabular w-4 shrink-0 text-ink-disabled">{i + 1}</span>
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-black text-page"
                  style={{ backgroundImage: card.gradient }}
                >
                  {card.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold text-ink-bright">{card.name}</span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    state === 'Now' ? 'bg-kick/15 text-kick' : state === 'Visited' ? 'text-ink-disabled' : 'text-ink-muted'
                  }`}
                >
                  {state}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
