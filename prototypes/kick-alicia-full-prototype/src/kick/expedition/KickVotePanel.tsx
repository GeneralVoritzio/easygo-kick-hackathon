import { useEffect, useState } from "react";

type KickVotePanelProps = {
  targetName: string;
  yes: number;
  no: number;
  endsAt: number;
  myVote: "yes" | "no" | null;
  onVote: (choice: "yes" | "no") => void;
};

/*
  A running joke, not a real consequence: every stop, the (mocked) crowd proposes booting a
  random fellow rider. Nobody actually leaves the expedition — it's a chat-flavored vote that
  resolves into a line in Explorer Chat, named after the platform on purpose. Both buttons stay
  clickable the whole time — you can change your vote as many times as you like before the clock
  runs out, not just cast it once. Ported from kick-web-redesign's KickVotePanel.tsx, using plain
  text instead of lucide's Footprints/HeartHandshake icons.
*/
export function KickVotePanel({ targetName, yes, no, endsAt, myVote, onVote }: KickVotePanelProps) {
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
        <p className="text-xs font-bold text-white">
          Kick vote: boot <span className="text-red-400">{targetName}</span>?
        </p>
        <span className="tabular-nums text-[11px] text-subtle">{secondsLeft}s</span>
      </div>

      <div className="mb-2 flex items-center gap-3 text-[11px] text-subtle">
        <span className="tabular-nums">{yes} kick</span>
        <span className="tabular-nums">{no} keep</span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onVote("yes")}
          className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-colors ${
            myVote === "yes"
              ? "border-red-400/50 bg-red-400/15 text-red-400"
              : "border-outline-decorative bg-secondary-base text-white betterhover:hover:bg-neutral-700"
          }`}
        >
          Vote to kick
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
          Let them stay
        </button>
      </div>
    </div>
  );
}
