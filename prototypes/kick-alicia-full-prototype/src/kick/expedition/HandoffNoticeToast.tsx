import { Icon } from "../Icon";
import { useExpeditions } from "./ExpeditionContext";
import { NotificationCountdownBar } from "./NotificationCountdownBar";

const NOTIFICATION_DURATION_MS = 8_000;

/*
  What just happened when a creator hands off their expedition to someone else — bottom-center,
  the same spot kick-web-redesign's KickBossRewardToast uses for its own payoff notice, global
  rather than a banner on the lobby page alone, so it still shows up wherever you land next.
  Auto-dismisses on the same countdown bar as the corner toasts.
*/
export function HandoffNoticeToast() {
  const { handoffNotice, clearHandoffNotice } = useExpeditions();
  if (!handoffNotice) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-popover w-[min(92vw,380px)] -translate-x-1/2 rounded-2xl border border-outline-decorative bg-surface-highest p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-base/15 text-primary-base">
          <Icon name="expedition" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">
            <span className="text-primary-base">{handoffNotice.newLeader}</span> is now leading{" "}
            {handoffNotice.expeditionName}
          </p>
          <p className="mt-0.5 text-xs text-subtle">Everyone's still on it.</p>
        </div>
        <button
          type="button"
          onClick={clearHandoffNotice}
          aria-label="Dismiss"
          className="shrink-0 text-subtle transition-colors betterhover:hover:text-white"
        >
          <Icon name="close" className="size-3.5" />
        </button>
      </div>
      <NotificationCountdownBar
        durationMs={NOTIFICATION_DURATION_MS}
        colorClass="bg-primary-base"
        onExpire={clearHandoffNotice}
      />
    </div>
  );
}
