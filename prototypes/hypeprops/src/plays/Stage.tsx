import { usePlays } from './playsStore'
import { shortHash } from './refCrypto'
import PlayCard from './PlayCard'

/** session leaderboard ticker — invented names, cosmetic only */
const LEADERBOARD = [
  { name: 'ironmaiden_44', points: 18420 },
  { name: 'couch_senate', points: 15310 },
  { name: 'lurkylurk', points: 12980 },
  { name: 'pixel_priest', points: 9640 },
]

export default function Stage() {
  const play = usePlays((s) => s.play)
  const log = usePlays((s) => s.log)
  const chainHead = usePlays((s) => s.chainHead)

  return (
    <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-black">
      {/* stands in for video — never a real stream */}
      <div className="absolute inset-0 bg-gradient-to-br from-kick-panel-2 via-black to-black" />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: 'radial-gradient(circle at 50% 40%, rgba(83,252,24,0.08), transparent 60%)' }}
      />

      {/* idle strip — always visible, OBS-browser-source style */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent px-4 py-2.5">
        <div className="flex items-center gap-3 overflow-hidden">
          {LEADERBOARD.map((row, i) => (
            <span key={row.name} className="flex shrink-0 items-center gap-1 text-[11px] font-semibold">
              <span className="text-kick-muted">
                {i + 1}. <span className="text-kick-text">{row.name}</span>
              </span>
              <span className="font-mono text-kick">{row.points.toLocaleString()}</span>
            </span>
          ))}
        </div>
        <div className="shrink-0 font-mono text-[10px] text-kick-muted" title="the audit trail, burned into the VOD">
          [REF-ROOT] {log.length} sha256:{shortHash(chainHead, 12)}
        </div>
      </div>

      {play && <PlayCard />}
    </div>
  )
}
