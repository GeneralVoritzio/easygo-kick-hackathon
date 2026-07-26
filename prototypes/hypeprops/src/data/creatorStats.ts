/**
 * Seeded streamer history for the demo account's Creator Dashboard. Fixed
 * seed → identical numbers every run. Field names follow
 * `.claude/KICK-API-CONVENTIONS.md` (snake_case, `_count`, `_at` RFC3339 UTC).
 */

const SEED = 0xcafe_2026

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type StreamSession = {
  /** ULID-shaped, like real message/event ids */
  id: string
  title: string
  category: string
  started_at: string
  ended_at: string
  peak_viewer_count: number
  average_viewer_count: number
  message_count: number
  /** that session's response odds, pre-formatted ("1 in 6") */
  odds_label: string
}

export type CreatorProfile = {
  broadcaster_user_id: number
  channel_slug: string
  follower_count: number
  lifetime_hours_streamed: number
  watch_time_minutes_30d: number
  /** newest first */
  sessions: StreamSession[]
  /** historical viewer samples feeding the dashboard sparkline before live data */
  viewer_trend: number[]
}

const SESSION_TITLES = [
  'chat runs my stream tonight',
  'prop roulette — you spin it, I wear it',
  'saturday IRL grind w/ the crew',
  'answering EVERY first-timer today',
  'sponsor props showcase + Q&A',
  'late night just chatting, come through',
  '1804 viewers and counting — hype check',
]

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export function buildCreatorProfile(seed = SEED): CreatorProfile {
  const rng = mulberry32(seed)

  const ulid = () => {
    let out = ''
    for (let i = 0; i < 26; i++) out += CROCKFORD[Math.floor(rng() * CROCKFORD.length)]
    return out
  }

  // last ~2 weeks of streams, walking back from a fixed anchor (newest first)
  const anchor = Date.parse('2026-07-24T19:00:00Z')
  const sessions: StreamSession[] = []
  let cursor = anchor
  for (let i = 0; i < 6; i++) {
    const durationMs = Math.round((2.5 + rng() * 3.5) * 3_600_000) // 2.5–6h
    const startedAt = cursor - durationMs
    const average = Math.round(950 + rng() * 700)
    const peak = Math.round(average * (1.25 + rng() * 0.5))
    const oddsN = Math.max(3, Math.round(4 + rng() * 8))
    sessions.push({
      id: ulid(),
      title: SESSION_TITLES[i % SESSION_TITLES.length],
      category: rng() < 0.7 ? 'Just Chatting' : 'IRL',
      started_at: new Date(startedAt).toISOString(),
      ended_at: new Date(cursor).toISOString(),
      peak_viewer_count: peak,
      average_viewer_count: average,
      message_count: Math.round((durationMs / 60_000) * (14 + rng() * 18)),
      odds_label: `1 in ${oddsN}`,
    })
    // 1–3 days of rest between streams
    cursor = startedAt - Math.round((1 + rng() * 2) * 86_400_000)
  }

  // a plausible session curve: ramp up, mid-stream plateau with wobble
  const trend: number[] = []
  let viewers = 700 + rng() * 200
  for (let i = 0; i < 90; i++) {
    const ramp = i < 25 ? 14 + rng() * 10 : 0
    viewers = Math.min(2200, Math.max(750, viewers + ramp + (rng() - 0.48) * 60))
    trend.push(Math.round(viewers))
  }

  return {
    broadcaster_user_id: 730_921,
    channel_slug: 'hypeking',
    follower_count: 48_213,
    lifetime_hours_streamed: 1_872,
    watch_time_minutes_30d: 4_318_540,
    sessions,
    viewer_trend: trend,
  }
}

export const HYPEKING_CREATOR_PROFILE = buildCreatorProfile()
