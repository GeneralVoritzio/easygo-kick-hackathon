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

const avatar = (slug: string) => {
  const url = avatarFiles[`../avatars/${slug}.svg`];
  if (!url) throw new Error(`No avatar for ${slug}. Add demo/src/kick/avatars/${slug}.svg`);
  return url;
};

// ponytail: stream and category stills are still remote placeholders. Replace them
// with real KICK frames and the official category art, captured with kick-page-clone.
const still = (seed: string, w = 640, h = 360) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const channel = (
  slug: string,
  username: string,
  followers: number,
  verified = false,
): Channel => ({ slug, username, avatar: avatar(slug), verified, followers });

export const categories = [
  { name: "Old School RuneScape", slug: "old-school-runescape", viewers: 41208, thumbnail: still("osrs", 285, 380) },
  { name: "Just Chatting", slug: "just-chatting", viewers: 189440, thumbnail: still("justchatting", 285, 380) },
  { name: "Slots & Casino", slug: "slots-casino", viewers: 96317, thumbnail: still("slots", 285, 380) },
  { name: "Grand Theft Auto V", slug: "grand-theft-auto-v", viewers: 33902, thumbnail: still("gtav", 285, 380) },
  { name: "IRL", slug: "irl", viewers: 27655, thumbnail: still("irl", 285, 380) },
  { name: "Counter-Strike 2", slug: "counter-strike-2", viewers: 21044, thumbnail: still("cs2", 285, 380) },
  { name: "Gakuen Idolmaster", slug: "gakuen-idolmaster", viewers: 4821, thumbnail: still("idolmaster", 285, 380) },
  { name: "Just Sleeping", slug: "just-sleeping", viewers: 15773, thumbnail: still("sleeping", 285, 380) },
  { name: "Minecraft", slug: "minecraft", viewers: 12988, thumbnail: still("minecraft", 285, 380) },
  { name: "League of Legends", slug: "league-of-legends", viewers: 18402, thumbnail: still("lol", 285, 380) },
  { name: "Music", slug: "music", viewers: 9120, thumbnail: still("music", 285, 380) },
  { name: "VR Chat", slug: "vr-chat", viewers: 6644, thumbnail: still("vrchat", 285, 380) },
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
    thumbnail: still("evscape"),
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
    thumbnail: still("adrienbroner"),
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
    thumbnail: still("deenthegreat"),
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
    thumbnail: still("hummdog"),
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
    thumbnail: still("gnomonkey"),
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
    thumbnail: still("kanzaki"),
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
    thumbnail: still("blame"),
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
    thumbnail: still("degendan"),
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
    thumbnail: still("thedoctor"),
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
    thumbnail: still("sludgewizard"),
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
    thumbnail: still("pixelgremlin"),
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
    thumbnail: still("tinnedbeans"),
    started_at: "2026-07-26T11:05:00Z",
    is_mature: false,
  },
];

export const followedChannels = [
  { ...channel("theburntpeanut", "TheBurntPeanut", 30211), live: false },
  { ...channel("slotden", "SlotDen", 51902), live: false },
  { ...channel("eddie", "Eddie", 220455, true), live: false },
];

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
