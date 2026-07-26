import { useState } from 'react';
import { motion } from 'framer-motion';
import type { CommunityEvent, CommunityGoal, CommunityPoll } from '@shared/types';

interface LiveParticipationPanelProps {
  liveEvent: CommunityEvent | null;
  poll: CommunityPoll | null;
  goal: CommunityGoal | null;
}

/** "Help streamers live" from the pitch — vote on strategies, solve
 *  puzzles, contribute to a battle or goal. A real feature, not just a
 *  description of one: votes are tallied locally and the goal bar animates
 *  toward its target. */
export function LiveParticipationPanel({ liveEvent, poll, goal }: LiveParticipationPanelProps) {
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [localVotes, setLocalVotes] = useState<Record<string, number>>({});

  if (!liveEvent && !poll && !goal) return null;

  const handleVote = (optionId: string) => {
    if (votedOptionId) return;
    setVotedOptionId(optionId);
    setLocalVotes((prev) => ({ ...prev, [optionId]: (prev[optionId] ?? 0) + 1 }));
  };

  const pollOptions = poll?.options.map((o) => ({ ...o, votes: o.votes + (localVotes[o.id] ?? 0) })) ?? [];
  const pollTotal = pollOptions.reduce((sum, o) => sum + o.votes, 0) || 1;
  const goalPct = goal ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;

  return (
    <section className="rounded-xl border border-kick/40 bg-kick/5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-kick animate-live-pulse" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-kick">🤝 Help Us Live</span>
      </div>

      {liveEvent && <h3 className="mb-4 text-sm font-extrabold text-ink-bright">{liveEvent.title}</h3>}

      {poll && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-ink">{poll.question}</p>
          <div className="space-y-2">
            {pollOptions.map((option) => {
              const pct = Math.round((option.votes / pollTotal) * 100);
              const isChosen = votedOptionId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleVote(option.id)}
                  disabled={votedOptionId !== null}
                  className={`relative block w-full overflow-hidden rounded-lg border text-left transition-colors ${
                    isChosen ? 'border-kick' : 'border-line'
                  } ${votedOptionId ? 'cursor-default' : 'cursor-pointer hover:border-kick/60'}`}
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-kick/20"
                    initial={{ width: `${pct}%` }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.6 }}
                  />
                  <div className="relative flex items-center justify-between gap-2 px-3 py-2">
                    <span className="text-xs font-semibold text-ink-bright">{option.label}</span>
                    <span className="tabular-score font-mono text-xs font-bold text-ink">{pct}%</span>
                  </div>
                </button>
              );
            })}
          </div>
          {votedOptionId && (
            <p className="mt-1.5 text-[10px] font-semibold text-kick">Vote counted — thanks for weighing in.</p>
          )}
        </div>
      )}

      {goal && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-ink">{goal.title}</span>
            <span className="tabular-score font-mono font-bold text-ink-bright">
              {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-raised">
            <motion.div
              className="h-full rounded-full bg-kick"
              initial={{ width: `${goalPct}%` }}
              animate={{ width: `${goalPct}%` }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.8 }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
