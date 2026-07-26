import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { BattleEvent } from '@shared/hooks/useBattle';

interface ContributionLabelProps {
  event: BattleEvent;
  leftPercent: number;
  color: string;
  /** Individual streamer's name within the side, shown when the side is a team. */
  targetLabel?: string;
  onLanded: (streamerId: string) => void;
}

function formatEvent(event: BattleEvent): string {
  switch (event.type) {
    case 'tip':
      return `$${event.amount % 1 === 0 ? event.amount : event.amount.toFixed(2)}`;
    case 'sub':
      return event.amount > 1 ? `${event.amount}x Sub` : 'New Sub';
    case 'follow':
      return 'Follow';
    case 'chat_burst':
      return `+${event.amount} chat`;
  }
}

/** Flies in from above the bar, "lands" on its competitor's segment (firing
 *  onLanded so the bar can bump in response), then fades out on removal. */
export function ContributionLabel({ event, leftPercent, color, targetLabel, onLanded }: ContributionLabelProps) {
  const landedRef = useRef(false);

  return (
    <motion.div
      className="pointer-events-none absolute -top-9 flex -translate-x-1/2 flex-col items-center whitespace-nowrap"
      style={{ left: `${leftPercent}%` }}
      initial={{ opacity: 0, y: -14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onAnimationComplete={() => {
        if (landedRef.current) return;
        landedRef.current = true;
        onLanded(event.streamerId);
      }}
    >
      <span
        className="rounded-md border bg-page/70 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide backdrop-blur-sm"
        style={{ borderColor: `${color}4D`, color }}
      >
        {event.viewerName}
      </span>
      <span className="mt-0.5 rounded-md bg-page/70 px-1.5 py-0.5 font-mono text-[9px] font-bold text-ink backdrop-blur-sm">
        {formatEvent(event)}
        {targetLabel ? ` → ${targetLabel}` : ''}
      </span>
    </motion.div>
  );
}
