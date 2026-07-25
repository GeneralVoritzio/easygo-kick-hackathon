import { useState } from 'react'
import { Link } from 'react-router'
import { useEngine } from '../engine/store'
import { INTERACTION_BADGES, formatOdds } from '../engine/ack'
import { SIM_CHANNEL_STATS, useInteraction } from '../engine/interactionStore'
import { CompassIcon, HomeIcon, UsersIcon } from './icons'

type Channel = {
  name: string
  category: string
  viewers: number
  gradient: string
  initials: string
  current?: boolean
}

const OTHER_CHANNELS: Channel[] = [
  { name: 'NovaStrikes', category: 'Valorant', viewers: 3204, gradient: 'linear-gradient(135deg,#60a5fa,#a78bfa)', initials: 'NS' },
  { name: 'LootGoblin', category: 'Old School RuneScape', viewers: 2113, gradient: 'linear-gradient(135deg,#fb923c,#f87171)', initials: 'LG' },
  { name: 'ClipFarmer', category: 'Grand Theft Auto V', viewers: 1842, gradient: 'linear-gradient(135deg,#f472b6,#facc15)', initials: 'CF' },
  { name: 'PixelPunk', category: 'Minecraft', viewers: 1390, gradient: 'linear-gradient(135deg,#34d399,#60a5fa)', initials: 'PP' },
  { name: 'DriftQueen', category: 'Just Chatting', viewers: 981, gradient: 'linear-gradient(135deg,#a78bfa,#f472b6)', initials: 'DQ' },
  { name: 'HexRunner', category: 'League of Legends', viewers: 845, gradient: 'linear-gradient(135deg,#22d3ee,#3b82f6)', initials: 'HR' },
  { name: 'StormCaller', category: 'Fortnite', viewers: 612, gradient: 'linear-gradient(135deg,#facc15,#fb923c)', initials: 'SC' },
]

const VISIBLE_COUNT = 5

const NAV_ITEMS: { label: string; icon: typeof HomeIcon; to?: string }[] = [
  { label: 'Home', icon: HomeIcon },
  { label: 'Browse', icon: CompassIcon, to: '/browse' },
  { label: 'Following', icon: UsersIcon },
]

export default function Sidebar() {
  const liveViewers = useEngine((s) => s.viewers)
  const liveStats = useInteraction((s) => s.stats)
  const [expanded, setExpanded] = useState(false)

  const channels: Channel[] = [
    {
      name: 'HypeKing',
      category: 'Just Chatting',
      viewers: liveViewers,
      gradient: 'linear-gradient(135deg,#53fc18,#3fc411)',
      initials: 'HK',
      current: true,
    },
    ...OTHER_CHANNELS,
  ]
  const visible = expanded ? channels : channels.slice(0, VISIBLE_COUNT)

  return (
    <aside className="hidden w-[230px] shrink-0 flex-col gap-1 overflow-y-auto bg-kick-dark px-2 py-3 lg:flex">
      <nav className="space-y-0.5">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) =>
          to ? (
            <Link
              key={label}
              to={to}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] text-kick-muted transition-colors hover:bg-white/5 hover:text-kick-text"
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          ) : (
            <button
              key={label}
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] text-kick-muted transition-colors hover:bg-white/5 hover:text-kick-text"
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </button>
          ),
        )}
      </nav>

      <div className="my-2 h-px bg-kick-border/60" />

      <div className="px-2.5 pb-1 text-[11px] font-bold text-kick-muted">Recommended</div>

      <div className="space-y-0.5">
        {visible.map((c) => {
          // HypeKing is the live channel — read its real odds/badges off the
          // interaction engine; every other row is the static browse-grid mock
          const isLive = c.name === 'HypeKing'
          const sim = SIM_CHANNEL_STATS[c.name]
          const oddsLabel = isLive ? formatOdds(liveStats) : sim?.oddsLabel
          const badges = isLive ? liveStats.badges : (sim?.badges ?? [])
          return (
            <div
              key={c.name}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 ${c.current ? 'bg-white/5' : 'hover:bg-white/5'}`}
            >
              <div
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-black text-black"
                style={{ backgroundImage: c.gradient }}
              >
                {c.initials}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[13px] font-bold text-kick-text">{c.name}</div>
                <div className="flex items-center gap-1 text-[11px] text-kick-muted">
                  <span className="truncate">{c.category}</span>
                  {oddsLabel && <span className="shrink-0">· {oddsLabel}</span>}
                  {badges.length > 0 && (
                    <span className="flex shrink-0 items-center gap-0.5">
                      {badges.map((b) => (
                        <span key={b} title={INTERACTION_BADGES[b].label}>
                          {INTERACTION_BADGES[b].icon}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-[12px] text-kick-text">
                <span className="h-1.5 w-1.5 rounded-full bg-kick" />
                {c.viewers.toLocaleString()}
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 rounded-lg px-2.5 py-1.5 text-left text-[12px] text-kick-muted transition-colors hover:text-kick-text"
      >
        {expanded ? 'Show Less' : 'Show More'}
      </button>
    </aside>
  )
}
