import { Zap } from 'lucide-react';

interface HypeIndicatorProps {
  size?: 'sm' | 'md';
  className?: string;
}

/** HUD badge shown on a muted tile while its chat is currently hyping, so a
 *  viewer scanning silenced tiles can still catch the spike. `sm` collapses
 *  to an icon-only dot for tight spaces like the pinned dock. */
export function HypeIndicator({ size = 'md', className = '' }: HypeIndicatorProps) {
  if (size === 'sm') {
    return (
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full bg-kick/25 text-kick ring-1 ring-kick/50 backdrop-blur-sm ${className}`}
        aria-label="Chat is hyping"
      >
        <Zap size={10} strokeWidth={2.5} fill="currentColor" className="animate-live-pulse" />
      </span>
    );
  }

  return (
    <span
      className={`flex items-center gap-1 rounded-full bg-kick/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-kick ring-1 ring-kick/50 backdrop-blur-sm ${className}`}
    >
      <Zap size={11} strokeWidth={2.5} fill="currentColor" className="animate-live-pulse" />
      Hyping
    </span>
  );
}
