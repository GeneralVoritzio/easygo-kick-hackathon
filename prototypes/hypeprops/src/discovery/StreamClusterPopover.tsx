import { useEffect, useState } from 'react'
import StreamPreviewCard from './StreamPreviewCard'
import { useDiscovery } from './discoveryStore'
import type { DiscoveryCluster } from './types'

const MAX_CARDS = 5

type Props = {
  cluster: DiscoveryCluster
  /** pointer is over the popover — keep it open */
  onPointerStay: () => void
  /** pointer left the popover — start the 250ms close countdown */
  onPointerAway: () => void
}

/**
 * The card stack that unfolds next to a hovered hotspot: connector line back
 * to the dot, city header, and 3–5 channel cards of which at most one plays a
 * live preview at a time.
 */
export default function StreamClusterPopover({ cluster, onPointerStay, onPointerAway }: Props) {
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const setSelectedChannel = useDiscovery((s) => s.setSelectedChannel)

  // a new cluster means a fresh stack — don't carry a stale preview across
  useEffect(() => setPreviewingId(null), [cluster.id])

  const channels = cluster.channels.slice(0, MAX_CARDS)

  return (
    // mouseover/mousemove (not mouseenter): the popover mounts *under* the
    // resting pointer, so an enter-edge never fires — any bubbled activity
    // inside the stack must keep it open
    <div
      className="pointer-events-auto relative -translate-y-1/2 pl-[22px]"
      onMouseOver={onPointerStay}
      onMouseMove={onPointerStay}
      onMouseLeave={onPointerAway}
      // OrbitControls listens on the shared canvas container, so a press on a
      // card would bubble up as a "grab the globe" start event — which now
      // folds the popover away and swallows the click. Keep presses to ourselves.
      onPointerDown={(e) => e.stopPropagation()}
      // scrolling over the stack means "get out of my way, I'm navigating" —
      // fold it up so the next wheel tick zooms the globe again
      onWheel={() => useDiscovery.getState().setFocusedCluster(null)}
    >
      {/* connector back to the hotspot */}
      <span className="absolute left-0 top-1/2 h-px w-[22px] bg-kick/70" />
      <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-kick shadow-[0_0_8px_rgba(83,252,24,0.9)]" />

      <div className="w-[240px] rounded-xl border border-kick-border bg-kick-panel/95 p-2 shadow-2xl backdrop-blur-sm">
        <div className="flex items-baseline justify-between px-1 pb-1.5">
          <span className="truncate text-[13px] font-bold text-kick-text">
            {cluster.city}
            <span className="ml-1.5 font-medium text-kick-muted">{cluster.country}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-kick">
            <span className="h-1.5 w-1.5 animate-pulse-fast rounded-full bg-kick" />
            {channels.length} live
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {channels.map((channel) => (
            <StreamPreviewCard
              key={channel.id}
              channel={channel}
              previewing={previewingId === channel.id}
              onPreviewStart={() => setPreviewingId(channel.id)}
              onPreviewEnd={() => setPreviewingId((id) => (id === channel.id ? null : id))}
              onSelect={() => setSelectedChannel(channel.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
