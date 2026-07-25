import { useState } from 'react'
import { useEngine } from '../engine/store'
import { PersonIcon, VerifiedIcon } from './icons'

export default function ChannelBar() {
  const viewers = useEngine((s) => s.viewers)
  const likes = useEngine((s) => s.likes)
  const [following, setFollowing] = useState(false)

  return (
    <div className="flex shrink-0 flex-wrap items-start justify-between gap-4 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-kick to-kick-dim text-[16px] font-black text-black ring-2 ring-kick/40 ring-offset-2 ring-offset-kick-dark">
            HK
          </div>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border-2 border-kick-dark bg-kick px-1.5 py-[1px] text-[8px] font-bold uppercase tracking-wide text-black">
            Live
          </span>
        </div>

        <div className="pt-0.5 leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-[16px] font-bold text-kick-text">HypeKing</span>
            <VerifiedIcon className="h-4 w-4 text-kick" />
          </div>
          <div className="mt-1 text-[13px] text-kick-text/90">Tipping props live · HypeProps demo</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[13px] font-semibold text-kick">Just Chatting</span>
            <span className="rounded bg-kick-panel-2 px-1.5 py-0.5 text-[11px] text-kick-text">English</span>
            <span className="rounded bg-kick-panel-2 px-1.5 py-0.5 text-[11px] text-kick-text">IRL</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFollowing((v) => !v)}
            className={`rounded-lg px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
              following ? 'bg-kick-panel-2 text-kick-text' : 'bg-kick text-black hover:bg-kick-dim'
            }`}
          >
            {following ? '✓ Following' : '♥ Follow'}
          </button>
          <button
            type="button"
            className="rounded-lg bg-kick-panel-2 px-3.5 py-1.5 text-[13px] font-semibold text-kick-text transition-colors hover:bg-white/10"
          >
            Subscribe ✦
          </button>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-kick-muted">
          <span className="flex items-center gap-1">
            <PersonIcon className="h-3.5 w-3.5" />
            <span className="font-bold text-kick-text">{viewers.toLocaleString()}</span>
          </span>
          <span className="flex items-center gap-1">
            ❤️
            <span className="font-bold text-kick-text">{likes.toLocaleString()}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
