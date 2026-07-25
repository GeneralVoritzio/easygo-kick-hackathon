import { useEffect, useState } from 'react'
import { INTERACTION_BADGES, formatOdds } from '../engine/ack'
import { useInteraction } from '../engine/interactionStore'
import { useEngine } from '../engine/store'
import DashboardCard from './DashboardCard'

const BACKLOG_SIZE = 5

function fmtWait(ms: number): string {
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))}s`
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`
}

/** gini → a phrase a streamer can act on */
function concentrationLabel(gini: number): string {
  if (gini < 0.3) return 'spread evenly across chat'
  if (gini < 0.6) return 'leaning towards your regulars'
  return 'concentrated on a few chatters'
}

/**
 * The streamer side of the interaction engine (spec §8–9): live response
 * odds, the unanswered backlog, and where your attention is actually going.
 */
export default function InteractionPanel({ live }: { live: boolean }) {
  const stats = useInteraction((s) => s.stats)
  const ackedIds = useInteraction((s) => s.ackedIds)
  const chat = useEngine((s) => s.chat)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!live) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [live])

  if (!live) {
    return (
      <DashboardCard title="Interaction engine">
        <p className="text-[13px] leading-relaxed text-kick-muted">
          Start streaming to measure your odds — once chat is flowing you'll see your response rate, badges, and the
          messages still waiting on you.
        </p>
      </DashboardCard>
    )
  }

  const acked = new Set(ackedIds)
  const backlog = chat
    .filter((m) => !acked.has(m.id) && m.user !== 'KICKBot')
    .slice(-BACKLOG_SIZE)
    .reverse()

  return (
    <DashboardCard
      title="Interaction engine"
      right={
        <span className="flex items-center gap-1 text-[12px] font-bold text-kick">
          replies {formatOdds(stats)}
        </span>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {stats.badges.length > 0 ? (
            stats.badges.map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 rounded-full border border-kick/50 bg-kick/10 px-2 py-0.5 text-[11px] font-semibold text-kick"
              >
                <span aria-hidden="true">{INTERACTION_BADGES[key].icon}</span>
                {INTERACTION_BADGES[key].label}
              </span>
            ))
          ) : (
            <span className="text-[12px] text-kick-muted">
              {stats.trackable ? 'no badges yet this window' : 'chat too fast to track badges right now'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-[12px]">
          <div className="rounded-lg bg-kick-panel-2 px-2.5 py-2">
            <div className="text-kick-muted">answered</div>
            <div className="font-bold tabular-nums text-kick-text">
              {stats.ackedMessages}/{stats.totalMessages}
            </div>
          </div>
          <div className="rounded-lg bg-kick-panel-2 px-2.5 py-2">
            <div className="text-kick-muted">median reply</div>
            <div className="font-bold tabular-nums text-kick-text">
              {stats.medianLatencyMs != null ? `${(stats.medianLatencyMs / 1000).toFixed(1)}s` : '—'}
            </div>
          </div>
          <div className="rounded-lg bg-kick-panel-2 px-2.5 py-2">
            <div className="text-kick-muted">first-timers</div>
            <div className="font-bold tabular-nums text-kick-text">{Math.round(stats.firstTimerShare * 100)}%</div>
          </div>
        </div>

        <p className="text-[12px] text-kick-muted">
          Attention is <span className="font-semibold text-kick-text">{concentrationLabel(stats.gini)}</span>.
        </p>

        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-kick-muted">
            Unanswered backlog
          </div>
          {backlog.length === 0 ? (
            <p className="text-[12px] text-kick-muted">All caught up — nothing waiting on you.</p>
          ) : (
            <ul className="space-y-1">
              {backlog.map((m) => (
                <li key={m.id} className="flex items-baseline gap-2 rounded-lg bg-kick-panel-2 px-2.5 py-1.5 text-[12px]">
                  <span className="shrink-0 font-semibold" style={{ color: m.color }}>
                    {m.user}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-kick-text/90">{m.text}</span>
                  <span className="shrink-0 tabular-nums text-kick-muted">{fmtWait(now - m.ts)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardCard>
  )
}
