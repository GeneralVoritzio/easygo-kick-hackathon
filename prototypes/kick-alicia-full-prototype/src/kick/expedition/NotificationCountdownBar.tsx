/*
  The visual, non-numeric timer a bottom-right nudge needs: a bar that shrinks to nothing over
  durationMs, then removes the notification itself — no seconds counter to read, just a
  shrinking strip. Ported from kick-web-redesign's NotificationCountdownBar.tsx, using the
  theme.css notification-countdown keyframe instead of framer-motion, which this project
  doesn't depend on.
*/
export function NotificationCountdownBar({
  durationMs,
  colorClass,
  onExpire,
}: {
  durationMs: number;
  colorClass: string;
  onExpire: () => void;
}) {
  return (
    <div className="mt-3 h-1 overflow-hidden rounded-full bg-outline-decorative">
      <div
        onAnimationEnd={onExpire}
        style={{ animationDuration: `${durationMs}ms`, transformOrigin: "left" }}
        className={`h-full origin-left animate-[notification-countdown_linear_forwards] ${colorClass}`}
      />
    </div>
  );
}
