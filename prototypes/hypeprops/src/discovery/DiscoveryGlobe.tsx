import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import { Html, OrbitControls, Stars, useTexture } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { DISCOVERY_CLUSTERS, DEFAULT_ORIGIN } from '../data/discoveryChannels'
import { applyDiscoveryFilters, hasActiveFilters } from './filters'
import {
  INITIAL_CAMERA_DISTANCE,
  MAX_CAMERA_DISTANCE,
  MIN_CAMERA_DISTANCE,
  latLngToVector3,
  selectVisiblePoints,
  zoomBandForDistance,
} from './geo'
import { useDiscovery } from './discoveryStore'
import LivePointLayer from './LivePointLayer'
import StreamClusterPopover from './StreamClusterPopover'
import type { ZoomBand } from './types'

/** representative camera distance per band — hotspot selection only depends on
 * the band, so re-picking points on every scroll tick would be wasted work */
const BAND_DISTANCE: Record<ZoomBand, number> = { near: 1.5, mid: 2.2, far: 3.4 }

/** the camera idles far out over the default region until geolocation resolves */
const IDLE_CAMERA_DISTANCE = 3.4

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const ATMOSPHERE_FRAGMENT = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
    gl_FragColor = vec4(0.24, 0.85, 0.18, 1.0) * intensity;
  }
`

/** additive fresnel rim — reads as atmosphere against the pure-black backdrop */
function Atmosphere() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ATMOSPHERE_VERTEX,
        fragmentShader: ATMOSPHERE_FRAGMENT,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      }),
    [],
  )
  return (
    <mesh scale={1.15} material={material}>
      <sphereGeometry args={[1, 48, 48]} />
    </mesh>
  )
}

/**
 * Owns the camera: restores a saved pose when returning from /stream, flies to
 * the resolved origin on first visit, feeds zoom-band changes upward, and
 * saves the pose on unmount so "继续探索/back" lands exactly where you left.
 */
function CameraRig({
  onBandChange,
  flyTo,
}: {
  onBandChange: (band: ZoomBand) => void
  /** externally requested destination (e.g. "nearest filter match") */
  flyTo: THREE.Vector3 | null
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const camera = useThree((s) => s.camera)
  const origin = useDiscovery((s) => s.origin)
  const flight = useRef<THREE.Vector3 | null>(null)

  // restore the pose saved on the last unmount (returning from the stream page)
  useEffect(() => {
    const saved = useDiscovery.getState().savedCamera
    if (!saved) return
    camera.position.set(...saved.position)
    controlsRef.current?.target.set(...saved.target)
    controlsRef.current?.update()
  }, [camera])

  // first visit only: swing from the idle view down to the resolved origin
  useEffect(() => {
    const state = useDiscovery.getState()
    if (!origin || state.introFlown || state.savedCamera) return
    flight.current = new THREE.Vector3(...latLngToVector3(origin.lat, origin.lng, INITIAL_CAMERA_DISTANCE))
  }, [origin])

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

  // save the pose for restore-on-return
  useEffect(
    () => () => {
      const target = controlsRef.current?.target
      useDiscovery.getState().setSavedCamera({
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: target ? [target.x, target.y, target.z] : [0, 0, 0],
      })
    },
    [camera],
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

function GlobeScene() {
  const texture = useTexture('/textures/earth-dark.jpg')
  const globeRef = useRef<THREE.Mesh>(null)
  const [band, setBand] = useState<ZoomBand>('far')
  // where the burst popover is pinned: the actual hovered dot (a channel dot
  // can sit ~1° off its cluster center at near zoom); null → cluster center,
  // which covers the restore-on-return path where nothing was hovered
  const [anchorOverride, setAnchorOverride] = useState<[number, number, number] | null>(null)
  const focusedClusterId = useDiscovery((s) => s.focusedClusterId)
  const filters = useDiscovery((s) => s.filters)

  // the globe only ever sees the filtered catalog — hidden channels drop out
  // of the hotspot layer, the popover and the counts alike
  const filteredClusters = useMemo(() => applyDiscoveryFilters(DISCOVERY_CLUSTERS, filters), [filters])

  // a filter change can empty the cluster whose burst is open — dismiss it
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

  // the texture ships very dark — lift it above the black backdrop (>1 channel
  // values are legal on Color and simply brighten the sampled texel)
  const globeTint = useMemo(() => new THREE.Color(1.7, 1.75, 1.7), [])

  const points = useMemo(() => selectVisiblePoints(filteredClusters, BAND_DISTANCE[band]), [band, filteredClusters])

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
  const popoverAnchor = focusedCluster
    ? (anchorOverride ?? latLngToVector3(focusedCluster.lat, focusedCluster.lng, 1.02))
    : null

  return (
    <>
      <mesh
        ref={globeRef}
        // swallow rays so hotspots on the far hemisphere can't be hovered through the planet
        onPointerOver={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
      >
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial map={texture} color={globeTint} />
      </mesh>

      <Atmosphere />
      <Stars radius={10} depth={4} count={1600} factor={1.6} saturation={0} fade speed={0.4} />

      <LivePointLayer
        points={points}
        onPointOver={(point) => {
          cancelClose()
          setAnchorOverride(latLngToVector3(point.lat, point.lng, 1.01))
          useDiscovery.getState().setFocusedCluster(point.clusterId)
        }}
        onPointOut={scheduleClose}
        onPointClick={(point) => {
          cancelClose()
          setAnchorOverride(latLngToVector3(point.lat, point.lng, 1.01))
          useDiscovery.getState().setFocusedCluster(point.clusterId)
        }}
      />

      {focusedCluster && popoverAnchor && (
        <Html
          position={popoverAnchor}
          occlude={[globeRef as React.RefObject<THREE.Object3D>]}
          zIndexRange={[30, 10]}
          style={{ pointerEvents: 'none' }}
        >
          <StreamClusterPopover cluster={focusedCluster} onPointerStay={cancelClose} onPointerAway={scheduleClose} />
        </Html>
      )}

      <CameraRig onBandChange={setBand} flyTo={filterFlyTarget} />
    </>
  )
}

export default function DiscoveryGlobe() {
  const initialPosition = useMemo<[number, number, number]>(() => {
    const saved = useDiscovery.getState().savedCamera
    if (saved) return saved.position
    return latLngToVector3(DEFAULT_ORIGIN.lat, DEFAULT_ORIGIN.lng, IDLE_CAMERA_DISTANCE)
  }, [])

  return (
    <Canvas camera={{ fov: 40, near: 0.05, far: 30, position: initialPosition }} gl={{ antialias: true }}>
      <color attach="background" args={['#050505']} />
      <Suspense fallback={null}>
        <GlobeScene />
      </Suspense>
    </Canvas>
  )
}
