import type { BossKind, KickBoss, StreamCard } from '../types';

export const BOSS_DURATION_SECONDS = 90;
export const MONSTER_DURATION_SECONDS = 60;
export const BOSS_MAX_HP = 600;
export const MONSTER_MAX_HP = 300;

/** Passive "the rest of the crowd is fighting too" drain, once a second,
 *  regardless of what this viewer personally does — the same reasoning
 *  `ExpeditionContext` uses for a ride that keeps moving whether or not
 *  anyone in particular is riding it. Tuned so the clock is real pressure:
 *  the crowd alone gets a boss close to dead by the time it would escape,
 *  and this viewer's own hits are what actually finishes it early. */
export const PASSIVE_DAMAGE_MIN = 3;
export const PASSIVE_DAMAGE_MAX = 8;

/** The compensation for whichever stream someone left to go fight a boss
 *  elsewhere — "bonus visibility... a net positive, not zero-sum." A
 *  temporary viewer-count bump plus a "Boosted" badge, not a real payment
 *  of any kind. */
export const BOOST_DURATION_MS = 3 * 60 * 1000;
export const BOOST_VIEWER_MULTIPLIER = 1.15;

/** Damage per engagement action. Donate scales with the gift instead of a
 *  flat number, same spirit as `kicks.gifted` carrying a real `amount`. */
export const DAMAGE = {
  chat: 2,
  like: 3,
  follow: 10,
  subscribe: 20,
  share: 6,
  donate: (amount: number) => Math.round(amount / 15),
};

const BOSS_NAMES = [
  'Grimlok the Lag Spike', 'The Buffering Beast', 'Ratio King Malachar', 'The Troll Toll Ogre',
  'Ping Fiend', 'The Doom Scroller', 'Overlay Wraith', 'The Silence Between Clips',
];

const MONSTER_NAMES = [
  'The Hype Wyrm', 'Chat Velocity Elemental', 'The Viewer Surge', 'Clout Kraken',
  'The Copium Golem', 'Emote Storm', 'The Algorithm Itself', 'Zeitgeist Beast',
];

const REWARDS = [
  '500 bonus Kicks', '1,000 bonus Kicks', 'a Boss Slayer badge', 'a golden chat name for 24 hours',
  'an exclusive emote unlock', '3 months of ad-free chat',
];

/** Excludes any streamer who's opted their channel out — see
 *  `SettingsContext.isStreamerOptedOutOfBoss`. Falls back to the full
 *  catalog if literally everyone has opted out, so a pathological settings
 *  state can never make spawning silently stop working. */
function randomSpawnStreamer(catalog: StreamCard[], isExcluded: (id: string) => boolean): StreamCard {
  const eligible = catalog.filter((c) => !isExcluded(c.id));
  const pool = eligible.length > 0 ? eligible : catalog;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Random streamer, random flavor name, sized and timed for its kind. */
export function createBossEvent(catalog: StreamCard[], kind: BossKind, isExcluded: (id: string) => boolean = () => false): KickBoss {
  const streamer = randomSpawnStreamer(catalog, isExcluded);
  const names = kind === 'boss' ? BOSS_NAMES : MONSTER_NAMES;
  const name = names[Math.floor(Math.random() * names.length)];
  const maxHp = kind === 'boss' ? BOSS_MAX_HP : MONSTER_MAX_HP;
  const durationSeconds = kind === 'boss' ? BOSS_DURATION_SECONDS : MONSTER_DURATION_SECONDS;
  const now = Date.now();

  return {
    id: `${kind}-${now}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    name,
    streamerId: streamer.id,
    streamerName: streamer.name,
    maxHp,
    hp: maxHp,
    spawnedAt: now,
    expiresAt: now + durationSeconds * 1000,
    status: 'active',
  };
}

export function randomReward(): string {
  return REWARDS[Math.floor(Math.random() * REWARDS.length)];
}
