import { useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import kickLogo from '../assets/kick-logo.svg'
import { DEFAULT_ORIGIN, DISCOVERY_CLUSTERS, findDiscoveryChannel } from '../data/discoveryChannels'
import DiscoveryGlobe from './DiscoveryGlobe'
import StreamPreviewPanel from './StreamPreviewPanel'
import { useDiscovery } from './discoveryStore'

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * Semantic alternative to the canvas (and the whole experience when WebGL is
 * missing): every region's live channels as plain links.
 */
function RegionChannelList({ className = '' }: { className?: string }) {
  return (
    <nav aria-label="Live channels by region" className={className}>
      {DISCOVERY_CLUSTERS.map((cluster) => (
        <section key={cluster.id} className="mb-4">
          <h3 className="mb-1.5 text-[13px] font-bold text-kick-text">
            {cluster.city}, {cluster.country}
          </h3>
          <ul className="space-y-1">
            {cluster.channels.map((channel) => (
              <li key={channel.id}>
                <Link
                  to={`/stream?channel=${encodeURIComponent(channel.kickSlug)}`}
                  className="text-[13px] text-kick-muted transition-colors hover:text-kick"
                >
                  {channel.name} — {channel.category}, {channel.viewers.toLocaleString()} viewers
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}

export default function DiscoveryPage() {
  const webglOk = useMemo(hasWebGL, [])
  const geoStatus = useDiscovery((s) => s.geoStatus)
  const origin = useDiscovery((s) => s.origin)
  const selectedChannelId = useDiscovery((s) => s.selectedChannelId)

  // one geolocation ask per session; coordinates only ever steer the local
  // camera — nothing is sent anywhere or persisted (discovery plan rule)
  useEffect(() => {
    const state = useDiscovery.getState()
    if (state.origin || state.geoStatus !== 'idle') return
    if (!('geolocation' in navigator)) {
      state.setGeoStatus('denied')
      state.setOrigin(DEFAULT_ORIGIN)
      return
    }
    state.setGeoStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const s = useDiscovery.getState()
        s.setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'your area', isFallback: false })
        s.setGeoStatus('granted')
      },
      () => {
        const s = useDiscovery.getState()
        s.setOrigin(DEFAULT_ORIGIN)
        s.setGeoStatus('denied')
      },
      { timeout: 8000, maximumAge: 600_000 },
    )
  }, [])

  // Escape peels layers back one at a time: confirm layer first, then popover
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const state = useDiscovery.getState()
      if (state.selectedChannelId) state.setSelectedChannel(null)
      else if (state.focusedClusterId) state.setFocusedCluster(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const selectedChannel = selectedChannelId ? findDiscoveryChannel(selectedChannelId) : undefined
  const selectedCluster = useMemo(
    () => (selectedChannel ? DISCOVERY_CLUSTERS.find((c) => c.channels.some((ch) => ch.id === selectedChannel.id)) : undefined),
    [selectedChannel],
  )

  const statusChip =
    geoStatus === 'locating'
      ? 'finding your area…'
      : origin?.isFallback
        ? `exploring from ${origin.label}`
        : origin
          ? 'exploring from your area'
          : null

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-kick-dark text-kick-text">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-kick-border px-4 sm:px-6">
        <img src={kickLogo} alt="Kick" className="h-5 w-auto shrink-0" />
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="text-[15px] font-bold text-kick-text">Discovery</span>
          <span className="hidden truncate rounded-full border border-kick-border bg-kick-panel-2 px-2.5 py-1 text-[11px] font-medium text-kick-muted sm:inline">
            who's live right now, around the globe
          </span>
        </div>
        <Link
          to="/stream"
          className="ml-auto shrink-0 text-[13px] font-semibold text-kick-muted transition-colors hover:text-kick-text"
        >
          ← back to stream
        </Link>
      </header>

      {webglOk ? (
        <div className="relative min-h-0 flex-1">
          <DiscoveryGlobe />

          {statusChip && (
            <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-kick-border bg-kick-panel/80 px-3 py-1.5 text-[12px] font-medium text-kick-muted backdrop-blur-sm">
              <span className={`h-1.5 w-1.5 rounded-full bg-kick ${geoStatus === 'locating' ? 'animate-pulse-fast' : ''}`} />
              {statusChip}
            </div>
          )}

          <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-kick-border bg-kick-panel/80 px-3 py-1.5 text-[12px] text-kick-muted backdrop-blur-sm">
            drag to rotate · scroll to zoom · hover a green dot to see who's live
          </div>

          <RegionChannelList className="sr-only" />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <p className="mb-4 max-w-xl text-[13px] text-kick-muted">
            Your browser can't render the 3D globe (WebGL unavailable) — here's everyone live, by region.
          </p>
          <RegionChannelList className="columns-1 gap-8 sm:columns-2 lg:columns-3" />
        </div>
      )}

      {selectedChannel && <StreamPreviewPanel channel={selectedChannel} cluster={selectedCluster} />}
    </div>
  )
}
