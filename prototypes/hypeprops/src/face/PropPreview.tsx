import { Suspense, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Skin } from '../engine/types'
import { useEngine } from '../engine/store'
import { SkinnedProp } from './primitives'

function Turntable({ children, yOffset }: { children: React.ReactNode; yOffset: number }) {
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }, dt) => {
    const g = group.current
    if (!g) return
    g.rotation.y += dt * 0.7
    g.position.y = yOffset + Math.sin(clock.elapsedTime * 1.4) * 0.35
  })
  return <group ref={group}>{children}</group>
}

/**
 * Studio turntable preview — renders through the exact same SkinnedProp path
 * as the live stream overlay, so the brand designs precisely what airs.
 */
export default function PropPreview({
  propModelId,
  skin,
  className = '',
}: {
  propModelId: string
  skin: Skin
  className?: string
}) {
  const model = useEngine((s) => s.propModels.find((m) => m.id === propModelId))
  if (!model) return null
  const yOffset = model.type === 'hat' ? -3.6 : 0

  return (
    <div className={`overflow-hidden rounded-xl ${className}`}>
      <Canvas camera={{ fov: 38, position: [0, 3, 30], near: 0.1, far: 200 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[6, 10, 8]} intensity={1.8} />
        <directionalLight position={[-8, 4, -6]} intensity={0.7} color="#a8c8ff" />
        <Turntable yOffset={yOffset}>
          <Suspense fallback={null}>
            <SkinnedProp type={model.type} skin={skin} />
          </Suspense>
        </Turntable>
      </Canvas>
    </div>
  )
}
