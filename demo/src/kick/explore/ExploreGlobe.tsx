import { Suspense, useEffect, useMemo, useRef, useState, type ComponentRef, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, Stars } from "@react-three/drei";
import { DEFAULT_ORIGIN, EXPLORE_CLUSTERS } from "../mock/explore";
import { BODIES } from "./bodies";
import { clustersForBody } from "./bodyView";
import { Atmosphere, BodySurface } from "./BodySurface";
import { BorderLayer } from "./BorderLayer";
import { CityLabelLayer } from "./CityLabelLayer";
import { ClusterChip } from "./ClusterChip";
import { useExplore } from "./exploreStore";
import { applyExploreFilters, hasActiveFilters } from "./filters";
import {
  bordersForBand,
  citiesForView,
  INITIAL_CAMERA_DISTANCE,
  latLngToVector3,
  MAX_CAMERA_DISTANCE,
  MIN_CAMERA_DISTANCE,
  selectVisiblePoints,
  zoomBandForDistance,
} from "./geo";
import { useCityPoints } from "./geoData";
import { LivePointLayer } from "./LivePointLayer";
import type { BodyId, ZoomBand } from "./types";

const IDLE_CAMERA_DISTANCE = 3.4;

// How far east of a country the camera parks when its channel list opens, so the country sits in the
// half of the map the panel leaves free.
const PANEL_OFFSET_DEGREES = 26;

// surface-lowest, so the canvas matches the page around it.
const CANVAS_BACKGROUND = "#0b0b0c";

// Owns the camera for one body: it restores that body's pose, flies to the origin on Earth's first
// visit, reports a zoom band change, and hands off to the system view on a zoom out past the ceiling.
function CameraRig({
  body,
  onBandChange,
  flyTo,
  onZoomOutPastCeiling,
}: {
  body: BodyId;
  onBandChange: (band: ZoomBand) => void;
  flyTo: THREE.Vector3 | null;
  onZoomOutPastCeiling: () => void;
}) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const origin = useExplore((s) => s.origin);
  const flight = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    const saved = useExplore.getState().savedCameras[body];
    if (!saved) return;
    camera.position.set(...saved.position);
    controlsRef.current?.target.set(...saved.target);
    controlsRef.current?.update();
  }, [camera, body]);

  // Earth's first visit only: swing from the idle view down to the origin.
  useEffect(() => {
    const state = useExplore.getState();
    if (body !== "earth" || !origin || state.introFlown || state.savedCameras.earth) return;
    flight.current = new THREE.Vector3(
      ...latLngToVector3(origin.lat, origin.lng, INITIAL_CAMERA_DISTANCE),
    );
  }, [origin, body]);

  useEffect(() => {
    if (flyTo) flight.current = flyTo.clone();
  }, [flyTo]);

  // A grab hands control back to the user at once, and it tucks the popover away. The popover would
  // otherwise sit pinned mid screen and swallow the hover and wheel events.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onUserGrab = () => {
      if (flight.current) {
        flight.current = null;
        useExplore.getState().setIntroFlown();
      }
      const state = useExplore.getState();
      if (state.focusedClusterId && !state.selectedChannelId) state.setFocusedCluster(null);
    };
    controls.addEventListener("start", onUserGrab);
    return () => controls.removeEventListener("start", onUserGrab);
  }, []);

  // Two wheel jobs on one listener.
  //
  // 1. OrbitControls clamps at maxDistance, so "keep zooming out" can only be read as an attempt: a
  //    zoom out tick while already parked at the ceiling. Two ticks in a row are needed, or one
  //    overshoot from normal zooming would launch you into space.
  //
  // 2. R3F raycasts on a pointer event only, so a wheel zoom slides the dots under a stationary
  //    cursor with no hover check. Once the zoom settles we replay a pointermove at the last known
  //    position, so the hover matches what is under the cursor.
  useEffect(() => {
    const el = gl.domElement;
    let ticksAtCeiling = 0;
    let resetAt: number | null = null;
    let rehoverAt: number | null = null;
    let pointer: { x: number; y: number } | null = null;

    const onPointerMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
    };
    const onPointerLeave = () => {
      pointer = null;
    };

    const rehover = () => {
      if (!pointer) return;
      const rect = el.getBoundingClientRect();
      const event = new PointerEvent("pointermove", {
        clientX: pointer.x,
        clientY: pointer.y,
        bubbles: true,
        pointerType: "mouse",
      });
      // R3F reads offsetX and offsetY, which a constructed PointerEvent leaves at 0. Without these
      // the replayed ray goes to the top left corner of the canvas instead of under the cursor.
      Object.defineProperty(event, "offsetX", { value: pointer.x - rect.left });
      Object.defineProperty(event, "offsetY", { value: pointer.y - rect.top });
      el.dispatchEvent(event);
    };

    const onWheel = (e: WheelEvent) => {
      // The camera keeps easing after the last tick, so wait for it to settle.
      if (rehoverAt) window.clearTimeout(rehoverAt);
      rehoverAt = window.setTimeout(rehover, 220);

      if (e.deltaY <= 0) {
        ticksAtCeiling = 0;
        return;
      }
      if (camera.position.length() < MAX_CAMERA_DISTANCE - 0.02) {
        ticksAtCeiling = 0;
        return;
      }
      ticksAtCeiling++;
      if (resetAt) window.clearTimeout(resetAt);
      resetAt = window.setTimeout(() => {
        ticksAtCeiling = 0;
      }, 600);
      if (ticksAtCeiling >= 2) {
        ticksAtCeiling = 0;
        onZoomOutPastCeiling();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerleave", onPointerLeave);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerleave", onPointerLeave);
      if (resetAt) window.clearTimeout(resetAt);
      if (rehoverAt) window.clearTimeout(rehoverAt);
    };
  }, [gl, camera, onZoomOutPastCeiling]);

  useEffect(
    () => () => {
      const target = controlsRef.current?.target;
      useExplore.getState().setSavedCamera(body, {
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: target ? [target.x, target.y, target.z] : [0, 0, 0],
      });
    },
    [camera, body],
  );

  const lastBand = useRef<ZoomBand | null>(null);
  useFrame((_, dt) => {
    const target = flight.current;
    if (target) {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, target.x, 2.4, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, target.y, 2.4, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, target.z, 2.4, dt);
      // A straight lerp between two distant surface points can dip towards the globe, so keep the
      // swoop outside the zoom floor.
      if (camera.position.length() < MIN_CAMERA_DISTANCE + 0.05) {
        camera.position.setLength(MIN_CAMERA_DISTANCE + 0.05);
      }
      if (camera.position.distanceTo(target) < 0.02) {
        flight.current = null;
        useExplore.getState().setIntroFlown();
      }
    }
    const controls = controlsRef.current;
    if (controls) {
      // A constant rotateSpeed flings the view several screens per drag once zoomed in, so scale it
      // with the height above the surface. A drag then moves a similar screen distance at any zoom.
      const height = (camera.position.length() - 1) / (INITIAL_CAMERA_DISTANCE - 1);
      controls.rotateSpeed = 0.45 * Math.min(1.2, Math.max(0.1, height));
      controls.update();
    }

    const band = zoomBandForDistance(camera.position.length());
    if (band !== lastBand.current) {
      lastBand.current = band;
      onBandChange(band);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      enablePan={false}
      minDistance={MIN_CAMERA_DISTANCE}
      maxDistance={MAX_CAMERA_DISTANCE}
      rotateSpeed={0.45}
      zoomSpeed={0.55}
      dampingFactor={0.1}
    />
  );
}

function BodyScene({ bodyId }: { bodyId: BodyId }) {
  const body = BODIES[bodyId];
  const surfaceRef = useRef<THREE.Mesh>(null);
  const [band, setBand] = useState<ZoomBand>("far");
  const focusedClusterId = useExplore((s) => s.focusedClusterId);
  const focusedAnchor = useExplore((s) => s.focusedAnchor);
  const filters = useExplore((s) => s.filters);
  const hiddenOverrides = useExplore((s) => s.hiddenOverrides);
  const setViewMode = useExplore((s) => s.setViewMode);

  const bodyClusters = useMemo(
    () => clustersForBody(EXPLORE_CLUSTERS, bodyId, hiddenOverrides),
    [bodyId, hiddenOverrides],
  );
  const filteredClusters = useMemo(
    () => applyExploreFilters(bodyClusters, filters),
    [bodyClusters, filters],
  );

  // A filter change, or a body change, can empty the country the pointer was on.
  useEffect(() => {
    if (focusedClusterId && !filteredClusters.some((c) => c.id === focusedClusterId)) {
      useExplore.getState().setFocusedCluster(null);
    }
  }, [filteredClusters, focusedClusterId]);

  // A filter can leave every match on the far hemisphere, for example Japanese while parked over the
  // Pacific. An unchanged view would read as "no results", so fly to the busiest match. The camera is
  // read imperatively on purpose, so this runs on a filter change only.
  const camera = useThree((s) => s.camera);
  const [flyTarget, setFlyTarget] = useState<THREE.Vector3 | null>(null);
  useEffect(() => {
    if (!hasActiveFilters(filters) || filteredClusters.length === 0) return;
    const camDir = camera.position.clone().normalize();
    const toward = new THREE.Vector3();
    const anyVisible = filteredClusters.some(
      (c) => camDir.dot(toward.set(...latLngToVector3(c.lat, c.lng))) > 0.25,
    );
    if (anyVisible) return;
    const busiest = filteredClusters.reduce((a, b) =>
      a.total_viewer_count >= b.total_viewer_count ? a : b,
    );
    setFlyTarget(
      new THREE.Vector3(
        ...latLngToVector3(
          busiest.lat,
          busiest.lng,
          Math.max(INITIAL_CAMERA_DISTANCE, camera.position.length()),
        ),
      ),
    );
  }, [filteredClusters, camera, filters]);

  const points = useMemo(() => selectVisiblePoints(filteredClusters), [filteredClusters]);

  // Geography is Earth's alone, and the city list loads only once it is wanted.
  const cityPoints = useCityPoints(body.hasVectorBorders && band === "near");
  const cities = useMemo(
    () => citiesForView(cityPoints, band, body.hasVectorBorders),
    [cityPoints, band, body.hasVectorBorders],
  );

  const focusedCluster = focusedClusterId
    ? filteredClusters.find((c) => c.id === focusedClusterId)
    : undefined;
  const chipAnchor = focusedCluster
    ? latLngToVector3(
        focusedAnchor?.lat ?? focusedCluster.lat,
        focusedAnchor?.lng ?? focusedCluster.lng,
        1.02,
      )
    : null;

  // The panel takes the right of the screen, so a country that opens it flies to the left half. The
  // camera sits east of the country, which pushes the country left on screen.
  const openCluster = (clusterId: string) => {
    const cluster = filteredClusters.find((c) => c.id === clusterId);
    if (!cluster) return;
    useExplore.getState().setSelectedCluster(clusterId);
    setFlyTarget(
      new THREE.Vector3(
        ...latLngToVector3(
          cluster.lat,
          cluster.lng + PANEL_OFFSET_DEGREES,
          Math.max(INITIAL_CAMERA_DISTANCE, camera.position.length()),
        ),
      ),
    );
  };

  return (
    <>
      <BodySurface body={body} meshRef={surfaceRef} />
      {body.hasVectorBorders && <BorderLayer sets={bordersForBand(band)} />}
      {cities.length > 0 && <CityLabelLayer candidates={cities} />}
      {body.atmosphere && (
        <Atmosphere color={body.atmosphere} scale={body.id === "sun" ? 1.28 : 1.15} />
      )}
      <Stars radius={10} depth={4} count={1600} factor={1.6} saturation={0} fade speed={0.4} />

      <LivePointLayer
        points={points}
        style={body.hotspotStyle}
        onPointOver={(point) => {
          useExplore.getState().setFocusedCluster(point.clusterId, {
            lat: point.lat,
            lng: point.lng,
          });
        }}
        onPointOut={() => useExplore.getState().setFocusedCluster(null)}
        onPointClick={(point) => openCluster(point.clusterId)}
      />

      {focusedCluster && chipAnchor && (
        <Html
          position={chipAnchor}
          occlude={[surfaceRef as RefObject<THREE.Object3D>]}
          zIndexRange={[30, 10]}
          style={{ pointerEvents: "none" }}
        >
          <ClusterChip cluster={focusedCluster} />
        </Html>
      )}

      <CameraRig
        body={bodyId}
        onBandChange={setBand}
        flyTo={flyTarget}
        onZoomOutPastCeiling={() => setViewMode("system")}
      />
    </>
  );
}

export function ExploreGlobe({ bodyId }: { bodyId: BodyId }) {
  // The camera starts where this body was last left, or out over the default region on a first
  // visit. Remounting the canvas for a new body reads this again.
  const initialPosition = useMemo<[number, number, number]>(() => {
    const saved = useExplore.getState().savedCameras[bodyId];
    if (saved) return saved.position;
    if (bodyId === "earth") {
      return latLngToVector3(DEFAULT_ORIGIN.lat, DEFAULT_ORIGIN.lng, IDLE_CAMERA_DISTANCE);
    }
    // Far enough out that the whole body fits the 40 degree fov. Earth is flown in to a place, but
    // the other bodies must read as a whole world first.
    return [0, 0.85, 3.05];
  }, [bodyId]);

  return (
    <Canvas
      camera={{ fov: 40, near: 0.05, far: 30, position: initialPosition }}
      gl={{ antialias: true }}
      // offsetSize measures the layout box. The default reads getBoundingClientRect, which the warp
      // animation scales, and R3F would write that scaled size onto the canvas and keep it.
      resize={{ offsetSize: true }}
    >
      <color attach="background" args={[CANVAS_BACKGROUND]} />
      <Suspense fallback={null}>
        <BodyScene bodyId={bodyId} />
      </Suspense>
    </Canvas>
  );
}
