import { useEffect, useState } from 'react'
import '../kickshell/theme.css'
import { Navbar } from '../kickshell/components/Navbar'
import { Sidebar } from '../kickshell/components/Sidebar'
import { ChannelShell } from '../kickshell/components/ChannelShell'
import { liveStreamFor, profileFor } from '../kickshell/mock/api'
import { startPlaysTick, usePlays } from './playsStore'
import PlayCard from './PlayCard'
import ViewerActionBar from './ViewerActionBar'
import VerifyPanel from './VerifyPanel'
import DirectorBar from './DirectorBar'
import PlaysChatPanel from './PlaysChatPanel'
import StartPlayModal from './StartPlayModal'

// The channel the Plays engine runs on top of. IronVow is the hero live channel in
// the copied mock/api.ts, already wired up with a full profile, banner and panels.
const CHANNEL_SLUG = 'ironvow'

const WIDE = '(min-width: 1280px)'

/**
 * /plays: the polished kickshell watch page (navbar, sidebar, player, channel bar,
 * real chat column) with the existing KICK PLAYS engine (src/plays/playsStore.ts)
 * running on top of it. This mirrors kickshell/components/Layout.tsx's collapsible
 * sidebar, since that component's own <Outlet/> only works inside nested react-router
 * routes and /plays is registered as a single flat route.
 */
export default function PlaysNativePage() {
  useEffect(() => startPlaysTick(), [])

  const [collapsed, setCollapsed] = useState(false)
  const [wide, setWide] = useState(() => window.matchMedia(WIDE).matches)
  const [modalOpen, setModalOpen] = useState(false)
  const play = usePlays((s) => s.play)

  useEffect(() => {
    const query = window.matchMedia(WIDE)
    const update = () => setWide(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const rail = collapsed || !wide

  const profile = profileFor(CHANNEL_SLUG)
  const stream = liveStreamFor(CHANNEL_SLUG)
  if (!profile) throw new Error(`No channel profile for ${CHANNEL_SLUG}`)

  return (
    <div className="kickshell group/main flex h-xvh flex-col" data-sidebar={!rail}>
      <Navbar onToggleSidebar={() => setCollapsed((v) => !v)} />

      <div className="flex w-xvw flex-1 lg:overflow-hidden">
        <Sidebar key={rail ? 'rail' : 'full'} collapsed={rail} />

        <div
          id="main-container"
          className="no-scrollbar h-full flex-1 overflow-y-auto overflow-x-hidden pb-6 outline-none lg:w-full"
        >
          <main>
            <ChannelShell
              profile={profile}
              stream={stream}
              active="home"
              watch
              playerOverlay={play && <PlayCard />}
              renderChat={(onCollapse) => <PlaysChatPanel onCollapse={onCollapse} />}
            >
              <div className="flex flex-col gap-4 px-4 pb-10 lg:px-7">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="state-layer-base inline-flex h-10 w-fit items-center justify-center gap-1.5 rounded bg-primary-base px-4 text-sm font-bold text-primary-onPrimary transition-all betterhover:active:scale-[0.98]"
                >
                  Start a Play
                </button>
                <ViewerActionBar />
                <VerifyPanel />
              </div>
            </ChannelShell>
          </main>
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

      {modalOpen && <StartPlayModal onClose={() => setModalOpen(false)} />}
    </div>
  )
}
