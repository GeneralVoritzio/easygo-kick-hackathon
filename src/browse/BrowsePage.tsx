import { Link } from 'react-router'
import kickLogo from '../assets/kick-logo.svg'
import { useEngine } from '../engine/store'
import { SIM_CHANNEL_STATS, useInteraction } from '../engine/interactionStore'
import { INTERACTION_BADGES, formatOdds } from '../engine/ack'
import type { InteractionBadgeKey } from '../engine/ack'

/** cosmetic only — categories aren't wired to filtering in this clone */
const CATEGORY_TABS = ['All', 'IRL', 'Slots', 'GTA V', 'Minecraft']

type StaticChannel = {
  name: string
  category: string
  initials: string
  gradient: string
  viewers: number
}

/** the 4 non-HypeKing channels the interaction engine is wired into (mirrors Sidebar.tsx) */
const WIRED_CHANNELS: StaticChannel[] = [
  { name: 'NovaStrikes', category: 'Valorant', initials: 'NS', gradient: 'linear-gradient(135deg,#60a5fa,#a78bfa)', viewers: 3204 },
  { name: 'LootGoblin', category: 'Old School RuneScape', initials: 'LG', gradient: 'linear-gradient(135deg,#fb923c,#f87171)', viewers: 2113 },
  { name: 'ClipFarmer', category: 'Grand Theft Auto V', initials: 'CF', gradient: 'linear-gradient(135deg,#f472b6,#facc15)', viewers: 1842 },
  { name: 'PixelPunk', category: 'Minecraft', initials: 'PP', gradient: 'linear-gradient(135deg,#34d399,#60a5fa)', viewers: 1390 },
]

/** plain filler channels — no interaction-engine partner, so no badges/odds render at all */
const PLAIN_CHANNELS: StaticChannel[] = [
  { name: 'DriftQueen', category: 'Just Chatting', initials: 'DQ', gradient: 'linear-gradient(135deg,#a78bfa,#f472b6)', viewers: 981 },
  { name: 'HexRunner', category: 'League of Legends', initials: 'HR', gradient: 'linear-gradient(135deg,#22d3ee,#3b82f6)', viewers: 845 },
  { name: 'StormCaller', category: 'Fortnite', initials: 'SC', gradient: 'linear-gradient(135deg,#facc15,#fb923c)', viewers: 612 },
]

const HYPEKING = {
  name: 'HypeKing',
  category: 'Just Chatting',
  initials: 'HK',
  gradient: 'linear-gradient(135deg,#53fc18,#3fc411)',
}

type TileProps = {
  name: string
  category: string
  initials: string
  gradient: string
  viewers: number
  badges: InteractionBadgeKey[]
  oddsLabel?: string
  blurb?: string
  liveLabel?: string
  highlight?: boolean
}

function BadgeChip({ badgeKey }: { badgeKey: InteractionBadgeKey }) {
  const badge = INTERACTION_BADGES[badgeKey]
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-kick/50 bg-kick/10 px-2 py-0.5 text-[11px] font-semibold text-kick">
      <span aria-hidden="true">{badge.icon}</span>
      {badge.label}
    </span>
  )
}

function StreamTile({ name, category, initials, gradient, viewers, badges, oddsLabel, blurb, liveLabel, highlight }: TileProps) {
  const hasSignal = badges.length > 0 || Boolean(oddsLabel)
  return (
    <Link
      to="/stream"
      className={`group flex flex-col gap-2 rounded-xl p-1.5 transition-colors hover:bg-white/5 ${
        highlight ? 'ring-1 ring-kick/50' : ''
      }`}
    >
      <div className="relative aspect-video overflow-hidden rounded-lg" style={{ backgroundImage: gradient }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <span className="absolute left-2 top-2 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Live
        </span>
        <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
          {viewers.toLocaleString()} viewers
        </span>
      </div>

      <div className="flex gap-2.5 px-1">
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-black text-black"
          style={{ backgroundImage: gradient }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[14px] font-bold text-kick-text">{name}</div>
          <div className="truncate text-[12px] text-kick-muted">{category}</div>
        </div>
      </div>

      {hasSignal && (
        <div className="flex flex-col gap-1.5 px-1">
          {liveLabel && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-kick">
              <span className="h-1.5 w-1.5 animate-pulse-fast rounded-full bg-kick" />
              {liveLabel}
            </div>
          )}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {badges.map((key) => (
                <BadgeChip key={key} badgeKey={key} />
              ))}
            </div>
          )}
          {oddsLabel && (
            <div className="text-[11px] leading-snug text-kick-muted">
              <span className="font-bold text-kick">{oddsLabel}</span>
              {blurb ? ` · ${blurb}` : ''}
            </div>
          )}
        </div>
      )}
    </Link>
  )
}

export default function BrowsePage() {
  const liveViewers = useEngine((s) => s.viewers)
  const liveStats = useInteraction((s) => s.stats)

  const hypeKingTile: TileProps = {
    ...HYPEKING,
    viewers: liveViewers,
    badges: liveStats.badges,
    oddsLabel: formatOdds(liveStats),
    liveLabel: '● measured live',
    highlight: true,
  }

  const wiredTiles: TileProps[] = WIRED_CHANNELS.map((c) => {
    const sim = SIM_CHANNEL_STATS[c.name]
    return {
      ...c,
      badges: sim?.badges ?? [],
      oddsLabel: sim?.oddsLabel,
      blurb: sim?.blurb,
    }
  })

  const plainTiles: TileProps[] = PLAIN_CHANNELS.map((c) => ({ ...c, badges: [] }))

  const tiles = [hypeKingTile, ...wiredTiles, ...plainTiles]

  return (
    <div className="flex h-full min-h-screen flex-col overflow-y-auto bg-kick-dark">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-kick-border px-4 sm:px-6">
        <img src={kickLogo} alt="Kick" className="h-5 w-auto shrink-0" />
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="text-[15px] font-bold text-kick-text">Browse</span>
          <span className="hidden truncate rounded-full border border-kick-border bg-kick-panel-2 px-2.5 py-1 text-[11px] font-medium text-kick-muted sm:inline">
            Interaction Engine — response odds per channel
          </span>
        </div>
        <Link
          to="/stream"
          className="ml-auto shrink-0 text-[13px] font-semibold text-kick-muted transition-colors hover:text-kick-text"
        >
          ← back to stream
        </Link>
      </header>

      <div className="flex flex-wrap gap-2 px-4 pt-4 sm:px-6">
        {CATEGORY_TABS.map((tab, i) => (
          <span
            key={tab}
            className={`cursor-default select-none rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
              i === 0 ? 'bg-kick text-black' : 'bg-kick-panel-2 text-kick-muted'
            }`}
          >
            {tab}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 px-4 py-6 sm:px-6 md:grid-cols-3 xl:grid-cols-4">
        {tiles.map((tile) => (
          <StreamTile key={tile.name} {...tile} />
        ))}
      </div>

      <div className="mt-auto px-4 pb-8 pt-2 text-[11px] text-kick-muted sm:px-6">
        Badges are computed from a rolling 10-minute window of acknowledgement events — no badge is shown when chat is too fast to
        track.
      </div>
    </div>
  )
}
