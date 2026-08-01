import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { PinnedCard } from "../components/PinnedCard";
import { usePrefs } from "../prefs";
import { FOLLOW_PROMPT_SECONDS } from "./events";
import { useEvent } from "./EventProvider";

// The prompt's own countdown ticks independently of the provider's auto-dismiss timeout,
// which only fires once, at the end, not every second.
function useTick() {
  const [, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
}

// Pinned at the top of the chat panel, same shell as every other notice docked there
// (BoostNoticeCards, HypeDemoRow). Fires from EventProvider's directorPrompt, not local
// state, because the demo control panel that triggers it lives outside the chat panel.
export function FollowPromptCard() {
  useTick();
  const { directorPrompt, dismissDirectorPrompt } = useEvent();
  const [, setPrefs] = usePrefs();

  if (!directorPrompt) return null;
  const { director, createdAt } = directorPrompt;
  const elapsed = Math.floor((Date.now() - createdAt) / 1000);
  const remaining = Math.max(0, FOLLOW_PROMPT_SECONDS - elapsed);

  function choose(choice: "always" | "once" | "never") {
    if (choice !== "once") setPrefs({ followDirector: choice });
    dismissDirectorPrompt();
  }

  return (
    <PinnedCard>
      <div className="flex items-start gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary-base">
          <Icon name="chat-settings" className="size-4 fill-primary-base" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-white">
            {director.username} updated the multiview
          </span>
          <span className="block text-xs text-surface-onSurfaceSecondary">
            Let mods and the event manager switch your view when they switch theirs?
          </span>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => choose("once")}
          className="state-layer-surface flex size-7 shrink-0 items-center justify-center rounded text-white"
        >
          <Icon name="close" className="size-3.5" />
        </button>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-primary-base transition-[width] duration-1000 ease-linear"
          style={{ width: `${(remaining / FOLLOW_PROMPT_SECONDS) * 100}%` }}
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => choose("never")}
            className="h-7 rounded px-2 text-xs font-semibold text-surface-onSurfaceSecondary betterhover:hover:bg-white/10"
          >
            Don't show me again
          </button>
          <button
            type="button"
            onClick={() => choose("once")}
            className="h-7 rounded bg-secondary-base px-2 text-xs font-semibold text-secondary-onSecondary"
          >
            Just this time
          </button>
          <button
            type="button"
            onClick={() => choose("always")}
            className="h-7 rounded bg-primary-base px-2 text-xs font-semibold text-primary-onPrimary"
          >
            Allow
          </button>
        </div>
      </div>
    </PinnedCard>
  );
}
