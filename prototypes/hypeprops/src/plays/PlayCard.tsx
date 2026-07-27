import { usePlays } from './playsStore'
import { shortHash } from './refCrypto'
import type { PlayMode } from './settle'
import PixelFrame from './PixelFrame'
import { formatCountdown, useNow } from './format'
import PollPlay from './PollPlay'
import QuizPlay from './QuizPlay'
import DrawPlay from './DrawPlay'
import BetPlay from './BetPlay'

const MODE_LABEL: Record<PlayMode, string> = { poll: 'POLL', quiz: 'QUIZ', draw: 'DRAW', bet: 'BET' }

export default function PlayCard() {
  const play = usePlays((s) => s.play)
  const now = useNow(200)
  if (!play) return null

  const remainingMs = play.closesAt - now
  const collecting = play.phase === 'collecting'
  const pct = collecting ? Math.max(0, Math.min(100, (remainingMs / (play.durationSec * 1000)) * 100)) : 0
  const urgent = collecting && remainingMs < 10_000

  return (
    <div className="animate-slide-up absolute bottom-3 left-3 w-[92%] max-w-[520px] overflow-visible border border-kick-border bg-black/55 p-3 backdrop-blur-sm">
      <PixelFrame />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-kick px-1.5 py-0.5 text-[10px] font-black tracking-wide text-black">
            {MODE_LABEL[play.mode]}
          </span>
          <span className="font-mono text-[11px] text-kick-muted">{play.id}</span>
        </div>
        {collecting ? (
          <span className={`font-mono text-[13px] font-bold ${urgent ? 'text-red-500' : 'text-kick-text'}`}>
            {formatCountdown(remainingMs)}
          </span>
        ) : (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-kick-muted">{play.phase}</span>
        )}
      </div>

      {collecting && (
        <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full transition-[width] duration-200 ${urgent ? 'bg-red-500' : 'bg-kick'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div
        className="mt-2 truncate font-mono text-[11px] text-kick"
        title="committed before the window opened"
      >
        [REF-COMMIT] sha256:{shortHash(play.commitHash, 12)}
      </div>

      <div className="mt-3 max-h-[340px] overflow-y-auto pr-1">
        {play.mode === 'poll' && <PollPlay />}
        {play.mode === 'quiz' && <QuizPlay />}
        {play.mode === 'draw' && <DrawPlay />}
        {play.mode === 'bet' && <BetPlay />}
      </div>
    </div>
  )
}
