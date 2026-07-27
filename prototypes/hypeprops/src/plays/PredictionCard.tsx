import { useEffect, useState } from 'react'
import DrawPlay from './DrawPlay'
import { formatCountdown, useNow } from './format'
import { OptionBadge } from './ModalKit'
import { usePlays, type OracleState, type Play } from './playsStore'
import { estimatePayout, getTwoOptionSplit } from './predictionSplit'
import QuizPlay from './QuizPlay'
import type { PlayMode, TallyResult } from './settle'

const MODE_LABEL: Record<PlayMode, string> = { poll: 'POLL', quiz: 'QUIZ', draw: 'DRAW', bet: 'BET' }
const AUTO_DISMISS_MS = 9000
const DEFAULT_STAKE = 100

function resolveWinnerName(play: Play, tally: TallyResult | null, oracle: OracleState | null): string | null {
  if (play.mode === 'poll') return tally?.approvalWinner ?? null
  if (play.mode === 'bet' && oracle) {
    if (oracle.verdict === 'PASS') return play.options[0] ?? null
    if (oracle.verdict === 'FAIL') return play.options[1] ?? null
  }
  return null
}

function TwoOptionBody() {
  const play = usePlays((s) => s.play)!
  const votes = usePlays((s) => s.votes)
  const stakedPoints = usePlays((s) => s.stakedPoints)
  const tally = usePlays((s) => s.tally)
  const oracle = usePlays((s) => s.oracle)
  const vote = usePlays((s) => s.vote)
  const now = useNow(200)

  const [myPick, setMyPick] = useState<string | null>(null)
  useEffect(() => setMyPick(null), [play.id])

  const split = getTwoOptionSplit(play, votes, stakedPoints)
  const collecting = play.phase === 'collecting'
  const settled = !collecting
  const remainingMs = collecting ? Math.max(0, play.closesAt - now) : 0
  const pctRemaining = collecting ? Math.min(100, Math.max(0, (remainingMs / (play.durationSec * 1000)) * 100)) : 0

  function pick(name: string) {
    if (!collecting || myPick) return
    setMyPick(name)
    vote([name])
  }

  const winnerName = settled ? resolveWinnerName(play, tally, oracle) : null
  const pendingReview = settled && play.mode === 'bet' && oracle?.verdict === 'ABSTAIN'
  const pool = stakedPoints > 0 ? stakedPoints : (split.votesA + split.votesB) * DEFAULT_STAKE
  const winnerPool = winnerName === split.optionAName ? split.poolA : winnerName === split.optionBName ? split.poolB : 0
  const payout = estimatePayout(pool, winnerPool, DEFAULT_STAKE)

  return (
    <div>
      <div className="space-y-1.5">
        {[split.optionAName, split.optionBName].map((name, i) => {
          const pct = i === 0 ? split.pctA : split.pctB
          const optionPool = i === 0 ? split.poolA : split.poolB
          const isMine = myPick === name
          const isWinner = winnerName === name
          return (
            <button
              key={name}
              type="button"
              disabled={!collecting || Boolean(myPick)}
              onClick={() => pick(name)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors disabled:cursor-default ${
                isWinner
                  ? 'bg-kick/15 ring-1 ring-kick'
                  : isMine
                    ? 'bg-[#3a3f45] ring-1 ring-white/40'
                    : 'bg-[#3a3f45] hover:bg-[#42474d]'
              }`}
            >
              <OptionBadge index={i === 0 ? 0 : 1} />
              <span className="flex-1 truncate text-[13px] font-bold text-white">{name}</span>
              <span className={`text-[13px] font-bold ${i === 0 ? 'text-kick' : 'text-[#f8a0a0]'}`}>{pct}%</span>
              <span className="w-16 shrink-0 text-right text-[10px] text-kick-muted tabular-nums">
                {optionPool.toLocaleString()} pts
              </span>
            </button>
          )
        })}
      </div>

      {collecting && (
        <>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-kick transition-[width] duration-200"
              style={{ width: `${pctRemaining}%` }}
            />
          </div>
          <p className="mt-1 text-center text-[11px] text-kick-muted">Play closes in {formatCountdown(remainingMs)}</p>
        </>
      )}

      {myPick && collecting && (
        <p className="mt-2 text-center text-[11px] font-semibold text-kick">
          You&apos;re in — {DEFAULT_STAKE} pts on {myPick}
        </p>
      )}

      {settled &&
        (pendingReview ? (
          <p className="mt-2 text-center text-[12px] font-semibold text-amber-300">Reviewing the call…</p>
        ) : winnerName ? (
          <p className="mt-2 text-center text-[12px] font-semibold text-white">
            {winnerName} won
            {myPick && (
              <span className={myPick === winnerName ? 'text-kick' : 'text-kick-muted'}>
                {' '}
                · {myPick === winnerName ? `You won ${payout} points` : 'Not this time'}
              </span>
            )}
          </p>
        ) : null)}
    </div>
  )
}

function QuizBody() {
  const play = usePlays((s) => s.play)!
  const grades = usePlays((s) => s.grades)
  return (
    <div>
      <p className="mb-2 text-[11px] text-kick-muted">
        {play.phase === 'collecting' ? 'Quiz in progress — answer below to earn points' : `Key revealed · ${grades.length} graded`}
      </p>
      <QuizPlay />
    </div>
  )
}

function DrawBody() {
  const play = usePlays((s) => s.play)!
  const entrants = usePlays((s) => s.entrants)
  return (
    <div>
      <p className="mb-2 text-[11px] text-kick-muted">
        {play.phase === 'collecting' ? `Draw open — ${entrants.length} entrants` : 'Draw settled'}
      </p>
      <DrawPlay />
    </div>
  )
}

/** the Play's own card, pinned above the chat feed — this is where viewers see and join a
 * live Play, mirroring how KICK surfaces Predictions in the chat column rather than over
 * the player. */
export default function PredictionCard() {
  const play = usePlays((s) => s.play)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => setDismissed(false), [play?.id])

  useEffect(() => {
    if (!play || play.phase === 'collecting') return
    const t = setTimeout(() => setDismissed(true), AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [play])

  if (!play || dismissed) return null

  return (
    <div className="shrink-0 border-b border-kick-border bg-kick-panel/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded bg-kick px-1.5 py-0.5 text-[10px] font-black tracking-wide text-black">
          {MODE_LABEL[play.mode]}
        </span>
        {play.phase !== 'collecting' && (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setDismissed(true)}
            className="text-kick-muted transition-colors hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      <p className="mb-2 text-[13px] font-bold leading-snug text-white">{play.title || play.criterion}</p>

      {play.mode === 'poll' || play.mode === 'bet' ? (
        <TwoOptionBody />
      ) : play.mode === 'quiz' ? (
        <QuizBody />
      ) : (
        <DrawBody />
      )}
    </div>
  )
}
