import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { latLngToVector3, pointScaleForDistance } from './geo'
import type { GlobePoint } from './types'

/** dots float just above the surface so they never z-fight the globe texture */
const SURFACE_RADIUS = 1.006
const CORE_RADIUS = 0.009
const HALO_SCALE = 2.7

type Props = {
  points: GlobePoint[]
  /**
   * `solid` for dark surfaces (Earth). `outlined` adds a dark backing disc
   * behind each dot for pale, bright bodies (Moon/Mars/Sun), where plain green
   * washes out against the surface.
   */
  style?: 'solid' | 'outlined'
  onPointOver: (point: GlobePoint) => void
  onPointOut: () => void
  onPointClick: (point: GlobePoint) => void
}

/**
 * All live hotspots in two instanced draw calls (solid core + additive pulsing
 * halo) — one <mesh> per hotspot would melt React with ~300 points. Pointer
 * events land on the halo mesh, whose 2.7× radius doubles as the hit target.
 */
export default function LivePointLayer({ points, style = 'solid', onPointOver, onPointOut, onPointClick }: Props) {
  const coreRef = useRef<THREE.InstancedMesh>(null)
  const haloRef = useRef<THREE.InstancedMesh>(null)
  const backingRef = useRef<THREE.InstancedMesh>(null)
  const hovered = useRef<number | null>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const outlined = style === 'outlined'

  const data = useMemo(
    () =>
      points.map((point) => ({
        point,
        pos: latLngToVector3(point.lat, point.lng, SURFACE_RADIUS),
        // viewer count → dot prominence, sqrt-compressed so outliers don't dwarf the map
        scale: 0.75 + Math.min(0.75, Math.sqrt(point.weight) / 110),
      })),
    [points],
  )

  useEffect(
    () => () => {
      document.body.style.cursor = ''
    },
    [],
  )

  useFrame(({ clock, camera }) => {
    const core = coreRef.current
    const halo = haloRef.current
    if (!core || !halo) return
    const t = clock.elapsedTime
    const zoomScale = pointScaleForDistance(camera.position.length())
    data.forEach((d, i) => {
      const boost = hovered.current === i ? 1.4 : 1
      const size = d.scale * zoomScale * boost
      dummy.position.set(d.pos[0], d.pos[1], d.pos[2])
      dummy.scale.setScalar(size)
      dummy.updateMatrix()
      core.setMatrixAt(i, dummy.matrix)
      // dark disc tucked just under the dot, so a green core still reads on a
      // pale lunar/martian/solar surface. It has to be a flat circle lying
      // tangent to the sphere and pushed inward — a backing *sphere* this size
      // would poke out past the core and swallow it.
      if (backingRef.current) {
        dummy.position.set(d.pos[0] * 0.998, d.pos[1] * 0.998, d.pos[2] * 0.998)
        dummy.lookAt(0, 0, 0) // +Z ends up pointing away from the centre
        dummy.scale.setScalar(size * 2.1)
        dummy.updateMatrix()
        backingRef.current.setMatrixAt(i, dummy.matrix)
        // restore for the halo pass below
        dummy.position.set(d.pos[0], d.pos[1], d.pos[2])
        dummy.rotation.set(0, 0, 0)
      }
      // desynchronized breathing so the map feels alive, not metronomic
      const pulse = 1 + 0.16 * Math.sin(t * 2.1 + i * 1.7)
      dummy.scale.setScalar(size * HALO_SCALE * pulse)
      dummy.updateMatrix()
      halo.setMatrixAt(i, dummy.matrix)
    })
    core.instanceMatrix.needsUpdate = true
    halo.instanceMatrix.needsUpdate = true
    if (backingRef.current) backingRef.current.instanceMatrix.needsUpdate = true
  })

  const instanceOf = (e: ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>) =>
    e.instanceId != null && e.instanceId < data.length ? e.instanceId : null

  return (
    <group>
      {outlined && (
        <instancedMesh
          key={`backing-${points.length}`}
          ref={backingRef}
          args={[undefined, undefined, points.length]}
          frustumCulled={false}
          raycast={() => null}
        >
          <circleGeometry args={[CORE_RADIUS, 20]} />
          <meshBasicMaterial color="#05100a" toneMapped={false} side={THREE.DoubleSide} />
        </instancedMesh>
      )}

      <instancedMesh
        key={`core-${points.length}`}
        ref={coreRef}
        args={[undefined, undefined, points.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[CORE_RADIUS, 12, 12]} />
        <meshBasicMaterial color="#53fc18" toneMapped={false} />
      </instancedMesh>

      <instancedMesh
        key={`halo-${points.length}`}
        ref={haloRef}
        args={[undefined, undefined, points.length]}
        frustumCulled={false}
        onPointerOver={(e) => {
          e.stopPropagation()
          const i = instanceOf(e)
          if (i == null) return
          hovered.current = i
          document.body.style.cursor = 'pointer'
          onPointOver(data[i].point)
        }}
        onPointerOut={() => {
          hovered.current = null
          document.body.style.cursor = ''
          onPointOut()
        }}
        onClick={(e) => {
          e.stopPropagation()
          const i = instanceOf(e)
          if (i != null) onPointClick(data[i].point)
        }}
      >
        <sphereGeometry args={[CORE_RADIUS, 12, 12]} />
        <meshBasicMaterial
          color="#53fc18"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  )
}
