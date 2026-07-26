import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { BossKind, BossResult, KickBoss, StreamCard } from '../types';
import { PASSIVE_DAMAGE_MAX, PASSIVE_DAMAGE_MIN, BOOST_DURATION_MS, createBossEvent, randomReward } from '../mock/kickBoss';
import { useSettings } from './SettingsContext';

const TICK_MS = 1000;
/** How often a new boss/monster can appear, while none is active. Short
 *  enough that a demo session actually sees the whole loop; the real
 *  product number would be much longer. */
const SPAWN_DELAY_MIN_MS = 40_000;
const SPAWN_DELAY_MAX_MS = 75_000;
/** How long a resolved (defeated/escaped) event stays visible — the glow,
 *  the panel, the announcement — before the world clears it and the next
 *  spawn timer starts. */
const RESULT_DISPLAY_MS = 8_000;

interface KickBossContextValue {
  activeBoss: KickBoss | null;
  lastResult: BossResult | null;
  /** Deals damage to the active boss, but only if it's actually on
   *  `streamerId` — callers don't need to guard this themselves. */
  engage: (streamerId: string, damage: number) => void;
  dismissResult: () => void;
  /** Call whenever a viewer starts deliberately watching a single stream
   *  (not an Expedition's auto-rotating stops). If they just came from a
   *  different stream and this one has an active fight, the one they left
   *  gets a compensation boost — see `isBoosted`. */
  reportWatching: (streamerId: string) => void;
  isBoosted: (streamerId: string) => boolean;
}

const KickBossContext = createContext<KickBossContextValue | null>(null);

function randomSpawnDelay(): number {
  return SPAWN_DELAY_MIN_MS + Math.random() * (SPAWN_DELAY_MAX_MS - SPAWN_DELAY_MIN_MS);
}

/** Kick Boss / Kick Monster: a limited-time world event that lands on one
 *  streamer's channel and everyone can help fight, from wherever they are
 *  on the site — see `KickBossAnnouncement`. Sits above the router, like
 *  `ExpeditionProvider`, so the announcement and the reward toast can
 *  render globally while the fight itself only shows on the boss's own
 *  streamer page.
 *
 *  All state transitions happen directly in the interval callback or in
 *  `engage`, never inside a `setState` updater function — a updater that
 *  calls another `setState` as a side effect gets invoked twice by
 *  StrictMode (React's own check for exactly this impurity), which
 *  duplicated a chat line the first time this bit us in `ExpeditionPage`. */
export function KickBossProvider({ catalog, children }: { catalog: StreamCard[]; children: ReactNode }) {
  const { isStreamerOptedOutOfBoss } = useSettings();
  const [activeBoss, setActiveBossState] = useState<KickBoss | null>(null);
  const [lastResult, setLastResult] = useState<BossResult | null>(null);
  const [boosts, setBoosts] = useState<Record<string, number>>({});
  const bossRef = useRef<KickBoss | null>(null);
  const participatedRef = useRef(false);
  const nextSpawnAtRef = useRef(Date.now() + randomSpawnDelay());
  const lastWatchedRef = useRef<string | null>(null);

  const setBoss = (boss: KickBoss | null) => {
    bossRef.current = boss;
    setActiveBossState(boss);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      const current = bossRef.current;

      if (!current) {
        if (now >= nextSpawnAtRef.current) {
          nextSpawnAtRef.current = now + randomSpawnDelay();
          participatedRef.current = false;
          const kind: BossKind = Math.random() < 0.5 ? 'boss' : 'monster';
          setBoss(createBossEvent(catalog, kind, isStreamerOptedOutOfBoss));
        }
      } else if (current.status === 'active') {
        const passive = PASSIVE_DAMAGE_MIN + Math.random() * (PASSIVE_DAMAGE_MAX - PASSIVE_DAMAGE_MIN);
        const hp = Math.max(0, current.hp - passive);

        if (hp <= 0) {
          const defeated: KickBoss = { ...current, hp: 0, status: 'defeated' };
          setBoss(defeated);
          setLastResult({ boss: defeated, participated: participatedRef.current, reward: participatedRef.current ? randomReward() : null });
        } else if (now >= current.expiresAt) {
          const escaped: KickBoss = { ...current, status: 'escaped' };
          setBoss(escaped);
          setLastResult({ boss: escaped, participated: participatedRef.current, reward: null });
        } else {
          setBoss({ ...current, hp });
        }
      }

      setBoosts((prev) => {
        const fresh = Object.entries(prev).filter(([, expiresAt]) => expiresAt > now);
        return fresh.length === Object.keys(prev).length ? prev : Object.fromEntries(fresh);
      });
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [catalog, isStreamerOptedOutOfBoss]);

  useEffect(() => {
    if (!activeBoss || activeBoss.status === 'active') return;
    const timer = window.setTimeout(() => setBoss(null), RESULT_DISPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [activeBoss]);

  const engage = (streamerId: string, damage: number) => {
    const current = bossRef.current;
    if (!current || current.status !== 'active' || current.streamerId !== streamerId) return;
    participatedRef.current = true;
    const hp = Math.max(0, current.hp - damage);

    if (hp <= 0) {
      const defeated: KickBoss = { ...current, hp: 0, status: 'defeated' };
      setBoss(defeated);
      setLastResult({ boss: defeated, participated: true, reward: randomReward() });
    } else {
      setBoss({ ...current, hp });
    }
  };

  const dismissResult = () => setLastResult(null);

  const reportWatching = (streamerId: string) => {
    const previous = lastWatchedRef.current;
    const current = bossRef.current;
    if (previous && previous !== streamerId && current?.status === 'active' && current.streamerId === streamerId) {
      setBoosts((prev) => ({ ...prev, [previous]: Date.now() + BOOST_DURATION_MS }));
    }
    lastWatchedRef.current = streamerId;
  };

  const isBoosted = (streamerId: string) => {
    const expiresAt = boosts[streamerId];
    return typeof expiresAt === 'number' && expiresAt > Date.now();
  };

  return (
    <KickBossContext.Provider value={{ activeBoss, lastResult, engage, dismissResult, reportWatching, isBoosted }}>
      {children}
    </KickBossContext.Provider>
  );
}

export function useKickBoss(): KickBossContextValue {
  const ctx = useContext(KickBossContext);
  if (!ctx) throw new Error('useKickBoss must be used within KickBossProvider');
  return ctx;
}
