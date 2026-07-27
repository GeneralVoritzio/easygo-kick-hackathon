import { usePlays } from './playsStore'
import { shortHash } from './refCrypto'

const COLORS = ['#f472b6', '#60a5fa', '#facc15', '#fb923c', '#a78bfa', '#34d399', '#f87171', '#22d3ee']

function colorFor(id: string): string {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return COLORS[h % COLORS.length]
}

export default function DrawPlay() {
  const play = usePlays((s) => s.play)!
  const entrants = usePlays((s) => s.entrants)
  const drawResult = usePlays((s) => s.drawResult)
  const log = usePlays((s) => s.log)

  const closeEvent = log.find(
    (e) => e.type === 'window_close' && (e.payload as { play_id: string }).play_id === play.id,
  )
  const clientSeedValue = closeEvent ? (closeEvent.payload as { client_seed: string }).client_seed : null

  return (
    <div>
      <div className="mb-2 grid grid-cols-6 gap-1.5">
        {entrants.map((e) => {
          const isWinner = drawResult?.winner?.userId === e.userId
          return (
            <div key={e.userId} className={`flex flex-col items-center gap-0.5 ${isWinner ? 'animate-pop' : ''}`}>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black text-black ${isWinner ? 'ring-2 ring-kick' : ''}`}
                style={{ backgroundColor: colorFor(e.userId) }}
              >
                {e.username[0]?.toUpperCase()}
              </div>
              <span className="max-w-[44px] truncate text-[9px] text-kick-muted">{e.username}</span>
            </div>
          )
        })}
        {entrants.length === 0 && <div className="col-span-6 text-[11px] text-kick-muted">waiting for entries…</div>}
      </div>

      {drawResult && (
        <div className="animate-pop rounded border border-kick bg-kick/10 px-2.5 py-2">
          <div className="text-[13px] font-bold text-kick">🎉 {drawResult.winner?.username ?? 'no entrants'} wins</div>
          <div className="mt-1 font-mono text-[10px] leading-snug text-kick-muted">
            server_seed={shortHash(play.serverSeed, 16)}
            <br />
            client_seed={clientSeedValue ? shortHash(clientSeedValue, 12) : '—'} (derived from entry order in chat)
            <br />
            nonce={play.nonce}
          </div>
        </div>
      )}
    </div>
  )
}
