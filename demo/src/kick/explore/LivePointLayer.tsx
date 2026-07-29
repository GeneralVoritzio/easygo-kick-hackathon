import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { HOTSPOT_COLOR, latLngToVector3, pointScaleForDistance } from "./geo";
import type { GlobePoint } from "./types";

// A dot floats just above the surface, so it never z-fights the body texture.
const SURFACE_RADIUS = 1.006;
const CORE_RADIUS = 0.009;
const HALO_SCALE = 2.7;
// The visible halo shrinks as the camera closes in, which keeps dense points apart but leaves a hit
// target a few pixels wide. The pick layer is invisible and sized in screen space, so hovering stays
// forgiving at every zoom and the dots do not get bigger.
const PICK_MIN_PIXELS = 15;
// The backing disc on a pale surface. surface-lowest, so it reads as a hole in the body.
const BACKING_COLOR = "#0b0b0c";

type Props = {
  points: GlobePoint[];
  // "outlined" adds a dark backing disc for the pale bodies, where plain green washes out.
  style?: "solid" | "outlined";
  onPointOver: (point: GlobePoint) => void;
  onPointOut: () => void;
  onPointClick: (point: GlobePoint) => void;
};

// Every hotspot in four instanced draw calls. One mesh per hotspot would melt React at 300 points.
export function LivePointLayer({
  points,
  style = "solid",
  onPointOver,
  onPointOut,
  onPointClick,
}: Props) {
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const haloRef = useRef<THREE.InstancedMesh>(null);
  const backingRef = useRef<THREE.InstancedMesh>(null);
  const pickRef = useRef<THREE.InstancedMesh>(null);
  const hovered = useRef<number | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const outlined = style === "outlined";

  const data = useMemo(
    () =>
      points.map((point) => ({
        point,
        pos: latLngToVector3(point.lat, point.lng, SURFACE_RADIUS),
        // Viewer count drives prominence, compressed by a square root so an outlier does not dwarf
        // the map.
        scale: 0.75 + Math.min(0.75, Math.sqrt(point.weight) / 110),
      })),
    [points],
  );

  useEffect(
    () => () => {
      document.body.style.cursor = "";
    },
    [],
  );

  useFrame(({ clock, camera, size }) => {
    const core = coreRef.current;
    const halo = haloRef.current;
    if (!core || !halo) return;
    const t = clock.elapsedTime;
    const distance = camera.position.length();
    const zoomScale = pointScaleForDistance(distance);
    const perspective = camera as THREE.PerspectiveCamera;
    const worldPerPixel =
      (2 * Math.tan((perspective.fov * Math.PI) / 360) * distance) / size.height;
    const minPickScale = (PICK_MIN_PIXELS * worldPerPixel) / CORE_RADIUS;
    data.forEach((d, i) => {
      const boost = hovered.current === i ? 1.4 : 1;
      const dotSize = d.scale * zoomScale * boost;
      dummy.position.set(d.pos[0], d.pos[1], d.pos[2]);
      dummy.scale.setScalar(dotSize);
      dummy.updateMatrix();
      core.setMatrixAt(i, dummy.matrix);
      // The backing has to be a flat circle, tangent to the sphere and pushed inward. A backing
      // sphere this size would poke out past the core and swallow it.
      if (backingRef.current) {
        dummy.position.set(d.pos[0] * 0.998, d.pos[1] * 0.998, d.pos[2] * 0.998);
        dummy.lookAt(0, 0, 0);
        dummy.scale.setScalar(dotSize * 2.1);
        dummy.updateMatrix();
        backingRef.current.setMatrixAt(i, dummy.matrix);
        dummy.position.set(d.pos[0], d.pos[1], d.pos[2]);
        dummy.rotation.set(0, 0, 0);
      }
      // Desynchronized breathing, so the map feels alive instead of metronomic.
      const pulse = 1 + 0.16 * Math.sin(t * 2.1 + i * 1.7);
      dummy.scale.setScalar(dotSize * HALO_SCALE * pulse);
      dummy.updateMatrix();
      halo.setMatrixAt(i, dummy.matrix);
      if (pickRef.current) {
        dummy.scale.setScalar(Math.max(dotSize * HALO_SCALE, minPickScale));
        dummy.updateMatrix();
        pickRef.current.setMatrixAt(i, dummy.matrix);
      }
    });
    core.instanceMatrix.needsUpdate = true;
    halo.instanceMatrix.needsUpdate = true;
    if (backingRef.current) backingRef.current.instanceMatrix.needsUpdate = true;
    if (pickRef.current) pickRef.current.instanceMatrix.needsUpdate = true;
  });

  const instanceOf = (e: ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>) =>
    e.instanceId != null && e.instanceId < data.length ? e.instanceId : null;

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
          <meshBasicMaterial color={BACKING_COLOR} toneMapped={false} side={THREE.DoubleSide} />
        </instancedMesh>
      )}

      <instancedMesh
        key={`core-${points.length}`}
        ref={coreRef}
        args={[undefined, undefined, points.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[CORE_RADIUS, 12, 12]} />
        <meshBasicMaterial color={HOTSPOT_COLOR} toneMapped={false} />
      </instancedMesh>

      <instancedMesh
        key={`halo-${points.length}`}
        ref={haloRef}
        args={[undefined, undefined, points.length]}
        frustumCulled={false}
        raycast={() => null}
      >
        <sphereGeometry args={[CORE_RADIUS, 12, 12]} />
        <meshBasicMaterial
          color={HOTSPOT_COLOR}
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* The hover target is invisible and generous. It draws last so it wins the depth test
          against its own dot, and it writes neither colour nor depth. */}
      <instancedMesh
        key={`pick-${points.length}`}
        ref={pickRef}
        args={[undefined, undefined, points.length]}
        frustumCulled={false}
        onPointerOver={(e) => {
          e.stopPropagation();
          const i = instanceOf(e);
          if (i == null) return;
          hovered.current = i;
          document.body.style.cursor = "pointer";
          onPointOver(data[i].point);
        }}
        onPointerOut={(e) => {
          // Moving straight from one dot to another fires this after the new dot's pointerover, so
          // act only when the pointer really leaves the dot we track.
          const leaving = instanceOf(e);
          if (leaving != null && hovered.current != null && leaving !== hovered.current) return;
          hovered.current = null;
          document.body.style.cursor = "";
          onPointOut();
        }}
        onClick={(e) => {
          e.stopPropagation();
          const i = instanceOf(e);
          if (i != null) onPointClick(data[i].point);
        }}
      >
        <sphereGeometry args={[CORE_RADIUS, 10, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </instancedMesh>
    </group>
  );
}
