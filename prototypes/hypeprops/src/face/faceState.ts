/**
 * Transient per-frame face data — written by the MediaPipe loop, read by the
 * R3F render loop. Deliberately NOT React state / NOT in the Zustand store:
 * this updates at video fps and must never trigger a React render.
 */
export const faceState = {
  /** column-major 4×4 facial transformation matrix (cm, camera at origin, -Z forward) */
  matrix: new Float32Array(16),
  hasFace: false,
  /** performance.now() of the last successful detection — stale ⇒ hide the prop */
  lastDetectionAt: 0,
}

export function markLost() {
  faceState.hasFace = false
}
