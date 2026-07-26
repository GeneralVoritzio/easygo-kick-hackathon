import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import KickPlayer from '../stream/KickPlayer'
import { posterUrl } from '../data/discoveryChannels'
import { INTERACTION_BADGES } from '../engine/ack'
import { SIM_CHANNEL_STATS } from '../engine/interactionStore'
import { startMockEvents } from '../engine/mockEvents'
import { useEngine } from '../engine/store'
import { useDiscovery } from './discoveryStore'
import type { DiscoveryChannel, DiscoveryCluster } from './types'

/** most recent chat lines shown in the panel's compact feed */
const CHAT_TAIL = 30

/** read-only live chat feed, driven by the same simulated crowd as /stream */
function LiveChatFeed() {
  const chat = useEngine((s) => s.chat)
  const scrollRef = useRef<HTMLDivElement>(null)

  // the crowd simulation normally starts with the stream page — run it while
  // the panel is open so the feed moves in real time
  useEffect(() => startMockEvents(), [])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat])

  return (
    <div className="flex min-h-[160px] flex-1 flex-col gap-1.5 rounded-xl border border-kick-border bg-kick-panel-2 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-kick-muted">
        <span className="h-1.5 w-1.5 animate-pulse-fast rounded-full bg-kick" />
        Live chat
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
        {chat.slice(-CHAT_TAIL).map((message) => (
          <div key={message.id} className="text-[12px] leading-snug break-words">
            <span className="font-semibold" style={{ color: message.color }}>
              {message.user}
            </span>
            <span className="text-kick-muted">: </span>
            <span className="text-kick-text/90">{message.text}</span>
          </div>
        ))}
        {chat.length === 0 && <div className="text-[12px] text-kick-muted">chat is warming up…</div>}
      </div>
    </div>
  )
}

type Props = {
  channel: DiscoveryChannel
  cluster?: DiscoveryCluster
}

/**
 * Half-screen confirm layer over the map: right panel on desktop, bottom
 * sheet on small screens. "Watch live" commits to the stream page; "Keep
 * exploring" drops back to the untouched camera + expanded hotspot.
 */
export default function StreamPreviewPanel({ channel, cluster }: Props) {
  const navigate = useNavigate()
  const setSelectedChannel = useDiscovery((s) => s.setSelectedChannel)
  const [posterFailed, setPosterFailed] = useState(false)
  const sim = SIM_CHANNEL_STATS[channel.name]
  const oddsLabel = sim?.oddsLabel ?? `1 in ${channel.interaction.oddsDenominator}`
  const badges = channel.interaction.badges
  const close = () => setSelectedChannel(null)

  return (
    <>
      {/* the map stays visible (and clickable-to-dismiss) behind the layer */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={close} aria-hidden="true" />

      <section
        aria-label={`${channel.name} — live channel details`}
        className="fixed inset-x-0 bottom-0 z-50 flex h-[70%] animate-slide-up flex-col overflow-y-auto rounded-t-2xl border-t border-kick-border bg-kick-panel md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-[46%] md:max-w-[620px] md:rounded-none md:border-l md:border-t-0"
      >
        <header className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-kick">
            <span className="h-1.5 w-1.5 animate-pulse-fast rounded-full bg-kick" />
            Live now
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-kick-muted transition-colors hover:bg-white/5 hover:text-kick-text"
          >
            ✕
          </button>
        </header>

        <div className="relative mx-4 aspect-video shrink-0 overflow-hidden rounded-xl bg-black ring-1 ring-kick-border">
          {channel.embeddable ? (
            <KickPlayer channel={channel.kickSlug} />
          ) : (
            <div className="absolute inset-0" style={{ backgroundImage: channel.thumbnail.gradient }}>
              {!posterFailed && (
                <img
                  src={posterUrl(channel)}
                  alt={`${channel.name} stream preview`}
                  onError={() => setPosterFailed(true)}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-[11px] text-kick-muted backdrop-blur-sm">
                live preview unavailable for this demo channel
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center gap-3">
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[13px] font-black text-black"
              style={{ backgroundImage: channel.thumbnail.gradient }}
            >
              {channel.thumbnail.initials}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[17px] font-bold text-kick-text">{channel.name}</div>
              <div className="truncate text-[13px] text-kick-muted">
                {channel.category} · {channel.language} · {channel.viewers.toLocaleString()} viewers
                {cluster ? ` · ${cluster.city}, ${cluster.country}` : ''}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 rounded-xl border border-kick-border bg-kick-panel-2 p-3">
            <div className="text-[11px] leading-snug text-kick-muted">
              <span className="font-bold text-kick">replies {oddsLabel}</span>
              {sim?.blurb ? ` · ${sim.blurb}` : ' · chance your message gets a response'}
            </div>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {badges.map((key) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 rounded-full border border-kick/50 bg-kick/10 px-2 py-0.5 text-[11px] font-semibold text-kick"
                  >
                    <span aria-hidden="true">{INTERACTION_BADGES[key].icon}</span>
                    {INTERACTION_BADGES[key].label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <LiveChatFeed />

          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate(`/stream?channel=${encodeURIComponent(channel.kickSlug)}`)}
              className="rounded-xl bg-kick px-4 py-3 text-[14px] font-bold text-black transition-colors hover:bg-kick-dim"
            >
              Watch live
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-xl border border-kick-border px-4 py-3 text-[14px] font-semibold text-kick-text transition-colors hover:bg-white/5"
            >
              Keep exploring
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
