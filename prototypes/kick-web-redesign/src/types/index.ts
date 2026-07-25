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
}
