import { useEffect, useRef } from 'react'
import { formatCountdown, useEscapeToClose, useNow } from './format'
import { GreyPillButton, ModalHeader, ModalPanel, ModalScrim, OptionBadge, PlainTextButton } from './ModalKit'
import { usePlays } from './playsStore'
import { derivedTotalPoints, formatRatio, getTwoOptionSplit } from './predictionSplit'

const SWARM_SIZE = 90
/** coprime with SWARM_SIZE so the index-based walk visits every slot once, mixing colours
 * without Math.random (a per-render shuffle would make the swarm jitter on every tick) */
const SWARM_STEP = 7

function IconCoin({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-3 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="7" rx="7" ry="3" />
      <path d="M5 7v10c0 1.7 3.1 3 7 3s7-1.3 7-3V7" />
      <path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
    </svg>
  )
}

function IconUsers({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-3 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="9" r="3" />
      <path d="M3 19c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M15.5 13.7c2.6.4 4.5 2.4 4.5 5.3" />
    </svg>
  )
}

function IconRatio({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-3 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="14 7 21 7 21 14" />
    </svg>
  )
}

export default function ManagePlayModal({ onClose }: { onClose: () => void }) {
  const play = usePlays((s) => s.play)
  const votes = usePlays((s) => s.votes)
  const stakedPoints = usePlays((s) => s.stakedPoints)
  const quizSubs = usePlays((s) => s.quizSubs)
  const entrants = usePlays((s) => s.entrants)
  const closeWindow = usePlays((s) => s.closeWindow)
  const reset = usePlays((s) => s.reset)
  const now = useNow(200)

  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
  }, [])
  useEscapeToClose(onClose)

  if (!play) return null

  const split = getTwoOptionSplit(play, votes, stakedPoints)
  const totalPoints = derivedTotalPoints(stakedPoints, votes.length + quizSubs.length + entrants.length)
  const collecting = play.phase === 'collecting'
  const remainingMs = collecting ? Math.max(0, play.closesAt - now) : 0
  const pctRemaining = collecting ? Math.min(100, Math.max(0, (remainingMs / (play.durationSec * 1000)) * 100)) : 0

  const greenCount = split.hasVotes ? Math.round((split.pctA / 100) * SWARM_SIZE) : 0
  const dots = Array.from({ length: SWARM_SIZE }, (_, i) => {
    if (!split.hasVotes) return 'grey'
    return (i * SWARM_STEP) % SWARM_SIZE < greenCount ? 'green' : 'salmon'
  })

  function handleDelete() {
    reset()
    onClose()
  }
  function handleEndSubmission() {
    closeWindow()
    onClose()
  }

  return (
    <ModalScrim onClose={onClose}>
      <ModalPanel labelledBy="manage-play-title" maxWidthPx={460}>
        <ModalHeader id="manage-play-title" title="Manage Play" onClose={onClose} closeRef={closeRef} />

        <p className="mb-1 text-center text-[17px] font-bold text-white">{play.title || play.criterion}</p>
        <p className="mb-4 text-center text-[13px] text-kick-muted">
          {totalPoints.toLocaleString()} points contributed
        </p>

        <div className="relative mb-4 h-[150px] overflow-hidden rounded-lg border border-white/10">
          <div className="absolute inset-0 flex flex-wrap content-center justify-center gap-1 p-3 opacity-50">
            {dots.map((color, i) => (
              <span
                key={i}
                className={`size-2 rounded-full ${
                  color === 'green' ? 'bg-kick' : color === 'salmon' ? 'bg-[#f8a0a0]' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <div className="relative z-10 flex items-center justify-center gap-3">
            <span className="text-[34px] font-bold text-kick">{split.pctA}%</span>
            <span className="text-sm text-kick-muted">vs</span>
            <span className="text-[34px] font-bold text-[#f8a0a0]">{split.pctB}%</span>
          </div>
        </div>

        <div className="mb-2 text-[13px] text-kick-muted">Options</div>
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-[#3a3f45] px-3 py-3">
              <OptionBadge index={0} />
              <span className="truncate text-sm font-bold text-white">{split.optionAName}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-kick-muted tabular-nums">
              <span className="inline-flex items-center gap-1">
                <IconCoin className="text-kick" />
                {split.poolA.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1">
                <IconUsers className="text-kick" />
                {split.votesA}
              </span>
              <span className="inline-flex items-center gap-1">
                <IconRatio className="text-kick" />
                {formatRatio(stakedPoints, split.poolA)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-[#3a3f45] px-3 py-3">
              <OptionBadge index={1} />
              <span className="truncate text-sm font-bold text-white">{split.optionBName}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-kick-muted tabular-nums">
              <span className="inline-flex items-center gap-1">
                <IconCoin className="text-[#f8a0a0]" />
                {split.poolB.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1">
                <IconUsers className="text-[#f8a0a0]" />
                {split.votesB}
              </span>
              <span className="inline-flex items-center gap-1">
                <IconRatio className="text-[#f8a0a0]" />
                {formatRatio(stakedPoints, split.poolB)}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-kick transition-[width] duration-200"
            style={{ width: `${pctRemaining}%` }}
          />
        </div>
        <p className="mb-6 text-center text-[12px] text-kick-muted">
          {collecting ? `Play closes in ${formatCountdown(remainingMs)}` : 'Play closed'}
        </p>

        {collecting ? (
          <div className="flex items-center justify-end gap-4">
            <PlainTextButton onClick={handleDelete}>Delete</PlainTextButton>
            <GreyPillButton onClick={handleEndSubmission}>End submission</GreyPillButton>
          </div>
        ) : (
          <div className="flex items-center justify-end">
            <GreyPillButton onClick={onClose}>Close</GreyPillButton>
          </div>
        )}
      </ModalPanel>
    </ModalScrim>
  )
}
