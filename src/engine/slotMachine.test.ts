import { describe, expect, it } from 'vitest'
import type { Slot } from './types'
import { SLOT, expiresAt, isDone, nextSlotState, timeLeftSec } from './slotMachine'
import { SEED_BRAND_PROPS } from '../data/catalog'

const T0 = 1_000_000
const slot = (over: Partial<Slot>): Slot => ({
  brandProp: SEED_BRAND_PROPS[0],
  startedAt: T0,
  baseDurationSec: 30,
  extensionSec: 0,
  state: 'active',
  stateSince: T0,
  ...over,
})

describe('nextSlotState', () => {
  it('entering → active after the enter animation', () => {
    const s = slot({ state: 'entering' })
    expect(nextSlotState(s, T0 + SLOT.ENTER_MS - 1)).toBe('entering')
    expect(nextSlotState(s, T0 + SLOT.ENTER_MS)).toBe('active')
  })

  it('active → expiring when timeLeft crosses the threshold', () => {
    const s = slot({})
    const justBefore = T0 + (30 - SLOT.EXPIRING_THRESHOLD_SEC) * 1000 - 1000
    const justAfter = T0 + (30 - SLOT.EXPIRING_THRESHOLD_SEC + 1) * 1000
    expect(nextSlotState(s, justBefore)).toBe('active')
    expect(nextSlotState(s, justAfter)).toBe('expiring')
  })

  it('expiring → active when a hype extension pulls it back (the product moment)', () => {
    const nearDeath = T0 + 27_000 // 3s left on a 30s base
    const dying = slot({ state: 'expiring', stateSince: nearDeath })
    expect(nextSlotState(dying, nearDeath)).toBe('expiring')
    const surged = { ...dying, extensionSec: 15 } // 18s left now
    expect(nextSlotState(surged, nearDeath)).toBe('active')
  })

  it('→ exiting at zero, from active or expiring', () => {
    expect(nextSlotState(slot({}), T0 + 30_001)).toBe('exiting')
    expect(nextSlotState(slot({ state: 'expiring' }), T0 + 30_001)).toBe('exiting')
  })
})

describe('expiresAt / timeLeftSec', () => {
  it('extension pushes expiry out, capped', () => {
    expect(expiresAt(slot({}))).toBe(T0 + 30_000)
    expect(expiresAt(slot({ extensionSec: 20 }))).toBe(T0 + 50_000)
    expect(expiresAt(slot({ extensionSec: 500 }))).toBe(T0 + 90_000) // 30 + 60 cap
  })

  it('timeLeft never goes negative', () => {
    expect(timeLeftSec(slot({}), T0 + 99_000)).toBe(0)
  })
})

describe('isDone', () => {
  it('waits out the exit animation', () => {
    const s = slot({ state: 'exiting', stateSince: T0 })
    expect(isDone(s, T0 + SLOT.EXIT_MS - 1)).toBe(false)
    expect(isDone(s, T0 + SLOT.EXIT_MS)).toBe(true)
  })
})
