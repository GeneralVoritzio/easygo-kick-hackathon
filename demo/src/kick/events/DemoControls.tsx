import { useLocation } from "react-router-dom";
import { Icon } from "../Icon";
import { useEvents } from "../EventsStore";
import { HYPE_TIER_MAX } from "./events";
import { isLiveWindow, liveSeats } from "../mock/events";
import { useEvent } from "./EventProvider";

const tierLabels = ["Off", "T1", "T2", "T3"];

// A judge or a presenter needs every notice on demand, not ten minutes into a chat command
// or a director feature this demo does not wire up end to end. This panel fires them
// straight from real state (boost(), setHypeTier(), showDirectorPrompt()), so what it shows
// is what a viewer would really see, docked wherever that notice really lands: the boost
// notice and the follow prompt pin to the open chat panel, same as the hype meter does.
export function DemoControls() {
  const { events } = useEvents();
  const { boost, hypeTiers, setHypeTier, showDirectorPrompt } = useEvent();
  const location = useLocation();
  const currentSlug = location.pathname.split("/")[1] ?? "";

  const liveEvent = events.find(isLiveWindow);
  const seats = liveEvent ? liveSeats(liveEvent) : [];
  const hypeTier = currentSlug ? (hypeTiers[currentSlug] ?? 0) : 0;

  function demoBoost() {
    if (!liveEvent || seats.length === 0) return;
    const pick = seats[Math.floor(Math.random() * seats.length)];
    boost(pick.channel.slug, liveEvent.event_id);
  }

  function demoFollowPrompt() {
    if (!liveEvent) return;
    showDirectorPrompt(liveEvent.host_channel);
  }

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[402] flex flex-col items-start gap-2">
      <div className="pointer-events-auto flex flex-col gap-1.5 rounded-lg border border-outline-decorative bg-surface-highest p-2 shadow-lg">
        <span className="px-1 text-[10px] font-bold uppercase leading-none tracking-wide text-surface-onSurfaceSecondary">
          Demo overlays
        </span>
        <button
          type="button"
          disabled={!liveEvent || seats.length === 0}
          onClick={demoBoost}
          className="state-layer-surface flex h-8 items-center gap-2 rounded px-2 text-left text-xs font-semibold text-white disabled:opacity-40"
        >
          <Icon name="chat-kicks" className="size-3.5 shrink-0 fill-primary-base" />
          Show boost notice
        </button>
        <button
          type="button"
          disabled={!liveEvent}
          onClick={demoFollowPrompt}
          className="state-layer-surface flex h-8 items-center gap-2 rounded px-2 text-left text-xs font-semibold text-white disabled:opacity-40"
        >
          <Icon name="chat-settings" className="size-3.5 shrink-0 fill-primary-base" />
          Show follow prompt
        </button>
        <div className="mx-1 h-px bg-outline-decorative" />
        <span className="px-1 text-[10px] font-bold uppercase leading-none tracking-wide text-surface-onSurfaceSecondary">
          Hype level
        </span>
        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: HYPE_TIER_MAX + 1 }, (_, tier) => (
            <button
              key={tier}
              type="button"
              disabled={!currentSlug}
              onClick={() => setHypeTier(currentSlug, tier)}
              className={`h-7 flex-1 rounded text-xs font-semibold disabled:opacity-40 ${
                hypeTier === tier
                  ? "bg-primary-base text-primary-onPrimary"
                  : "bg-secondary-base text-secondary-onSecondary"
              }`}
            >
              {tierLabels[tier]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
