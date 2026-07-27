/**
 * Ref — the pluggable settle functions. One engine, four modes:
 * approval tally (poll), answer key (quiz), provably-fair draw, oracle (bet).
 */

import { drawIndex } from './refCrypto'

export type PlayMode = 'poll' | 'quiz' | 'draw' | 'bet'
export type Verdict = 'PASS' | 'FAIL' | 'ABSTAIN'

export type ApprovalVote = { userId: string; picks: string[] }

export type TallyResult = {
  /** approval: every pick counts — winner needs breadth */
  approval: Record<string, number>
  /** plurality: only the first pick counts — what a troll bloc games */
  firstChoice: Record<string, number>
  approvalWinner: string | null
  firstChoiceWinner: string | null
  /** true when the two methods disagree: the demo beat */
  diverges: boolean
  voters: number
}

const topOf = (counts: Record<string, number>): string | null => {
  let best: string | null = null
  for (const [option, n] of Object.entries(counts)) {
    if (best === null || n > counts[best]) best = option
  }
  return best
}

/**
 * Approval voting, not plurality. A coordinated bloc can lead first-choice
 * while the sincere majority splits; approval makes the winner clear the
 * breadth test instead.
 */
export function approvalTally(options: string[], votes: ApprovalVote[]): TallyResult {
  const approval: Record<string, number> = {}
  const firstChoice: Record<string, number> = {}
  for (const option of options) {
    approval[option] = 0
    firstChoice[option] = 0
  }
  // latest vote per user wins
  const latest = new Map<string, string[]>()
  for (const v of votes) latest.set(v.userId, v.picks)

  for (const picks of latest.values()) {
    const valid = picks.filter((p) => options.includes(p))
    if (!valid.length) continue
    for (const p of valid) approval[p] += 1
    firstChoice[valid[0]] += 1
  }
  const approvalWinner = topOf(approval)
  const firstChoiceWinner = topOf(firstChoice)
  return {
    approval,
    firstChoice,
    approvalWinner,
    firstChoiceWinner,
    diverges: approvalWinner !== firstChoiceWinner,
    voters: latest.size,
  }
}

export type QuizAnswer = { userId: string; username: string; answers: string[] }
export type QuizGrade = { userId: string; username: string; correct: number; total: number; tier: 'gold' | 'silver' | 'flair' }

/** answer key settlement: tiered, participation always earns something */
export function gradeQuiz(key: string[], submissions: QuizAnswer[]): QuizGrade[] {
  const norm = (s: string) => s.trim().toLowerCase()
  return submissions
    .map((s) => {
      const correct = key.reduce((n, k, i) => n + (norm(s.answers[i] ?? '') === norm(k) ? 1 : 0), 0)
      const ratio = key.length ? correct / key.length : 0
      const tier: QuizGrade['tier'] = ratio === 1 ? 'gold' : ratio >= 0.7 ? 'silver' : 'flair'
      return { userId: s.userId, username: s.username, correct, total: key.length, tier }
    })
    .sort((a, b) => b.correct - a.correct)
}

export type DrawEntrant = { userId: string; username: string }

/** provably-fair draw: winner is a pure function of the revealed seeds */
export function settleDraw(
  entrants: DrawEntrant[],
  serverSeed: string,
  seedClient: string,
  nonce: number,
): { index: number; winner: DrawEntrant | null } {
  const index = drawIndex(serverSeed, seedClient, nonce, entrants.length)
  return { index, winner: entrants[index] ?? null }
}

export type OracleRun = { verdict: Verdict; cited: number[]; rationale: string }

/**
 * Asymmetric policy — presumption of compliance:
 * a single run may PASS, but FAIL needs an agreeing re-run at the committed
 * alternate offset. Low confidence can never produce FAIL.
 */
export function oraclePolicy(run1: OracleRun, run2?: OracleRun): { verdict: Verdict; reason: string; runs: OracleRun[] } {
  const runs = run2 ? [run1, run2] : [run1]
  if (run1.verdict === 'PASS') return { verdict: 'PASS', reason: 'single run may PASS', runs }
  if (run1.verdict === 'ABSTAIN') return { verdict: 'ABSTAIN', reason: 'insufficient evidence — routing to mods', runs }
  if (!run2) return { verdict: 'ABSTAIN', reason: 'FAIL requires a re-run; none supplied', runs }
  if (run2.verdict === 'FAIL') return { verdict: 'FAIL', reason: 'both runs agree FAIL', runs }
  return { verdict: 'ABSTAIN', reason: 'runs disagree — routing to mods', runs }
}

export const REWARD_TIERS = [100, 500, 1000] as const
