import { Icon } from "../Icon";
import { NotificationCountdownBar } from "./NotificationCountdownBar";

const NOTIFICATION_DURATION_MS = 8_000;

/*
  The other half of the waitlist promotion story: a provisional spot nobody confirmed before
  departure doesn't just quietly vanish, it goes to someone else. Purely informational, no
  action to take, so it auto-dismisses on its own countdown same as the other toasts.
*/
export function ExpeditionMissedToast({
  expeditionName,
  onDismiss,
}: {
  expeditionName: string;
  onDismiss: () => void;
}) {
  return (
    <div className="w-[min(92vw,340px)] rounded-2xl border border-outline-decorative bg-surface-base p-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary-base text-subtle">
            <Icon name="expedition" className="size-4" />
          </span>
          <h3 className="text-sm font-extrabold text-white">You missed the departure</h3>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-subtle transition-colors betterhover:hover:text-white"
        >
          <Icon name="close" className="size-4" />
        </button>
      </div>

      <p className="text-xs leading-relaxed text-subtle">
        <span className="font-semibold text-white">{expeditionName}</span> left without you — someone from the
        waitlist took the spot instead.
      </p>

      <NotificationCountdownBar
        durationMs={NOTIFICATION_DURATION_MS}
        colorClass="bg-secondary-base"
        onExpire={onDismiss}
      />
    </div>
  );
}
