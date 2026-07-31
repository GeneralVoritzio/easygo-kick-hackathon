import { useMemo } from 'react'
import * as THREE from 'three'
import { latLngToVector3 } from './geo'
import { useBorderLines } from './geoData'
import type { BorderSet } from './geoData'
import type { PackedLines } from './types'

/** borders float just above the surface so they never z-fight the texture */
const BORDER_RADIUS = 1.0015
const ADMIN1_RADIUS = 1.0012

/**
 * Country and state/province borders drawn as vector lines on the globe — crisp
 * at every zoom, unlike a raster texture. Colour is a desaturated slate on
 * purpose: the Kick green is reserved for live hotspots (Design Spec §1 keeps
 * `#53fc18` under 10% of visible pixels), so geography must stay quiet.
 */

const COUNTRY_COLOR = '#5c6f78'
const ADMIN1_COLOR = '#3b4a51'

/** one LineSegments geometry for a whole packed dataset — a single draw call */
function useSegments(lines: PackedLines | undefined, radius: number) {
  return useMemo(() => {
    if (!lines) return null
    const { lengths, coords } = lines
    // each polyline of n points contributes n-1 segments = 2(n-1) vertices
    const vertexCount = lengths.reduce((sum, n) => sum + (n - 1) * 2, 0)
    const positions = new Float32Array(vertexCount * 3)

    let readAt = 0
    let writeAt = 0
    for (const n of lengths) {
      for (let i = 0; i < n - 1; i++) {
        const a = latLngToVector3(coords[readAt + i * 2], coords[readAt + i * 2 + 1], radius)
        const b = latLngToVector3(coords[readAt + (i + 1) * 2], coords[readAt + (i + 1) * 2 + 1], radius)
        positions[writeAt++] = a[0]
        positions[writeAt++] = a[1]
        positions[writeAt++] = a[2]
        positions[writeAt++] = b[0]
        positions[writeAt++] = b[1]
        positions[writeAt++] = b[2]
      }
      readAt += n * 2
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [lines, radius])
}

export default function BorderLayer({ sets }: { sets: BorderSet[] }) {
  const loaded = useBorderLines(sets)

  // sets are requested in draw order: countries first, admin-1 (if present) on top
  const countryLines = loaded?.[0]
  const adminLines = sets.length > 1 ? loaded?.[1] : undefined
  const countryGeometry = useSegments(countryLines, BORDER_RADIUS)
  const adminGeometry = useSegments(adminLines, ADMIN1_RADIUS)

  return (
    <group raycast={() => null}>
      {countryGeometry && (
        <lineSegments geometry={countryGeometry} frustumCulled={false}>
          <lineBasicMaterial color={COUNTRY_COLOR} transparent opacity={0.75} depthWrite={false} />
        </lineSegments>
      )}
      {adminGeometry && (
        <lineSegments geometry={adminGeometry} frustumCulled={false}>
          <lineBasicMaterial color={ADMIN1_COLOR} transparent opacity={0.6} depthWrite={false} />
        </lineSegments>
      )}
    </group>
  )
}
