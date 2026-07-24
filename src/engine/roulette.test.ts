import { describe, expect, it } from 'vitest'
import { draw, entryOdds, moderate, seedFromQuestions, upsertEntry, weightFor, type RouletteEntry } from './roulette'

const entry = (user_id: string, over: Partial<RouletteEntry> = {}): RouletteEntry => ({
  user_id,
  username: user_id,
  color: '#fff',
  text: 'do a victory lap around the room',
  submitted_at: 1_000_000,
  rounds_waited: 0,
  ...over,
})

describe('pity timer', () => {
  it('weights by rounds waited: 1 + 0.5×n', () => {
    expect(weightFor(entry('a'))).toBe(1)
    expect(weightFor(entry('a', { rounds_waited: 4 }))).toBe(3)
  })

  it('entryOdds reflect weights, "1 in N"', () => {
    const pool = [entry('a', { rounds_waited: 4 }), entry('b'), entry('c')] // weights 3,1,1
    expect(entryOdds(pool, 'a')).toBe(2) // 5/3 → 1 in 2
    expect(entryOdds(pool, 'b')).toBe(5)
    expect(entryOdds(pool, 'missing')).toBeNull()
  })
})

describe('upsertEntry', () => {
  it('one live entry per user — resubmission replaces text but keeps waited rounds', () => {
    let pool = [entry('a', { rounds_waited: 3, text: 'old dare' })]
    pool = upsertEntry(pool, entry('a', { text: 'new dare' }))
    expect(pool).toHaveLength(1)
    expect(pool[0].text).toBe('new dare')
    expect(pool[0].rounds_waited).toBe(3)
  })
})

describe('draw', () => {
  it('is deterministic given rand and covers the full pool', () => {
    const pool = [entry('a'), entry('b'), entry('c')]
    expect(draw(pool, () => 0.01)!.user_id).toBe('a')
    expect(draw(pool, () => 0.99)!.user_id).toBe('c')
    expect(draw([], () => 0.5)).toBeNull()
  })

  it('pity weight measurably shifts distribution', () => {
    const pool = [entry('waited', { rounds_waited: 6 }), entry('fresh')] // weights 4 vs 1
    let waitedWins = 0
    for (let i = 0; i < 1000; i++) {
      const r = ((i * 2654435761) % 1000) / 1000 // deterministic pseudo-rand sweep
      if (draw(pool, () => r)!.user_id === 'waited') waitedWins++
    }
    expect(waitedWins / 1000).toBeGreaterThan(0.7)
  })
})

describe('moderate', () => {
  it('passes benign dares and blocks the pool at arrival', () => {
    expect(moderate('speak in an accent for one minute').ok).toBe(true)
    expect(moderate('chug a beer').ok).toBe(false)
    expect(moderate('say my address on stream').ok).toBe(false)
    expect(moderate('visit https://sus.link').ok).toBe(false)
    expect(moderate('hi').ok).toBe(false)
  })
})

describe('seedFromQuestions (empty-pool fallback)', () => {
  const m = (id: string, user: string, content: string) => ({
    message_id: id,
    user_id: user,
    username: user,
    content,
    created_at: 1_000_000,
  })
  it('seeds from unanswered questions, one per user, skipping acked', () => {
    const msgs = [
      m('1', 'a', 'what rank are you now?'),
      m('2', 'b', 'GG'),
      m('3', 'a', 'wait what headset is that?'),
      m('4', 'c', 'how long have you been streaming?'),
    ]
    const pool = seedFromQuestions(msgs, new Set(['4']), 2_000_000)
    expect(pool.map((e) => e.user_id)).toEqual(['a']) // c acked, b not a question, a deduped to newest
    expect(pool[0].text).toBe('wait what headset is that?')
    expect(pool[0].seeded).toBe(true)
  })
})
