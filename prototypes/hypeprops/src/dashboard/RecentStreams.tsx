import type { StreamSession } from '../data/creatorStats'
import DashboardCard from './DashboardCard'

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function fmtDuration(startIso: string, endIso: string): string {
  const min = Math.round((Date.parse(endIso) - Date.parse(startIso)) / 60_000)
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`
}

export default function RecentStreams({ sessions }: { sessions: StreamSession[] }) {
  return (
    <DashboardCard title="Recent streams">
      {sessions.length === 0 ? (
        <p className="text-[13px] text-kick-muted">No streams yet — your past sessions will appear here.</p>
      ) : (
        <ul className="divide-y divide-kick-border/60">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="w-14 shrink-0 text-[12px] font-semibold tabular-nums text-kick-muted">
                {fmtDate(s.started_at)}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[13px] font-semibold text-kick-text">{s.title}</div>
                <div className="text-[11px] text-kick-muted">
                  {s.category} · {fmtDuration(s.started_at, s.ended_at)}
                </div>
              </div>
              <div className="hidden shrink-0 text-right text-[12px] tabular-nums sm:block">
                <div className="text-kick-text">
                  {s.peak_viewer_count.toLocaleString()} <span className="text-kick-muted">peak</span>
                </div>
                <div className="text-kick-muted">{s.average_viewer_count.toLocaleString()} avg</div>
              </div>
              <div className="hidden w-20 shrink-0 text-right text-[12px] tabular-nums text-kick-muted md:block">
                {s.message_count.toLocaleString()} msgs
              </div>
              <span className="w-16 shrink-0 rounded-full border border-kick/40 bg-kick/10 px-2 py-0.5 text-center text-[11px] font-semibold text-kick">
                {s.odds_label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}
