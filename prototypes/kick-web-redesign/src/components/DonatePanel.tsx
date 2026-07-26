import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';

interface DonatePanelProps {
  streamerName: string;
  onDonate: (amount: number) => void;
  onClose: () => void;
}

const DONATE_AMOUNTS = [100, 500, 1000];

/** Same bottom-sheet shape as `prototypes/kick-recap`'s `HighlightsPanel`:
 *  a plain list of bordered rows, one tap and done. Used from the video
 *  actions on any stream — a plain watch page or a Kick Expedition ride. */
export function DonatePanel({ streamerName, onDonate, onClose }: DonatePanelProps) {
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
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-line bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
        <h2 className="mb-3 text-sm font-extrabold text-ink-bright">Gift Kicks to {streamerName}</h2>

        <div className="space-y-2">
          {DONATE_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => {
                onDonate(amount);
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-lg border border-line p-2.5 text-left active:border-kick"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kick/15 text-kick">
                <Gift size={16} strokeWidth={2.25} />
              </span>
              <span className="tabular text-xs font-semibold text-ink-bright">{amount} Kicks</span>
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
}
