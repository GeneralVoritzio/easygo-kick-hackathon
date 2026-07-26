import { useEffect, useState } from 'react';
import { Footprints, HeartHandshake } from 'lucide-react';

interface KickVotePanelProps {
  targetName: string;
  yes: number;
  no: number;
  endsAt: number;
  myVote: 'yes' | 'no' | null;
  onVote: (choice: 'yes' | 'no') => void;
}

/** A running joke, not a real consequence: every stop, the (mocked) crowd
 *  proposes booting a random fellow rider. Nobody actually leaves the
 *  expedition — it's a chat-flavored vote that resolves into a line in
 *  Explorer Chat, named after the platform on purpose. Countdown is its
 *  own local tick, same pattern as `KickBossPanel`'s `secondsLeft`, so
 *  this doesn't need the parent to re-render every second just to keep
 *  the clock honest.
 *
 *  Both buttons stay clickable the whole time — you can change your vote
 *  as many times as you like before the clock runs out, not just cast it
 *  once. */
export function KickVotePanel({ targetName, yes, no, endsAt, myVote, onVote }: KickVotePanelProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  return (
    <div className="border-b border-line bg-raised/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-ink-bright">
          🗳️ Kick vote: boot <span className="text-live">{targetName}</span>?
        </p>
        <span className="tabular text-[11px] text-ink-muted">{secondsLeft}s</span>
      </div>

      <div className="mb-2 flex items-center gap-3 text-[11px] text-ink-muted">
        <span className="tabular flex items-center gap-1">
          <Footprints size={12} strokeWidth={2.5} />
          {yes} kick
        </span>
        <span className="tabular flex items-center gap-1">
          <HeartHandshake size={12} strokeWidth={2.5} />
          {no} keep
        </span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onVote('yes')}
          className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-colors ${
            myVote === 'yes' ? 'border-live/50 bg-live/15 text-live' : 'border-line bg-raised text-ink-bright hover:bg-overlay'
          }`}
        >
          Vote to kick
        </button>
        <button
          type="button"
          onClick={() => onVote('no')}
          className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-colors ${
            myVote === 'no' ? 'border-kick/50 bg-kick/15 text-kick' : 'border-line bg-raised text-ink-bright hover:bg-overlay'
          }`}
        >
          Let them stay
        </button>
      </div>
    </div>
  );
}
