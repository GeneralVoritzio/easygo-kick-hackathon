import { useEffect, useRef, useState } from 'react';
import type { BattleSide } from '@shared/types';

export interface ScoreSnapshot {
  t: number;
  /** Percent share of total score, keyed by sideId. */
  percents: Record<string, number>;
}

const SAMPLE_INTERVAL_MS = 500;
const HISTORY_WINDOW_MS = 60_000;

function sideTotal(side: BattleSide): number {
  return side.streamers.reduce((sum, s) => sum + s.score, 0);
}

/** Samples each side's percent share of the total on a fixed interval and
 *  keeps a rolling window, so the overlay can look back "N ms ago" to render
 *  a momentum ghost marker or detect a rapid comeback. */
export function useScoreHistory(sides: BattleSide[] | undefined) {
  const sidesRef = useRef(sides);
  sidesRef.current = sides;
  const historyRef = useRef<ScoreSnapshot[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = sidesRef.current;
      if (current && current.length > 0) {
        const total = current.reduce((sum, side) => sum + sideTotal(side), 0) || 1;
        const percents: Record<string, number> = {};
        for (const side of current) percents[side.sideId] = (sideTotal(side) / total) * 100;

        const now = Date.now();
        historyRef.current = [...historyRef.current, { t: now, percents }].filter(
          (snap) => now - snap.t <= HISTORY_WINDOW_MS
        );
      }
      setTick((n) => n + 1);
    }, SAMPLE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  function getSnapshotAt(msAgo: number): ScoreSnapshot | null {
    const history = historyRef.current;
    if (history.length === 0) return null;

    const target = Date.now() - msAgo;
    let closest = history[0];
    let bestDiff = Math.abs(closest.t - target);
    for (const snap of history) {
      const diff = Math.abs(snap.t - target);
      if (diff < bestDiff) {
        closest = snap;
        bestDiff = diff;
      }
    }
    return closest;
  }

  /** True once we have a real sample old enough to answer `getSnapshotAt(msAgo)`. */
  function hasHistoryFor(msAgo: number): boolean {
    const history = historyRef.current;
    return history.length > 0 && Date.now() - history[0].t >= msAgo * 0.8;
  }

  return { getSnapshotAt, hasHistoryFor };
}
