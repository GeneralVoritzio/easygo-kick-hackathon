import { useEffect, useRef, useState } from 'react'
import { usePlays } from './playsStore'
import type { Verdict } from './settle'

const VERDICT_STYLE: Record<Verdict, string> = {
  PASS: 'border-kick bg-kick/15 text-kick',
  FAIL: 'border-red-500 bg-red-500/15 text-red-400',
  ABSTAIN: 'border-amber-400 bg-amber-400/15 text-amber-300',
}

/** the beat between window-close and the verdict landing — the engine settles
 * synchronously, so this is a UI-only pause, not a real review */
const REVIEW_MS = 1400

export default function BetPlay() {
  const play = usePlays((s) => s.play)!
  const votes = usePlays((s) => s.votes)
  const stakedPoints = usePlays((s) => s.stakedPoints)
  const oracle = usePlays((s) => s.oracle)
  const modResolve = usePlays((s) => s.modResolve)

  // fires once on the collecting → settled edge, not on later mod-resolution
  // edits to `oracle` (those must not re-trigger the reviewing beat)
  const [reviewing, setReviewing] = useState(false)
  const prevPhaseRef = useRef(play.phase)
  useEffect(() => {
    const cameFromSettled = prevPhaseRef.current === 'settled'
    prevPhaseRef.current = play.phase
    if (play.phase !== 'settled' || !oracle || cameFromSettled) return
    setReviewing(true)
    const t = setTimeout(() => setReviewing(false), REVIEW_MS)
    return () => clearTimeout(t)
  }, [play.id, play.phase, oracle])

  const yes = votes.filter((v) => v.picks[0] === 'Yes').length
  const no = votes.filter((v) => v.picks[0] === 'No').length
  const total = Math.max(1, yes + no)

  return (
    <div>
      <div className="mb-1.5 text-[12px] italic leading-snug text-kick-text">“{play.criterion}”</div>

      <div className="mb-1.5 flex items-center justify-between text-[11px] text-kick-muted">
        <span>
          Staked: <span className="font-mono text-kick-text">{stakedPoints.toLocaleString()} pts</span>
        </span>
        <span className="font-mono">
          {yes} Yes · {no} No
        </span>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-white/5">
        <div className="h-full bg-kick" style={{ width: `${(yes / total) * 100}%` }} />
        <div className="h-full bg-red-500/70" style={{ width: `${(no / total) * 100}%` }} />
      </div>

      {play.phase === 'settled' &&
        oracle &&
        (reviewing ? (
          <div className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-kick-muted">
            <span className="animate-pulse-fast">⏳</span> Ref is reviewing…
          </div>
        ) : (
          <div className="animate-slide-up mt-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`inline-block rounded border px-2.5 py-0.5 text-[13px] font-black ${VERDICT_STYLE[oracle.verdict]}`}>
                {oracle.verdict}
              </span>
              <span className="text-[11px] text-kick-text">{oracle.reason}</span>
            </div>

            <div className="rounded border border-kick-border bg-black/40 p-1.5">
              <div className="mb-1 text-[9px] font-bold uppercase tracking-wide text-kick-muted">Pass-1 event log</div>
              <div className="max-h-[72px] space-y-0.5 overflow-y-auto font-mono text-[9px] leading-tight">
                {oracle.eventLog.map((e) => {
                  const isInjection = e.event.includes('donation alert')
                  return (
                    <div key={e.t} className={isInjection ? 'text-amber-300' : 'text-kick-muted'}>
                      t={e.t.toFixed(1)}s — {e.event}
                      {isInjection && (
                        <div className="text-[8px] leading-snug text-amber-400/80">
                          ⚠ on-screen text transcribed as observation, not obeyed
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="mb-1 text-[9px] font-bold uppercase tracking-wide text-kick-muted">Evidence frames</div>
              <div className="flex items-center gap-1.5">
                {oracle.frames.map((t) => (
                  <div
                    key={t}
                    className="relative h-9 w-16 shrink-0 overflow-hidden rounded bg-gradient-to-br from-kick-panel-2 to-black"
                  >
                    <span className="absolute bottom-0.5 right-1 font-mono text-[8px] text-kick-muted">
                      {t.toFixed(1)}s
                    </span>
                  </div>
                ))}
                <span className="text-[9px] leading-snug text-kick-muted">
                  frames chosen by the revealed seed — neither side picked them
                </span>
              </div>
            </div>

            {oracle.verdict === 'ABSTAIN' && (
              <div className="rounded border border-amber-400/50 bg-amber-400/10 p-1.5">
                <div className="mb-1 text-[10px] font-semibold text-amber-300">Mod resolution needed</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => modResolve('PASS')}
                    className="rounded bg-kick px-3 py-1 text-[11px] font-bold text-black transition-colors hover:bg-kick-dim"
                  >
                    Resolve: PASS
                  </button>
                  <button
                    type="button"
                    onClick={() => modResolve('FAIL')}
                    className="rounded bg-red-500 px-3 py-1 text-[11px] font-bold text-black transition-colors hover:bg-red-400"
                  >
                    Resolve: FAIL
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  )
}
