import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { latLngToVector3, nearestCities } from "./geo";
import type { CityPoint } from "./types";

const LABEL_RADIUS = 1.004;
// How often the visible set is picked again, in seconds. It is imperceptible for a label, and much
// cheaper than ranking hundreds of cities every frame.
const REPICK_INTERVAL = 0.35;
// Pick again early if the camera swung this far, in radians.
const REPICK_ANGLE = 0.12;

// A city label is a DOM node, so two things keep this cheap: the visible set is picked on a
// throttle, and a label that faces away fades imperatively instead of through React state.
export function CityLabelLayer({ candidates }: { candidates: CityPoint[] }) {
  const [visible, setVisible] = useState<CityPoint[]>([]);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const camDir = useRef(new THREE.Vector3(0, 0, 1));
  const lastPickDir = useRef(new THREE.Vector3(0, 0, 0));
  const sincePick = useRef(REPICK_INTERVAL);

  const placed = useMemo(
    () =>
      visible.map((city) => {
        const pos = latLngToVector3(city.lat, city.lng, LABEL_RADIUS);
        return { city, pos, normal: new THREE.Vector3(...pos).normalize() };
      }),
    [visible],
  );

  useFrame(({ camera }, dt) => {
    camDir.current.copy(camera.position).normalize();

    sincePick.current += dt;
    const swung = camDir.current.angleTo(lastPickDir.current);
    if (candidates.length > 0 && (sincePick.current >= REPICK_INTERVAL || swung > REPICK_ANGLE)) {
      sincePick.current = 0;
      lastPickDir.current.copy(camDir.current);
      const picked = nearestCities(candidates, [
        camDir.current.x,
        camDir.current.y,
        camDir.current.z,
      ]);
      setVisible((prev) => {
        if (prev.length === picked.length && prev.every((c, i) => c.name === picked[i].name)) {
          return prev;
        }
        return picked;
      });
    }

    // Fade near the limb, so a name does not pop in at the horizon.
    for (let i = 0; i < placed.length; i++) {
      const node = nodes.current[i];
      if (!node) continue;
      const facing = camDir.current.dot(placed[i].normal);
      node.style.opacity = facing > 0.32 ? String(Math.min(1, (facing - 0.32) * 5)) : "0";
    }
  });

  return (
    <group raycast={() => null}>
      {placed.map(({ city, pos }, i) => (
        <Html
          key={`${city.name}-${city.lat}-${city.lng}`}
          position={pos}
          center
          zIndexRange={[8, 4]}
          // No opacity here. useFrame drives the inner node, and a zero on the wrapper would
          // override it permanently.
          style={{ pointerEvents: "none" }}
        >
          <div
            ref={(el) => {
              nodes.current[i] = el;
            }}
            className="flex select-none items-center gap-1 whitespace-nowrap"
            style={{ opacity: 0, transition: "opacity 120ms linear" }}
          >
            <span className="h-[3px] w-[3px] rounded-full bg-white/55" />
            <span className="text-[9px] font-medium tracking-wide text-white/65 [text-shadow:0_1px_2px_rgba(0,0,0,0.95)]">
              {city.name}
            </span>
          </div>
        </Html>
      ))}
    </group>
  );
}
