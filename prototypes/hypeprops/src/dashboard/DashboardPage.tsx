import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { DEMO_CREDENTIALS, useAuth, useAuthUser } from '../auth/authStore'
import { HYPEKING_CREATOR_PROFILE } from '../data/creatorStats'
import { startMockEvents } from '../engine/mockEvents'
import TopBar from '../stream/TopBar'
import ChannelInfoCard from './ChannelInfoCard'
import InteractionPanel from './InteractionPanel'
import RecentStreams from './RecentStreams'
import SessionOverview from './SessionOverview'
import ViewerTrendCard from './ViewerTrendCard'

/** left-nav entries — Kick's creator dashboard has all of these; only
 * Overview is real in this prototype */
const NAV_PLACEHOLDERS = ['Analytics', 'Community', 'Moderation', 'Settings']

export default function DashboardPage() {
  const user = useAuthUser()
  const navigate = useNavigate()
  // distinguishes "arrived signed out" (→ prompt login) from "signed out
  // while here" (→ just leave quietly)
  const hadUser = useRef(user !== null)

  useEffect(() => {
    if (user) {
      hadUser.current = true
      return
    }
    navigate('/stream', { replace: true })
    if (!hadUser.current) useAuth.getState().openAuthModal('login')
  }, [user, navigate])

  // keep the simulated crowd flowing while the dashboard is open — same
  // source that powers /stream
  useEffect(() => (user ? startMockEvents() : undefined), [user])

  if (!user) return null

  const isDemo = user.name === DEMO_CREDENTIALS.name
  const profile = isDemo ? HYPEKING_CREATOR_PROFILE : null

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-kick-dark text-kick-text">
      <TopBar />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[190px] shrink-0 flex-col gap-0.5 border-r border-kick-border/60 px-2 py-4 md:flex">
          <span className="rounded-lg bg-white/5 px-3 py-2 text-[13px] font-bold text-kick-text">Overview</span>
          {NAV_PLACEHOLDERS.map((label) => (
            <span
              key={label}
              aria-disabled="true"
              title="Not in this prototype"
              className="cursor-not-allowed rounded-lg px-3 py-2 text-[13px] text-kick-muted/50"
            >
              {label}
            </span>
          ))}
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-[1080px] space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[19px] font-bold text-kick-text">Creator Dashboard</h1>
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                  isDemo ? 'bg-kick/10 text-kick' : 'bg-kick-panel-2 text-kick-muted'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isDemo ? 'animate-pulse-fast bg-kick' : 'bg-kick-muted'}`} />
                {isDemo ? 'Live' : 'Offline'}
              </span>
            </div>

            <SessionOverview live={isDemo} />

            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="min-w-0 space-y-4">
                <InteractionPanel live={isDemo} />
                <ViewerTrendCard history={profile?.viewer_trend ?? []} live={isDemo} />
                <RecentStreams sessions={profile?.sessions ?? []} />
              </div>
              <ChannelInfoCard user={user} profile={profile} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
