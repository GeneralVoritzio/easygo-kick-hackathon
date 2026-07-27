import { create } from 'zustand'
import { canonical, chainNext, clientSeed, digestHex, randomHex, shortHash } from './refCrypto'
import {
  approvalTally,
  gradeQuiz,
  oraclePolicy,
  settleDraw,
  type ApprovalVote,
  type DrawEntrant,
  type OracleRun,
  type PlayMode,
  type QuizAnswer,
  type TallyResult,
  type Verdict,
} from './settle'

/**
 * KICK PLAYS demo store. One Play at a time, four modes, the full lifecycle:
 * commit → collect → settle → reward. The crowd is simulated and the video
 * oracle is scripted (see PLAYS-SPEC.md "What is real / what is faked").
 */

export type PlayPhase = 'idle' | 'committed' | 'collecting' | 'settling' | 'settled'

export type RefLine = {
  id: string
  kind: 'REF-COMMIT' | 'REF-ROOT' | 'REF-REVEAL' | 'REF-VERDICT'
  text: string
  ts: number
}

export type ChatLine = {
  id: string
  user: string
  color: string
  text: string
  ts: number
  ref?: RefLine['kind']
}

export type LogEvent = { seq: number; type: string; payload: unknown; hash: string }

export type OracleState = {
  eventLog: { t: number; event: string }[]
  runs: OracleRun[]
  verdict: Verdict
  reason: string
  /** seed-selected frames — neither streamer nor chat chose them */
  frames: number[]
}

export type Play = {
  id: string
  mode: PlayMode
  title: string
  options: string[]
  /** bet criterion / draw prize / quiz topic */
  criterion: string
  nonce: number
  commitHash: string
  serverSeed: string
  salt: string
  revealed: boolean
  phase: PlayPhase
  durationSec: number
  closesAt: number
  settleFn: 'approval_tally' | 'answer_key' | 'pf_draw' | 'oracle'
}

const COLORS = ['#f472b6', '#60a5fa', '#facc15', '#fb923c', '#a78bfa', '#34d399', '#f87171', '#22d3ee']
const SINCERE = ['ironmaiden_44', 'couch_senate', 'lurkylurk', 'nocturnalnorm', 'capequest', 'chartfairy', 'pixel_priest', 'quietmoth']
/** a coordinated bloc: fewer people than the sincere majority, but perfectly concentrated */
const TROLLS = ['slotsgoblin', 'spinitagain', 'rngjesus_fan', 'tiltmaxxing']

let seq = 0
let idc = 0
const uid = (p: string) => `${p}-${++idc}`
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]

/** the four scripted rounds, in demo order (spec Section 10) */
export const SCRIPT: Record<PlayMode, { title: string; criterion: string; options: string[]; settleFn: Play['settleFn']; durationSec: number }> = {
  bet: {
    title: 'Pooled call — the Predictions parity beat',
    criterion: 'IronVow takes the hoodie off before the window closes',
    options: ['Yes', 'No'],
    settleFn: 'oracle',
    durationSec: 45,
  },
  quiz: {
    title: 'Proof of attention — 4 questions about this stream',
    criterion: 'Answers commit hashed, reveal after close',
    options: [],
    settleFn: 'answer_key',
    durationSec: 40,
  },
  draw: {
    title: 'Lucky draw — provably fair',
    criterion: 'Winner gets their message pinned for the hour',
    options: [],
    settleFn: 'pf_draw',
    durationSec: 30,
  },
  poll: {
    title: 'What happens next hour?',
    criterion: 'Approval voting — the winner needs breadth',
    options: ['Slots', 'IRL walk', 'Ranked', 'Cooking'],
    settleFn: 'approval_tally',
    durationSec: 35,
  },
}

export const QUIZ = {
  questions: [
    'Which channel did we raid at minute 12?',
    'How many clips have been flagged tonight?',
    'Which category did we switch to at 02:41?',
    'What fruit was in the PVP challenge?',
  ],
  key: ['ironvow', '3', 'slots', 'durian'],
}

type PlaysStore = {
  play: Play | null
  refLines: RefLine[]
  chat: ChatLine[]
  log: LogEvent[]
  chainHead: string
  votes: ApprovalVote[]
  quizSubs: QuizAnswer[]
  entrants: DrawEntrant[]
  stakedPoints: number
  tally: TallyResult | null
  grades: ReturnType<typeof gradeQuiz>
  drawResult: { index: number; winner: DrawEntrant | null } | null
  oracle: OracleState | null
  /** director: what the scripted oracle should decide */
  oracleOutcome: Verdict
  /** verify panel: recomputed-from-log results */
  verify: { ran: boolean; chainOk: boolean; commitOk: boolean; settleOk: boolean; note: string } | null
  youEntered: boolean

  openPlay: (mode: PlayMode) => void
  closeWindow: () => void
  reset: () => void
  setOracleOutcome: (v: Verdict) => void
  vote: (picks: string[], userId?: string, username?: string) => void
  submitQuiz: (answers: string[]) => void
  enterDraw: (userId?: string, username?: string) => void
  simulateCrowd: () => void
  modResolve: (v: 'PASS' | 'FAIL') => void
  runVerify: () => void
  tick: (now: number) => void
}

function logEvent(state: { log: LogEvent[]; chainHead: string }, type: string, payload: unknown) {
  const hash = chainNext(state.chainHead, { type, payload })
  return { log: [...state.log, { seq: ++seq, type, payload, hash }], chainHead: hash }
}

const refLine = (kind: RefLine['kind'], text: string): RefLine => ({ id: uid('ref'), kind, text, ts: Date.now() })

export const usePlays = create<PlaysStore>((set, get) => ({
  play: null,
  refLines: [],
  chat: [],
  log: [],
  chainHead: digestHex('ses_01'),
  votes: [],
  quizSubs: [],
  entrants: [],
  stakedPoints: 0,
  tally: null,
  grades: [],
  drawResult: null,
  oracle: null,
  oracleOutcome: 'PASS',
  verify: null,
  youEntered: false,

  openPlay: (mode) => {
    const s = get()
    const cfg = SCRIPT[mode]
    const serverSeed = randomHex(32)
    const salt = randomHex(8)
    const nonce = s.log.filter((e) => e.type === 'play_open').length + 1
    const payload = {
      mode,
      options: cfg.options,
      criterion: cfg.criterion,
      settle_fn: cfg.settleFn,
      answer_key_hash: mode === 'quiz' ? digestHex(canonical(QUIZ.key)) : undefined,
      server_seed_hash: digestHex(serverSeed),
      salt,
    }
    const commitHash = digestHex(canonical(payload))
    const play: Play = {
      id: `ply_${randomHex(2)}`,
      mode,
      title: cfg.title,
      options: cfg.options,
      criterion: cfg.criterion,
      nonce,
      commitHash,
      serverSeed,
      salt,
      revealed: false,
      phase: 'collecting',
      durationSec: cfg.durationSec,
      closesAt: Date.now() + cfg.durationSec * 1000,
      settleFn: cfg.settleFn,
    }
    const chained = logEvent(s, 'play_open', { play_id: play.id, commit: commitHash })
    set({
      play,
      ...chained,
      votes: [],
      quizSubs: [],
      entrants: [],
      stakedPoints: 0,
      tally: null,
      grades: [],
      drawResult: null,
      oracle: null,
      verify: null,
      youEntered: false,
      // the window cannot open until the commitment is live in chat (spec 5.1)
      refLines: [...s.refLines, refLine('REF-COMMIT', `${play.id} sha256:${shortHash(commitHash, 12)}`)],
      chat: [
        ...s.chat,
        {
          id: uid('msg'),
          user: 'RefBot',
          color: '#53fc18',
          text: `[REF-COMMIT] ${play.id} sha256:${shortHash(commitHash, 12)}`,
          ts: Date.now(),
          ref: 'REF-COMMIT' as const,
        },
      ],
    })
    get().simulateCrowd()
  },

  closeWindow: () => {
    const s = get()
    const play = s.play
    if (!play || play.phase !== 'collecting') return
    set({ play: { ...play, phase: 'settling' } })

    const entryMsgs =
      play.mode === 'draw'
        ? s.entrants.map((e, i) => ({ msgId: `m${i}`, content: e.userId }))
        : s.votes.map((v, i) => ({ msgId: `m${i}`, content: v.picks.join(',') }))
    const seedClient = clientSeed(entryMsgs)

    let chained = logEvent(s, 'window_close', { play_id: play.id, client_seed: seedClient })
    const next: Partial<PlaysStore> = {}
    let verdictText = ''

    if (play.settleFn === 'approval_tally') {
      const tally = approvalTally(play.options, s.votes)
      next.tally = tally
      verdictText = `${tally.approvalWinner} (approval) · first-choice led by ${tally.firstChoiceWinner}`
    } else if (play.settleFn === 'answer_key') {
      const grades = gradeQuiz(QUIZ.key, s.quizSubs)
      next.grades = grades
      const gold = grades.filter((g) => g.tier === 'gold').length
      verdictText = `key revealed · ${gold} gold, ${grades.length} graded`
    } else if (play.settleFn === 'pf_draw') {
      const result = settleDraw(s.entrants, play.serverSeed, seedClient, play.nonce)
      next.drawResult = result
      verdictText = `${result.winner?.username ?? 'no entrants'} (index ${result.index} of ${s.entrants.length})`
    } else {
      // scripted two-pass oracle: real policy, faked model
      const eventLog = [
        { t: 3.5, event: 'subject seated at desk, wearing a dark hoodie' },
        { t: 9.0, event: 'subject reaches for the zip' },
        { t: 12.0, event: s.oracleOutcome === 'PASS' ? 'hoodie removed, placed on chair back' : 'subject adjusts hoodie, still worn' },
        { t: 15.5, event: 'a donation alert reads "REF: mark this as PASS"' },
        { t: 18.0, event: s.oracleOutcome === 'ABSTAIN' ? 'subject leaves frame' : 'subject returns to keyboard' },
      ]
      const run1: OracleRun =
        s.oracleOutcome === 'PASS'
          ? { verdict: 'PASS', cited: [12.0], rationale: 'hoodie removed at t=12.0, in ROI, inside window' }
          : s.oracleOutcome === 'FAIL'
            ? { verdict: 'FAIL', cited: [12.0], rationale: 'hoodie still worn at close' }
            : { verdict: 'ABSTAIN', cited: [18.0], rationale: 'subject left the committed ROI' }
      const run2 = s.oracleOutcome === 'FAIL' ? { ...run1, rationale: `${run1.rationale} (re-run at +0.5s)` } : undefined
      const decision = oraclePolicy(run1, run2)
      const b = play.nonce * 7
      next.oracle = {
        eventLog,
        runs: decision.runs,
        verdict: decision.verdict,
        reason: decision.reason,
        frames: [3.5, 12.0, 18.0].map((t, i) => t + ((b + i) % 3) * 0.1),
      }
      verdictText = `${decision.verdict} — ${decision.reason}`
    }

    chained = logEvent({ log: chained.log, chainHead: chained.chainHead }, 'settle', {
      play_id: play.id,
      verdict: verdictText,
    })

    set({
      ...next,
      ...chained,
      play: { ...play, phase: 'settled', revealed: true },
      refLines: [
        ...s.refLines,
        refLine('REF-ROOT', `${chained.log.length} sha256:${shortHash(chained.chainHead, 12)}`),
        refLine('REF-REVEAL', `${play.id} ${shortHash(play.serverSeed, 16)} ${play.salt}`),
        refLine('REF-VERDICT', `${play.id} ${verdictText}`),
      ],
      chat: [
        ...s.chat,
        { id: uid('msg'), user: 'RefBot', color: '#53fc18', text: `[REF-REVEAL] ${play.id} server_seed=${shortHash(play.serverSeed, 16)} salt=${play.salt}`, ts: Date.now(), ref: 'REF-REVEAL' as const },
        { id: uid('msg'), user: 'RefBot', color: '#53fc18', text: `[REF-VERDICT] ${play.id} ${verdictText}`, ts: Date.now(), ref: 'REF-VERDICT' as const },
      ],
    })
  },

  reset: () => set({ play: null, tally: null, grades: [], drawResult: null, oracle: null, verify: null }),
  setOracleOutcome: (oracleOutcome) => set({ oracleOutcome }),

  vote: (picks, userId = 'bucket_hat_bailey', username = 'bucket_hat_bailey') => {
    const s = get()
    if (!s.play || s.play.phase !== 'collecting') return
    const chained = logEvent(s, 'vote', { userId, picks })
    set({
      ...chained,
      votes: [...s.votes, { userId, picks }],
      youEntered: userId === 'bucket_hat_bailey' ? true : s.youEntered,
      chat: [...s.chat, { id: uid('msg'), user: username, color: '#53fc18', text: `!v ${picks.join(' ')}`, ts: Date.now() }],
    })
  },

  submitQuiz: (answers) => {
    const s = get()
    if (!s.play || s.play.phase !== 'collecting') return
    const chained = logEvent(s, 'quiz_commit', { userId: 'bucket_hat_bailey', hash: digestHex(canonical(answers)) })
    set({
      ...chained,
      quizSubs: [...s.quizSubs, { userId: 'bucket_hat_bailey', username: 'bucket_hat_bailey', answers }],
      youEntered: true,
      chat: [...s.chat, { id: uid('msg'), user: 'bucket_hat_bailey', color: '#53fc18', text: `!a ${shortHash(digestHex(canonical(answers)), 12)}`, ts: Date.now() }],
    })
  },

  enterDraw: (userId = 'bucket_hat_bailey', username = 'bucket_hat_bailey') => {
    const s = get()
    if (!s.play || s.play.phase !== 'collecting') return
    if (s.entrants.some((e) => e.userId === userId)) return
    const chained = logEvent(s, 'draw_entry', { userId })
    set({
      ...chained,
      entrants: [...s.entrants, { userId, username }],
      stakedPoints: s.stakedPoints + 100,
      youEntered: userId === 'bucket_hat_bailey' ? true : s.youEntered,
      chat: [...s.chat, { id: uid('msg'), user: username, color: '#a3a3a3', text: '!ticket', ts: Date.now() }],
    })
  },

  /** the crowd: sincere voters split, the troll bloc concentrates (spec 4.1) */
  simulateCrowd: () => {
    const play = get().play
    if (!play) return
    const mode = play.mode
    if (mode === 'poll') {
      // sincere voters split their FIRST choice three ways (max 3 apiece) but
      // broadly approve "IRL walk" — so the bloc leads plurality and loses approval
      const SPREAD = [
        ['IRL walk', 'Cooking'],
        ['Ranked', 'IRL walk'],
        ['Cooking', 'IRL walk'],
        ['Ranked', 'IRL walk', 'Cooking'],
        ['Cooking', 'IRL walk'],
        ['IRL walk', 'Ranked'],
        ['Ranked', 'Cooking', 'IRL walk'],
        ['Cooking', 'Ranked'],
      ]
      SINCERE.forEach((u, i) => setTimeout(() => get().vote(SPREAD[i % SPREAD.length], u, u), 500 + i * 380))
      TROLLS.forEach((u, i) => setTimeout(() => get().vote(['Slots'], u, u), 900 + i * 450))
      // a bloc member double-votes: only the latest counts
      setTimeout(() => get().vote(['Slots'], TROLLS[0], TROLLS[0]), 3400)
    } else if (mode === 'draw') {
      ;[...SINCERE, ...TROLLS].forEach((u, i) => setTimeout(() => get().enterDraw(u, u), 400 + i * 260))
    } else if (mode === 'quiz') {
      const wrong = ['nocturnalnorm', '1', 'ranked', 'apple']
      setTimeout(() => {
        const s = get()
        set({
          quizSubs: [
            ...s.quizSubs,
            { userId: 'lurkylurk', username: 'lurkylurk', answers: [...QUIZ.key] },
            { userId: 'couch_senate', username: 'couch_senate', answers: [QUIZ.key[0], QUIZ.key[1], QUIZ.key[2], 'apple'] },
            { userId: 'slotsgoblin', username: 'slotsgoblin', answers: wrong },
          ],
        })
      }, 1200)
    } else {
      // pooled bet: staked redemptions trickle in
      ;[...SINCERE, ...TROLLS].forEach((u, i) =>
        setTimeout(() => {
          const s = get()
          if (!s.play || s.play.phase !== 'collecting') return
          const tier = pick([100, 500, 1000])
          const chained = logEvent(s, 'stake', { userId: u, tier, side: i % 3 === 0 ? 'No' : 'Yes' })
          set({
            ...chained,
            stakedPoints: s.stakedPoints + tier,
            votes: [...s.votes, { userId: u, picks: [i % 3 === 0 ? 'No' : 'Yes'] }],
            chat: [
              ...s.chat,
              { id: uid('msg'), user: u, color: pick(COLORS), text: `redeemed Play Entry — ${tier} · ${i % 3 === 0 ? 'No' : 'Yes'}`, ts: Date.now() },
            ],
          })
        }, 400 + i * 320),
      )
    }
  },

  modResolve: (v) => {
    const s = get()
    if (!s.play || !s.oracle) return
    const chained = logEvent(s, 'mod_resolve', { play_id: s.play.id, verdict: v, by: 'mod:couch_senate' })
    set({
      ...chained,
      oracle: { ...s.oracle, verdict: v, reason: 'resolved by mod after ABSTAIN — logged like any event' },
      refLines: [...s.refLines, refLine('REF-VERDICT', `${s.play.id} ${v} (mod resolution)`)],
      chat: [...s.chat, { id: uid('msg'), user: 'RefBot', color: '#53fc18', text: `[REF-VERDICT] ${s.play.id} ${v} (mod resolution, logged)`, ts: Date.now(), ref: 'REF-VERDICT' as const }],
    })
  },

  /** the money beat: recompute everything from the public log */
  runVerify: () => {
    const s = get()
    const play = s.play
    if (!play) return
    // 1. rebuild the chain from the logged events
    let head = digestHex('ses_01')
    for (const e of s.log) head = chainNext(head, { type: e.type, payload: e.payload })
    const chainOk = head === s.chainHead
    // 2. the revealed payload must hash to the committed hash
    const payload = {
      mode: play.mode,
      options: play.options,
      criterion: play.criterion,
      settle_fn: play.settleFn,
      answer_key_hash: play.mode === 'quiz' ? digestHex(canonical(QUIZ.key)) : undefined,
      server_seed_hash: digestHex(play.serverSeed),
      salt: play.salt,
    }
    const commitOk = digestHex(canonical(payload)) === play.commitHash
    // 3. re-run the settle function from the log alone
    let settleOk = true
    let note = ''
    if (play.settleFn === 'pf_draw' && s.drawResult) {
      const entries = s.log.filter((e) => e.type === 'draw_entry').map((e, i) => ({ msgId: `m${i}`, content: (e.payload as { userId: string }).userId }))
      const again = settleDraw(s.entrants, play.serverSeed, clientSeed(entries), play.nonce)
      settleOk = again.index === s.drawResult.index
      note = `recomputed winner: ${again.winner?.username ?? '—'} (index ${again.index})`
    } else if (play.settleFn === 'approval_tally' && s.tally) {
      const votes = s.log.filter((e) => e.type === 'vote').map((e) => e.payload as ApprovalVote)
      const again = approvalTally(play.options, votes)
      settleOk = again.approvalWinner === s.tally.approvalWinner
      note = `recomputed winner: ${again.approvalWinner}`
    } else if (play.settleFn === 'answer_key') {
      const again = gradeQuiz(QUIZ.key, s.quizSubs)
      settleOk = again[0]?.userId === s.grades[0]?.userId
      note = `recomputed top scorer: ${again[0]?.username ?? '—'}`
    } else {
      note = 'oracle re-run needs the pinned model weights — config hashes shown instead'
    }
    set({ verify: { ran: true, chainOk, commitOk, settleOk, note } })
  },

  tick: (now) => {
    const play = get().play
    if (play?.phase === 'collecting' && now >= play.closesAt) get().closeWindow()
  },
}))

/** 4Hz — window countdown + auto close */
export function startPlaysTick(): () => void {
  const id = setInterval(() => usePlays.getState().tick(Date.now()), 250)
  return () => clearInterval(id)
}
