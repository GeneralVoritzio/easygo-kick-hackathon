import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { textureUrl } from "./textures";
import type { CelestialBody } from "./types";

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ATMOSPHERE_FRAGMENT = /* glsl */ `
  uniform vec3 tint;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
    gl_FragColor = vec4(tint, 1.0) * intensity;
  }
`;

// An additive fresnel rim, which reads as atmosphere against the black backdrop.
export function Atmosphere({ color, scale = 1.15 }: { color: string; scale?: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { tint: { value: new THREE.Color(color) } },
        vertexShader: ATMOSPHERE_VERTEX,
        fragmentShader: ATMOSPHERE_FRAGMENT,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      }),
    [color],
  );
  return (
    <mesh scale={scale} material={material}>
      <sphereGeometry args={[1, 48, 48]} />
    </mesh>
  );
}

// A still photograph of the Sun looks dead beside the other bodies. The texture is sampled twice at
// different scrolling rates and multiplied, which reads as convecting plasma with no noise shader.
const SUN_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const SUN_FRAGMENT = /* glsl */ `
  uniform sampler2D map;
  uniform float time;
  uniform vec3 tint;
  varying vec2 vUv;
  void main() {
    vec2 slow = vUv + vec2(time * 0.006, 0.0);
    vec2 fast = vUv * 1.6 - vec2(time * 0.011, time * 0.003);
    vec3 base = texture2D(map, slow).rgb;
    vec3 churn = texture2D(map, fast).rgb;
    vec3 c = base * 0.8 + churn * 0.5;
    c *= tint * (0.94 + 0.06 * sin(time * 0.7));
    gl_FragColor = vec4(c, 1.0);
  }
`;

function SunSurface({ body }: { body: CelestialBody }) {
  const texture = useTexture(textureUrl(body.texture));
  const material = useMemo(() => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        time: { value: 0 },
        tint: { value: new THREE.Color(...body.surfaceTint) },
      },
      vertexShader: SUN_VERTEX,
      fragmentShader: SUN_FRAGMENT,
    });
  }, [texture, body.surfaceTint]);

  useFrame((_, dt) => {
    material.uniforms.time.value += dt;
  });

  return <primitive object={material} attach="material" />;
}

function TexturedSurface({ body }: { body: CelestialBody }) {
  const texture = useTexture(textureUrl(body.texture));
  const tint = useMemo(() => new THREE.Color(...body.surfaceTint), [body.surfaceTint]);
  return <meshBasicMaterial map={texture} color={tint} />;
}

// The mesh swallows a pointer ray, so a hotspot on the far hemisphere cannot be hovered through the
// planet.
export function BodySurface({
  body,
  meshRef,
}: {
  body: CelestialBody;
  meshRef?: React.Ref<THREE.Mesh>;
}) {
  return (
    <mesh
      ref={meshRef}
      onPointerOver={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
    >
      <sphereGeometry args={[1, 64, 64]} />
      {body.id === "sun" ? <SunSurface body={body} /> : <TexturedSurface body={body} />}
    </mesh>
  );
}
