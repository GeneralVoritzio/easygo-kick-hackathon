import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import kickLogo from '../assets/kick-logo.svg'
import { useAuth, useAuthUser } from '../auth/authStore'
import { avatarGradient, avatarInitials } from '../auth/avatar'
import { GlobeIcon, HamburgerIcon, SearchIcon } from './icons'

/** greyed menu entries — Kick has these; our prototype doesn't (yet) */
const PLACEHOLDER_ITEMS = ['Profile', 'Settings', 'KICKs Wallet']

function UserMenu() {
  const user = useAuthUser()!
  const signOut = useAuth((s) => s.signOut)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-white/5"
      >
        <span
          className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-black text-black"
          style={{ backgroundImage: avatarGradient(user.name) }}
        >
          {avatarInitials(user.name)}
        </span>
        <span className="hidden text-[13px] font-semibold text-kick-text sm:inline">{user.name}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-kick-border bg-kick-panel p-1.5 shadow-2xl">
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-[13px] font-semibold text-kick-text transition-colors hover:bg-white/5"
          >
            Creator Dashboard
          </Link>
          {PLACEHOLDER_ITEMS.map((label) => (
            <span
              key={label}
              aria-disabled="true"
              title="Not in this prototype"
              className="block cursor-not-allowed rounded-lg px-3 py-2 text-[13px] text-kick-muted/50"
            >
              {label}
            </span>
          ))}
          <div className="my-1 h-px bg-kick-border/60" />
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              signOut()
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-kick-text transition-colors hover:bg-white/5"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

export default function TopBar() {
  const user = useAuthUser()
  const openAuthModal = useAuth((s) => s.openAuthModal)

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
        <Link
          to="/brand"
          title="Brand console"
          className="hidden text-[12px] font-semibold text-kick-muted transition-colors hover:text-kick-text md:inline"
        >
          For Brands
        </Link>
        <GlobeIcon className="h-5 w-5 text-kick-muted" />
        {user ? (
          <UserMenu />
        ) : (
          <>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="text-[13px] font-semibold text-kick-text transition-colors hover:text-kick-muted"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('signup')}
              className="rounded-lg bg-kick px-4 py-1.5 text-[13px] font-bold text-black transition-colors hover:bg-kick-dim"
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </header>
  )
}
