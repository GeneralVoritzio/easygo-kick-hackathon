import { Link } from 'react-router'
import kickLogo from '../assets/kick-logo.svg'
import { GlobeIcon, HamburgerIcon, SearchIcon } from './icons'

export default function TopBar() {
  return (
    <header className="grid h-14 shrink-0 grid-cols-[auto_1fr_auto] items-center gap-4 bg-kick-dark px-4">
      <div className="flex items-center gap-4">
        <button type="button" aria-label="Menu" className="text-kick-muted transition-colors hover:text-kick-text">
          <HamburgerIcon className="h-5 w-5" />
        </button>
        <img src={kickLogo} alt="Kick" className="h-5 w-auto" />
      </div>

      <div className="flex justify-center">
        <div className="flex w-full max-w-[420px] items-center gap-2 rounded-full border border-kick-border bg-kick-panel-2 px-4 py-2">
          <SearchIcon className="h-4 w-4 shrink-0 text-kick-muted" />
          <input
            readOnly
            placeholder="Search"
            className="w-full bg-transparent text-[13px] text-kick-text placeholder:text-kick-muted focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <GlobeIcon className="h-5 w-5 text-kick-muted" />
        <Link to="/brand" className="text-[13px] font-semibold text-kick-text transition-colors hover:text-kick-muted">
          Log In
        </Link>
        <Link
          to="/brand"
          title="Brand console"
          className="rounded-lg bg-kick px-4 py-1.5 text-[13px] font-bold text-black transition-colors hover:bg-kick-dim"
        >
          Sign Up
        </Link>
      </div>
    </header>
  )
}
