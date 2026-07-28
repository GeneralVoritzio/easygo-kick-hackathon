import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import type { Livestream } from "../mock/api";

type NextStopVotePanelProps = {
  candidates: Livestream[];
  votes: number[];
  endsAt: number;
  myVoteIndex: number | null;
  onVote: (index: number) => void;
  suggestPool: Livestream[];
  suggestCost: number;
  kicksBalance: number;
  onSuggest: (stream: Livestream) => void;
};

/*
  Only for a custom expedition that chose "decide the route in chat": a real 3-way vote between
  candidate streams instead of a fixed pre-built route. Resolving appends the winner as the next
  stop and announces it in Explorer Chat (see Expedition.tsx). Same countdown-and-live-tally
  shape as KickVotePanel.tsx, picking between streams instead of yes/no.
*/
export function NextStopVotePanel({
  candidates,
  votes,
  endsAt,
  myVoteIndex,
  onVote,
  suggestPool,
  suggestCost,
  kicksBalance,
  onSuggest,
}: NextStopVotePanelProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
  const [suggesting, setSuggesting] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  const total = votes.reduce((a, b) => a + b, 0) || 1;
  const canAfford = kicksBalance >= suggestCost;
  const results = query.trim()
    ? suggestPool.filter((s) => s.channel.username.toLowerCase().includes(query.trim().toLowerCase()))
    : suggestPool;

  return (
    <div className="border-b border-outline-decorative bg-surface-highest/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-white">🧭 Vote: where next?</p>
        <span className="tabular-nums text-[11px] text-subtle">{secondsLeft}s</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {candidates.map((c, i) => {
          const pct = Math.round((votes[i] / total) * 100);
          const mine = myVoteIndex === i;
          return (
            <button
              key={c.channel.slug}
              type="button"
              onClick={() => onVote(i)}
              className={`relative overflow-hidden rounded-lg border px-2 py-1.5 text-left text-[11px] font-bold transition-colors ${
                mine
                  ? "border-primary-base/50 bg-primary-base/15 text-primary-base"
                  : "border-outline-decorative bg-secondary-base text-white betterhover:hover:bg-neutral-700"
              }`}
            >
              <span className="absolute inset-y-0 left-0 bg-primary-base/10" style={{ width: `${pct}%` }} />
              <span className="relative flex items-center justify-between gap-2">
                <span className="truncate">{c.channel.username}</span>
                <span className="tabular-nums text-subtle">
                  {votes[i]} ({pct}%)
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {suggestPool.length > 0 &&
        (suggesting ? (
          <div className="mt-2 flex flex-col gap-1.5">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a streamer"
              className="w-full rounded-lg border border-outline-decorative bg-black/30 px-2 py-1.5 text-[11px] font-semibold text-white placeholder:text-subtle focus:outline-none"
            />
            <div className="flex max-h-32 flex-col gap-1 overflow-y-auto">
              {results.length === 0 && <p className="px-1 text-[11px] text-subtle">No match.</p>}
              {results.map((s) => (
                <button
                  key={s.channel.slug}
                  type="button"
                  onClick={() => {
                    onSuggest(s);
                    setSuggesting(false);
                    setQuery("");
                  }}
                  className="truncate rounded-lg border border-outline-decorative bg-secondary-base px-2 py-1.5 text-left text-[11px] font-bold text-white betterhover:hover:bg-neutral-700"
                >
                  {s.channel.username}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setSuggesting(false);
                setQuery("");
              }}
              className="self-start text-[11px] font-semibold text-subtle betterhover:hover:text-white"
            >
              Cancel
            </button>
          </div>
        ) : canAfford ? (
          <button
            type="button"
            onClick={() => setSuggesting(true)}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-outline-decorative px-2 py-1.5 text-[11px] font-bold text-primary-base betterhover:hover:bg-primary-base/10"
          >
            <Icon name="get-kicks" className="size-3.5" />
            Suggest a streamer ({suggestCost} Kicks)
          </button>
        ) : (
          <p className="mt-2 text-center text-[11px] text-subtle">Need {suggestCost} Kicks to suggest a streamer.</p>
        ))}
    </div>
  );
}
