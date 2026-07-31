import { useEffect, useState } from "react";

type MoveOnVotePanelProps = {
  yes: number;
  no: number;
  endsAt: number;
  myVote: "yes" | "no" | null;
  onVote: (choice: "yes" | "no") => void;
};

/*
  Only for a "decide in chat" stop duration: there's no fixed timer, so the crowd periodically
  votes on whether to move to the next stop right now. A "no" isn't final — the same vote just
  runs again a moment later, so nobody is stuck waiting on a duration that was never set.
*/
export function MoveOnVotePanel({ yes, no, endsAt, myVote, onVote }: MoveOnVotePanelProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  return (
    <div className="border-b border-outline-decorative bg-surface-highest/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-white">Move to the next stop now?</p>
        <span className="tabular-nums text-[11px] text-subtle">{secondsLeft}s</span>
      </div>

      <div className="mb-2 flex items-center gap-3 text-[11px] text-subtle">
        <span className="tabular-nums">{yes} move on</span>
        <span className="tabular-nums">{no} stay</span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onVote("yes")}
          className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-colors ${
            myVote === "yes"
              ? "border-primary-base/50 bg-primary-base/15 text-primary-base"
              : "border-outline-decorative bg-secondary-base text-white betterhover:hover:bg-neutral-700"
          }`}
        >
          Move on
        </button>
        <button
          type="button"
          onClick={() => onVote("no")}
          className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-colors ${
            myVote === "no"
              ? "border-primary-base/50 bg-primary-base/15 text-primary-base"
              : "border-outline-decorative bg-secondary-base text-white betterhover:hover:bg-neutral-700"
          }`}
        >
          Stay longer
        </button>
      </div>
    </div>
  );
}
