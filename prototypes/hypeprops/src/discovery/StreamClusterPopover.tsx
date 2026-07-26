import { useEffect, useState } from 'react'
import StreamPreviewCard from './StreamPreviewCard'
import { useDiscovery } from './discoveryStore'
import type { DiscoveryCluster } from './types'

const MAX_CARDS = 5
const CARD_WIDTH = 186

type Props = {
  cluster: DiscoveryCluster
  /** pointer is over the popover — keep it open */
  onPointerStay: () => void
  /** pointer left the popover — start the 250ms close countdown */
  onPointerAway: () => void
}

/**
 * Channel cards bursting radially from the hovered hotspot: each card sits on
 * an ellipse around the dot with a connector line back to the center, and at
 * most one card plays a live preview at a time. The wrapper itself is
 * pointer-transparent so the globe stays draggable between the cards; only
 * the cards and the city chip catch the mouse.
 */
export default function StreamClusterPopover({ cluster, onPointerStay, onPointerAway }: Props) {
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const setSelectedChannel = useDiscovery((s) => s.setSelectedChannel)

  // a new cluster means a fresh burst — don't carry a stale preview across
  useEffect(() => setPreviewingId(null), [cluster.id])

  const channels = cluster.channels.slice(0, MAX_CARDS)
  const count = channels.length

  // elliptical spread (cards are wide, so give them more room horizontally);
  // first card at 12 o'clock, the rest evenly around
  const rx = count <= 3 ? 180 : 225
  const ry = count <= 3 ? 135 : 165
  const spots = channels.map((_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / count
    return { x: rx * Math.cos(angle), y: ry * Math.sin(angle) }
  })

  const svgW = rx * 2 + CARD_WIDTH
  const svgH = ry * 2 + CARD_WIDTH

  return (
    <div
      className="pointer-events-none relative"
      onMouseOver={onPointerStay}
      onMouseMove={onPointerStay}
      onMouseLeave={onPointerAway}
      // OrbitControls listens on the shared canvas container, so a press on a
      // card would bubble up as a "grab the globe" start event — which folds
      // the popover away and swallows the click. Keep presses to ourselves.
      onPointerDown={(e) => e.stopPropagation()}
      // scrolling over a card means "get out of my way, I'm navigating" —
      // fold the burst up so the next wheel tick zooms the globe again
      onWheel={() => useDiscovery.getState().setFocusedCluster(null)}
    >
      {/* hit shield: while the burst is open, the gaps between cards belong to
          the popover — without it, crossing a gap hovers an unrelated dot
          underneath and yanks the burst to another cluster mid-selection.
          Clicking the empty area dismisses the burst. */}
      <div
        className="pointer-events-auto absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
        style={{ width: svgW, height: svgH }}
        onClick={() => useDiscovery.getState().setFocusedCluster(null)}
      />

      {/* connector rays from the hotspot out to every card */}
      <svg
        width={svgW}
        height={svgH}
        viewBox={`${-svgW / 2} ${-svgH / 2} ${svgW} ${svgH}`}
        className="pointer-events-none absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        {spots.map((p, i) => (
          <line key={channels[i].id} x1={0} y1={0} x2={p.x} y2={p.y} stroke="#53fc18" strokeOpacity={0.45} />
        ))}
        <circle r={4} fill="#53fc18" />
      </svg>

      {/* city chip tucked under the hotspot */}
      <div className="pointer-events-auto absolute left-0 top-0 -translate-x-1/2 translate-y-3 whitespace-nowrap rounded-full border border-kick-border bg-kick-panel/95 px-2.5 py-1 shadow-lg backdrop-blur-sm">
        <span className="text-[12px] font-bold text-kick-text">{cluster.city}</span>
        <span className="ml-1 text-[11px] text-kick-muted">{cluster.country}</span>
        <span className="ml-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-kick">
          <span className="h-1.5 w-1.5 animate-pulse-fast rounded-full bg-kick" />
          {count} live
        </span>
      </div>

      {channels.map((channel, i) => (
        <div
          key={channel.id}
          className="pointer-events-auto absolute"
          style={{
            left: spots[i].x,
            top: spots[i].y,
            width: CARD_WIDTH,
            transform: 'translate(-50%, -50%)',
            zIndex: previewingId === channel.id ? 10 : undefined,
          }}
        >
          {/* entrance animation lives on this inner div so its transform never
              fights the positioning translate above or the card's hover scale */}
          <div className="animate-pop" style={{ animationDelay: `${i * 45}ms` }}>
            <StreamPreviewCard
              channel={channel}
              previewing={previewingId === channel.id}
              onPreviewStart={() => setPreviewingId(channel.id)}
              onPreviewEnd={() => setPreviewingId((id) => (id === channel.id ? null : id))}
              onSelect={() => setSelectedChannel(channel.id)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
