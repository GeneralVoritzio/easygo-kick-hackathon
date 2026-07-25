/**
 * Pure hype engine — deterministic given an event stream.
 * This is the "real system": mock events flow in, but the math is production-shaped.
 */

export const HYPE = {
  /** velocity that counts as "maxed out" for each feed */
  CHAT_FULL_PER_SEC: 6,
  LIKE_FULL_PER_SEC: 12,
  VIEWER_FULL_PER_SEC: 15,
  /** feed weights (sum to 1) */
  W_CHAT: 0.5,
  W_LIKE: 0.3,
  W_VIEWER: 0.2,
  /** exponential decay half-life — hype must be *sustained* */
  HALF_LIFE_SEC: 2.5,
  /**
   * how fast raw input charges the score. Sets the sustained-input equilibrium:
   * s* ≈ raw · GAIN·dt / (1 − 2^(−dt/HALF_LIFE)) ≈ 1.8·raw at 10Hz — so ambient
   * chatter idles the meter near 15–20% and only a real surge saturates it.
   */
  GAIN: 0.5,
  /** score above this earns countdown extension */
  BASELINE: 0.35,
  /** extension seconds earned per second at score 1.0 ≈ K * (1 - BASELINE) */
  K: 10,
  MAX_EXTENSION_SEC: 60,
  /** instant bonus when the presenter fires a surge — makes the timer visibly jump */
  SURGE_BONUS_SEC: 15,
} as const

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export type HypeInputs = {
  chatVelocity: number // msgs/sec over rolling window
  likeVelocity: number // likes/sec over rolling window
  viewerDelta: number // viewers gained/sec over rolling window
}

/** weighted, normalized instantaneous hype pressure in 0..1 */
export function rawHype(inputs: HypeInputs): number {
  return clamp01(
    HYPE.W_CHAT * clamp01(inputs.chatVelocity / HYPE.CHAT_FULL_PER_SEC) +
      HYPE.W_LIKE * clamp01(inputs.likeVelocity / HYPE.LIKE_FULL_PER_SEC) +
      HYPE.W_VIEWER * clamp01(inputs.viewerDelta / HYPE.VIEWER_FULL_PER_SEC),
  )
}

/** decay previous score toward 0, then charge with current pressure */
export function nextHype(prev: number, inputs: HypeInputs, dt: number): number {
  const decayed = prev * Math.exp((-Math.LN2 * dt) / HYPE.HALF_LIFE_SEC)
  return clamp01(decayed + rawHype(inputs) * HYPE.GAIN * dt)
}

/** extension seconds earned this tick while a slot is live */
export function extensionFor(score: number, dt: number): number {
  return HYPE.K * Math.max(0, score - HYPE.BASELINE) * dt
}

export function cappedExtension(extensionSec: number): number {
  return Math.min(extensionSec, HYPE.MAX_EXTENSION_SEC)
}
