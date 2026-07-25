import { useEffect, useState } from 'react'
import { useEngine } from '../engine/store'
import { useInteraction } from '../engine/interactionStore'

/** the demo session "went live" a while before the dashboard was opened, so
 * uptime reads like a stream that's been running, not a stopwatch from zero */
const SESSION_HEAD_START_MS = 47 * 60_000
const sessionStartedAt = Date.now() - SESSION_HEAD_START_MS

function fmtUptime(ms: number): string {
  const totalMin = Math.floor(ms / 60_000)
  return `${Math.floor(totalMin / 60)}h ${String(totalMin % 60).padStart(2, '0')}m`
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-kick-border bg-kick-panel p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-kick-muted">{label}</div>
      <div className={`mt-1 text-[22px] font-bold tabular-nums leading-tight ${accent ? 'text-kick' : 'text-kick-text'}`}>
        {value}
      </div>
    </div>
  )
}

/** top strip: the numbers a streamer glances at every few seconds */
export default function SessionOverview({ live }: { live: boolean }) {
  const viewers = useEngine((s) => s.viewers)
  const hype = useEngine((s) => s.hype.score)
  const likes = useEngine((s) => s.likes)
  const msgsPerMin = useInteraction((s) => s.stats.msgsPerMin)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!live) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [live])

  if (!live) {
    return (
      <div>
        <div className="mb-3 rounded-xl border border-kick-border bg-kick-panel-2 px-4 py-3 text-[13px] text-kick-muted">
          You haven't streamed yet — go live and this page fills itself in.
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Tile label="Viewers" value="0" />
          <Tile label="Hype" value="—" />
          <Tile label="Chat / min" value="0" />
          <Tile label="Likes" value="0" />
          <Tile label="Uptime" value="—" />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Tile label="Viewers" value={viewers.toLocaleString()} accent />
      <Tile label="Hype" value={`${Math.round(hype * 100)}%`} />
      <Tile label="Chat / min" value={String(Math.round(msgsPerMin))} />
      <Tile label="Likes" value={likes.toLocaleString()} />
      <Tile label="Uptime" value={fmtUptime(now - sessionStartedAt)} />
    </div>
  )
}
