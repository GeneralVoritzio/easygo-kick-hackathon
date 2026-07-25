import { create } from 'zustand'
import {
  ACK_WINDOW_MS,
  SENDER_MATCH_WINDOW_MS,
  computeStats,
  matchUsernames,
  type AcknowledgementEvent,
  type AckTier,
  type ChannelInteractionStats,
  type InteractionBadgeKey,
  type KickChatEvent,
} from './ack'
import {
  draw,
  entryOdds,
  moderate,
  seedFromQuestions,
  upsertEntry,
  type RouletteEntry,
  type RouletteOutcome,
} from './roulette'

/** the id the stream-view input box sends as — the "person in the room" */
export const YOU_USER_ID = 'hypeking'

// rolling buffers — module-level, evicted on tick, never trigger renders
const windowMessages: KickChatEvent[] = []
const windowAcks: AcknowledgementEvent[] = []
const seenUsers = new Set<string>()
const lastAckByUser = new Map<string, number>()

// KICKBot announcer — injected by the sim layer to avoid a store import cycle
let announcer: ((text: string) => void) | null = null
export function setRouletteAnnouncer(fn: ((text: string) => void) | null) {
  announcer = fn
}
/** the bot's own messages must not pollute the odds denominator */
export const BOT_USER_ID = 'kickbot'

export type RoulettePhase = 'collecting' | 'spinning' | 'presenting' | 'verifying'

export type SimChannelStats = { oddsLabel: string; badges: InteractionBadgeKey[]; blurb: string }

/** browse-grid scores for the other (fully simulated) channels */
export const SIM_CHANNEL_STATS: Record<string, SimChannelStats> = {
  HypeKing: { oddsLabel: 'live', badges: [], blurb: 'measured live below' },
  NovaStrikes: { oddsLabel: '1 in 9', badges: ['responsive'], blurb: '9% of chat answered · 4s median' },
  LootGoblin: { oddsLabel: '1 in 4', badges: ['responsive', 'reads_everything'], blurb: 'spread across chat · low Gini' },
  ClipFarmer: { oddsLabel: '1 in 31', badges: [], blurb: 'busy chat, thin odds' },
  PixelPunk: { oddsLabel: '1 in 6', badges: ['new_chatter_friendly'], blurb: '38% of reads go to first-timers' },
}

export type InteractionStore = {
  stats: ChannelInteractionStats
  /** reactive mirror of acked message ids, for chat-row ✓ marks */
  ackedIds: string[]
  /** most recent streamer-transcript line (tier-1 source), for the UI */
  lastTranscript: string
  transcriptEnabled: boolean
  transcriptSupported: boolean
  simAcksEnabled: boolean
  /** session receipt for the input-box user */
  sessionSent: number
  sessionAcked: number

  // roulette
  phase: RoulettePhase
  pool: RouletteEntry[]
  roundLengthSec: number
  roundEndsAt: number
  filteredCount: number
  drawn: RouletteEntry | null
  lastOutcome: RouletteOutcome | null

  ingestChat: (ev: Omit<KickChatEvent, 'first_message_in_channel'>) => void
  ackMessage: (message_id: string, tier: AckTier) => void
  ackUser: (user_id: string, tier: AckTier) => void
  onTranscript: (utterance: string) => void
  setTranscriptEnabled: (on: boolean) => void
  setTranscriptSupported: (on: boolean) => void
  setSimAcksEnabled: (on: boolean) => void
  submitDare: (user_id: string, username: string, color: string, text: string) => { ok: boolean; reason?: string }
  seedDares: (entries: RouletteEntry[]) => void
  yourOdds: (user_id: string) => number | null
  spinNow: () => void
  finishSpin: () => void
  acceptDare: () => void
  declineDare: () => void
  verifyDare: (done: boolean) => void
  setRoundLengthSec: (sec: number) => void
  tick: (now: number, viewers: number) => void
}

function emptyStats(): ChannelInteractionStats {
  return {
    totalMessages: 0,
    ackedMessages: 0,
    odds: 0,
    oddsN: null,
    medianLatencyMs: null,
    gini: 0,
    firstTimerShare: 0,
    msgsPerMin: 0,
    trackable: true,
    badges: [],
  }
}

export const useInteraction = create<InteractionStore>((set, get) => ({
  stats: emptyStats(),
  ackedIds: [],
  lastTranscript: '',
  transcriptEnabled: false,
  transcriptSupported: true,
  simAcksEnabled: true,
  sessionSent: 0,
  sessionAcked: 0,

  phase: 'collecting',
  pool: [],
  roundLengthSec: 150,
  roundEndsAt: Date.now() + 150_000,
  filteredCount: 0,
  drawn: null,
  lastOutcome: null,

  ingestChat: (ev) => {
    if (ev.sender.user_id === BOT_USER_ID) return
    const first = !seenUsers.has(ev.sender.user_id)
    seenUsers.add(ev.sender.user_id)
    windowMessages.push({ ...ev, first_message_in_channel: first })
    if (ev.sender.user_id === YOU_USER_ID) set((s) => ({ sessionSent: s.sessionSent + 1 }))
  },

  ackMessage: (message_id, tier) => {
    const msg = windowMessages.find((m) => m.message_id === message_id)
    if (!msg) return
    if (windowAcks.some((a) => a.message_id === message_id)) return
    const now = Date.now()
    windowAcks.push({
      message_id,
      user_id: msg.sender.user_id,
      message_ts: msg.created_at,
      ack_ts: now,
      latency_ms: Math.max(0, now - msg.created_at),
      tier,
      confidence: tier === 'inferred' ? 0.6 : 1,
    })
    lastAckByUser.set(msg.sender.user_id, now)
    set((s) => ({ ackedIds: [...s.ackedIds.slice(-199), message_id] }))
    if (msg.sender.user_id === YOU_USER_ID) set((s) => ({ sessionAcked: s.sessionAcked + 1 }))
  },

  // acknowledge a user's most recent unacked message in the 60s sender window
  ackUser: (user_id, tier) => {
    const now = Date.now()
    // debounce: a transcript can mention the same name across several results
    if (now - (lastAckByUser.get(user_id) ?? 0) < 20_000) return
    const acked = new Set(windowAcks.map((a) => a.message_id))
    const candidate = [...windowMessages]
      .reverse()
      .find((m) => m.sender.user_id === user_id && !acked.has(m.message_id) && now - m.created_at <= SENDER_MATCH_WINDOW_MS)
    if (candidate) get().ackMessage(candidate.message_id, tier)
  },

  onTranscript: (utterance) => {
    set({ lastTranscript: utterance })
    const now = Date.now()
    const senders = windowMessages
      .filter((m) => now - m.created_at <= SENDER_MATCH_WINDOW_MS)
      .map((m) => ({ user_id: m.sender.user_id, username: m.sender.username }))
    for (const user_id of matchUsernames(utterance, senders)) get().ackUser(user_id, 'explicit')
  },

  setTranscriptEnabled: (on) => set({ transcriptEnabled: on }),
  setTranscriptSupported: (on) => set({ transcriptSupported: on }),
  setSimAcksEnabled: (on) => set({ simAcksEnabled: on }),

  /** bulk-seed the pool (sim crowd) — no moderation spam, no KICKBot announcements */
  seedDares: (entries) =>
    set((s) => {
      let pool = s.pool
      for (const e of entries) pool = upsertEntry(pool, e)
      return { pool }
    }),

  submitDare: (user_id, username, color, text) => {
    const verdict = moderate(text)
    if (!verdict.ok) {
      set((s) => ({ filteredCount: s.filteredCount + 1 }))
      if (user_id === YOU_USER_ID) announcer?.(`@${username} that dare didn't pass moderation (${verdict.reason}).`)
      return verdict
    }
    announcer?.(`@${username} Your dare has been submitted! ✅`)
    set((s) => ({
      pool: upsertEntry(s.pool, {
        user_id,
        username,
        color,
        text: text.trim(),
        submitted_at: Date.now(),
        rounds_waited: 0,
      }),
    }))
    return verdict
  },

  yourOdds: (user_id) => entryOdds(get().pool, user_id),

  spinNow: () => {
    const s = get()
    if (s.phase !== 'collecting') return
    let pool = s.pool
    if (pool.length === 0) {
      // empty-pool fallback: the wheel always spins
      const acked = new Set(windowAcks.map((a) => a.message_id))
      pool = seedFromQuestions(
        windowMessages.map((m) => ({
          message_id: m.message_id,
          user_id: m.sender.user_id,
          username: m.sender.username,
          content: m.content,
          created_at: m.created_at,
        })),
        acked,
        Date.now(),
      )
      if (pool.length === 0) {
        set({ roundEndsAt: Date.now() + s.roundLengthSec * 1000 })
        return
      }
    }
    const winner = draw(pool, Math.random)
    announcer?.('The wheel is spinning…')
    set({ phase: 'spinning', pool, drawn: winner })
  },

  finishSpin: () => set((s) => (s.phase === 'spinning' ? { phase: 'presenting' } : s)),

  acceptDare: () => {
    const s = get()
    if (s.phase !== 'presenting') return
    if (s.drawn) announcer?.(`🎰 @${s.drawn.username} "${s.drawn.text}" — ACCEPTED ✅`)
    set({ phase: 'verifying' })
  },

  declineDare: () => {
    const s = get()
    if (s.phase !== 'presenting') return
    // declining is free: it still counts as engagement with the segment
    if (s.drawn && !s.drawn.seeded) get().ackUser(s.drawn.user_id, 'roulette')
    if (s.drawn) announcer?.(`🎰 @${s.drawn.username} "${s.drawn.text}" — declined (still counts as engagement)`)
    nextRound(set, get, 'declined')
  },

  verifyDare: (done) => {
    const s = get()
    if (s.phase !== 'verifying') return
    if (s.drawn && !s.drawn.seeded) get().ackUser(s.drawn.user_id, 'roulette')
    if (s.drawn) announcer?.(`🎰 @${s.drawn.username} "${s.drawn.text}" — ${done ? 'DONE ✅' : 'not done ❌'}`)
    nextRound(set, get, done ? 'accepted_done' : 'accepted_not_done')
  },

  setRoundLengthSec: (sec) =>
    set({ roundLengthSec: sec, roundEndsAt: Date.now() + sec * 1000 }),

  tick: (now, viewers) => {
    // evict the rolling window
    while (windowMessages.length && windowMessages[0].created_at < now - ACK_WINDOW_MS) windowMessages.shift()
    while (windowAcks.length && windowAcks[0].ack_ts < now - ACK_WINDOW_MS) windowAcks.shift()
    set({ stats: computeStats(windowMessages, windowAcks, { viewers }) })
    const s = get()
    if (s.phase === 'collecting' && now >= s.roundEndsAt) s.spinNow()
  },
}))

function nextRound(
  set: (partial: Partial<InteractionStore>) => void,
  get: () => InteractionStore,
  outcome: RouletteOutcome,
) {
  const s = get()
  set({
    phase: 'collecting',
    lastOutcome: outcome,
    drawn: null,
    filteredCount: 0,
    roundEndsAt: Date.now() + s.roundLengthSec * 1000,
    // losers accrue pity weight; the winner leaves the pool; seeded entries don't carry over
    pool: s.pool
      .filter((e) => e.user_id !== s.drawn?.user_id && !e.seeded)
      .map((e) => ({ ...e, rounds_waited: e.rounds_waited + 1 })),
  })
}

/** hook for the mock-events simulator: recent unacked sim messages to acknowledge */
export function pickSimAckCandidate(now: number, preferFirstTimer: boolean): string | null {
  const acked = new Set(windowAcks.map((a) => a.message_id))
  const fresh = windowMessages.filter(
    (m) => !acked.has(m.message_id) && m.sender.user_id !== YOU_USER_ID && now - m.created_at < 45_000,
  )
  if (!fresh.length) return null
  const firstTimers = fresh.filter((m) => m.first_message_in_channel)
  const pool = preferFirstTimer && firstTimers.length ? firstTimers : fresh
  return pool[Math.floor(Math.random() * pool.length)].message_id
}
