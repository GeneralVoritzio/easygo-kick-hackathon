import type {
  ChatMessage,
  Community,
  CommunityCard,
  CommunityEvent,
  CommunityGoal,
  CommunityPoll,
  CommunityThread,
  KickPassport,
  LiveStream,
  StreamSignal,
} from '../types';

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
}

/** Real, large Kick channels — the grid embeds their actual broadcasts (see
 *  `StreamSurface`), so unlike the rest of this file these aren't fictional.
 *  If a channel happens to be offline, Kick's own embed shows its real
 *  offline card rather than anything we fabricate — same accepted tradeoff
 *  as `prototypes/hypeprops` already documents for its `/stream` demo. */
const LIVE_STREAM_TEMPLATES: LiveStreamTemplate[] = [
  { id: 'stream-maxholloway', name: 'maxholloway', embedId: 'maxholloway', tags: ['IRL', 'English'] },
  { id: 'stream-adinross', name: 'Adin Ross', embedId: 'adinross', tags: ['IRL', 'Slots'] },
  { id: 'stream-xqc', name: 'xQc', embedId: 'xqc', tags: ['Variety', 'English'] },
  { id: 'stream-amouranth', name: 'Amouranth', embedId: 'amouranth', tags: ['IRL', 'English'] },
  { id: 'stream-trainwreckstv', name: 'Trainwreckstv', embedId: 'trainwreckstv', tags: ['Slots', 'English'] },
  { id: 'stream-n3on', name: 'N3on', embedId: 'n3on', tags: ['IRL', 'Collab'] },
];

/** Template for a stream's card signal — `secondsFromNow` (for the three
 *  countdown kinds) is resolved to a real `endsAt` timestamp inside
 *  `createMockLiveStreams`, not baked in statically here, so the countdown
 *  is always fresh relative to when the app actually loaded. */
type SignalTemplate =
  | { kind: 'friends_watching'; count: number }
  | { kind: 'community_members'; count: number }
  | { kind: 'poll_ending'; secondsFromNow: number }
  | { kind: 'battle_ending'; secondsFromNow: number }
  | { kind: 'event_starting'; label: string; secondsFromNow: number };

/** One signal per stream (bar one, deliberately left without to show that's
 *  a valid state too), spanning all five kinds — social proof
 *  (friends/community already watching) and live events wrapping up soon
 *  (poll/battle/a scheduled moment) — so the discovery feed shows the full
 *  variety rather than one repeated badge. */
const SIGNAL_TEMPLATES: Record<string, SignalTemplate> = {
  'stream-maxholloway': { kind: 'friends_watching', count: 3 },
  'stream-adinross': { kind: 'battle_ending', secondsFromNow: 50 },
  'stream-xqc': { kind: 'community_members', count: 6 },
  'stream-amouranth': { kind: 'poll_ending', secondsFromNow: 102 },
  'stream-trainwreckstv': { kind: 'event_starting', label: 'Giveaway', secondsFromNow: 45 },
};

function resolveSignal(template: SignalTemplate): StreamSignal {
  switch (template.kind) {
    case 'friends_watching':
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
    platform: 'kick',
    embedId: t.embedId,
    tags: t.tags,
    isLive: true,
    signal: SIGNAL_TEMPLATES[t.id] ? resolveSignal(SIGNAL_TEMPLATES[t.id]) : undefined,
  }));
}

// --- Kick Communities mock data ---------------------------------------------

export function createMockCommunity(): Community {
  return { id: 'nova-community', name: "NOVA_'s Community", creatorName: 'NOVA_', iconEmoji: '🟢', memberCount: 48213 };
}

export function createMockCommunityEvents(): CommunityEvent[] {
  const now = Date.now();
  return [
    {
      id: 'evt-1',
      title: 'Community Week: Boss Rush',
      kind: 'live_event',
      startsAt: new Date(now - 1000 * 60 * 20).toISOString(),
      isLive: true,
    },
    {
      id: 'evt-2',
      title: 'Charity Marathon vs. BLKOUT',
      kind: 'charity_stream',
      startsAt: new Date(now + 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
      id: 'evt-3',
      title: 'NOVA_Con — Annual Meetup',
      kind: 'convention',
      startsAt: new Date(now + 1000 * 60 * 60 * 24 * 21).toISOString(),
    },
  ];
}

/** "Vote on strategies" from the pitch — a live poll tied to the Boss Rush
 *  event fans help decide. */
export function createMockCommunityPoll(): CommunityPoll {
  return {
    id: 'poll-1',
    question: 'Which boss do we fight first tonight?',
    options: [
      { id: 'opt-1', label: 'The Clockwork Warden', votes: 412 },
      { id: 'opt-2', label: 'The Glass Sovereign', votes: 356 },
      { id: 'opt-3', label: 'Whatever chat votes for at the door', votes: 89 },
    ],
    endsAt: new Date(Date.now() + 1000 * 60 * 12).toISOString(),
  };
}

/** "Solve puzzles" / "contribute to a battle or goal" from the pitch — a
 *  community-wide progress bar fans push forward live. */
export function createMockCommunityGoal(): CommunityGoal {
  return { id: 'goal-1', title: 'Puzzle clues found', current: 7, target: 10, unit: 'clues' };
}

export function createMockCommunityThreads(): CommunityThread[] {
  const now = Date.now();
  return [
    {
      id: 'th-1',
      authorName: 'NOVA_',
      kind: 'announcement',
      title: 'Community Week starts Friday — Boss Rush event live in-stream',
      bodyPreview: 'Vote on which boss we fight first. Clear it as a community and everyone gets a card.',
      replyCount: 214,
      reactionCount: 1830,
      createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
      pinned: true,
    },
    {
      id: 'th-2',
      authorName: 'mossy_dev',
      kind: 'discussion',
      title: 'anyone else catch the boss fight last night??',
      bodyPreview: "That last-second puzzle solve in chat was insane, didn't think we'd clutch it.",
      replyCount: 42,
      reactionCount: 96,
      createdAt: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
    },
    {
      id: 'th-3',
      authorName: 'pixel.jam',
      kind: 'fan_art',
      title: 'drew NOVA_ as the boss from last night',
      bodyPreview: 'took way too long but worth it',
      replyCount: 12,
      reactionCount: 340,
      createdAt: new Date(now - 1000 * 60 * 60 * 14).toISOString(),
    },
    {
      id: 'th-4',
      authorName: 'quiet_riot99',
      kind: 'meme',
      title: 'when the puzzle hint is "look closer" for the 5th time',
      bodyPreview: '',
      replyCount: 8,
      reactionCount: 512,
      createdAt: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
    },
    {
      id: 'th-5',
      authorName: 'echo_lynn',
      kind: 'discussion',
      title: "puzzle hint thread — drop what you've found",
      bodyPreview: "Compiling everyone's clues here so we're not solving it five times over.",
      replyCount: 87,
      reactionCount: 61,
      createdAt: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
    },
    {
      id: 'th-6',
      authorName: 'thorne_',
      kind: 'discussion',
      title: 'NOVA_ really outdid herself with that Boss Rush planning',
      bodyPreview: 'Been here since day one and this might be the best-organized community event yet.',
      replyCount: 19,
      reactionCount: 88,
      createdAt: new Date(now - 1000 * 60 * 60 * 30).toISOString(),
    },
    {
      id: 'th-7',
      authorName: 'kelpy_dev',
      kind: 'discussion',
      title: "NOVA_'s reaction to the puzzle solve was priceless",
      bodyPreview: "Somebody needs to clip that scream, I'm still laughing.",
      replyCount: 27,
      reactionCount: 145,
      createdAt: new Date(now - 1000 * 60 * 60 * 32).toISOString(),
    },
  ];
}

const PASSPORT_CARDS: CommunityCard[] = [
  {
    id: 'card-1',
    communityName: "NOVA_'s Community",
    creatorName: 'NOVA_',
    iconEmoji: '🟢',
    title: 'First Charity Marathon',
    earnedAt: '2024-03-16T00:00:00.000Z',
    rarity: 'legendary',
    revealKind: 'voice_note',
    revealMessage: "Thank you for being part of our first charity marathon. We couldn't have done it without you.",
    revealAuthor: '— NOVA_',
  },
  {
    id: 'card-2',
    communityName: "BLKOUT's Community",
    creatorName: 'BLKOUT',
    iconEmoji: '🔥',
    title: 'Boss Rush Survivor',
    earnedAt: '2024-07-02T00:00:00.000Z',
    rarity: 'rare',
    revealKind: 'clip',
    revealMessage: "You were one of 340 who stuck it out to the last phase. Here's the clip from your angle.",
    revealAuthor: '— BLKOUT',
  },
  {
    id: 'card-3',
    communityName: "RIVIT's Community",
    creatorName: 'RIVIT',
    iconEmoji: '💧',
    title: 'Puzzle Hunt Finisher',
    earnedAt: '2024-08-21T00:00:00.000Z',
    rarity: 'common',
    revealKind: 'message',
    revealMessage: 'You cracked the final cipher before anyone else in chat. Nicely done.',
    revealAuthor: '— RIVIT',
  },
  {
    id: 'card-4',
    communityName: "sade_'s Community",
    creatorName: 'sade_',
    iconEmoji: '❤️',
    title: 'Fan Art Contributor',
    earnedAt: '2024-09-04T00:00:00.000Z',
    rarity: 'common',
    revealKind: 'image',
    revealMessage: 'Your piece is still my phone background. Thank you for making something for us.',
    revealAuthor: '— sade_',
  },
  {
    id: 'card-5',
    communityName: "NOVA_'s Community",
    creatorName: 'NOVA_',
    iconEmoji: '🟢',
    title: 'NOVA_Con Year One',
    earnedAt: '2024-11-09T00:00:00.000Z',
    rarity: 'legendary',
    revealKind: 'video',
    revealMessage: "You flew out for the very first meetup. This one's just for the people who were in that room.",
    revealAuthor: '— NOVA_',
    revealMediaUrl: 'https://www.youtube.com/embed/bUPRxh9hghw',
  },
  {
    id: 'card-6',
    communityName: "KAIDO's Community",
    creatorName: 'KAIDO',
    iconEmoji: '🎯',
    title: 'Community Week Regular',
    earnedAt: '2025-01-12T00:00:00.000Z',
    rarity: 'rare',
    revealKind: 'animation',
    revealMessage: "Five Community Weeks in a row. That's not luck, that's showing up.",
    revealAuthor: '— KAIDO',
  },
  {
    id: 'card-7',
    communityName: "Lunarix's Community",
    creatorName: 'Lunarix',
    iconEmoji: '🌙',
    title: 'Strategy Vote Champion',
    earnedAt: '2025-04-30T00:00:00.000Z',
    rarity: 'common',
    revealKind: 'message',
    revealMessage: 'Your call in the strategy vote is the reason we won that one. Chat still brings it up.',
    revealAuthor: '— Lunarix',
  },
];

/** A user's collected Community Cards, mixed rarities/reveal types across
 *  several creators — the passport is meant to span communities, not just
 *  one. Face-down until flipped by the profile owner. */
export function createMockPassport(): KickPassport {
  return {
    handle: 'you',
    communitiesJoined: 12,
    cards: PASSPORT_CARDS,
  };
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
