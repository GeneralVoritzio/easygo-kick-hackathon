import { useEffect } from 'react'
import { Link } from 'react-router'
import { useEngine } from '../engine/store'
import { startMockEvents } from '../engine/mockEvents'
import FaceStage from '../face/FaceStage'
import Hud from './Hud'
import Chat from './Chat'
import DirectorPanel from './DirectorPanel'

export default function StreamView() {
  useEffect(() => startMockEvents(), [])

  const viewers = useEngine((s) => s.viewers)
  const likes = useEngine((s) => s.likes)

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-kick-dark text-kick-text">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-kick-border bg-kick-panel px-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-kick to-kick-dim text-[13px] font-black text-black">
            HK
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold">HypeKing</span>
              <span className="flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                <span className="animate-pulse-fast h-1.5 w-1.5 rounded-full bg-white" />
                Live
              </span>
            </div>
            <span className="text-[11px] text-kick-muted">Just Chatting · HypeProps demo</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[13px]">
          <div className="flex items-center gap-1.5 text-kick-muted">
            <span className="animate-pulse-fast h-2 w-2 rounded-full bg-kick" />
            <span className="font-semibold tabular-nums text-kick-text">{viewers.toLocaleString()}</span>
            <span>viewers</span>
          </div>
          <div className="flex items-center gap-1.5 text-kick-muted">
            <span>❤️</span>
            <span className="font-semibold tabular-nums text-kick-text">{likes.toLocaleString()}</span>
          </div>
          <Link to="/brand" className="text-kick-muted underline-offset-2 transition-colors hover:text-kick hover:underline">
            brand console →
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 items-center justify-center bg-black p-4">
          <div className="relative aspect-video w-full max-h-full overflow-hidden rounded-xl border border-kick-border bg-black shadow-2xl">
            <FaceStage />
            <Hud />
          </div>
        </main>

        <div className="w-[320px] shrink-0 border-l border-kick-border">
          <Chat />
        </div>
      </div>

      <DirectorPanel />
    </div>
  )
}
