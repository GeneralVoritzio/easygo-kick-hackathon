import { usePlays } from './playsStore'
import { approvalTally } from './settle'

/**
 * Dual bars per option — first-choice (grey, what plurality would use) against
 * approval (green, what actually wins). Live from votes while collecting,
 * frozen to the settled tally once the window closes (settle.ts's demo beat).
 */
export default function PollPlay() {
  const play = usePlays((s) => s.play)!
  const votes = usePlays((s) => s.votes)
  const tally = usePlays((s) => s.tally)
  const options = play.options

  const live = play.phase === 'collecting' ? approvalTally(options, votes) : tally
  const maxCount = live
    ? Math.max(1, ...options.map((o) => Math.max(live.approval[o] ?? 0, live.firstChoice[o] ?? 0)))
    : 1

  return (
    <div>
      <div className="mb-2 text-[12px] font-semibold text-kick-text">{play.title}</div>

      <div className="space-y-2.5">
        {options.map((opt) => {
          const firstChoice = live?.firstChoice[opt] ?? 0
          const approval = live?.approval[opt] ?? 0
          return (
            <div key={opt}>
              <div className="text-[11px] text-kick-text">{opt}</div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="w-9 shrink-0 text-[9px] text-kick-muted">1st</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-white/40 transition-[width] duration-300"
                    style={{ width: `${(firstChoice / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-5 shrink-0 text-right font-mono text-[10px] text-kick-muted">{firstChoice}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="w-9 shrink-0 text-[9px] text-kick-muted">appr</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-kick transition-[width] duration-300"
                    style={{ width: `${(approval / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-5 shrink-0 text-right font-mono text-[10px] text-kick">{approval}</span>
              </div>
            </div>
          )
        })}
      </div>

      {tally && tally.diverges && (
        <div className="animate-pop mt-3 rounded border border-kick bg-kick/10 px-2.5 py-2 text-[12px] font-semibold leading-snug text-kick-text">
          first-choice led by <span className="text-kick-text">{tally.firstChoiceWinner}</span> · approval winner{' '}
          <span className="text-kick">{tally.approvalWinner}</span>
        </div>
      )}
    </div>
  )
}
