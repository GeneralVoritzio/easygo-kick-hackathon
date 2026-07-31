export interface ChannelInfo {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string;
  isLive: boolean;
  viewerCount?: number;
}

// --- Multiview grid (Home tab) -----------------------------------------------

export type StreamPlatform = 'kick';

/** A single watchable feed for the mobile multi-stream grid. Extends
 *  `ChannelInfo` so it drops straight into `ChannelBadge`; adds only what
 *  the mosaic itself needs. Embeds a real, currently-live Kick broadcast
 *  rather than a mock placeholder, so `viewerCount` is intentionally left
 *  unset (no API key to source a real number from) instead of showing a
 *  fabricated one. `embedId` is the Kick channel slug `StreamSurface`
 *  actually embeds via `player.kick.com`. */
export interface LiveStream extends ChannelInfo {
  platform: StreamPlatform;
  embedId: string;
  /** Kick-style genre/format/language tag pills ("IRL", "English",
   *  "Shooter") shown on a stream card instead of a single "Playing X" /
   *  "Just Chatting" line. Directory-style, curated by us rather than
   *  fetched live from the Kick API (no API key), same as the rest of this
   *  file's mock data. */
  tags: string[];
  /** Why this specific stream is worth tapping into *right now* — social
   *  proof (community members already there) or something live wrapping up
   *  soon. Not every stream has one. */
  signal?: StreamSignal;
}

export type StreamSignalKind = 'community_members' | 'poll_ending' | 'battle_ending' | 'event_starting';

/** The social/event line shown on a stream card. `count` drives
 *  `community_members`; `endsAt` (plus `label` for `event_starting`) drives
 *  the three countdown kinds. */
export interface StreamSignal {
  kind: StreamSignalKind;
  count?: number;
  /** For `event_starting` — what's starting, e.g. "Birthday surprise". */
  label?: string;
  /** ISO timestamp the countdown counts down to. */
  endsAt?: string;
}

/** One line of live chat in the fullscreen Stream View. `viewerName: 'you'`
 *  marks the viewer's own locally-sent messages. */
export interface ChatMessage {
  id: string;
  viewerName: string;
  text: string;
  createdAt: string;
}

// --- Discover tab -------------------------------------------------------

export type DiscoverEventKind = 'tournament' | 'charity_stream' | 'collab' | 'irl_meetup' | 'launch';

/** A streamer credited on a `DiscoverEvent` card. Carries its own avatar
 *  rather than a bare name so the card can always show one, even for a
 *  streamer with no live embed backing this particular event yet. */
export interface DiscoverEventStreamer {
  name: string;
  avatarUrl: string;
}

/** A platform-wide happening worth discovering — spans multiple streamers
 *  and categories rather than one creator's own calendar. `streamIds` is
 *  only set once it's actually live, and only ever points at real embedded
 *  channels in `createMockLiveStreams` — there's nothing to embed for a
 *  happening that hasn't started. A collab spanning several streamers opens
 *  as a multiview (same flow as `TrendingMultiview`), not a single stream. */
export interface DiscoverEvent {
  id: string;
  title: string;
  kind: DiscoverEventKind;
  category: string;
  streamers: DiscoverEventStreamer[];
  streamIds?: string[];
  startsAt: string;
  isLive?: boolean;
}

/** A multiview combo other viewers are currently watching together, ranked
 *  by how many people have that exact combo open right now. `watching` is
 *  our own invented signal (fake-kick): no real API exposes multiview
 *  popularity, so this doesn't pretend to be sourced from one. */
export interface TrendingMultiview {
  id: string;
  title: string;
  streamIds: string[];
  watching: number;
}
