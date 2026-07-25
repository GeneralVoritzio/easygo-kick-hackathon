import { useEffect, useRef, useState } from 'react';
import type { BattleSide, BattleState } from '@shared/types';
import type { useScoreHistory } from './useScoreHistory';

const CLOSE_THRESHOLD = 10;
const BLOWOUT_THRESHOLD = 50;
const COMEBACK_LOOKBACK_MS = 15_000;
const COMEBACK_CLOSED_THRESHOLD = 20;
const COMEBACK_COOLDOWN_MS = 12_000;

export interface BattleFlags {
  order: string[];
  percents: Record<string, number>;
  leaderId: string | null;
  gapPercent: number;
  isClose: boolean;
  isBlowout: boolean;
  /** Pulse animation-duration in seconds; faster as the gap narrows further. */
  glowDurationSec: number;
  /** Bumps whenever a rapid comeback is detected — key a remount off it to replay a one-shot animation. */
  comebackPulseKey: number;
}

function sideTotal(side: BattleSide): number {
  return side.streamers.reduce((sum, s) => sum + s.score, 0);
}

export function useBattleFlags(
  battle: BattleState | null,
  history: Pick<ReturnType<typeof useScoreHistory>, 'getSnapshotAt' | 'hasHistoryFor'>
): BattleFlags {
  const [comebackPulseKey, setComebackPulseKey] = useState(0);
  const lastTriggeredAtRef = useRef(0);

  const sides = battle?.sides ?? [];
  const order = sides.map((s) => s.sideId);
  const total = sides.reduce((sum, s) => sum + sideTotal(s), 0) || 1;
  const percents: Record<string, number> = {};
  for (const side of sides) percents[side.sideId] = (sideTotal(side) / total) * 100;

  const sorted = [...sides].sort((a, b) => sideTotal(b) - sideTotal(a));
  const leader = sorted[0] ?? null;
  const runnerUp = sorted[1] ?? null;
  const gapPercent = leader ? percents[leader.sideId] - (runnerUp ? percents[runnerUp.sideId] : 0) : 0;

  const isClose = leader !== null && runnerUp !== null && gapPercent < CLOSE_THRESHOLD;
  const isBlowout = gapPercent > BLOWOUT_THRESHOLD;
  const glowDurationSec = 0.6 + (Math.min(gapPercent, CLOSE_THRESHOLD) / CLOSE_THRESHOLD) * (2.2 - 0.6);

  useEffect(() => {
    if (!leader || !runnerUp) return;
    if (!history.hasHistoryFor(COMEBACK_LOOKBACK_MS)) return;

    const past = history.getSnapshotAt(COMEBACK_LOOKBACK_MS);
    if (!past) return;

    const pastLeaderPercent = past.percents[leader.sideId] ?? percents[leader.sideId];
    const pastRunnerUpPercent = past.percents[runnerUp.sideId] ?? percents[runnerUp.sideId];
    const pastGap = pastLeaderPercent - pastRunnerUpPercent;
    const closedAmount = pastGap - gapPercent;

    const now = Date.now();
    if (closedAmount > COMEBACK_CLOSED_THRESHOLD && now - lastTriggeredAtRef.current > COMEBACK_COOLDOWN_MS) {
      lastTriggeredAtRef.current = now;
      setComebackPulseKey((k) => k + 1);
    }
    // Re-checked on every gap change, which is as often as the battle state ticks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gapPercent, leader?.sideId, runnerUp?.sideId]);

  return {
    order,
    percents,
    leaderId: leader?.sideId ?? null,
    gapPercent,
    isClose,
    isBlowout,
    glowDurationSec,
    comebackPulseKey,
  };
}
