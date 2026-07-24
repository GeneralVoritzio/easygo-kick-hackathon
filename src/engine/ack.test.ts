import { describe, expect, it } from 'vitest'
import {
  baselineOdds,
  computeStats,
  formatOdds,
  gini,
  matchUsernames,
  timingHint,
  type AcknowledgementEvent,
  type KickChatEvent,
} from './ack'

const msg = (id: string, user: string, over: Partial<KickChatEvent> = {}): KickChatEvent => ({
  message_id: id,
  sender: { user_id: user, username: user, identity: { badges: [] } },
  content: 'hello there',
  created_at: 1_000_000,
  ...over,
})

const ack = (message_id: string, user_id: string, over: Partial<AcknowledgementEvent> = {}): AcknowledgementEvent => ({
  message_id,
  user_id,
  message_ts: 1_000_000,
  ack_ts: 1_004_000,
  latency_ms: 4000,
  tier: 'explicit',
  confidence: 1,
  ...over,
})

describe('gini', () => {
  it('is 0 for perfectly spread attention', () => {
    expect(gini([3, 3, 3, 3])).toBe(0)
  })
  it('approaches 1 when one user absorbs everything', () => {
    expect(gini([20, 0, 0, 0, 0])).toBeGreaterThan(0.7)
  })
  it('handles empty and single-user cases', () => {
    expect(gini([])).toBe(0)
    expect(gini([7])).toBe(0)
  })
})

describe('computeStats', () => {
  const tenMsgs = Array.from({ length: 10 }, (_, i) => msg(`m${i}`, `u${i}`))

  it('computes odds as acked/total over the window', () => {
    const s = computeStats(tenMsgs, [ack('m1', 'u1'), ack('m2', 'u2')], { viewers: 500 })
    expect(s.odds).toBeCloseTo(0.2)
    expect(s.oddsN).toBe(5)
    expect(formatOdds(s)).toBe('1 in 5')
  })

  it('refuses to score a thin window', () => {
    const s = computeStats(tenMsgs.slice(0, 4), [ack('m1', 'u1')], { viewers: 500 })
    expect(s.oddsN).toBeNull()
    expect(formatOdds(s)).toBe('warming up…')
    expect(s.badges).toEqual([])
  })

  it('marks untrackable chat instead of scoring it badly', () => {
    const flood = Array.from({ length: 1000 }, (_, i) => msg(`f${i}`, `u${i % 40}`))
    const s = computeStats(flood, [], { viewers: 20000 })
    expect(s.trackable).toBe(false)
    expect(formatOdds(s)).toBe('chat too fast to track')
    expect(s.badges).toEqual([])
  })

  it('first-timer share counts acks on first messages only', () => {
    const msgs = [msg('a', 'new1', { first_message_in_channel: true }), ...tenMsgs.slice(0, 9)]
    const s = computeStats(msgs, [ack('a', 'new1'), ack('m0', 'u0')], { viewers: 500 })
    expect(s.firstTimerShare).toBeCloseTo(0.5)
  })

  it('awards badges positively and only above baseline', () => {
    const acks = ['m0', 'm1', 'm2', 'm3', 'm4'].map((id, i) => ack(id, `u${i}`))
    const s = computeStats(tenMsgs, acks, { viewers: 500 })
    expect(s.badges).toContain('responsive')
    expect(s.badges).toContain('reads_everything') // 5 acks across 5 users → gini 0
    const cold = computeStats(tenMsgs, [], { viewers: 500 })
    expect(cold.badges).toEqual([])
  })
})

describe('baselineOdds', () => {
  it('shrinks as the room grows', () => {
    expect(baselineOdds(50)).toBeGreaterThan(baselineOdds(800))
    expect(baselineOdds(800)).toBeGreaterThan(baselineOdds(20000))
  })
})

describe('timingHint', () => {
  it('maps queue depth to agency', () => {
    expect(timingHint(5)).toBe('lull')
    expect(timingHint(25)).toBe('normal')
    expect(timingHint(60)).toBe('busy')
  })
})

describe('matchUsernames (tier 1)', () => {
  const senders = [
    { user_id: 'u1', username: 'vibecheckerr' },
    { user_id: 'u2', username: 'kekw_enjoyer' },
    { user_id: 'u3', username: 'abc' }, // too short to match safely
  ]
  it('matches verbatim usernames through punctuation and case', () => {
    expect(matchUsernames('big thanks to VibeCheckerr for that one', senders)).toEqual(['u1'])
    expect(matchUsernames('kekw enjoyer asks a good question', senders)).toEqual(['u2'])
  })
  it('never matches short usernames or empty utterances', () => {
    expect(matchUsernames('abc that is wild', senders)).toEqual([])
    expect(matchUsernames('', senders)).toEqual([])
  })
})
