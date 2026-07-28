import { Icon } from "../Icon";
import { useExpeditions } from "./ExpeditionContext";

/*
  The payoff for staying through an entire Kick Break without hopping off. Bottom-center, the
  same spot kick-web-redesign's KickBossRewardToast uses for its own reward payoff — manual close
  only, no auto-dismiss, since this is a reward, not a passing notice.
*/
export function ChannelPointsToast() {
  const { channelPointsNotice, clearChannelPointsNotice } = useExpeditions();
  if (!channelPointsNotice) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-popover w-[min(92vw,380px)] -translate-x-1/2 rounded-2xl border border-outline-decorative bg-surface-highest p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-base/15 text-primary-base">
          <Icon name="channel-points" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">You made it through the whole break!</p>
          <p className="mt-0.5 text-xs text-subtle">
            You earned{" "}
            <span className="font-bold text-primary-base">{channelPointsNotice.amount} channel points</span> for
            staying with {channelPointsNotice.streamerName} the whole way through.
          </p>
        </div>
        <button
          type="button"
          onClick={clearChannelPointsNotice}
          aria-label="Dismiss"
          className="shrink-0 text-subtle transition-colors betterhover:hover:text-white"
        >
          <Icon name="close" className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
