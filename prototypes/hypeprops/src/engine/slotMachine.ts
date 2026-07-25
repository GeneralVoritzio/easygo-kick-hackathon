import type { Slot, SlotState } from './types'
import { cappedExtension } from './hype'

export const SLOT = {
  ENTER_MS: 400,
  EXIT_MS: 500,
  /** timeLeft at which the placement starts its expiring pulse */
  EXPIRING_THRESHOLD_SEC: 5,
  /** gap between one slot exiting and the next queued sponsor entering */
  COOLDOWN_MS: 1500,
} as const

export function expiresAt(slot: Slot): number {
  return slot.startedAt + (slot.baseDurationSec + cappedExtension(slot.extensionSec)) * 1000
}

export function timeLeftSec(slot: Slot, now: number): number {
  return Math.max(0, (expiresAt(slot) - now) / 1000)
}

/**
 * Pure transition function.
 * Note the expiring → active edge: a hype surge can pull a placement back
 * from the brink — that's the whole product.
 */
export function nextSlotState(slot: Slot, now: number): SlotState {
  const left = timeLeftSec(slot, now)
  switch (slot.state) {
    case 'entering':
      return now - slot.stateSince >= SLOT.ENTER_MS ? 'active' : 'entering'
    case 'active':
      if (left <= 0) return 'exiting'
      return left <= SLOT.EXPIRING_THRESHOLD_SEC ? 'expiring' : 'active'
    case 'expiring':
      if (left <= 0) return 'exiting'
      return left > SLOT.EXPIRING_THRESHOLD_SEC ? 'active' : 'expiring'
    case 'exiting':
      return 'exiting'
  }
}

/** true once the exit animation has finished and the slot should be cleared */
export function isDone(slot: Slot, now: number): boolean {
  return slot.state === 'exiting' && now - slot.stateSince >= SLOT.EXIT_MS
}
