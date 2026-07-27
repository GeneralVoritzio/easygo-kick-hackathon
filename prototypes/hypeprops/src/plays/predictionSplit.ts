import type { Play } from './playsStore'
import type { ApprovalVote } from './settle'

export type TwoOptionSplit = {
  optionAName: string
  optionBName: string
  votesA: number
  votesB: number
  hasVotes: boolean
  pctA: number
  pctB: number
  poolA: number
  poolB: number
}

/**
 * The engine tracks vote picks but never a per-user stake amount, so points per
 * option are estimated by splitting the play's total staked points in proportion
 * to each option's backer count. Used by ManagePlayModal and the pinned prediction
 * card so both read the same split off the same live data.
 */
export function getTwoOptionSplit(play: Play, votes: ApprovalVote[], stakedPoints: number): TwoOptionSplit {
  const rawA = play.options[0]
  const rawB = play.options[1]
  const votesA = rawA ? votes.filter((v) => v.picks.includes(rawA)).length : 0
  const votesB = rawB ? votes.filter((v) => v.picks.includes(rawB)).length : 0
  const totalVotes = votesA + votesB
  const hasVotes = totalVotes > 0
  const pctA = hasVotes ? Math.round((votesA / totalVotes) * 100) : 50
  const pctB = 100 - pctA
  const poolA = hasVotes ? Math.round(stakedPoints * (votesA / totalVotes)) : 0
  const poolB = hasVotes ? stakedPoints - poolA : 0

  return {
    optionAName: rawA ?? 'Option 1',
    optionBName: rawB ?? 'Option 2',
    votesA,
    votesB,
    hasVotes,
    pctA,
    pctB,
    poolA,
    poolB,
  }
}

export function formatRatio(totalPool: number, optionPool: number): string {
  if (optionPool <= 0) return '1:0.0'
  return `1:${(totalPool / optionPool).toFixed(1)}`
}

/** stakedPoints stays 0 for poll and quiz in this engine; fall back to a 100 pt per-participant estimate */
export function derivedTotalPoints(stakedPoints: number, participantCount: number): number {
  return stakedPoints > 0 ? stakedPoints : participantCount * 100
}

export function estimatePayout(pool: number, winnerPool: number, stake = 100): number {
  if (winnerPool <= 0) return stake
  return Math.round(stake * (pool / winnerPool))
}
