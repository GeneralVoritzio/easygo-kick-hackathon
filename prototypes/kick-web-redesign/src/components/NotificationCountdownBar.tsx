import { motion } from 'framer-motion';

interface NotificationCountdownBarProps {
  durationMs: number;
  colorClass: string;
  onExpire: () => void;
}

/** The visual, non-numeric timer the bottom-right nudges need: a bar that
 *  slides down to nothing over `durationMs`, then removes the notification
 *  itself — no seconds counter to read, just a shrinking strip. */
export function NotificationCountdownBar({ durationMs, colorClass, onExpire }: NotificationCountdownBarProps) {
  return (
    <div className="mt-3 h-1 overflow-hidden rounded-full bg-line">
      <motion.div
        className={`h-full ${colorClass}`}
        style={{ transformOrigin: 'left' }}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: durationMs / 1000, ease: 'linear' }}
        onAnimationComplete={onExpire}
      />
    </div>
  );
}
