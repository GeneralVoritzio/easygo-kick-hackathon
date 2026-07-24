/**
 * Interaction Engine — layer 1 core (pure, unit-tested).
 * Measures how reliably a streamer acknowledges chat and turns it into
 * "response odds": the chance a message sent right now gets acknowledged.
 */

export type AckTier = 'explicit' | 'inferred' | 'roulette'

export type AcknowledgementEvent = {
  message_id: string
  user_id: string
  message_ts: number
  ack_ts: number
  latency_ms: number
  tier: AckTier
  confidence: number // 1.0 for explicit and roulette
}

/** ingest boundary — shaped like Kick's chat.message.sent webhook payload */
export type KickChatEvent = {
  message_id: string
  sender: {
    user_id: string
    username: string
    identity: { badges: { type: string }[] }
  }
  content: string
  created_at: number
  /** clone-only convenience: true when this sender has no prior message in the channel */
  first_message_in_channel?: boolean
}

export type InteractionBadgeKey = 'responsive' | 'reads_everything' | 'new_chatter_friendly'

export const INTERACTION_BADGES: Record<InteractionBadgeKey, { label: string; icon: string; blurb: string }> = {
  responsive: { label: 'Responsive', icon: '💬', blurb: 'answers chat at above-baseline odds' },
  reads_everything: { label: 'Reads everything', icon: '👀', blurb: 'high odds, spread across the room' },
  new_chatter_friendly: { label: 'New-chatter friendly', icon: '🌱', blurb: 'first messages get seen here' },
}

export type ChannelInteractionStats = {
  totalMessages: number
  ackedMessages: number
  /** acked / total over the rolling window; NaN-free (0 when no messages) */
  odds: number
  /** "1 in N" denominator, null when odds are 0 or window too thin */
  oddsN: number | null
  medianLatencyMs: number | null
  /** Gini over acks per unique acked user: 0 = spread evenly, 1 = one person absorbs all */
  gini: number
  /** share of acks going to users with no prior message in this channel */
  firstTimerShare: number
  /** messages/min over the window — the "queue depth" signal */
  msgsPerMin: number
  /** false when chat is too fast to track — show no badge, with this reason */
  trackable: boolean
  badges: InteractionBadgeKey[]
}

export const ACK_WINDOW_MS = 10 * 60 * 1000
export const SENDER_MATCH_WINDOW_MS = 60 * 1000
/** beyond this the streamer can't plausibly track chat — show "no badge + reason" */
export const TRACKABLE_MAX_MSGS_PER_MIN = 90
/** minimum window volume before odds mean anything */
export const MIN_SAMPLE = 8

const median = (xs: number[]): number | null => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Gini coefficient over per-user ack counts (0 when ≤1 user) */
export function gini(counts: number[]): number {
  const n = counts.length
  if (n <= 1) return 0
  const total = counts.reduce((a, b) => a + b, 0)
  if (total === 0) return 0
  const sorted = [...counts].sort((a, b) => a - b)
  let cum = 0
  let weighted = 0
  for (let i = 0; i < n; i++) {
    cum += sorted[i]
    weighted += cum
  }
  // standard formula: G = (n + 1 - 2 * Σ cum_i / total) / n
  return Math.max(0, (n + 1 - (2 * weighted) / total) / n)
}

/**
 * Baseline odds a "responsive" streamer should beat, adjusted for room size:
 * a 10k-viewer chat can't answer 1 in 4. Tuned against the simulator.
 */
export function baselineOdds(viewers: number): number {
  if (viewers < 100) return 0.2
  if (viewers < 1000) return 0.12
  if (viewers < 5000) return 0.06
  return 0.03
}

export function computeStats(
  windowMessages: KickChatEvent[],
  windowAcks: AcknowledgementEvent[],
  opts: { viewers: number; windowMs?: number },
): ChannelInteractionStats {
  const windowMs = opts.windowMs ?? ACK_WINDOW_MS
  const totalMessages = windowMessages.length
  const ackedIds = new Set(windowAcks.map((a) => a.message_id))
  const ackedMessages = windowMessages.filter((m) => ackedIds.has(m.message_id)).length
  const odds = totalMessages > 0 ? ackedMessages / totalMessages : 0
  const msgsPerMin = (totalMessages / (windowMs / 1000)) * 60
  const trackable = msgsPerMin <= TRACKABLE_MAX_MSGS_PER_MIN

  const perUser = new Map<string, number>()
  for (const a of windowAcks) perUser.set(a.user_id, (perUser.get(a.user_id) ?? 0) + 1)

  const firstTimerAcks = windowAcks.filter((a) => {
    const msg = windowMessages.find((m) => m.message_id === a.message_id)
    return msg?.first_message_in_channel
  }).length

  const stats: ChannelInteractionStats = {
    totalMessages,
    ackedMessages,
    odds,
    oddsN: odds > 0 && totalMessages >= MIN_SAMPLE ? Math.max(1, Math.round(1 / odds)) : null,
    medianLatencyMs: median(windowAcks.map((a) => a.latency_ms)),
    gini: gini([...perUser.values()]),
    firstTimerShare: windowAcks.length ? firstTimerAcks / windowAcks.length : 0,
    msgsPerMin,
    trackable,
    badges: [],
  }
  stats.badges = badgesFor(stats, opts.viewers)
  return stats
}

/** positive only — absence says enough */
export function badgesFor(s: ChannelInteractionStats, viewers: number): InteractionBadgeKey[] {
  if (!s.trackable || s.totalMessages < MIN_SAMPLE) return []
  const out: InteractionBadgeKey[] = []
  const base = baselineOdds(viewers)
  if (s.odds >= base) out.push('responsive')
  if (s.odds >= base && s.gini <= 0.45 && s.ackedMessages >= 5) out.push('reads_everything')
  if (s.firstTimerShare >= 0.25 && s.ackedMessages >= 4) out.push('new_chatter_friendly')
  return out
}

/** always "1 in N" — odds resist inflation, percentages invite it */
export function formatOdds(s: ChannelInteractionStats): string {
  if (!s.trackable) return 'chat too fast to track'
  if (s.totalMessages < MIN_SAMPLE) return 'warming up…'
  if (s.oddsN === null) return 'no reads yet'
  return `1 in ${s.oddsN}`
}

export type TimingHint = 'lull' | 'normal' | 'busy'

/** timing agency: tell the viewer WHEN to type */
export function timingHint(msgsPerMin: number): TimingHint {
  if (msgsPerMin <= 12) return 'lull'
  if (msgsPerMin >= 40) return 'busy'
  return 'normal'
}

export const TIMING_COPY: Record<TimingHint, string> = {
  lull: 'lull open — good time to type',
  normal: 'steady chat',
  busy: 'chat is flying — odds are thin',
}

/**
 * Tier-1 matching: does the streamer's transcribed utterance verbatim-contain
 * a username that spoke in the rolling 60s window? Deterministic, no model.
 */
export function matchUsernames(utterance: string, recentSenders: { user_id: string; username: string }[]): string[] {
  const flat = utterance.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!flat) return []
  const hits: string[] = []
  for (const s of recentSenders) {
    const uname = s.username.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (uname.length >= 4 && flat.includes(uname)) hits.push(s.user_id)
  }
  return [...new Set(hits)]
}
