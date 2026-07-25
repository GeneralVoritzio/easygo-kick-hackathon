// --- Multi-streamer "battle" -------------------------------------------------

export interface BattleStreamer {
  streamerId: string;
  name: string;
  avatarUrl?: string;
  score: number;
}

/** One side of the battle bar: a solo streamer (a single-item `streamers`
 *  array) or a team of streamers whose scores are summed into one segment.
 *  A duel is just two sides; a multi-way battle is more than two. */
export interface BattleSide {
  sideId: string;
  name: string;
  streamers: BattleStreamer[];
}

export type BattleStatus = 'starting' | 'live' | 'final';

export interface BattleState {
  battleId: string;
  sides: BattleSide[];
  /** ISO timestamp the battle timer ends at. */
  endsAt: string;
  status: BattleStatus;
}

export type ContributionType = 'tip' | 'follow' | 'sub' | 'chat_burst';

/** A single contribution as it happens, for visual flair only — the running
 *  score itself arrives via `battle_update`. */
export interface ContributionEvent {
  streamerId: string;
  viewerName: string;
  amount: number;
  type: ContributionType;
  timestamp: string;
}

/** Envelope for every message sent over the live-scores WebSocket. */
export type WsMessage =
  | { type: 'battle_update'; payload: BattleState }
  | { type: 'contribution_event'; payload: ContributionEvent };

export type ConnectionStatus = 'connecting' | 'open' | 'closed' | 'mock';
