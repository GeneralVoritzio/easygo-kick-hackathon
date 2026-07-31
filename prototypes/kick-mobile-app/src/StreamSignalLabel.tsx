import { useEffect, useState } from 'react';
import type { StreamSignal } from '@shared/types';

function formatCountdown(endsAt: string): string {
  const remainingSec = Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000));
  const mm = Math.floor(remainingSec / 60);
  const ss = remainingSec % 60;
  return `${mm}:${ss.toString().padStart(2, '0')}`;
}

function signalText(signal: StreamSignal): string {
  switch (signal.kind) {
    case 'community_members':
      return `${signal.count} from your communities here`;
    case 'poll_ending':
      return `Poll ends in ${formatCountdown(signal.endsAt!)}`;
    case 'battle_ending':
      return `Kick battle ending in ${formatCountdown(signal.endsAt!)}`;
    case 'event_starting':
      return `${signal.label} starts in ${formatCountdown(signal.endsAt!)}`;
  }
}

interface StreamSignalLabelProps {
  signal: StreamSignal;
  className?: string;
}

/** The reason a stream card is worth tapping *right now* — social proof
 *  (community members already watching) or a live event wrapping up soon
 *  (poll/battle/scheduled surprise), always in Kick green since both are
 *  meant to catch the eye the same way. Countdown-based signals tick live
 *  once a second by re-rendering from `endsAt` rather than holding a stale
 *  time in state. */
export function StreamSignalLabel({ signal, className = '' }: StreamSignalLabelProps) {
  const isCountdown = signal.endsAt !== undefined;
  const [, tick] = useState(0);

  useEffect(() => {
    if (!isCountdown) return;
    const interval = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(interval);
  }, [isCountdown]);

  return <div className={`font-bold text-kick ${className}`}>{signalText(signal)}</div>;
}
