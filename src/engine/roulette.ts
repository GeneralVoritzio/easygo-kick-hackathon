/**
 * Interaction Engine — layer 2 core (pure).
 * The roulette: one entry per user, pity-weighted random draw over a
 * moderation-filtered pool. Sybil-resistant by construction.
 */

export type RouletteEntry = {
  user_id: string
  username: string
  color: string
  text: string
  submitted_at: number
  /** rounds this user has entered without being drawn — feeds the pity timer */
  rounds_waited: number
  /** true when auto-seeded from unanswered chat questions (empty-pool fallback) */
  seeded?: boolean
}

export type RouletteOutcome = 'accepted_done' | 'accepted_not_done' | 'declined'

/** pity timer: cheap, legible, turns the lurker thesis into a mechanism */
export function weightFor(e: RouletteEntry): number {
  return 1 + 0.5 * e.rounds_waited
}

/** viewer-facing odds line: "1 in 47 this round" (weighted) */
export function entryOdds(pool: RouletteEntry[], user_id: string): number | null {
  const mine = pool.find((e) => e.user_id === user_id)
  if (!mine) return null
  const total = pool.reduce((a, e) => a + weightFor(e), 0)
  return total > 0 ? Math.max(1, Math.round(total / weightFor(mine))) : null
}

/** one live entry per user — resubmission replaces */
export function upsertEntry(pool: RouletteEntry[], entry: RouletteEntry): RouletteEntry[] {
  const prior = pool.find((e) => e.user_id === entry.user_id)
  const rounds_waited = prior ? prior.rounds_waited : entry.rounds_waited
  return [...pool.filter((e) => e.user_id !== entry.user_id), { ...entry, rounds_waited }]
}

/** weighted draw; rand injected for testability */
export function draw(pool: RouletteEntry[], rand: () => number): RouletteEntry | null {
  if (!pool.length) return null
  const total = pool.reduce((a, e) => a + weightFor(e), 0)
  let r = rand() * total
  for (const e of pool) {
    r -= weightFor(e)
    if (r <= 0) return e
  }
  return pool[pool.length - 1]
}

/**
 * Moderation on arrival — the wheel is built from survivors only.
 * Blocklist + shape heuristics; a real deployment swaps in a classifier,
 * the boundary stays identical.
 */
const BLOCKLIST = [
  'kill', 'die', 'hurt', 'punch', 'fight', 'blood', 'naked', 'strip', 'nude', 'sex',
  'drink', 'shot', 'chug', 'vodka', 'beer', 'drug', 'smoke', 'vape', 'pill',
  'address', 'doxx', 'dox', 'ssn', 'password', 'swat', 'fire', 'burn', 'knife', 'gun',
  'racist', 'slur', 'nazi', 'steal', 'shoplift', 'illegal',
]

export function moderate(text: string): { ok: boolean; reason?: string } {
  const t = text.toLowerCase().trim()
  if (t.length < 4) return { ok: false, reason: 'too short' }
  if (t.length > 140) return { ok: false, reason: 'too long' }
  const words = t.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
  for (const w of words) {
    if (BLOCKLIST.includes(w)) return { ok: false, reason: 'blocked term' }
  }
  if (/https?:\/\//.test(t)) return { ok: false, reason: 'links not allowed' }
  return { ok: true }
}

/** looks like a genuine question the streamer never answered */
export function looksLikeQuestion(content: string): boolean {
  const t = content.trim()
  return t.length >= 10 && t.length <= 120 && t.includes('?')
}

/**
 * Empty-pool fallback: seed the wheel from unanswered chat questions,
 * one per user, newest first, diversity-capped. The wheel always spins.
 */
export function seedFromQuestions(
  messages: { message_id: string; user_id: string; username: string; content: string; created_at: number }[],
  ackedMessageIds: Set<string>,
  now: number,
  max = 6,
): RouletteEntry[] {
  const seen = new Set<string>()
  const out: RouletteEntry[] = []
  for (const m of [...messages].reverse()) {
    if (out.length >= max) break
    if (seen.has(m.user_id)) continue
    if (ackedMessageIds.has(m.message_id)) continue
    if (!looksLikeQuestion(m.content)) continue
    seen.add(m.user_id)
    out.push({
      user_id: m.user_id,
      username: m.username,
      color: '#a3a3a3',
      text: m.content,
      submitted_at: now,
      rounds_waited: 0,
      seeded: true,
    })
  }
  return out
}
