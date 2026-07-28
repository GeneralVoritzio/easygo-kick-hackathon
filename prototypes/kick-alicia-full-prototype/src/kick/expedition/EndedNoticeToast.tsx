import { Icon } from "../Icon";
import { useExpeditions } from "./ExpeditionContext";
import { NotificationCountdownBar } from "./NotificationCountdownBar";

const NOTIFICATION_DURATION_MS = 8_000;

/*
  What just happened to an expedition that ended — bottom-center, the same spot
  kick-web-redesign's KickBossRewardToast uses for its own payoff notice, global rather than a
  banner on the lobby page alone, so it still shows up wherever you land next. Worded generically
  rather than "you ended it" — an expedition can end on its own (the ending-soon demo, a Kick
  Break completing its lap) just as often as from an explicit action. Auto-dismisses on the same
  countdown bar as the corner toasts.
*/
export function EndedNoticeToast() {
  const { endedNotice, clearEndedNotice } = useExpeditions();
  if (!endedNotice) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-popover w-[min(92vw,380px)] -translate-x-1/2 rounded-2xl border border-outline-decorative bg-surface-highest p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-base/15 text-primary-base">
          <Icon name="expedition" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">{endedNotice.endedName} expedition ended</p>
          <p className="mt-0.5 text-xs text-subtle">
            {endedNotice.pouredCount > 0
              ? `Everyone poured into ${endedNotice.pouredInto}'s stream.`
              : "Nobody else was on it."}
          </p>
        </div>
        <button
          type="button"
          onClick={clearEndedNotice}
          aria-label="Dismiss"
          className="shrink-0 text-subtle transition-colors betterhover:hover:text-white"
        >
          <Icon name="close" className="size-3.5" />
        </button>
      </div>
      <NotificationCountdownBar
        durationMs={NOTIFICATION_DURATION_MS}
        colorClass="bg-primary-base"
        onExpire={clearEndedNotice}
      />
    </div>
  );
}
