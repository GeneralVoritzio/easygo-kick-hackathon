import { useState } from 'react'
import KickPlayer from '../stream/KickPlayer'
import { posterUrl } from '../data/discoveryChannels'
import { SIM_CHANNEL_STATS } from '../engine/interactionStore'
import type { DiscoveryChannel } from './types'

type Props = {
  channel: DiscoveryChannel
  /** true → this is the (single) card currently allowed to play a live preview */
  previewing: boolean
  onPreviewStart: () => void
  onPreviewEnd: () => void
  onSelect: () => void
}

/**
 * One channel card in the cluster popover. Poster + always-visible name by
 * default; while hovered it grows, glows kick-green and — if the channel has a
 * playable slug — swaps in a muted live Kick preview. A transparent overlay
 * keeps all pointer events in our document (an iframe would swallow them and
 * break hover tracking), and doubles as the persistent name bar.
 */
export default function StreamPreviewCard({ channel, previewing, onPreviewStart, onPreviewEnd, onSelect }: Props) {
  const [posterFailed, setPosterFailed] = useState(false)
  // legacy channels keep their hand-written odds label ("live" for HypeKing);
  // everyone else formats the seeded interaction profile
  const oddsLabel = SIM_CHANNEL_STATS[channel.name]?.oddsLabel ?? `1 in ${channel.interaction.oddsDenominator}`
  const playing = previewing && channel.embeddable

  return (
    <button
      type="button"
      onMouseEnter={onPreviewStart}
      onMouseLeave={onPreviewEnd}
      onFocus={onPreviewStart}
      onBlur={onPreviewEnd}
      onClick={onSelect}
      className={`relative block w-full overflow-hidden rounded-lg text-left transition-all duration-200 ease-out ${
        previewing
          ? 'z-10 scale-[1.15] ring-2 ring-kick shadow-[0_0_28px_rgba(83,252,24,0.4)]'
          : 'ring-1 ring-kick-border'
      }`}
    >
      <div className="relative aspect-video w-full" style={{ backgroundImage: channel.thumbnail.gradient }}>
        {!posterFailed && (
          <img
            src={posterUrl(channel)}
            alt=""
            loading="lazy"
            draggable={false}
            onError={() => setPosterFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {playing && (
          <div className="absolute inset-0 bg-black">
            <KickPlayer channel={channel.kickSlug} />
          </div>
        )}

        {/* pointer shield + persistent chrome: name stays visible in every state,
            and clicks land here (bubbling to the button) instead of vanishing
            into the preview iframe */}
        <div className="absolute inset-0 z-10 flex flex-col justify-between">
          <div className="flex items-center justify-between p-1.5">
            <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              Live
            </span>
            <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              {channel.viewers.toLocaleString()}
            </span>
          </div>
          <div className="bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 pb-1.5 pt-4 leading-tight">
            <div className="truncate text-[12px] font-bold text-kick-text">{channel.name}</div>
            <div className="truncate text-[10px] text-kick-muted">
              {channel.category} · replies {oddsLabel}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
