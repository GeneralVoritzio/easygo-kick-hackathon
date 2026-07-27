import { useEffect, useState } from 'react'
import { usePlays } from './playsStore'
import { REWARD_TIERS } from './settle'

export default function ViewerActionBar() {
  const play = usePlays((s) => s.play)
  const vote = usePlays((s) => s.vote)
  const enterDraw = usePlays((s) => s.enterDraw)
  const youEntered = usePlays((s) => s.youEntered)
  const [picks, setPicks] = useState<string[]>([])

  useEffect(() => setPicks([]), [play?.id])

  const togglePick = (opt: string) => setPicks((p) => (p.includes(opt) ? p.filter((o) => o !== opt) : [...p, opt]))

  const collecting = play?.phase === 'collecting'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-kick-border bg-kick-panel px-4 py-3">
      <div className="text-[12px] leading-tight">
        <div className="font-bold text-kick-text">
          2,450 pts <span className="font-normal text-kick-muted">· earned by watching</span>
        </div>
        <div className="text-[10px] text-kick-muted">earned channel points only — never purchasable value</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!play && <span className="text-[12px] text-kick-muted">No round open — the director starts one</span>}

        {play?.mode === 'poll' &&
          (collecting ? (
            <>
              {play.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => togglePick(opt)}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    picks.includes(opt)
                      ? 'border-kick bg-kick/15 text-kick'
                      : 'border-kick-border text-kick-muted hover:text-kick-text'
                  }`}
                >
                  {opt}
                </button>
              ))}
              <button
                type="button"
                disabled={picks.length === 0}
                onClick={() => vote(picks)}
                className="rounded-full bg-kick px-4 py-1.5 text-[12px] font-bold text-black transition-colors hover:bg-kick-dim disabled:opacity-30"
              >
                Submit approval vote
              </button>
            </>
          ) : (
            <span className="text-[12px] text-kick-muted">Voting closed</span>
          ))}

        {play?.mode === 'quiz' && (
          <span className={`text-[12px] font-semibold ${youEntered ? 'text-kick' : 'text-kick-muted'}`}>
            {youEntered ? 'Answers submitted ✓' : 'Answer the quiz on stage to earn points'}
          </span>
        )}

        {play?.mode === 'draw' && (
          <button
            type="button"
            disabled={!collecting || youEntered}
            onClick={() => enterDraw()}
            className="rounded-full bg-kick px-4 py-1.5 text-[12px] font-bold text-black transition-colors hover:bg-kick-dim disabled:opacity-30"
          >
            {youEntered ? '🎟 Entered' : '🎟 Enter — 100 pts'}
          </button>
        )}

        {play?.mode === 'bet' && (
          <div className="flex items-center gap-1.5">
            {REWARD_TIERS.map((tier) => (
              <button
                key={tier}
                type="button"
                disabled={!collecting}
                onClick={() => vote(['Yes'])}
                className="rounded-full border border-kick-border px-3 py-1.5 text-[12px] font-semibold text-kick-text transition-colors hover:border-kick disabled:opacity-30"
              >
                Stake {tier}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
