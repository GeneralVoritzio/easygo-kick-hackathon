import { useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import kickLogo from '../assets/kick-logo.svg'
import { DEFAULT_ORIGIN, DISCOVERY_CLUSTERS, findDiscoveryChannel } from '../data/discoveryChannels'
import { BODIES, BODY_ORDER } from './bodies'
import { channelCountsByBody, clustersForBody, isLocationHidden } from './bodyView'
import BodySwitcher from './BodySwitcher'
import DiscoveryFilterBar from './DiscoveryFilterBar'
import DiscoveryGlobe from './DiscoveryGlobe'
import SolarSystemView from './SolarSystemView'
import StreamPreviewPanel from './StreamPreviewPanel'
import { applyDiscoveryFilters } from './filters'
import { useDiscovery } from './discoveryStore'
import type { BodyId, DiscoveryCluster } from './types'

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
 * missing): every body's live channels as plain links, grouped by location.
 */
function BodyChannelList({
  bodies,
  className = '',
}: {
  bodies: { id: BodyId; clusters: DiscoveryCluster[] }[]
  className?: string
}) {
  return (
    <nav aria-label="Live channels by location" className={className}>
      {bodies.map(({ id, clusters }) => (
        <section key={id} className="mb-6">
          <h2 className="mb-2 text-[14px] font-bold text-kick-text">
            {BODIES[id].name} — {BODIES[id].tagline}
          </h2>
          {clusters.map((cluster) => (
            <section key={cluster.id} className="mb-4">
              <h3 className="mb-1.5 text-[13px] font-bold text-kick-text">
                {/* Sun pockets have no geography to print */}
                {cluster.body === 'sun' ? 'Location private' : `${cluster.city}, ${cluster.country}`}
              </h3>
              <ul className="space-y-1">
                {cluster.channels.map((channel) => (
                  <li key={channel.id}>
                    <Link
                      to={`/stream?channel=${encodeURIComponent(channel.kickSlug)}`}
                      className="text-[13px] text-kick-muted transition-colors hover:text-kick"
                    >
                      {channel.name} — {channel.category}, {channel.viewers.toLocaleString()} viewers
                      {channel.relay ? ` · relaying ${channel.relay.agency} ${channel.relay.instrument}` : ''}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
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
  const filters = useDiscovery((s) => s.filters)
  const activeBody = useDiscovery((s) => s.activeBody)
  const viewMode = useDiscovery((s) => s.viewMode)
  const hiddenOverrides = useDiscovery((s) => s.hiddenOverrides)

  const body = BODIES[activeBody]

  // counts feed both the switcher and the solar-system labels; they follow the
  // privacy toggles but deliberately ignore filters, since they describe the
  // whole system rather than the current query
  const counts = useMemo(() => channelCountsByBody(DISCOVERY_CLUSTERS, hiddenOverrides), [hiddenOverrides])

  // what the current body shows under the active filters
  const bodyClusters = useMemo(
    () => clustersForBody(DISCOVERY_CLUSTERS, activeBody, hiddenOverrides),
    [activeBody, hiddenOverrides],
  )
  const filteredClusters = useMemo(() => applyDiscoveryFilters(bodyClusters, filters), [bodyClusters, filters])
  const matchCount = useMemo(() => filteredClusters.reduce((sum, c) => sum + c.channels.length, 0), [filteredClusters])

  // if this body has no matches, say where the matches actually are
  const elsewhere = useMemo(() => {
    if (matchCount > 0) return null
    for (const id of BODY_ORDER) {
      if (id === activeBody) continue
      const n = applyDiscoveryFilters(clustersForBody(DISCOVERY_CLUSTERS, id, hiddenOverrides), filters).reduce(
        (sum, c) => sum + c.channels.length,
        0,
      )
      if (n > 0) return { body: id, count: n }
    }
    return null
  }, [matchCount, activeBody, filters, hiddenOverrides])

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

  // Escape peels layers back one at a time: confirm layer, popover, then the
  // solar-system view
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const state = useDiscovery.getState()
      if (state.selectedChannelId) state.setSelectedChannel(null)
      else if (state.focusedClusterId) state.setFocusedCluster(null)
      else if (state.viewMode === 'system') state.setViewMode('body')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const selectedChannel = selectedChannelId ? findDiscoveryChannel(selectedChannelId) : undefined
  // a channel that's hiding has no location to name, so the panel gets no cluster
  const selectedCluster = useMemo(() => {
    if (!selectedChannel) return undefined
    if (isLocationHidden(selectedChannel, hiddenOverrides)) return undefined
    return DISCOVERY_CLUSTERS.find((c) => c.channels.some((ch) => ch.id === selectedChannel.id))
  }, [selectedChannel, hiddenOverrides])

  const statusChip =
    activeBody !== 'earth'
      ? body.tagline
      : geoStatus === 'locating'
        ? 'finding your area…'
        : origin?.isFallback
          ? `exploring from ${origin.label}`
          : origin
            ? 'exploring from your area'
            : null

  const hint =
    viewMode === 'system'
      ? 'sizes and distances are compressed for browsing · click a body to fly in'
      : 'drag to rotate · scroll to zoom · zoom out twice to leave orbit'

  const allBodies = useMemo(
    () => BODY_ORDER.map((id) => ({ id, clusters: clustersForBody(DISCOVERY_CLUSTERS, id, hiddenOverrides) })),
    [hiddenOverrides],
  )

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-kick-dark text-kick-text">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-kick-border px-4 sm:px-6">
        <img src={kickLogo} alt="Kick" className="h-5 w-auto shrink-0" />
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="text-[15px] font-bold text-kick-text">Discovery</span>
          <span className="hidden truncate rounded-full border border-kick-border bg-kick-panel-2 px-2.5 py-1 text-[11px] font-medium text-kick-muted sm:inline">
            who's live right now, across the system
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
          {/* the swap between views is a jump cut without this: each view
              arrives with a short warp so travelling reads as movement */}
          {viewMode === 'system' ? (
            <div key="system" className="animate-warp-out h-full w-full">
              <SolarSystemView counts={counts} />
            </div>
          ) : (
            // keyed by body: a new body means a fresh scene and camera
            <div key={activeBody} className="animate-warp-in h-full w-full">
              <DiscoveryGlobe bodyId={activeBody} />
            </div>
          )}

          {viewMode === 'body' && (
            <DiscoveryFilterBar matchCount={matchCount} emptyLabel={body.emptyLabel} elsewhere={elsewhere} />
          )}

          <div className="pointer-events-none absolute inset-x-4 top-4 flex justify-center sm:inset-x-auto sm:right-4">
            <BodySwitcher counts={counts} />
          </div>

          <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-kick-border bg-kick-panel/80 px-3 py-1.5 text-[12px] text-kick-muted backdrop-blur-sm">
            {hint}
          </div>

          {statusChip && (
            <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-kick-border bg-kick-panel/80 px-3 py-1.5 text-[12px] font-medium text-kick-muted backdrop-blur-sm">
              <span
                className={`h-1.5 w-1.5 rounded-full ${geoStatus === 'locating' && activeBody === 'earth' ? 'animate-pulse-fast' : ''}`}
                style={{ backgroundColor: body.accent }}
              />
              {statusChip}
            </div>
          )}

          <BodyChannelList bodies={allBodies} className="sr-only" />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <p className="mb-4 max-w-xl text-[13px] text-kick-muted">
            Your browser can't render the 3D view (WebGL unavailable) — here's everyone live, by location.
          </p>
          <BodyChannelList bodies={allBodies} />
        </div>
      )}

      {selectedChannel && <StreamPreviewPanel channel={selectedChannel} cluster={selectedCluster} />}
    </div>
  )
}
