import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CountdownProps {
  endsAt: string;
  onFinalStretchChange?: (isFinal: boolean) => void;
}

/** mm:ss countdown that speeds up its own pulse in the final minute, with a
 *  sharper per-second bump in the final 10 seconds. Used by the overlay
 *  battle bar and Director's battle scoreboard, both driven by the same
 *  `BattleState.endsAt`. */
export function Countdown({ endsAt, onFinalStretchChange }: CountdownProps) {
  const [remainingMs, setRemainingMs] = useState(() => new Date(endsAt).getTime() - Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemainingMs(new Date(endsAt).getTime() - Date.now());
    }, 250);
    return () => window.clearInterval(interval);
  }, [endsAt]);

  const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const isFinal = remainingSec <= 60 && remainingSec > 0;
  const isCritical = remainingSec <= 10 && remainingSec > 0;

  useEffect(() => {
    onFinalStretchChange?.(isFinal);
  }, [isFinal, onFinalStretchChange]);

  const mm = Math.floor(remainingSec / 60);
  const ss = remainingSec % 60;
  const label = remainingSec <= 0 ? 'FINAL' : `${mm}:${ss.toString().padStart(2, '0')}`;

  return (
    <motion.div
      className={`tabular inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-extrabold backdrop-blur-sm ${
        remainingSec <= 0
          ? 'border-line bg-page/70 text-ink'
          : isFinal
            ? 'border-red-500/60 bg-red-950/80 text-red-300'
            : 'border-line bg-page/70 text-ink-bright'
      }`}
      animate={isFinal ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={
        isFinal
          ? { duration: isCritical ? 0.5 : 1, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
          : { duration: 0.2 }
      }
    >
      {label}
    </motion.div>
  );
}
