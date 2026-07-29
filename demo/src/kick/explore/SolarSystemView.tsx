import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Stars, useTexture } from "@react-three/drei";
import { BODIES, BODY_ORDER, orbitRings, systemPlacement, systemPosition } from "./bodies";
import { useExplore } from "./exploreStore";
import { textureUrl } from "./textures";
import type { BodyId, CelestialBody } from "./types";

// surface-lowest, so the canvas matches the page around it. The ring is neutral-700.
const CANVAS_BACKGROUND = "#0b0b0c";
const ORBIT_RING_COLOR = "#42474d";

function OrbitRing({ radius }: { radius: number }) {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      // The same 0.42 vertical squash systemPosition applies, so a ring sits under the bodies
      // instead of cutting through them.
      points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius * 0.42, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineDashedMaterial
        color={ORBIT_RING_COLOR}
        dashSize={0.08}
        gapSize={0.06}
        transparent
        opacity={0.5}
      />
    </line>
  );
}

function SystemBody({
  body,
  count,
  onPick,
}: {
  body: CelestialBody;
  count: number;
  onPick: () => void;
}) {
  const texture = useTexture(textureUrl(body.texture));
  const groupRef = useRef<THREE.Group>(null);
  const placement = systemPlacement(body.id);
  const position = useMemo(() => systemPosition(body.id), [body.id]);
  const tint = useMemo(
    () => new THREE.Color(...(body.systemTint ?? body.surfaceTint)),
    [body.systemTint, body.surfaceTint],
  );
  const hovered = useRef(false);
  const scale = useRef(placement.displayScale);

  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y += dt * 0.12;
    const target = placement.displayScale * (hovered.current ? 1.12 : 1);
    scale.current = THREE.MathUtils.damp(scale.current, target, 8, dt);
    g.scale.setScalar(scale.current);
  });

  return (
    <group position={position}>
      <group
        ref={groupRef}
        scale={placement.displayScale}
        onPointerOver={(e) => {
          e.stopPropagation();
          hovered.current = true;
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          hovered.current = false;
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "";
          onPick();
        }}
      >
        <mesh>
          <sphereGeometry args={[1, 48, 48]} />
          <meshBasicMaterial map={texture} color={tint} />
        </mesh>
        {/* A tight accent rim lifts each body off the black backdrop. It stays small, or the Sun's
            halo swallows Earth's orbit. */}
        <mesh scale={1.16}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color={body.accent}
            transparent
            opacity={0.12}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      <Html
        position={[0, -placement.displayScale - 0.26, 0]}
        center
        zIndexRange={[20, 10]}
        style={{ pointerEvents: "none" }}
      >
        <button
          type="button"
          onClick={onPick}
          className="pointer-events-auto flex flex-col items-center gap-1 whitespace-nowrap"
        >
          <span className="text-sm font-bold tracking-[-0.01em] text-white">{body.name}</span>
          <span
            className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums"
            style={{
              borderColor: `${body.accent}66`,
              color: body.accent,
              backgroundColor: `${body.accent}14`,
            }}
          >
            <span
              className="size-1 animate-pulse-fast rounded-full"
              style={{ backgroundColor: body.accent }}
            />
            {count} live
          </span>
        </button>
      </Html>
    </group>
  );
}

// The camera settles inward on arrival. The CSS warp handles the cut, and this gives the view its own
// moment of deceleration.
const REST_Z = 9.4;

function ArrivalDolly() {
  const camera = useThree((s) => s.camera);
  const started = useRef(false);
  useFrame((_, dt) => {
    if (!started.current) {
      camera.position.z = REST_Z + 3.2;
      started.current = true;
      return;
    }
    camera.position.z = THREE.MathUtils.damp(camera.position.z, REST_Z, 3.4, dt);
  });
  return null;
}

function SystemScene({ counts }: { counts: Record<BodyId, number> }) {
  const setActiveBody = useExplore((s) => s.setActiveBody);
  return (
    <>
      <ArrivalDolly />
      <Stars radius={24} depth={8} count={2600} factor={2} saturation={0} fade speed={0.3} />
      {orbitRings().map((radius) => (
        <OrbitRing key={radius} radius={radius} />
      ))}
      {BODY_ORDER.map((id) => (
        <SystemBody
          key={id}
          body={BODIES[id]}
          count={counts[id]}
          onPick={() => setActiveBody(id)}
        />
      ))}
    </>
  );
}

// The distances and the sizes are compressed on purpose. At true scale the Sun fills the viewport and
// Mars is a few pixels, so the page says so instead of implying astronomical accuracy.
export function SolarSystemView({ counts }: { counts: Record<BodyId, number> }) {
  return (
    <Canvas
      camera={{ fov: 42, near: 0.1, far: 60, position: [0, 1.6, 9.4] }}
      gl={{ antialias: true }}
      // See ExploreGlobe: the warp animation scales the measured rect, so measure the layout box.
      resize={{ offsetSize: true }}
    >
      <color attach="background" args={[CANVAS_BACKGROUND]} />
      <SystemScene counts={counts} />
    </Canvas>
  );
}
