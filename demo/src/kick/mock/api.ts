export type Channel = {
  slug: string;
  username: string;
  avatar: string;
  verified: boolean;
  followers: number;
};

export type Livestream = {
  id: number;
  channel: Channel;
  session_title: string;
  category: { name: string; slug: string; thumbnail: string };
  viewer_count: number;
  is_live: boolean;
  language: string;
  tags: string[];
  thumbnail: string;
  started_at: string;
  is_mature: boolean;
  hide_viewer_count?: boolean;
};

const avatarFiles = import.meta.glob("../avatars/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const art = import.meta.glob("../art/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const avatar = (slug: string) => {
  const url = avatarFiles[`../avatars/${slug}.svg`];
  if (!url) throw new Error(`No avatar for ${slug}. Add demo/src/kick/avatars/${slug}.svg`);
  return url;
};

// ponytail: category tiles and stream stills are still our own art. Replace them with the
// official kick.com artwork and real frames, captured with kick-page-clone.
const artUrl = (name: string) => art[`../art/${name}.svg`] ?? "";

export const bannerFor = (seed: string) => artUrl(`banner-${seed}`);

const channel = (
  slug: string,
  username: string,
  followers: number,
  verified = false,
): Channel => ({ slug, username, avatar: avatar(slug), verified, followers });

export const categories = [
  { name: "Old School RuneScape", slug: "old-school-runescape", viewers: 41208, thumbnail: artUrl("cat-old-school-runescape") },
  { name: "Just Chatting", slug: "just-chatting", viewers: 189440, thumbnail: artUrl("cat-just-chatting") },
  { name: "Slots & Casino", slug: "slots-casino", viewers: 96317, thumbnail: artUrl("cat-slots-casino") },
  { name: "Grand Theft Auto V", slug: "grand-theft-auto-v", viewers: 33902, thumbnail: artUrl("cat-grand-theft-auto-v") },
  { name: "IRL", slug: "irl", viewers: 27655, thumbnail: artUrl("cat-irl") },
  { name: "Counter-Strike 2", slug: "counter-strike-2", viewers: 21044, thumbnail: artUrl("cat-counter-strike-2") },
  { name: "Gakuen Idolmaster", slug: "gakuen-idolmaster", viewers: 4821, thumbnail: artUrl("cat-gakuen-idolmaster") },
  { name: "Just Sleeping", slug: "just-sleeping", viewers: 15773, thumbnail: artUrl("cat-just-sleeping") },
  { name: "Minecraft", slug: "minecraft", viewers: 12988, thumbnail: artUrl("cat-minecraft") },
  { name: "League of Legends", slug: "league-of-legends", viewers: 18402, thumbnail: artUrl("cat-league-of-legends") },
  { name: "Music", slug: "music", viewers: 9120, thumbnail: artUrl("cat-music") },
  { name: "VR Chat", slug: "vr-chat", viewers: 6644, thumbnail: artUrl("cat-vr-chat") },
];

const cat = (slug: string) => {
  const c = categories.find((x) => x.slug === slug) ?? categories[0];
  return { name: c.name, slug: c.slug, thumbnail: c.thumbnail };
};

export const evscape = channel("evscape", "EvScape", 184203, true);

export const livestreams: Livestream[] = [
  {
    id: 1,
    channel: evscape,
    session_title: "IRON HARDCORE RUN, ONE DEATH AND WE RESTART THE WHOLE THING",
    category: cat("old-school-runescape"),
    viewer_count: 4187,
    is_live: true,
    language: "English",
    tags: ["Ironman", "HCIM", "No Deaths"],
    thumbnail: artUrl("thumb-old-school-runescape-1"),
    started_at: "2026-07-26T09:12:00Z",
    is_mature: false,
    hide_viewer_count: true,
  },
  {
    id: 2,
    channel: channel("adrienbroner", "AdrienBroner", 512877, true),
    session_title: "the problem is asleep",
    category: cat("just-sleeping"),
    viewer_count: 1512,
    is_live: true,
    language: "English",
    tags: ["Sleeping"],
    thumbnail: artUrl("thumb-just-sleeping-1"),
    started_at: "2026-07-26T02:40:00Z",
    is_mature: false,
  },
  {
    id: 3,
    channel: channel("deenthegreat", "DeenTheGreat", 298310),
    session_title: "24 HOUR SLEEP STREAM DAY 3, DO NOT WAKE ME",
    category: cat("just-sleeping"),
    viewer_count: 7311,
    is_live: true,
    language: "English",
    tags: ["Sleeping", "24/7"],
    thumbnail: artUrl("thumb-just-sleeping-2"),
    started_at: "2026-07-25T20:05:00Z",
    is_mature: false,
  },
  {
    id: 4,
    channel: channel("hummdog", "hummdog", 44021),
    session_title: "bonus buys until the balance says no",
    category: cat("slots-casino"),
    viewer_count: 194,
    is_live: true,
    language: "English",
    tags: ["Slots", "Bonus Buys"],
    thumbnail: artUrl("thumb-slots-casino-1"),
    started_at: "2026-07-26T11:30:00Z",
    is_mature: true,
  },
  {
    id: 5,
    channel: channel("gnomonkey", "Gnomonkey", 71553),
    session_title: "fire cape or i uninstall",
    category: cat("old-school-runescape"),
    viewer_count: 180,
    is_live: true,
    language: "English",
    tags: ["Fight Caves"],
    thumbnail: artUrl("thumb-old-school-runescape-2"),
    started_at: "2026-07-26T10:02:00Z",
    is_mature: false,
  },
  {
    id: 6,
    channel: channel("kanzaki_ranko", "Kanzaki_Ranko", 9204),
    session_title: "produce plan week 12, we are so back",
    category: cat("gakuen-idolmaster"),
    viewer_count: 12,
    is_live: true,
    language: "Japanese",
    tags: ["Idol", "JP"],
    thumbnail: artUrl("thumb-gakuen-idolmaster-1"),
    started_at: "2026-07-26T12:15:00Z",
    is_mature: false,
  },
  {
    id: 7,
    channel: channel("blame", "Blame", 402881, true),
    session_title: "BLAME THE ELEPHANTS W/ @IcePoseidon",
    category: cat("irl"),
    viewer_count: 2744,
    is_live: true,
    language: "English",
    tags: ["IRL", "Travel"],
    thumbnail: artUrl("thumb-irl-1"),
    started_at: "2026-07-26T06:44:00Z",
    is_mature: false,
  },
  {
    id: 8,
    channel: channel("degendanuk", "DegenDanUK", 66190),
    session_title: "£500 start, we are not stopping until it is gone",
    category: cat("slots-casino"),
    viewer_count: 883,
    is_live: true,
    language: "English",
    tags: ["Slots", "UK"],
    thumbnail: artUrl("thumb-slots-casino-2"),
    started_at: "2026-07-26T13:00:00Z",
    is_mature: true,
  },
  {
    id: 9,
    channel: channel("thedoctor", "TheDoctor", 130744),
    session_title: "reading your medical questions, i am not a doctor",
    category: cat("just-chatting"),
    viewer_count: 429,
    is_live: true,
    language: "English",
    tags: ["Just Chatting"],
    thumbnail: artUrl("thumb-just-chatting-1"),
    started_at: "2026-07-26T12:50:00Z",
    is_mature: false,
  },
  {
    id: 10,
    channel: channel("sludgewizard", "SludgeWizard", 20117),
    session_title: "building the worst possible base, on purpose",
    category: cat("minecraft"),
    viewer_count: 1067,
    is_live: true,
    language: "English",
    tags: ["Minecraft", "Building"],
    thumbnail: artUrl("thumb-minecraft-1"),
    started_at: "2026-07-26T08:20:00Z",
    is_mature: false,
  },
  {
    id: 11,
    channel: channel("pixelgremlin", "PixelGremlin", 88420),
    session_title: "ranked grind, silver to global or i log off forever",
    category: cat("counter-strike-2"),
    viewer_count: 3390,
    is_live: true,
    language: "English",
    tags: ["Ranked", "FPS"],
    thumbnail: artUrl("thumb-counter-strike-2-1"),
    started_at: "2026-07-26T07:55:00Z",
    is_mature: false,
  },
  {
    id: 12,
    channel: channel("tinnedbeans", "TinnedBeans", 15308),
    session_title: "cooking every meal a viewer picks, no refusals",
    category: cat("irl"),
    viewer_count: 611,
    is_live: true,
    language: "English",
    tags: ["Cooking", "IRL"],
    thumbnail: artUrl("thumb-irl-2"),
    started_at: "2026-07-26T11:05:00Z",
    is_mature: false,
  },
];

export const followedChannels = [
  {
    ...evscape,
    live: true,
    category: "Old School RuneScape",
    viewers: undefined as number | undefined,
  },
  { ...channel("theburntpeanut", "TheBurntPeanut", 30211), live: false },
  { ...channel("slotden", "SlotDen", 51902), live: false },
  { ...channel("eddie", "Eddie", 283204, true), live: false },
];

export type ChannelVideo = {
  id: number;
  title: string;
  thumbnail: string;
  duration_seconds: number;
  view_count: number;
  category: { name: string; slug: string };
  created_at: string;
};

export type OfflineChannel = {
  channel: Channel;
  banner: string;
  last_live_at: string;
  videos: ChannelVideo[];
  clips: ChannelVideo[];
  recent_categories: { name: string; slug: string; thumbnail: string }[];
};

const video = (
  id: number,
  title: string,
  _seed: string,
  duration_seconds: number,
  view_count: number,
  catSlug: string,
  created_at: string,
): ChannelVideo => {
  const c = categories.find((x) => x.slug === catSlug) ?? categories[0];
  return {
    id,
    title,
    thumbnail: artUrl(`thumb-${c.slug}-${(id % 3) + 1}`),
    duration_seconds,
    view_count,
    category: { name: c.name, slug: c.slug },
    created_at,
  };
};

const catTile = (slug: string) => {
  const c = categories.find((x) => x.slug === slug) ?? categories[0];
  return { name: c.name, slug: c.slug, thumbnail: c.thumbnail };
};

export const offlineChannels: OfflineChannel[] = [
  {
    channel: channel("eddie", "Eddie", 283204, true),
    banner: artUrl("banner-eddie"),
    last_live_at: "2026-07-25T16:00:00Z",
    videos: [
      video(1, "Kick Talk Episode 99 Ft. Chat", "eddie-v1", 3981, 23700, "just-chatting", "2026-07-25T16:00:00Z"),
      video(2, "Stake Weekly Stream Episode 376", "eddie-v2", 7249, 103400, "slots-casino", "2026-07-25T09:00:00Z"),
      video(3, "Kick Talk Episode 98 Ft. Chat", "eddie-v3", 3982, 29500, "just-chatting", "2026-07-19T18:00:00Z"),
      video(4, "Stake Weekly Stream Episode 375", "eddie-v4", 7473, 65100, "slots-casino", "2026-07-19T09:00:00Z"),
      video(5, "Kick Talk Episode 97 Ft. Chat", "eddie-v5", 4027, 25800, "just-chatting", "2026-07-12T18:00:00Z"),
    ],
    clips: [
      video(11, "You're also up 13.7 Million Dollars", "eddie-c1", 50, 65400, "slots-casino", "2024-07-01T12:00:00Z"),
      video(12, "Rare non-autistic take from Ice", "eddie-c2", 50, 32900, "just-chatting", "2024-06-14T12:00:00Z"),
      video(13, "W Eddie", "eddie-c3", 60, 27100, "slots-casino", "2023-11-02T12:00:00Z"),
      video(14, "Eddie talks about Ice's Japan trip", "eddie-c4", 37, 20600, "slots-casino", "2025-04-18T12:00:00Z"),
      video(15, "OTK best org", "eddie-c5", 50, 14300, "just-chatting", "2024-02-09T12:00:00Z"),
    ],
    recent_categories: [catTile("just-chatting"), catTile("slots-casino"), catTile("irl")],
  },
  {
    channel: channel("theburntpeanut", "TheBurntPeanut", 30211),
    banner: artUrl("banner-theburntpeanut"),
    last_live_at: "2026-07-22T21:30:00Z",
    videos: [
      video(21, "burnt the roast again, chat is furious", "peanut-v1", 5210, 8800, "irl", "2026-07-22T21:30:00Z"),
      video(22, "one pot, one shot, no recipe", "peanut-v2", 4400, 6100, "irl", "2026-07-18T20:00:00Z"),
    ],
    clips: [
      video(31, "the smoke alarm becomes a bit", "peanut-c1", 42, 19400, "irl", "2026-06-30T12:00:00Z"),
      video(32, "chat orders the worst possible topping", "peanut-c2", 55, 12200, "irl", "2026-05-11T12:00:00Z"),
    ],
    recent_categories: [catTile("irl"), catTile("just-chatting")],
  },
  {
    channel: channel("slotden", "SlotDen", 51902),
    banner: artUrl("banner-slotden"),
    last_live_at: "2026-07-24T02:15:00Z",
    videos: [
      video(41, "the den opens at midnight, bring your own luck", "slotden-v1", 9100, 41200, "slots-casino", "2026-07-24T02:15:00Z"),
      video(42, "chasing one bonus for six hours straight", "slotden-v2", 21600, 58700, "slots-casino", "2026-07-20T01:00:00Z"),
    ],
    clips: [
      video(51, "the den has never been louder", "slotden-c1", 48, 88300, "slots-casino", "2026-07-02T12:00:00Z"),
      video(52, "balance goes up, den goes feral", "slotden-c2", 31, 44100, "slots-casino", "2026-06-08T12:00:00Z"),
    ],
    recent_categories: [catTile("slots-casino")],
  },
];

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const NOW = new Date("2026-07-26T13:30:00Z").getTime();

export function timeAgo(iso: string): string {
  const diff = Math.max(0, NOW - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

export const currentUser = {
  username: "Martibo",
  avatar: avatar("martibo"),
  followers: 1,
  bio: "Martibo's Kick Channel",
};

export function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}
