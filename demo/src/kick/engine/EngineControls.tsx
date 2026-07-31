import { fireKinds } from "./engine";
import { useEngine, useEngineState } from "./EngineProvider";
import { formatViewers } from "../mock/api";

// The demo console. Open any page with `?dev` to show it, then fire an event on cue.
export function EngineControls() {
  const engine = useEngine();
  const { viewers, messagesPerMinute, multiplier } = useEngineState();

  if (!new URLSearchParams(window.location.search).has("dev")) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[220px] flex-col gap-2 rounded-lg bg-surface-highest p-3 text-sm text-white shadow-lg">
      <div className="flex items-baseline justify-between">
        <span className="font-bold">{formatViewers(viewers)} viewers</span>
        <span className="text-subtle">x{multiplier.toFixed(1)}</span>
      </div>
      <div className="text-subtle">{Math.round(messagesPerMinute)} messages per minute</div>
      <div className="flex flex-col gap-1">
        {fireKinds.map(({ kind, label }) => (
          <button
            key={kind}
            type="button"
            onClick={() => engine.fire(kind)}
            className="h-8 rounded bg-[#42474D] px-3 text-left font-semibold"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
