import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { Decal } from '@react-three/drei'
import type { Finish, Skin } from '../engine/types'

/**
 * Parametric fallback props — no GLB asset dependency, still fully skinnable.
 * All dimensions in cm to match MediaPipe's canonical-face metric space.
 * Local +Z is "face forward" (toward the camera), +Y up.
 */

const FINISH_MAT: Record<Finish, { roughness: number; metalness: number }> = {
  matte: { roughness: 0.85, metalness: 0.02 },
  gloss: { roughness: 0.18, metalness: 0.08 },
  metallic: { roughness: 0.28, metalness: 0.92 },
}

function skinMaterialProps(skin: Skin) {
  return { color: skin.baseColor, ...FINISH_MAT[skin.finish] }
}

function LogoDecal({
  url,
  position,
  scale,
}: {
  url: string
  position: [number, number, number]
  scale: [number, number, number]
}) {
  const texture = useLoader(THREE.TextureLoader, url)
  // R3F v9 no longer auto-converts color textures to sRGB
  texture.colorSpace = THREE.SRGBColorSpace
  return (
    <Decal position={position} rotation={[0, 0, 0]} scale={scale}>
      <meshBasicMaterial
        map={texture}
        transparent
        polygonOffset
        polygonOffsetFactor={-4}
        toneMapped={false}
      />
    </Decal>
  )
}

export function Cap({ skin }: { skin: Skin }) {
  const mat = skinMaterialProps(skin)
  return (
    <group>
      {/* crown — deliberately tall dome: virtual hats must swallow real hair,
          since video pixels above the brim can't be occluded away */}
      <mesh scale={[1, 1.18, 1]}>
        <sphereGeometry args={[8.5, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial {...mat} />
        {skin.logoUrl && <LogoDecal url={skin.logoUrl} position={[0, 3.4, 7.4]} scale={[7.5, 3.75, 5]} />}
      </mesh>
      {/* sweatband ring so the crown doesn't float */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[8.5, 8.6, 1.6, 48, 1, true]} />
        <meshStandardMaterial {...mat} side={THREE.DoubleSide} />
      </mesh>
      {/* brim — half-disc extending forward (+Z) */}
      <mesh position={[0, -0.6, 0.8]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1.15, 1]}>
        <circleGeometry args={[8.3, 48, 0, Math.PI]} />
        <meshStandardMaterial {...mat} side={THREE.DoubleSide} />
      </mesh>
      {/* top button */}
      <mesh position={[0, 7.9, 0]}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  )
}

export function Glasses({ skin }: { skin: Skin }) {
  const mat = skinMaterialProps(skin)
  const lensMat = { color: '#0c1014', roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.72 }
  const rim = (x: number) => (
    <mesh position={[x, 0, 0]}>
      <torusGeometry args={[2.35, 0.34, 16, 48]} />
      <meshStandardMaterial {...mat} />
    </mesh>
  )
  return (
    <group>
      {rim(-3.35)}
      {rim(3.35)}
      {/* lenses */}
      <mesh position={[-3.35, 0, 0.1]}>
        <circleGeometry args={[2.2, 32]} />
        <meshStandardMaterial {...lensMat} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[3.35, 0, 0.1]}>
        <circleGeometry args={[2.2, 32]} />
        <meshStandardMaterial {...lensMat} side={THREE.DoubleSide} />
        {skin.logoUrl && <LogoDecal url={skin.logoUrl} position={[0.9, -1.1, 0.2]} scale={[1.7, 0.85, 1]} />}
      </mesh>
      {/* bridge */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[2.1, 0.42, 0.42]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* temples, angled back toward the ears */}
      <mesh position={[-5.9, 0.35, -3.1]} rotation={[0, -0.12, 0]}>
        <boxGeometry args={[0.34, 0.5, 7.2]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[5.9, 0.35, -3.1]} rotation={[0, 0.12, 0]}>
        <boxGeometry args={[0.34, 0.5, 7.2]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  )
}

/**
 * The one shared prop-render path — the brand-console preview and the live
 * stream overlay both go through here, so "what you designed is what airs".
 */
export function SkinnedProp({ type, skin }: { type: 'hat' | 'glasses'; skin: Skin }) {
  return type === 'hat' ? <Cap skin={skin} /> : <Glasses skin={skin} />
}
