import { useEffect } from 'react'
import { startMockEvents } from '../engine/mockEvents'
import FaceStage from '../face/FaceStage'
import Hud from './Hud'
import Chat from './Chat'
import DirectorPanel from './DirectorPanel'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import ChannelBar from './ChannelBar'

export default function StreamView() {
  useEffect(() => startMockEvents(), [])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-kick-dark text-kick-text">
      <TopBar />

      <div className="flex min-h-0 flex-1">
        <Sidebar />

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          {/* Edge-to-edge player: no rounding, no border, no padding — Kick's live progress bar
              is a 2px green line across the full bottom edge. */}
          <div className="relative aspect-video w-full shrink-0 bg-black">
            <FaceStage />
            <Hud />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-kick" />
          </div>

          <ChannelBar />
        </main>

        <div className="w-[320px] shrink-0 bg-kick-dark">
          <Chat />
        </div>
      </div>

      <DirectorPanel />
    </div>
  )
}
