export interface ChannelInfo {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string;
  isLive: boolean;
  viewerCount?: number;
}

// --- Kick Communities -------------------------------------------------------

export type ThreadKind = 'discussion' | 'meme' | 'fan_art' | 'announcement';

/** One post in a creator's community feed — a discussion thread, a shared
 *  meme/fan art, or an announcement, all in the same feed rather than split
 *  across Reddit/Discord/X. */
export interface CommunityThread {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  kind: ThreadKind;
  title: string;
  bodyPreview: string;
  replyCount: number;
  reactionCount: number;
  createdAt: string;
  pinned?: boolean;
}

export type CommunityEventKind = 'convention' | 'charity_stream' | 'community_week' | 'live_event' | 'quest';

/** A scheduled or in-progress community happening — a convention, a charity
 *  marathon, a live-event moment fans help drive (vote/solve/contribute),
 *  or a running quest. */
export interface CommunityEvent {
  id: string;
  title: string;
  kind: CommunityEventKind;
  startsAt: string;
  isLive?: boolean;
}

export interface CommunityPollOption {
  id: string;
  label: string;
  votes: number;
}

/** A live vote fans can help decide — "vote on strategies" from the
 *  pitch, e.g. which boss/route/decision the streamer takes next. */
export interface CommunityPoll {
  id: string;
  question: string;
  options: CommunityPollOption[];
  endsAt: string;
}

/** A community-wide progress goal fans contribute to live — covers both
 *  "solve puzzles" (progress toward clues found) and "contribute to a
 *  battle or goal" from the pitch, rather than modeling each as its own
 *  bespoke mechanic. */
export interface CommunityGoal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
}

/** The community a feed/event belongs to — one dedicated space per creator
 *  (or interest) rather than one generic Kick-wide forum. */
export interface Community {
  id: string;
  name: string;
  creatorName: string;
  iconEmoji: string;
  memberCount: number;
}

export type CommunityCardRarity = 'common' | 'rare' | 'legendary';

export type CommunityCardRevealKind = 'video' | 'voice_note' | 'message' | 'clip' | 'animation' | 'image';

/** A collectible earned by completing a community quest/event — face-down
 *  by default. Only its owner can flip it to reveal the creator's private
 *  message underneath, so the card is a memory, not just a badge. */
export interface CommunityCard {
  id: string;
  communityName: string;
  creatorName: string;
  iconEmoji: string;
  /** What was done to earn it, e.g. "First Charity Marathon". */
  title: string;
  earnedAt: string;
  rarity: CommunityCardRarity;
  revealKind: CommunityCardRevealKind;
  /** The secret behind the card — the creator's private message/clip/etc. */
  revealMessage: string;
  revealAuthor: string;
  /** An embed URL (for `revealKind: 'video'`) or image URL (for
   *  `revealKind: 'image'`). Falls back to a placeholder when unset. */
  revealMediaUrl?: string;
}

/** A user's profile as a record of the communities they've been part of and
 *  the moments they've collected — a passport, not just a follow list. */
export interface KickPassport {
  handle: string;
  communitiesJoined: number;
  cards: CommunityCard[];
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
   *  proof (friends/community members already there) or something live
   *  wrapping up soon. Not every stream has one. */
  signal?: StreamSignal;
}

export type StreamSignalKind = 'friends_watching' | 'community_members' | 'poll_ending' | 'battle_ending' | 'event_starting';

/** The social/event line shown on a stream card. `count` drives the two
 *  headcount kinds (`friends_watching`, `community_members`); `endsAt` (plus
 *  `label` for `event_starting`) drives the three countdown kinds. */
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
