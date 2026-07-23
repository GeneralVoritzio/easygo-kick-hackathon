import { describe, expect, it } from 'vitest'
import { HYPE, cappedExtension, extensionFor, nextHype, rawHype } from './hype'

const QUIET = { chatVelocity: 0, likeVelocity: 0, viewerDelta: 0 }
const MAXED = { chatVelocity: 100, likeVelocity: 100, viewerDelta: 100 }

describe('rawHype', () => {
  it('is 0 for a dead chat and 1 for a maxed one', () => {
    expect(rawHype(QUIET)).toBe(0)
    expect(rawHype(MAXED)).toBe(1)
  })

  it('weights feeds and clamps each one individually', () => {
    // chat alone, fully saturated, contributes exactly its weight
    expect(rawHype({ ...QUIET, chatVelocity: HYPE.CHAT_FULL_PER_SEC * 50 })).toBeCloseTo(HYPE.W_CHAT)
  })
})

describe('nextHype', () => {
  it('decays toward 0 with no input', () => {
    const s1 = nextHype(1, QUIET, HYPE.HALF_LIFE_SEC)
    expect(s1).toBeCloseTo(0.5, 5)
    expect(nextHype(s1, QUIET, HYPE.HALF_LIFE_SEC)).toBeCloseTo(0.25, 5)
  })

  it('must be sustained: a single tick of input cannot pin the score at 1', () => {
    expect(nextHype(0, MAXED, 0.1)).toBeLessThan(0.2)
  })

  it('sustained max input saturates to 1', () => {
    let s = 0
    for (let i = 0; i < 100; i++) s = nextHype(s, MAXED, 0.1)
    expect(s).toBeCloseTo(1, 1)
  })

  it('is deterministic given the same event stream', () => {
    const run = () => {
      let s = 0.3
      for (let i = 0; i < 50; i++) s = nextHype(s, { chatVelocity: i % 7, likeVelocity: i % 5, viewerDelta: 2 }, 0.1)
      return s
    }
    expect(run()).toBe(run())
  })
})

describe('extensionFor', () => {
  it('earns nothing at or below baseline', () => {
    expect(extensionFor(HYPE.BASELINE, 1)).toBe(0)
    expect(extensionFor(0.1, 1)).toBe(0)
  })

  it('earns proportionally above baseline', () => {
    expect(extensionFor(1, 1)).toBeCloseTo(HYPE.K * (1 - HYPE.BASELINE))
    expect(extensionFor(0.7, 0.1)).toBeCloseTo(HYPE.K * 0.35 * 0.1, 5)
  })
})

describe('cappedExtension', () => {
  it('caps at MAX_EXTENSION_SEC', () => {
    expect(cappedExtension(HYPE.MAX_EXTENSION_SEC + 100)).toBe(HYPE.MAX_EXTENSION_SEC)
    expect(cappedExtension(5)).toBe(5)
  })
})
