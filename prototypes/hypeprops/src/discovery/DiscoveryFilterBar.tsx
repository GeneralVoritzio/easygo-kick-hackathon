import { useEffect, useRef, useState } from 'react'
import { DISCOVERY_CATEGORIES, DISCOVERY_LANGUAGES } from '../data/discoveryChannels'
import { INTERACTION_BADGES } from '../engine/ack'
import type { InteractionBadgeKey } from '../engine/ack'
import { VIEWER_TIERS, hasActiveFilters } from './filters'
import { useDiscovery } from './discoveryStore'
import type { ViewerTier } from './types'

type MenuKey = 'category' | 'language' | 'interaction' | 'viewers'

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3 w-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function Check() {
  return (
    <svg viewBox="0 0 12 12" className="h-3.5 w-3.5 shrink-0 text-kick" aria-hidden="true">
      <path d="M2 6.5 4.8 9 10 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/** one filter pill + its anchored dropdown panel */
function FilterMenu({
  label,
  summary,
  open,
  onToggle,
  panelClassName = 'w-60',
  children,
}: {
  label: string
  /** current selection, shown on the pill when set — the pill lights up */
  summary: string | null
  open: boolean
  onToggle: () => void
  panelClassName?: string
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold backdrop-blur-sm transition-colors ${
          summary
            ? 'border-kick/60 bg-kick/10 text-kick'
            : open
              ? 'border-kick-border bg-white/10 text-kick-text'
              : 'border-kick-border bg-kick-panel/90 text-kick-muted hover:text-kick-text'
        }`}
      >
        {summary ?? label}
        <Chevron open={open} />
      </button>

      {open && (
        <div
          className={`absolute left-0 top-full z-20 mt-2 rounded-xl border border-kick-border bg-kick-panel/95 p-1.5 shadow-2xl backdrop-blur-md ${panelClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function OptionRow({
  selected,
  onClick,
  children,
  sub,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  sub?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-white/5 ${
        selected ? 'text-kick-text' : 'text-kick-muted'
      }`}
    >
      <span className="min-w-0">
        <span className="block truncate font-semibold">{children}</span>
        {sub && <span className="block truncate text-[11px] font-normal text-kick-muted">{sub}</span>}
      </span>
      {selected && <Check />}
    </button>
  )
}

/**
 * Compact filter rail over the globe — three dropdown pills (category /
 * interaction / viewer size) in the Airbnb-search style, so a dozen options
 * never sprawl across the screen. Each pill shows its live selection, the
 * count chip shows how many channels survive, and everything restores after
 * a round-trip to /stream because the state lives in the discovery store.
 */
export default function DiscoveryFilterBar({ matchCount }: { matchCount: number }) {
  const filters = useDiscovery((s) => s.filters)
  const setFilters = useDiscovery((s) => s.setFilters)
  const resetFilters = useDiscovery((s) => s.resetFilters)
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // click-away and Escape close the open panel; Escape is captured so the
  // page-level handler doesn't also fold the hotspot popover in the same press
  useEffect(() => {
    if (!openMenu) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setOpenMenu(null)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown, { capture: true })
    }
  }, [openMenu])

  const toggleMenu = (menu: MenuKey) => setOpenMenu((cur) => (cur === menu ? null : menu))

  const toggleBadge = (badge: InteractionBadgeKey) =>
    setFilters({
      badges: filters.badges.includes(badge) ? filters.badges.filter((b) => b !== badge) : [...filters.badges, badge],
    })

  const badgeSummary =
    filters.badges.length === 0
      ? null
      : filters.badges.length === 1
        ? `${INTERACTION_BADGES[filters.badges[0]].icon} ${INTERACTION_BADGES[filters.badges[0]].label}`
        : `Interaction · ${filters.badges.length}`

  return (
    <div ref={rootRef} className="pointer-events-auto absolute left-4 top-4 flex flex-wrap items-center gap-2">
      <FilterMenu
        label="Category"
        summary={filters.category}
        open={openMenu === 'category'}
        onToggle={() => toggleMenu('category')}
        panelClassName="w-[390px]"
      >
        <div className="grid grid-cols-2 gap-x-1">
          <OptionRow selected={filters.category === null} onClick={() => { setFilters({ category: null }); setOpenMenu(null) }}>
            All categories
          </OptionRow>
          {DISCOVERY_CATEGORIES.map((category) => (
            <OptionRow
              key={category}
              selected={filters.category === category}
              onClick={() => { setFilters({ category: filters.category === category ? null : category }); setOpenMenu(null) }}
            >
              {category}
            </OptionRow>
          ))}
        </div>
      </FilterMenu>

      <FilterMenu
        label="Language"
        summary={filters.language}
        open={openMenu === 'language'}
        onToggle={() => toggleMenu('language')}
        panelClassName="w-[340px]"
      >
        <div className="grid grid-cols-2 gap-x-1">
          <OptionRow selected={filters.language === null} onClick={() => { setFilters({ language: null }); setOpenMenu(null) }}>
            All languages
          </OptionRow>
          {DISCOVERY_LANGUAGES.map((language) => (
            <OptionRow
              key={language}
              selected={filters.language === language}
              onClick={() => { setFilters({ language: filters.language === language ? null : language }); setOpenMenu(null) }}
            >
              {language}
            </OptionRow>
          ))}
        </div>
      </FilterMenu>

      <FilterMenu
        label="Interaction"
        summary={badgeSummary}
        open={openMenu === 'interaction'}
        onToggle={() => toggleMenu('interaction')}
        panelClassName="w-64"
      >
        {(Object.keys(INTERACTION_BADGES) as InteractionBadgeKey[]).map((badge) => (
          <OptionRow
            key={badge}
            selected={filters.badges.includes(badge)}
            onClick={() => toggleBadge(badge)}
            sub={INTERACTION_BADGES[badge].blurb}
          >
            {INTERACTION_BADGES[badge].icon} {INTERACTION_BADGES[badge].label}
          </OptionRow>
        ))}
      </FilterMenu>

      <FilterMenu
        label="Viewers"
        summary={filters.viewerTier ? `${VIEWER_TIERS[filters.viewerTier].label} viewers` : null}
        open={openMenu === 'viewers'}
        onToggle={() => toggleMenu('viewers')}
        panelClassName="w-44"
      >
        <OptionRow selected={filters.viewerTier === null} onClick={() => { setFilters({ viewerTier: null }); setOpenMenu(null) }}>
          Any size
        </OptionRow>
        {(Object.keys(VIEWER_TIERS) as ViewerTier[]).map((tier) => (
          <OptionRow
            key={tier}
            selected={filters.viewerTier === tier}
            onClick={() => { setFilters({ viewerTier: filters.viewerTier === tier ? null : tier }); setOpenMenu(null) }}
          >
            {VIEWER_TIERS[tier].label} viewers
          </OptionRow>
        ))}
      </FilterMenu>

      <span
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold backdrop-blur-sm ${
          hasActiveFilters(filters)
            ? 'border-kick/50 bg-kick/10 text-kick'
            : 'border-kick-border bg-kick-panel/90 text-kick-muted'
        }`}
      >
        <span className="h-1.5 w-1.5 animate-pulse-fast rounded-full bg-kick" />
        {matchCount.toLocaleString()} live
      </span>

      {hasActiveFilters(filters) && (
        <button
          type="button"
          onClick={() => { resetFilters(); setOpenMenu(null) }}
          className="rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-kick-muted underline-offset-2 transition-colors hover:text-kick-text hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
