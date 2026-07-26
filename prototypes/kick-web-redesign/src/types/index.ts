/** Rough size tier, purely for discoverability purposes — never shown as a
 *  hard label to viewers, just what the discovery algorithm mixes on. */
export type StreamTier = 'rising' | 'growing' | 'popular';

export interface StreamCard {
  id: string;
  name: string;
  category: string;
  tags: string[];
  tier: StreamTier;
  viewerCount: number;
  isLive: boolean;
  /** A real Kick channel slug gets a real live embed wherever video actually
   *  renders (hero, watch page, multiview). Everything else is a styled
   *  placeholder — we don't have real footage for a fictional catalog
   *  entry, and pretending otherwise would be dishonest, not just a demo
   *  shortcut. */
  embedId?: string;
  /** Deterministic gradient for the thumbnail/avatar when there's no real
   *  embed to show. */
  gradient: string;
  /** Set when this streamer is currently streaming together with others —
   *  a shared RP lobby, a collab house, and so on. `partyId` groups the
   *  members (see `partyMatesOf`); `partyName` is what a viewer sees.
   *  Undefined means solo. KICK has no public party/collab API today, so
   *  this is an invented (`fake-kick`) surface. */
  partyId?: string;
  partyName?: string;
}

export interface FeaturedStreamer {
  card: StreamCard;
  weekLabel: string;
  blurb: string;
}

export interface ChatMessage {
  id: string;
  viewerName: string;
  text: string;
  /** A journey narration line ("Now arriving at KAIDO") rather than a real
   *  viewer message — rendered without a username, centered and muted. */
  system?: boolean;
}

/** `boarding`: still in the lobby, ticking down to its first departure.
 *  `in-progress`: already hopping between stops on a 1-minute clock. */
export type ExpeditionStatus = 'boarding' | 'in-progress';

/** Kick Expedition: a shared, scheduled hop between several random live
 *  streamers, one minute each, that any viewer can join or leave. Runs on
 *  its own clock regardless of whether anyone in particular is riding it,
 *  the same way a real raid is already moving before a given viewer joins
 *  it — see `ExpeditionContext`. */
export interface Expedition {
  id: string;
  name: string;
  stops: StreamCard[];
  viewerCount: number;
  maxViewers: number;
  status: ExpeditionStatus;
  /** Which entry in `stops` is the current one. Meaningful only once
   *  `status` is `in-progress`; `0` while boarding (the upcoming first stop). */
  stopIndex: number;
  /** Seconds until the next departure — the first one while boarding, the
   *  next stop once under way. */
  secondsRemaining: number;
  /** Set the moment a departure fires, cleared once the transit view has
   *  had its moment on screen. Non-null means "don't teleport yet." */
  transitionUntil: number | null;
}

/** `boss`: fully random — could land on any live streamer. `monster`: the
 *  same fight, framed as triggered by that stream's own hype running hot.
 *  Mechanically identical; only the name and the announcement copy differ,
 *  since neither is a capability KICK's real API exposes — see
 *  `KickBossContext`. */
export type BossKind = 'boss' | 'monster';
export type BossStatus = 'active' | 'defeated' | 'escaped';

/** A limited-time world event on one streamer's channel: a shared HP bar
 *  every viewer chips away at through chat, follows, subs, gifts, likes
 *  and shares, racing a clock before it escapes. */
export interface KickBoss {
  id: string;
  kind: BossKind;
  name: string;
  streamerId: string;
  streamerName: string;
  maxHp: number;
  hp: number;
  spawnedAt: number;
  expiresAt: number;
  status: BossStatus;
}

/** What came of a fight, for the reward toast — `reward` is set only when
 *  the boss was defeated and this viewer actually took part in it. */
export interface BossResult {
  boss: KickBoss;
  participated: boolean;
  reward: string | null;
}
