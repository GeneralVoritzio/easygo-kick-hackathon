import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Expedition, StreamCard } from '../types';
import { createExpeditions, STOP_DURATION_SECONDS } from '../mock/expeditions';

/** How long the "Departing to X" transit view holds before the new stop's
 *  video actually loads — the brief's "don't instantly teleport." */
const TRANSITION_MS = 2600;
const TICK_MS = 1000;

interface ExpeditionContextValue {
  expeditions: Expedition[];
  /** Which expedition "you" are currently riding, if any. */
  riderExpeditionId: string | null;
  join: (id: string) => void;
  hopOff: () => void;
  currentStop: (expedition: Expedition) => StreamCard;
}

const ExpeditionContext = createContext<ExpeditionContextValue | null>(null);

/** Every expedition on the platform ticks forward on its own clock whether
 *  or not anyone in particular is riding it — the same reason a real raid
 *  is already moving before a given viewer joins it. `join`/`hopOff` only
 *  track which one "you" are currently attached to; they never pause or
 *  reset the clock for anyone else. Sits above the router, like
 *  `PinnedStreamsContext`, so the idle nudge (Home), the lobby tab and the
 *  ride itself all read the same live state. */
export function ExpeditionProvider({ catalog, children }: { catalog: StreamCard[]; children: ReactNode }) {
  const [expeditions, setExpeditions] = useState<Expedition[]>(() => createExpeditions(catalog));
  const [riderExpeditionId, setRiderExpeditionId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setExpeditions((prev) =>
        prev.map((exp) => {
          if (exp.transitionUntil !== null && Date.now() < exp.transitionUntil) return exp;

          if (exp.secondsRemaining > 1) {
            return { ...exp, secondsRemaining: exp.secondsRemaining - 1, transitionUntil: null };
          }

          if (exp.status === 'boarding') {
            return {
              ...exp,
              status: 'in-progress',
              stopIndex: 0,
              secondsRemaining: STOP_DURATION_SECONDS,
              transitionUntil: Date.now() + TRANSITION_MS,
            };
          }

          return {
            ...exp,
            stopIndex: (exp.stopIndex + 1) % exp.stops.length,
            secondsRemaining: STOP_DURATION_SECONDS,
            transitionUntil: Date.now() + TRANSITION_MS,
          };
        })
      );
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  const value = useMemo<ExpeditionContextValue>(
    () => ({
      expeditions,
      riderExpeditionId,
      join: (id) => setRiderExpeditionId(id),
      hopOff: () => setRiderExpeditionId(null),
      currentStop: (expedition) => expedition.stops[expedition.stopIndex],
    }),
    [expeditions, riderExpeditionId]
  );

  return <ExpeditionContext.Provider value={value}>{children}</ExpeditionContext.Provider>;
}

export function useExpeditions(): ExpeditionContextValue {
  const ctx = useContext(ExpeditionContext);
  if (!ctx) throw new Error('useExpeditions must be used within ExpeditionProvider');
  return ctx;
}
