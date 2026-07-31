import type { ChatMessage, DiscoverEvent, LiveStream, StreamSignal, TrendingMultiview } from '../types';
import souljaboyAvatar from '../../assets/avatars/souljaboy.svg';
import lospollostvAvatar from '../../assets/avatars/lospollostv.svg';
import grinchAvatar from '../../assets/avatars/grinch.svg';
import eslcsAvatar from '../../assets/avatars/eslcs.svg';
import cctCsAvatar from '../../assets/avatars/cct_cs.svg';
import honkfmAvatar from '../../assets/avatars/honkfm.svg';
import amouranthAvatar from '../../assets/avatars/amouranth.svg';
import trainwreckstvAvatar from '../../assets/avatars/trainwreckstv.svg';

const VIEWER_NAMES = [
  'nightowl22', 'xX_Raven_Xx', 'lurkmaster', 'sodapop', 'ghostie', 'kelpy_dev',
  'quietstorm', 'BunsenBurner', 'triple_axel', 'mango.tv', 'zerocool', 'flickerbulb',
];

// --- Multiview grid mock data -----------------------------------------------

interface LiveStreamTemplate {
  id: string;
  name: string;
  /** Kick channel slug, embedded live via player.kick.com. */
  embedId: string;
  /** Genre/format/language tag pills — directory-style, same caveat as
   *  `SIGNAL_TEMPLATES`: curated by us, not fetched live from the Kick API. */
  tags: string[];
  /** DiceBear Pixel Art, committed under `src/assets/avatars/` — see
   *  `.claude/KICK-ASSETS.md`. Stands in for the profile picture the real
   *  API would return; never initials. */
  avatarUrl: string;
}

/** Real, large Kick channels — the grid embeds their actual broadcasts (see
 *  `StreamSurface`), so unlike the rest of this file these aren't fictional.
 *  Picked for being reliably live (24/7 or long-running marathon/rerun
 *  broadcasts) rather than big names that happen to be offline most of the
 *  day. If a channel does go offline, Kick's own embed shows its real
 *  offline card rather than anything we fabricate — same accepted tradeoff
 *  as `prototypes/hypeprops` already documents for its `/stream` demo. */
const LIVE_STREAM_TEMPLATES: LiveStreamTemplate[] = [
  { id: 'stream-souljaboy', name: 'souljaboy', embedId: 'souljaboy', tags: ['IRL', 'English'], avatarUrl: souljaboyAvatar },
  { id: 'stream-lospollostv', name: 'LosPollosTV', embedId: 'lospollostv', tags: ['Slots', 'English'], avatarUrl: lospollostvAvatar },
  { id: 'stream-grinch', name: 'Grinch', embedId: 'grinch', tags: ['GTA', 'English'], avatarUrl: grinchAvatar },
  { id: 'stream-eslcs', name: 'ESLCS', embedId: 'eslcs', tags: ['Esports', 'English'], avatarUrl: eslcsAvatar },
  { id: 'stream-cct_cs', name: 'CCT_CS', embedId: 'cct_cs', tags: ['Esports', 'English'], avatarUrl: cctCsAvatar },
  { id: 'stream-honkfm', name: 'HonkFM', embedId: 'honkfm', tags: ['Music', 'English'], avatarUrl: honkfmAvatar },
];

/** Template for a stream's card signal — `secondsFromNow` (for the three
 *  countdown kinds) is resolved to a real `endsAt` timestamp inside
 *  `createMockLiveStreams`, not baked in statically here, so the countdown
 *  is always fresh relative to when the app actually loaded. */
type SignalTemplate =
  | { kind: 'community_members'; count: number }
  | { kind: 'poll_ending'; secondsFromNow: number }
  | { kind: 'battle_ending'; secondsFromNow: number }
  | { kind: 'event_starting'; label: string; secondsFromNow: number };

/** One signal per stream (bar one, deliberately left without to show that's
 *  a valid state too), spanning all four kinds — community social proof and
 *  live events wrapping up soon (poll/battle/a scheduled moment) — so the
 *  discovery feed shows the full variety rather than one repeated badge. */
const SIGNAL_TEMPLATES: Record<string, SignalTemplate> = {
  'stream-souljaboy': { kind: 'community_members', count: 8 },
  'stream-lospollostv': { kind: 'battle_ending', secondsFromNow: 50 },
  'stream-grinch': { kind: 'poll_ending', secondsFromNow: 102 },
  'stream-eslcs': { kind: 'event_starting', label: 'Grand Final', secondsFromNow: 45 },
  'stream-cct_cs': { kind: 'community_members', count: 4 },
};

function resolveSignal(template: SignalTemplate): StreamSignal {
  switch (template.kind) {
    case 'community_members':
      return { kind: template.kind, count: template.count };
    case 'poll_ending':
    case 'battle_ending':
      return { kind: template.kind, endsAt: new Date(Date.now() + template.secondsFromNow * 1000).toISOString() };
    case 'event_starting':
      return {
        kind: template.kind,
        label: template.label,
        endsAt: new Date(Date.now() + template.secondsFromNow * 1000).toISOString(),
      };
  }
}

/** Deterministic gradient per stream id — shown behind the embed while it
 *  loads. */
export function streamGradient(streamId: string): string {
  let hash = 0;
  for (let i = 0; i < streamId.length; i++) hash = (hash * 31 + streamId.charCodeAt(i)) >>> 0;
  const hueA = hash % 360;
  const hueB = (hueA + 40 + (hash % 60)) % 360;
  return `linear-gradient(135deg, hsl(${hueA} 70% 18%), hsl(${hueB} 65% 10%))`;
}

export function createMockLiveStreams(): LiveStream[] {
  return LIVE_STREAM_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.id,
    avatarUrl: t.avatarUrl,
    platform: 'kick',
    embedId: t.embedId,
    tags: t.tags,
    isLive: true,
    signal: SIGNAL_TEMPLATES[t.id] ? resolveSignal(SIGNAL_TEMPLATES[t.id]) : undefined,
  }));
}

// --- Discover tab mock data ---------------------------------------------

export function createMockDiscoverEvents(): DiscoverEvent[] {
  const now = Date.now();
  return [
    {
      id: 'evt-1',
      title: 'CS2 Tournament Double Feed',
      kind: 'collab',
      category: 'Counter-Strike 2',
      streamers: [
        { name: 'ESLCS', avatarUrl: eslcsAvatar },
        { name: 'CCT_CS', avatarUrl: cctCsAvatar },
      ],
      streamIds: ['stream-eslcs', 'stream-cct_cs'],
      startsAt: new Date(now - 1000 * 60 * 35).toISOString(),
      isLive: true,
    },
    {
      id: 'evt-2',
      title: 'SOULJATHON x Slots Charity Relay',
      kind: 'charity_stream',
      category: 'Just Chatting',
      streamers: [
        { name: 'souljaboy', avatarUrl: souljaboyAvatar },
        { name: 'LosPollosTV', avatarUrl: lospollostvAvatar },
      ],
      streamIds: ['stream-souljaboy', 'stream-lospollostv'],
      startsAt: new Date(now - 1000 * 60 * 12).toISOString(),
      isLive: true,
    },
    {
      id: 'evt-3',
      title: 'Kick Creator Cup — CS2',
      kind: 'tournament',
      category: 'Counter-Strike 2',
      streamers: [
        { name: 'ESLCS', avatarUrl: eslcsAvatar },
        { name: 'CCT_CS', avatarUrl: cctCsAvatar },
        { name: 'Grinch', avatarUrl: grinchAvatar },
      ],
      startsAt: new Date(now + 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      id: 'evt-4',
      title: 'Neon Riot — Slot Launch Party',
      kind: 'launch',
      category: 'Slots & Casino',
      streamers: [{ name: 'LosPollosTV', avatarUrl: lospollostvAvatar }],
      startsAt: new Date(now + 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: 'evt-5',
      title: 'Beach Meetup IRL',
      kind: 'irl_meetup',
      category: 'Pools, Hot Tubs & Beaches',
      streamers: [
        { name: 'Amouranth', avatarUrl: amouranthAvatar },
        { name: 'Trainwreckstv', avatarUrl: trainwreckstvAvatar },
      ],
      startsAt: new Date(now + 1000 * 60 * 60 * 24 * 5).toISOString(),
    },
  ];
}

/** Combos other viewers currently have open in their own multiview, ranked
 *  by `watching`. `streamIds` reference `LIVE_STREAM_TEMPLATES` ids so a tap
 *  can pin the exact same combo into the Home tab's focus mosaic. */
export function createMockTrendingMultiviews(): TrendingMultiview[] {
  return [
    {
      id: 'trend-1',
      title: 'CS2 Double Feed',
      streamIds: ['stream-eslcs', 'stream-cct_cs'],
      watching: 8420,
    },
    {
      id: 'trend-2',
      title: 'Charity Relay: souljaboy + LosPollosTV',
      streamIds: ['stream-souljaboy', 'stream-lospollostv'],
      watching: 6190,
    },
    {
      id: 'trend-3',
      title: 'Casino & Chaos Trio',
      streamIds: ['stream-lospollostv', 'stream-grinch', 'stream-eslcs'],
      watching: 4310,
    },
    {
      id: 'trend-4',
      title: 'The Full Lobby',
      streamIds: ['stream-souljaboy', 'stream-lospollostv', 'stream-grinch', 'stream-cct_cs'],
      watching: 2075,
    },
  ];
}

// --- Live chat mock data (Stream View) ---------------------------------------

const CHAT_MESSAGE_TEMPLATES = [
  'POGGERS',
  "let's gooo",
  'who else just joined',
  'W stream',
  'chat is moving so fast rn',
  'first time catching this live, loving it',
  'any tips for beginners?',
  '🔥🔥🔥',
  'clip that',
  'LOL',
  'been watching for 2 hours straight',
  "can't believe that just happened",
  'wait what did I just miss',
  'this chat has no chill 😭',
];

export function createMockChatMessage(): ChatMessage {
  return {
    id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    viewerName: VIEWER_NAMES[Math.floor(Math.random() * VIEWER_NAMES.length)],
    text: CHAT_MESSAGE_TEMPLATES[Math.floor(Math.random() * CHAT_MESSAGE_TEMPLATES.length)],
    createdAt: new Date().toISOString(),
  };
}

export function createMockChatMessages(count = 12): ChatMessage[] {
  return Array.from({ length: count }, () => createMockChatMessage());
}
