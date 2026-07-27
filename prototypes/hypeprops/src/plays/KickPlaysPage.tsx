import { useEffect } from 'react'
import TopBar from '../stream/TopBar'
import Sidebar from '../stream/Sidebar'
import { startPlaysTick } from './playsStore'
import Stage from './Stage'
import ViewerActionBar from './ViewerActionBar'
import VerifyPanel from './VerifyPanel'
import ChatColumn from './ChatColumn'
import DirectorBar from './DirectorBar'

export default function KickPlaysPage() {
  useEffect(() => startPlaysTick(), [])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-kick-dark text-kick-text">
      <TopBar />

      <div className="flex min-h-0 flex-1">
        <Sidebar />

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <Stage />
          <ViewerActionBar />
          <div className="p-3">
            <VerifyPanel />
          </div>
        </main>

        <div className="w-[340px] shrink-0 bg-kick-dark">
          <ChatColumn />
        </div>
      </div>

      <DirectorBar />

      <div className="pointer-events-none fixed bottom-3 left-3 z-40 max-w-xs rounded-lg border border-kick-border bg-black/70 px-3 py-2 text-[10px] leading-snug text-kick-muted backdrop-blur">
        Prototype: crowd simulated · video oracle scripted · hashes are display-only stubs —{' '}
        <a
          href="/PLAYS-SPEC.md"
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto text-kick underline"
        >
          PLAYS-SPEC.md
        </a>
      </div>
    </div>
  )
}
