import { useMemo } from "react";
import * as THREE from "three";
import { latLngToVector3 } from "./geo";
import { useBorderLines } from "./geoData";
import type { BorderSet } from "./geoData";
import type { PackedLines } from "./types";

// A border floats just above the surface, so it never z-fights the texture.
const BORDER_RADIUS = 1.0015;
const ADMIN1_RADIUS = 1.0012;

// Geography stays quiet, because CLAUDE.md keeps the green under 10 percent of visible pixels and
// the hotspots need it. These two are neutral-600 and neutral-700 from theme.css.
const COUNTRY_COLOR = "#606971";
const ADMIN1_COLOR = "#42474d";

// One LineSegments geometry per packed dataset, so a whole dataset is one draw call.
function useSegments(lines: PackedLines | undefined, radius: number) {
  return useMemo(() => {
    if (!lines) return null;
    const { lengths, coords } = lines;
    // A polyline of n points contributes n-1 segments, so 2(n-1) vertices.
    const vertexCount = lengths.reduce((sum, n) => sum + (n - 1) * 2, 0);
    const positions = new Float32Array(vertexCount * 3);

    let readAt = 0;
    let writeAt = 0;
    for (const n of lengths) {
      for (let i = 0; i < n - 1; i++) {
        const a = latLngToVector3(coords[readAt + i * 2], coords[readAt + i * 2 + 1], radius);
        const b = latLngToVector3(
          coords[readAt + (i + 1) * 2],
          coords[readAt + (i + 1) * 2 + 1],
          radius,
        );
        positions[writeAt++] = a[0];
        positions[writeAt++] = a[1];
        positions[writeAt++] = a[2];
        positions[writeAt++] = b[0];
        positions[writeAt++] = b[1];
        positions[writeAt++] = b[2];
      }
      readAt += n * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [lines, radius]);
}

export function BorderLayer({ sets }: { sets: BorderSet[] }) {
  const loaded = useBorderLines(sets);

  // The sets arrive in draw order: countries first, then admin1 on top.
  const countryLines = loaded?.[0];
  const adminLines = sets.length > 1 ? loaded?.[1] : undefined;
  const countryGeometry = useSegments(countryLines, BORDER_RADIUS);
  const adminGeometry = useSegments(adminLines, ADMIN1_RADIUS);

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
  );
}
