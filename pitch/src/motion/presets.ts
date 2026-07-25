/*
  The curves are KICK-BRAND-IDENTITY.md Section 6, measured on KICK. hardCut is the
  default, because the deck cuts and does not dissolve.
*/
const MEDIA = [0.87, 0, 0.13, 1] as const

export type Preset = {
  keyframes: Record<string, unknown>
  duration: number
  easing: readonly number[]
}

export const presets: Record<string, Preset> = {
  hardCut: { keyframes: { opacity: [1, 1] }, duration: 0, easing: MEDIA },
  riseIn: { keyframes: { y: [24, 0], opacity: [0, 1] }, duration: 0.2, easing: MEDIA },
  slamIn: { keyframes: { scale: [0.82, 1], opacity: [0, 1] }, duration: 0.4, easing: MEDIA },
  bracketSnap: { keyframes: { scale: [1.15, 1], opacity: [0, 1] }, duration: 0.12, easing: MEDIA },
}

export const STAGGER = 0.04
