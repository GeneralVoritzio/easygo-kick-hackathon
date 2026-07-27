import { describe, expect, it } from 'vitest'
import { approvalTally, gradeQuiz, oraclePolicy, settleDraw, type OracleRun } from './settle'
import { chainNext, clientSeed, digestHex, drawIndex } from './refCrypto'

const OPTIONS = ['Slots', 'IRL walk', 'Ranked', 'Cooking']

describe('approvalTally', () => {
  it('lets a bloc win plurality but lose approval (the demo beat)', () => {
    const votes = [
      // 3-strong troll bloc, single-mindedly on Slots
      { userId: 't1', picks: ['Slots'] },
      { userId: 't2', picks: ['Slots'] },
      { userId: 't3', picks: ['Slots'] },
      // 4 sincere voters split their first choice but broadly approve IRL walk
      { userId: 's1', picks: ['IRL walk', 'Cooking'] },
      { userId: 's2', picks: ['Ranked', 'IRL walk'] },
      { userId: 's3', picks: ['Cooking', 'IRL walk'] },
      { userId: 's4', picks: ['IRL walk', 'Ranked'] },
    ]
    const t = approvalTally(OPTIONS, votes)
    expect(t.firstChoiceWinner).toBe('Slots')
    expect(t.approvalWinner).toBe('IRL walk')
    expect(t.diverges).toBe(true)
    expect(t.voters).toBe(7)
  })

  it('counts only the latest vote per user', () => {
    const t = approvalTally(OPTIONS, [
      { userId: 'u1', picks: ['Slots'] },
      { userId: 'u1', picks: ['Ranked'] },
    ])
    expect(t.approval.Slots).toBe(0)
    expect(t.approval.Ranked).toBe(1)
    expect(t.voters).toBe(1)
  })

  it('ignores picks that are not on the ballot', () => {
    const t = approvalTally(OPTIONS, [{ userId: 'u1', picks: ['Nonsense', 'Ranked'] }])
    expect(t.approval.Ranked).toBe(1)
    expect(t.firstChoice.Ranked).toBe(1)
  })
})

describe('gradeQuiz', () => {
  const key = ['ironvow', '3', 'slots', 'durian']
  it('tiers by ratio and is case/space insensitive', () => {
    const grades = gradeQuiz(key, [
      { userId: 'a', username: 'lurker', answers: ['IronVow', ' 3', 'Slots', 'durian'] },
      { userId: 'b', username: 'most', answers: ['ironvow', '3', 'slots', 'wrong'] },
      { userId: 'c', username: 'guess', answers: ['x', 'y', 'z', 'w'] },
    ])
    expect(grades[0].tier).toBe('gold') // 4/4
    expect(grades[0].correct).toBe(4)
    expect(grades[1].tier).toBe('silver') // 3/4 = 0.75, clears the 0.7 gate
    expect(grades[2].tier).toBe('flair')
  })

  it('holds the silver line at exactly 70%', () => {
    const tenKey = Array.from({ length: 10 }, (_, i) => `a${i}`)
    const seven = tenKey.map((k, i) => (i < 7 ? k : 'wrong'))
    const six = tenKey.map((k, i) => (i < 6 ? k : 'wrong'))
    expect(gradeQuiz(tenKey, [{ userId: 'x', username: 'x', answers: seven }])[0].tier).toBe('silver')
    expect(gradeQuiz(tenKey, [{ userId: 'y', username: 'y', answers: six }])[0].tier).toBe('flair')
  })

  it('participation always earns flair, never nothing', () => {
    const grades = gradeQuiz(key, [{ userId: 'z', username: 'wrong', answers: ['', '', ''] }])
    expect(grades[0].tier).toBe('flair')
  })
})

describe('settleDraw', () => {
  const entrants = Array.from({ length: 12 }, (_, i) => ({ userId: `u${i}`, username: `viewer${i}` }))

  it('is a pure function of the revealed seeds — the recount matches', () => {
    const a = settleDraw(entrants, 'server-seed', 'client-seed', 1)
    const b = settleDraw(entrants, 'server-seed', 'client-seed', 1)
    expect(a.winner).toEqual(b.winner)
    expect(a.index).toBeGreaterThanOrEqual(0)
    expect(a.index).toBeLessThan(entrants.length)
  })

  it('a different nonce or seed moves the winner', () => {
    const base = settleDraw(entrants, 'server-seed', 'client-seed', 1).index
    const otherNonce = settleDraw(entrants, 'server-seed', 'client-seed', 2).index
    const otherSeed = settleDraw(entrants, 'server-seed-2', 'client-seed', 1).index
    expect([otherNonce, otherSeed].some((i) => i !== base)).toBe(true)
  })

  it('spreads across the entrant list over many nonces', () => {
    const seen = new Set(Array.from({ length: 200 }, (_, n) => drawIndex('s', 'c', n, entrants.length)))
    expect(seen.size).toBeGreaterThan(6)
  })

  it('handles an empty entrant list', () => {
    expect(settleDraw([], 's', 'c', 1).winner).toBeNull()
  })
})

describe('oraclePolicy (presumption of compliance)', () => {
  const pass: OracleRun = { verdict: 'PASS', cited: [12], rationale: 'jacket removed at 12.0s' }
  const fail: OracleRun = { verdict: 'FAIL', cited: [], rationale: 'no such event' }
  const abstain: OracleRun = { verdict: 'ABSTAIN', cited: [], rationale: 'subject left frame' }

  it('a single run may PASS', () => {
    expect(oraclePolicy(pass).verdict).toBe('PASS')
  })

  it('FAIL alone never settles as FAIL — it needs an agreeing re-run', () => {
    expect(oraclePolicy(fail).verdict).toBe('ABSTAIN')
    expect(oraclePolicy(fail, pass).verdict).toBe('ABSTAIN')
    expect(oraclePolicy(fail, fail).verdict).toBe('FAIL')
  })

  it('ABSTAIN routes to humans and never becomes FAIL', () => {
    expect(oraclePolicy(abstain).verdict).toBe('ABSTAIN')
    expect(oraclePolicy(abstain, fail).verdict).toBe('ABSTAIN')
  })
})

describe('log integrity helpers', () => {
  it('the hash chain changes when any event changes', () => {
    const h1 = chainNext(digestHex('session'), { type: 'vote', user: 'a' })
    const h2 = chainNext(digestHex('session'), { type: 'vote', user: 'b' })
    expect(h1).not.toBe(h2)
    expect(h1).toHaveLength(64)
  })

  it('the client seed is fixed by chat entries, order-independent of arrival', () => {
    const a = clientSeed([
      { msgId: 'm2', content: 'B' },
      { msgId: 'm1', content: 'A' },
    ])
    const b = clientSeed([
      { msgId: 'm1', content: 'A' },
      { msgId: 'm2', content: 'B' },
    ])
    expect(a).toBe(b)
    expect(a).not.toBe(clientSeed([{ msgId: 'm1', content: 'A' }]))
  })
})
