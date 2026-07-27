import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Stars } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { DISCOVERY_CLUSTERS, DEFAULT_ORIGIN } from '../data/discoveryChannels'
import { BODIES } from './bodies'
import { channelsForFocus, clustersForBody } from './bodyView'
import BodySurface, { Atmosphere } from './BodySurface'
import BorderLayer from './BorderLayer'
import CityLabelLayer from './CityLabelLayer'
import { applyDiscoveryFilters, hasActiveFilters } from './filters'
import {
  INITIAL_CAMERA_DISTANCE,
  MAX_CAMERA_DISTANCE,
  MIN_CAMERA_DISTANCE,
  bordersForBand,
  citiesForView,
  latLngToVector3,
  selectVisiblePoints,
  zoomBandForDistance,
} from './geo'
import { useCityPoints } from './geoData'
import { useDiscovery } from './discoveryStore'
import LivePointLayer from './LivePointLayer'
import StreamClusterPopover from './StreamClusterPopover'
import type { BodyId, ZoomBand } from './types'

/** representative camera distance per band — hotspot selection only depends on
 * the band, so re-picking points on every scroll tick would be wasted work */
const BAND_DISTANCE: Record<ZoomBand, number> = { near: 1.5, mid: 2.2, far: 3.4 }

/** the camera idles far out over the default region until geolocation resolves */
const IDLE_CAMERA_DISTANCE = 3.4

/**
 * Owns the camera for one body: restores that body's saved pose, flies to the
 * resolved origin on Earth's first visit, feeds zoom-band changes upward, and
 * hands off to the solar-system view when the user keeps zooming out.
 */
function CameraRig({
  body,
  onBandChange,
  flyTo,
  onZoomOutPastCeiling,
}: {
  body: BodyId
  onBandChange: (band: ZoomBand) => void
  /** externally requested destination (e.g. "nearest filter match") */
  flyTo: THREE.Vector3 | null
  onZoomOutPastCeiling: () => void
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const origin = useDiscovery((s) => s.origin)
  const flight = useRef<THREE.Vector3 | null>(null)

  // restore this body's own pose (each keeps its own vantage point)
  useEffect(() => {
    const saved = useDiscovery.getState().savedCameras[body]
    if (!saved) return
    camera.position.set(...saved.position)
    controlsRef.current?.target.set(...saved.target)
    controlsRef.current?.update()
  }, [camera, body])

  // Earth's first visit only: swing from the idle view down to the resolved origin
  useEffect(() => {
    const state = useDiscovery.getState()
    if (body !== 'earth' || !origin || state.introFlown || state.savedCameras.earth) return
    flight.current = new THREE.Vector3(...latLngToVector3(origin.lat, origin.lng, INITIAL_CAMERA_DISTANCE))
  }, [origin, body])

  useEffect(() => {
    if (flyTo) flight.current = flyTo.clone()
  }, [flyTo])

  // grabbing the globe hands control back to the user immediately, and tucks
  // the card popover away — it would otherwise sit pinned mid-screen,
  // swallowing hover and wheel events while the user tries to navigate
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const onUserGrab = () => {
      if (flight.current) {
        flight.current = null
        useDiscovery.getState().setIntroFlown()
      }
      const state = useDiscovery.getState()
      if (state.focusedClusterId && !state.selectedChannelId) state.setFocusedCluster(null)
    }
    controls.addEventListener('start', onUserGrab)
    return () => controls.removeEventListener('start', onUserGrab)
  }, [])

  /**
   * OrbitControls clamps at maxDistance, so "keep zooming out" can only be
   * detected as an *attempt*: a zoom-out wheel tick while already parked at the
   * ceiling. Two consecutive ticks are required so a single overshoot from
   * normal zooming doesn't launch you into space.
   */
  useEffect(() => {
    const el = gl.domElement
    let ticksAtCeiling = 0
    let resetAt: number | null = null
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY <= 0) {
        ticksAtCeiling = 0
        return
      }
      if (camera.position.length() < MAX_CAMERA_DISTANCE - 0.02) {
        ticksAtCeiling = 0
        return
      }
      ticksAtCeiling++
      if (resetAt) window.clearTimeout(resetAt)
      resetAt = window.setTimeout(() => {
        ticksAtCeiling = 0
      }, 600)
      if (ticksAtCeiling >= 2) {
        ticksAtCeiling = 0
        onZoomOutPastCeiling()
      }
    }
    el.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (resetAt) window.clearTimeout(resetAt)
    }
  }, [gl, camera, onZoomOutPastCeiling])

  // save this body's pose for restore-on-return
  useEffect(
    () => () => {
      const target = controlsRef.current?.target
      useDiscovery.getState().setSavedCamera(body, {
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: target ? [target.x, target.y, target.z] : [0, 0, 0],
      })
    },
    [camera, body],
  )

  const lastBand = useRef<ZoomBand | null>(null)
  useFrame((_, dt) => {
    const target = flight.current
    if (target) {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, target.x, 2.4, dt)
      camera.position.y = THREE.MathUtils.damp(camera.position.y, target.y, 2.4, dt)
      camera.position.z = THREE.MathUtils.damp(camera.position.z, target.z, 2.4, dt)
      // a straight lerp between distant surface points can dip towards the
      // globe — keep the swoop outside the zoom floor
      if (camera.position.length() < MIN_CAMERA_DISTANCE + 0.05) {
        camera.position.setLength(MIN_CAMERA_DISTANCE + 0.05)
      }
      if (camera.position.distanceTo(target) < 0.02) {
        flight.current = null
        useDiscovery.getState().setIntroFlown()
      }
    }
    const controls = controlsRef.current
    if (controls) {
      // constant rotateSpeed feels fine at globe scale but flings the view
      // multiple screens per drag once zoomed in — scale it with height above
      // the surface so a drag moves a similar *screen* distance at every zoom
      const height = (camera.position.length() - 1) / (INITIAL_CAMERA_DISTANCE - 1)
      controls.rotateSpeed = 0.45 * Math.min(1.2, Math.max(0.1, height))
      controls.update()
    }

    const band = zoomBandForDistance(camera.position.length())
    if (band !== lastBand.current) {
      lastBand.current = band
      onBandChange(band)
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      enablePan={false}
      minDistance={MIN_CAMERA_DISTANCE}
      maxDistance={MAX_CAMERA_DISTANCE}
      rotateSpeed={0.45}
      zoomSpeed={0.55}
      dampingFactor={0.1}
    />
  )
}

function BodyScene({ bodyId }: { bodyId: BodyId }) {
  const body = BODIES[bodyId]
  const surfaceRef = useRef<THREE.Mesh>(null)
  const [band, setBand] = useState<ZoomBand>('far')
  const focusedClusterId = useDiscovery((s) => s.focusedClusterId)
  const focusedAnchor = useDiscovery((s) => s.focusedAnchor)
  const focusedChannelId = useDiscovery((s) => s.focusedChannelId)
  const filters = useDiscovery((s) => s.filters)
  const hiddenOverrides = useDiscovery((s) => s.hiddenOverrides)
  const setViewMode = useDiscovery((s) => s.setViewMode)

  // the scene only ever sees this body's clusters, then the active filters
  const bodyClusters = useMemo(
    () => clustersForBody(DISCOVERY_CLUSTERS, bodyId, hiddenOverrides),
    [bodyId, hiddenOverrides],
  )
  const filteredClusters = useMemo(() => applyDiscoveryFilters(bodyClusters, filters), [bodyClusters, filters])

  // a filter change (or a body change) can empty the cluster whose burst is
  // open — dismiss it
  useEffect(() => {
    if (focusedClusterId && !filteredClusters.some((c) => c.id === focusedClusterId)) {
      useDiscovery.getState().setFocusedCluster(null)
    }
  }, [filteredClusters, focusedClusterId])

  // a filter can leave every match on the far hemisphere (pick "Português"
  // while parked over the Pacific) — an unchanged view would read as "no
  // results", so fly to the busiest matching cluster instead
  const camera = useThree((s) => s.camera)
  const [filterFlyTarget, setFilterFlyTarget] = useState<THREE.Vector3 | null>(null)
  useEffect(() => {
    if (!hasActiveFilters(filters) || filteredClusters.length === 0) return
    const camDir = camera.position.clone().normalize()
    const toward = new THREE.Vector3()
    const anyVisible = filteredClusters.some(
      (c) => camDir.dot(toward.set(...latLngToVector3(c.lat, c.lng))) > 0.25,
    )
    if (anyVisible) return
    const busiest = filteredClusters.reduce((a, b) => (a.totalViewers >= b.totalViewers ? a : b))
    setFilterFlyTarget(
      new THREE.Vector3(
        ...latLngToVector3(busiest.lat, busiest.lng, Math.max(INITIAL_CAMERA_DISTANCE, camera.position.length())),
      ),
    )
    // camera is read imperatively on purpose — this must only re-run on filter changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredClusters])

  const points = useMemo(() => selectVisiblePoints(filteredClusters, BAND_DISTANCE[band]), [band, filteredClusters])

  // geography is Earth's alone; the city list is fetched only once it's wanted
  const cityPoints = useCityPoints(body.hasVectorBorders && band === 'near')
  const cities = useMemo(
    () => citiesForView(cityPoints, band, body.hasVectorBorders),
    [cityPoints, band, body.hasVectorBorders],
  )

  // hotspot → popover hover contract: moving between the dot and the card
  // stack gets a 250ms grace window before the popover closes
  const closeTimer = useRef<number | null>(null)
  const cancelClose = () => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = window.setTimeout(() => {
      // never auto-close while the confirm layer is up — the expanded hotspot
      // is part of the state we restore when the user comes back
      if (!useDiscovery.getState().selectedChannelId) {
        useDiscovery.getState().setFocusedCluster(null)
      }
      closeTimer.current = null
    }, 250)
  }
  useEffect(() => cancelClose, [])

  const focusedCluster = focusedClusterId ? filteredClusters.find((c) => c.id === focusedClusterId) : undefined
  // hovering an expanded child dot must show that one stream, not its siblings
  const focusedChannels = useMemo(
    () => (focusedCluster ? channelsForFocus(focusedCluster, focusedChannelId) : []),
    [focusedCluster, focusedChannelId],
  )
  // the hovered dot when we have one, otherwise the cluster centre (the
  // restore-on-return path, where nothing was hovered)
  const popoverAnchor = focusedCluster
    ? focusedAnchor
      ? latLngToVector3(focusedAnchor.lat, focusedAnchor.lng, 1.01)
      : latLngToVector3(focusedCluster.lat, focusedCluster.lng, 1.02)
    : null

  return (
    <>
      <BodySurface body={body} meshRef={surfaceRef} />
      {body.hasVectorBorders && <BorderLayer sets={bordersForBand(band)} />}
      {cities.length > 0 && <CityLabelLayer candidates={cities} />}
      {body.atmosphere && <Atmosphere color={body.atmosphere} scale={body.id === 'sun' ? 1.28 : 1.15} />}
      <Stars radius={10} depth={4} count={1600} factor={1.6} saturation={0} fade speed={0.4} />

      <LivePointLayer
        points={points}
        style={body.hotspotStyle}
        onPointOver={(point) => {
          cancelClose()
          // a near-zoom dot is one channel; a cluster dot is the whole city
          useDiscovery
            .getState()
            .setFocusedCluster(point.clusterId, point.channelId ?? null, { lat: point.lat, lng: point.lng })
        }}
        onPointOut={scheduleClose}
        onPointClick={(point) => {
          cancelClose()
          useDiscovery
            .getState()
            .setFocusedCluster(point.clusterId, point.channelId ?? null, { lat: point.lat, lng: point.lng })
        }}
      />

      {focusedCluster && popoverAnchor && (
        <Html
          position={popoverAnchor}
          occlude={[surfaceRef as React.RefObject<THREE.Object3D>]}
          zIndexRange={[30, 10]}
          style={{ pointerEvents: 'none' }}
        >
          <StreamClusterPopover
            cluster={focusedCluster}
            channels={focusedChannels}
            onPointerStay={cancelClose}
            onPointerAway={scheduleClose}
          />
        </Html>
      )}

      <CameraRig
        body={bodyId}
        onBandChange={setBand}
        flyTo={filterFlyTarget}
        onZoomOutPastCeiling={() => setViewMode('system')}
      />
    </>
  )
}

export default function DiscoveryGlobe({ bodyId }: { bodyId: BodyId }) {
  // the camera starts where this body was last left, or out over the default
  // region for a first visit
  const initialPosition = useMemo<[number, number, number]>(() => {
    const saved = useDiscovery.getState().savedCameras[bodyId]
    if (saved) return saved.position
    if (bodyId === 'earth') return latLngToVector3(DEFAULT_ORIGIN.lat, DEFAULT_ORIGIN.lng, IDLE_CAMERA_DISTANCE)
    // far enough out that the whole body fits the 40° fov — Earth gets flown in
    // to a specific place, but the other bodies should read as a whole world first
    return [0, 0.85, 3.05]
    // deliberately per-body: remounting the canvas for a new body re-reads this
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyId])

  return (
    <Canvas camera={{ fov: 40, near: 0.05, far: 30, position: initialPosition }} gl={{ antialias: true }}>
      <color attach="background" args={['#050505']} />
      <Suspense fallback={null}>
        <BodyScene bodyId={bodyId} />
      </Suspense>
    </Canvas>
  )
}
