import { useState, type ReactNode } from 'react'
import { INTERACTION_BADGES, TIMING_COPY, formatOdds, timingHint, type TimingHint } from '../engine/ack'
import { useInteraction } from '../engine/interactionStore'

/** timing hint → color: green when it's a good time to type, amber when odds are thin */
const TIMING_COLOR: Record<TimingHint, string> = {
  lull: 'text-kick',
  normal: 'text-kick-muted',
  busy: 'text-amber-400',
}

const TIMING_DOT: Record<TimingHint, string> = {
  lull: 'bg-kick',
  normal: 'bg-kick-muted',
  busy: 'bg-amber-400',
}

function StatCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-2.5">
      <span className="text-[10px] font-bold tracking-wide text-kick-muted">{label}</span>
      {children}
    </div>
  )
}

/**
 * Full-width interaction-engine stats strip — sits below the video, above
 * the channel bar. Four always-on cells plus a ghost "about" popover.
 */
export default function InteractionMeter() {
  const stats = useInteraction((s) => s.stats)
  const sessionSent = useInteraction((s) => s.sessionSent)
  const sessionAcked = useInteraction((s) => s.sessionAcked)
  const transcriptEnabled = useInteraction((s) => s.transcriptEnabled)
  const lastTranscript = useInteraction((s) => s.lastTranscript)
  const [showInfo, setShowInfo] = useState(false)

  const hint = timingHint(stats.msgsPerMin)
  const topBadgeLabel = stats.badges.length > 0 ? INTERACTION_BADGES[stats.badges[0]].label : 'Response odds'

  return (
    <div className="w-full shrink-0 border-b border-kick-border bg-kick-panel">
      <div className="flex items-stretch">
        <div className="flex flex-1 divide-x divide-kick-border">
          <StatCell label={topBadgeLabel}>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black leading-none text-kick">{formatOdds(stats)}</span>
              {stats.badges.length > 0 && (
                <span className="flex items-center gap-0.5">
                  {stats.badges.map((b) => (
                    <span
                      key={b}
                      title={`${INTERACTION_BADGES[b].label} — ${INTERACTION_BADGES[b].blurb}`}
                      className="text-[12px] leading-none"
                    >
                      {INTERACTION_BADGES[b].icon}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </StatCell>

          <StatCell label="Median Latency">
            <span className="text-xl font-black leading-none text-kick-text">
              {stats.medianLatencyMs !== null ? `${Math.round(stats.medianLatencyMs / 1000)}s` : '—'}
            </span>
          </StatCell>

          <StatCell label="New Chatter Share">
            <span className="text-xl font-black leading-none text-kick-text">
              {Math.round(stats.firstTimerShare * 100)}%
            </span>
          </StatCell>

          <StatCell label="You tonight">
            <span className="text-xl font-black leading-none text-kick-text">
              <span className="">{sessionAcked}</span>
              <span className="ml-1 text-[11px] font-semibold text-kick-muted">
                of {sessionSent} acknowledged
              </span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TIMING_DOT[hint]}`} />
              <span className={`text-[10px] font-semibold ${TIMING_COLOR[hint]}`}>{TIMING_COPY[hint]}</span>
            </div>
          </StatCell>
        </div>

        <div className="relative flex shrink-0 items-center border-l border-kick-border px-3">
          <button
            type="button"
            onClick={() => setShowInfo((v) => !v)}
            className="whitespace-nowrap rounded px-1.5 py-1 text-[11px] font-semibold text-kick-muted transition-colors hover:text-kick-text"
          >
            ⓘ About Interaction Engine ›
          </button>

          {showInfo && (
            <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-kick-border bg-kick-panel-2 p-3 text-[11px] leading-snug text-kick-muted shadow-2xl">
              Response odds come from a rolling 10-minute window of acknowledgement events, shown as 1-in-N. No
              badge is awarded when chat is moving too fast to reliably track.
            </div>
          )}
        </div>
      </div>

      {transcriptEnabled && lastTranscript && (
        <div className="truncate border-t border-kick-border px-4 py-1 text-[11px] text-kick-muted">
          🎙 {lastTranscript}
        </div>
      )}
    </div>
  )
}
