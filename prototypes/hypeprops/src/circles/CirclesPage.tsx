import { Link } from 'react-router'
import kickLogo from '../assets/kick-logo.svg'
import OrbitGraph from './OrbitGraph'

export default function CirclesPage() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-kick-dark text-kick-text">
      <header className="flex h-14 shrink-0 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src={kickLogo} alt="Kick" className="h-5 w-auto" />
          <div className="h-6 w-px bg-kick-border" />
          <span className="text-[15px] font-black">My Circles</span>
          <span className="rounded-full bg-kick-panel-2 px-2.5 py-1 text-[11px] font-semibold text-kick">
            SpookyBunny
          </span>
        </div>
        <div className="flex items-center gap-4 text-[12px] text-kick-muted">
          <span>click a Circle to open its live streams · click a stream to drop in</span>
          <Link to="/solution" className="underline-offset-2 hover:text-kick hover:underline">
            solution deck →
          </Link>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <OrbitGraph />
      </div>
    </div>
  )
}
