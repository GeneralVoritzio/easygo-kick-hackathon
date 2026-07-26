import { motion } from 'framer-motion';
import { Ghost, PartyPopper, Trophy, X } from 'lucide-react';
import type { BossResult } from '../types';

interface KickBossRewardToastProps {
  result: BossResult;
  onClose: () => void;
}

/** The payoff — but only for viewers who were actually in the fight; see
 *  the `result.participated` gate at the call site in `App.tsx`. Someone
 *  who wasn't never sees this, so it never reads as a global "a boss
 *  happened somewhere" blast. Bottom-center, sliding up — the same spot
 *  as an Xbox achievement banner. Manual close only, no auto-dismiss: this
 *  is a reward, not a passing notice, so it waits for you to read it. */
export function KickBossRewardToast({ result, onClose }: KickBossRewardToastProps) {
  const { boss, reward } = result;
  const defeated = boss.status === 'defeated';

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 24, opacity: 0 }}
      transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
      className="fixed bottom-5 left-1/2 z-40 w-[min(92vw,380px)] -translate-x-1/2 rounded-2xl border border-line bg-surface p-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
              defeated ? 'bg-kick/15 text-kick' : 'bg-raised text-ink-muted'
            }`}
          >
            {defeated ? <Trophy size={16} strokeWidth={2.25} /> : <Ghost size={16} strokeWidth={2.25} />}
          </span>
          <h3 className="text-sm font-extrabold text-ink-bright">{defeated ? `${boss.name} defeated!` : `${boss.name} escaped`}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="Dismiss" className="text-ink-muted transition-colors hover:text-ink-bright">
          <X size={16} strokeWidth={2.25} />
        </button>
      </div>

      {defeated && reward ? (
        <p className="flex items-center gap-1.5 text-xs text-ink">
          <PartyPopper size={13} strokeWidth={2.25} className="shrink-0 text-kick" />
          You helped take it down — you earned <span className="font-bold text-kick">{reward}</span>.
        </p>
      ) : (
        <p className="text-xs text-ink-muted">Not enough damage before the clock ran out — it'll be back.</p>
      )}
    </motion.div>
  );
}
