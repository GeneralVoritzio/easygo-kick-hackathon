import { Suspense, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEngine } from '../engine/store'
import type { SlotState } from '../engine/types'
import { faceState } from './faceState'
import { SkinnedProp } from './primitives'

/** hide the prop if detection has been dark for this long (blink/occlusion tolerant) */
const STALE_MS = 350

/**
 * Applies MediaPipe's facial transformation matrix every frame — imperatively,
 * outside React state. Column-major, cm units, camera-at-origin: it maps
 * 1:1 onto a Three.js group with matrixAutoUpdate disabled. No transpose.
 */
function FaceAnchor({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null)
  useFrame(() => {
    const g = group.current
    if (!g) return
    const fresh = faceState.hasFace && performance.now() - faceState.lastDetectionAt < STALE_MS
    g.visible = fresh
    if (fresh) g.matrix.fromArray(faceState.matrix)
  })
  return (
    <group ref={group} matrixAutoUpdate={false}>
      {children}
    </group>
  )
}

/**
 * Invisible skull: writes depth only (colorWrite=false, drawn first via
 * renderOrder −1), so prop parts behind the head are culled and the real head
 * in the video shows through — the cap band wraps *around* the skull instead
 * of drawing its far rim over your hair. Same recipe as MindAR / Jeeliz VTO.
 * Sized in canonical-face cm; front face stays behind the glasses plane (z≈5.4)
 * so face-surface props are never wrongly culled.
 */
function HeadOccluder() {
  return (
    <mesh position={[0, 2.5, -3.5]} scale={[7.3, 9.8, 8.0]} renderOrder={-1}>
      <sphereGeometry args={[1, 48, 32]} />
      <meshBasicMaterial colorWrite={false} />
    </mesh>
  )
}

/** enter/exit scale spring + expiring "nervous" pulse, driven per-frame */
function SlotScale({ state, children }: { state: SlotState; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null)
  const base = useRef(0.001)
  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    const target = state === 'exiting' ? 0.001 : 1
    base.current = THREE.MathUtils.damp(base.current, target, state === 'entering' ? 14 : 9, dt)
    const pulse = state === 'expiring' ? 1 + 0.035 * Math.sin(performance.now() / 110) : 1
    g.scale.setScalar(base.current * pulse)
  })
  return (
    <group ref={group} scale={0.001}>
      {children}
    </group>
  )
}

export default function PropCanvas() {
  const activeSlot = useEngine((s) => s.activeSlot)
  const model = useEngine((s) =>
    s.activeSlot ? s.propModels.find((m) => m.id === s.activeSlot!.brandProp.propModelId) : undefined,
  )

  return (
    <Canvas
      // MediaPipe's virtual camera: origin, 63° vertical FOV, near 1cm, far 100m
      camera={{ fov: 63, near: 1, far: 10000, position: [0, 0, 0] }}
      gl={{ alpha: true, antialias: true }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'transparent' }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[50, 120, 80]} intensity={1.7} />
      <directionalLight position={[-60, 20, 40]} intensity={0.5} color="#bcd6ff" />
      <FaceAnchor>
        {activeSlot && <HeadOccluder />}
        {activeSlot && model && (
          <SlotScale key={activeSlot.startedAt} state={activeSlot.state}>
            <group
              position={model.anchor.position}
              rotation={model.anchor.rotation}
              scale={model.anchor.scale}
            >
              <Suspense fallback={null}>
                <SkinnedProp type={model.type} skin={activeSlot.brandProp.skin} />
              </Suspense>
            </group>
          </SlotScale>
        )}
      </FaceAnchor>
    </Canvas>
  )
}
