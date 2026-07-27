import { useEffect, useState } from 'react'
import '../kickshell/theme.css'
import { Navbar } from '../kickshell/components/Navbar'
import { Sidebar } from '../kickshell/components/Sidebar'
import { ChannelShell } from '../kickshell/components/ChannelShell'
import { liveStreamFor, profileFor } from '../kickshell/mock/api'
import ChooseOutcomeModal from './ChooseOutcomeModal'
import ManagePlayModal from './ManagePlayModal'
import { startPlaysTick, usePlays } from './playsStore'
import PlaysChatPanel from './PlaysChatPanel'
import StartPlayModal from './StartPlayModal'
import ViewerActionBar from './ViewerActionBar'
import DirectorBar from './DirectorBar'

// The channel the Plays engine runs on top of. IronVow is the hero live channel in
// the copied mock/api.ts, already wired up with a full profile, banner and panels.
const CHANNEL_SLUG = 'ironvow'

const WIDE = '(min-width: 1280px)'

type ViewMode = 'viewer' | 'streamer'
const VIEW_MODES: ViewMode[] = ['viewer', 'streamer']

function ViewModeToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-kick-border bg-kick-panel-2 p-1 text-[12px] font-semibold">
      <span className="pl-2 pr-1 text-kick-muted">Viewing as</span>
      {VIEW_MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`rounded-full px-3 py-1 capitalize transition-colors ${
            value === mode ? 'bg-kick text-black' : 'text-kick-muted hover:text-white'
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  )
}

/**
 * /plays: the polished kickshell watch page (navbar, sidebar, player, channel bar,
 * real chat column) with the existing KICK PLAYS engine (src/plays/playsStore.ts)
 * running on top of it. This mirrors kickshell/components/Layout.tsx's collapsible
 * sidebar, since that component's own <Outlet/> only works inside nested react-router
 * routes and /plays is registered as a single flat route.
 *
 * A Play lives in its own card, pinned in the chat column (see PredictionCard), not
 * as an overlay on the player — that's how KICK surfaces Predictions. The Viewer /
 * Streamer toggle below switches which affordances show: viewers only ever see the
 * pinned card, streamers also get Create / Manage / Choose outcome controls.
 */
export default function PlaysNativePage() {
  useEffect(() => startPlaysTick(), [])

  const [collapsed, setCollapsed] = useState(false)
  const [wide, setWide] = useState(() => window.matchMedia(WIDE).matches)
  const [viewMode, setViewMode] = useState<ViewMode>('viewer')
  const [startOpen, setStartOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [chooseOutcomeOpen, setChooseOutcomeOpen] = useState(false)
  const play = usePlays((s) => s.play)
  const oracle = usePlays((s) => s.oracle)

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
              renderChat={(onCollapse) => <PlaysChatPanel onCollapse={onCollapse} />}
            >
              <div className="flex flex-col gap-4 px-4 pb-10 lg:px-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <ViewModeToggle value={viewMode} onChange={setViewMode} />

                  {viewMode === 'streamer' && (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setStartOpen(true)}
                        className="state-layer-base inline-flex h-10 items-center justify-center gap-1.5 rounded bg-primary-base px-4 text-sm font-bold text-primary-onPrimary transition-all betterhover:active:scale-[0.98]"
                      >
                        Create a Play
                      </button>
                      <button
                        type="button"
                        disabled={!play}
                        onClick={() => setManageOpen(true)}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded border border-kick-border px-4 text-sm font-bold text-kick-text transition-colors hover:border-kick disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Manage Play
                      </button>
                      {oracle?.verdict === 'ABSTAIN' && (
                        <button
                          type="button"
                          onClick={() => setChooseOutcomeOpen(true)}
                          className="inline-flex h-10 items-center justify-center gap-1.5 rounded border border-amber-400/60 px-4 text-sm font-bold text-amber-300 transition-colors hover:bg-amber-400/10"
                        >
                          Choose outcome
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <ViewerActionBar />
              </div>
            </ChannelShell>
          </main>
        </div>
      </div>

      <DirectorBar />

      {startOpen && <StartPlayModal onClose={() => setStartOpen(false)} />}
      {manageOpen && <ManagePlayModal onClose={() => setManageOpen(false)} />}
      {chooseOutcomeOpen && <ChooseOutcomeModal onClose={() => setChooseOutcomeOpen(false)} />}
    </div>
  )
}
