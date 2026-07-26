/** One sample of aggregate stream engagement over time — a stand-in for
 *  what a real chat-rate / viewer-delta feed would produce. Aggregate only
 *  (never per-viewer), so this is the kind of signal the real API could
 *  plausibly expose. */
export interface EngagementPoint {
  /** Seconds since stream start. */
  t: number;
  /** Synthetic 0-100 engagement score at this point. */
  value: number;
}

/** A detected spike in `EngagementPoint[]` — a local peak well above the
 *  surrounding baseline. We only know engagement jumped here, not why, so
 *  the caption stays generic rather than inventing a specific cause we
 *  have no real signal for. */
export interface StreamHighlight {
  id: string;
  /** Seconds since stream start this highlight is centered on. */
  t: number;
  /** How far above baseline, drives caption intensity. */
  intensity: number;
  caption: string;
}

export type RecapSegmentKind = 'opening' | 'highlight' | 'closing';

/** One card in the recap sequence. `startSec`/`endSec` are seconds since
 *  stream start — what a real seekable-VOD recap would jump to for this
 *  card, if one existed. */
export interface RecapSegment {
  id: string;
  kind: RecapSegmentKind;
  startSec: number;
  endSec: number;
  title: string;
  caption: string;
}

export interface StreamSession {
  streamerName: string;
  kickChannel: string;
  streamStartedAt: string;
  /** When the current viewer joined — recap covers `streamStartedAt` up to
   *  this moment. */
  viewerJoinedAt: string;
  engagement: EngagementPoint[];
}
