import { describe, expect, it } from 'vitest'
import { HYPEKING_CREATOR_PROFILE, buildCreatorProfile } from './creatorStats'

describe('creator profile', () => {
  it('is deterministic for a fixed seed', () => {
    expect(buildCreatorProfile()).toEqual(buildCreatorProfile())
  })

  it('ships 5–7 sessions, newest first, with coherent numbers', () => {
    const { sessions } = HYPEKING_CREATOR_PROFILE
    expect(sessions.length).toBeGreaterThanOrEqual(5)
    expect(sessions.length).toBeLessThanOrEqual(7)
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i]
      expect(s.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/) // ULID alphabet
      expect(Date.parse(s.started_at)).toBeLessThan(Date.parse(s.ended_at))
      expect(s.average_viewer_count).toBeLessThanOrEqual(s.peak_viewer_count)
      expect(s.message_count).toBeGreaterThan(0)
      expect(s.odds_label).toMatch(/^1 in \d+$/)
      if (i > 0) expect(Date.parse(s.started_at)).toBeLessThan(Date.parse(sessions[i - 1].started_at))
    }
  })

  it('provides a bounded historical trend long enough to draw', () => {
    const { viewer_trend } = HYPEKING_CREATOR_PROFILE
    expect(viewer_trend.length).toBeGreaterThanOrEqual(60)
    for (const v of viewer_trend) {
      expect(v).toBeGreaterThanOrEqual(750)
      expect(v).toBeLessThanOrEqual(2200)
    }
  })

  it('keeps session ids unique', () => {
    const ids = HYPEKING_CREATOR_PROFILE.sessions.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
