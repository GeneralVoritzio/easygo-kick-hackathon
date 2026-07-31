export type Channel = {
  slug: string;
  username: string;
  avatar: string;
  verified: boolean;
  followers: number;
  is_partner: boolean;
};

export type Livestream = {
  id: number;
  channel: Channel;
  session_title: string;
  category: { name: string; slug: string; thumbnail: string };
  viewer_count: number;
  is_live: boolean;
  language: string;
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

export const avatarFor = avatar;

// ponytail: category tiles and stream stills are still our own art. Replace them with the
// official kick.com artwork and real frames, captured with kick-page-clone.
const artUrl = (name: string) => art[`../art/${name}.svg`] ?? "";

export const bannerFor = (seed: string) => artUrl(`banner-${seed}`);

const partnerSlugs = new Set([
  "ironvow",
  "couchsenate",
  "wanderfuse",
  "nocturnalnorm",
  "spinvicar",
  "midnightden",
  "charcoalchef",
  "superdude1337",
]);

const channel = (
  slug: string,
  username: string,
  followers: number,
  verified = false,
): Channel => ({
  slug,
  username,
  avatar: avatar(slug),
  verified,
  followers,
  is_partner: partnerSlugs.has(slug),
});

export type Category = {
  name: string;
  slug: string;
  viewers: number;
  thumbnail: string;
  tags: string[];
};

export const categories: Category[] = [
  { name: "Old School RuneScape", slug: "old-school-runescape", viewers: 41208, thumbnail: artUrl("cat-old-school-runescape"), tags: ["RPG", "MMO"] },
  { name: "Just Chatting", slug: "just-chatting", viewers: 189440, thumbnail: artUrl("cat-just-chatting"), tags: ["IRL", "Casual"] },
  { name: "Slots & Casino", slug: "slots-casino", viewers: 96317, thumbnail: artUrl("cat-slots-casino"), tags: ["Gambling"] },
  { name: "Grand Theft Auto V", slug: "grand-theft-auto-v", viewers: 33902, thumbnail: artUrl("cat-grand-theft-auto-v"), tags: ["Shooter", "Action"] },
  { name: "IRL", slug: "irl", viewers: 27655, thumbnail: artUrl("cat-irl"), tags: ["IRL", "Adventure"] },
  { name: "Counter-Strike 2", slug: "counter-strike-2", viewers: 21044, thumbnail: artUrl("cat-counter-strike-2"), tags: ["Shooter", "FPS"] },
  { name: "Gakuen Idolmaster", slug: "gakuen-idolmaster", viewers: 4821, thumbnail: artUrl("cat-gakuen-idolmaster"), tags: ["Simulator", "Casual"] },
  { name: "Just Sleeping", slug: "just-sleeping", viewers: 15773, thumbnail: artUrl("cat-just-sleeping"), tags: ["IRL", "Sleeping"] },
  { name: "Minecraft", slug: "minecraft", viewers: 12988, thumbnail: artUrl("cat-minecraft"), tags: ["Adventure"] },
  { name: "League of Legends", slug: "league-of-legends", viewers: 18402, thumbnail: artUrl("cat-league-of-legends"), tags: ["MOBA", "Action"] },
  { name: "Music", slug: "music", viewers: 9120, thumbnail: artUrl("cat-music"), tags: ["Casual"] },
  { name: "VR Chat", slug: "vr-chat", viewers: 6644, thumbnail: artUrl("cat-vr-chat"), tags: ["Simulator", "Casual"] },
];

export const cat = (slug: string) => {
  const c = categories.find((x) => x.slug === slug) ?? categories[0];
  return { name: c.name, slug: c.slug, thumbnail: c.thumbnail };
};

export const ironvow = channel("ironvow", "IronVow", 184203, true);

export const livestreams: Livestream[] = [
  {
    id: 1,
    channel: ironvow,
    session_title: "IRON HARDCORE RUN, ONE DEATH AND WE RESTART THE WHOLE THING",
    category: cat("old-school-runescape"),
    viewer_count: 4187,
    is_live: true,
    language: "English",
    thumbnail: artUrl("thumb-old-school-runescape-1"),
    started_at: "2026-07-26T09:12:00Z",
    is_mature: false,
    hide_viewer_count: true,
  },
  {
    id: 2,
    channel: channel("nocturnalnorm", "NocturnalNorm", 512877, true),
    session_title: "asleep on camera, day nine",
    category: cat("just-sleeping"),
    viewer_count: 1512,
    is_live: true,
    language: "English",
    thumbnail: artUrl("thumb-just-sleeping-1"),
    started_at: "2026-07-26T02:40:00Z",
    is_mature: false,
  },
  {
    id: 3,
    channel: channel("snoozebaron", "SnoozeBaron", 298310),
    session_title: "24 HOUR SLEEP STREAM DAY 3, DO NOT WAKE ME",
    category: cat("just-sleeping"),
    viewer_count: 7311,
    is_live: true,
    language: "English",
    thumbnail: artUrl("thumb-just-sleeping-2"),
    started_at: "2026-07-25T20:05:00Z",
    is_mature: false,
  },
  {
    id: 4,
    channel: channel("reelgoblin", "reelgoblin", 44021),
    session_title: "bonus buys until the balance says no",
    category: cat("slots-casino"),
    viewer_count: 194,
    is_live: true,
    language: "English",
    thumbnail: artUrl("thumb-slots-casino-1"),
    started_at: "2026-07-26T11:30:00Z",
    is_mature: true,
  },
  {
    id: 5,
    channel: channel("capequest", "CapeQuest", 71553),
    session_title: "fire cape or i uninstall",
    category: cat("old-school-runescape"),
    viewer_count: 180,
    is_live: true,
    language: "English",
    thumbnail: artUrl("thumb-old-school-runescape-2"),
    started_at: "2026-07-26T10:02:00Z",
    is_mature: false,
  },
  {
    id: 6,
    channel: channel("chartfairy", "ChartFairy", 9204),
    session_title: "produce plan week 12, we are so back",
    category: cat("gakuen-idolmaster"),
    viewer_count: 12,
    is_live: true,
    language: "Japanese",
    thumbnail: artUrl("thumb-gakuen-idolmaster-1"),
    started_at: "2026-07-26T12:15:00Z",
    is_mature: false,
  },
  {
    id: 7,
    channel: channel("wanderfuse", "WanderFuse", 402881, true),
    session_title: "WE FOUND THE ELEPHANTS AND THEY FOUND THE VAN",
    category: cat("irl"),
    viewer_count: 2744,
    is_live: true,
    language: "English",
    thumbnail: artUrl("thumb-irl-1"),
    started_at: "2026-07-26T06:44:00Z",
    is_mature: false,
  },
  {
    id: 8,
    channel: channel("tiltcabinet", "TiltCabinet", 66190),
    session_title: "£500 start, we are not stopping until it is gone",
    category: cat("slots-casino"),
    viewer_count: 883,
    is_live: true,
    language: "English",
    thumbnail: artUrl("thumb-slots-casino-2"),
    started_at: "2026-07-26T13:00:00Z",
    is_mature: true,
  },
  {
    id: 9,
    channel: channel("notadoc", "NotADoc", 130744),
    session_title: "reading your medical questions, i am not a doctor",
    category: cat("just-chatting"),
    viewer_count: 429,
    is_live: true,
    language: "English",
    thumbnail: artUrl("thumb-just-chatting-1"),
    started_at: "2026-07-26T12:50:00Z",
    is_mature: false,
  },
  {
    id: 10,
    channel: channel("mudbrickmage", "MudbrickMage", 20117),
    session_title: "building the worst possible base, on purpose",
    category: cat("minecraft"),
    viewer_count: 1067,
    is_live: true,
    language: "English",
    thumbnail: artUrl("thumb-minecraft-1"),
    started_at: "2026-07-26T08:20:00Z",
    is_mature: false,
  },
  {
    id: 11,
    channel: channel("flickgremlin", "FlickGremlin", 88420),
    session_title: "ranked grind, silver to global or i log off forever",
    category: cat("counter-strike-2"),
    viewer_count: 3390,
    is_live: true,
    language: "English",
    thumbnail: artUrl("thumb-counter-strike-2-1"),
    started_at: "2026-07-26T07:55:00Z",
    is_mature: false,
  },
  {
    id: 12,
    channel: channel("panfriedpaul", "PanfriedPaul", 15308),
    session_title: "cooking every meal a viewer picks, no refusals",
    category: cat("irl"),
    viewer_count: 611,
    is_live: true,
    language: "English",
    thumbnail: artUrl("thumb-irl-2"),
    started_at: "2026-07-26T11:05:00Z",
    is_mature: false,
  },
  {
    id: 13,
    channel: channel("couchsermon", "CouchSermon", 57330),
    session_title: "hot takes only, you are all wrong and i will prove it",
    category: cat("just-chatting"),
    viewer_count: 2210,
    is_live: true,
    language: "English",
    thumbnail: artUrl("thumb-just-chatting-2"),
    started_at: "2026-07-26T10:40:00Z",
    is_mature: false,
  },
  {
    id: 14,
    channel: channel("yapmerchant", "YapMerchant", 24885),
    session_title: "six hours of talking, zero points made",
    category: cat("just-chatting"),
    viewer_count: 764,
    is_live: true,
    language: "English",
    thumbnail: artUrl("thumb-just-chatting-3"),
    started_at: "2026-07-26T13:25:00Z",
    is_mature: false,
  },
  {
    id: 15,
    channel: channel("spinvicar", "SpinVicar", 103470, true),
    session_title: "blessing every spin, the machine is listening",
    category: cat("slots-casino"),
    viewer_count: 5108,
    is_live: true,
    language: "English",
    thumbnail: artUrl("thumb-slots-casino-3"),
    started_at: "2026-07-26T09:50:00Z",
    is_mature: true,
  },
  {
    id: 16,
    channel: channel("cluecrawler", "ClueCrawler", 38914),
    session_title: "master clues until a third age drops or i do",
    category: cat("old-school-runescape"),
    viewer_count: 1339,
    is_live: true,
    language: "English",
    thumbnail: artUrl("thumb-old-school-runescape-3"),
    started_at: "2026-07-26T08:05:00Z",
    is_mature: false,
  },
  {
    id: 17,
    channel: channel("vanlifevoid", "VanlifeVoid", 61228),
    session_title: "the van broke down again, chat picks the tow truck",
    category: cat("irl"),
    viewer_count: 1874,
    is_live: true,
    language: "English",
    thumbnail: artUrl("thumb-irl-3"),
    started_at: "2026-07-26T12:30:00Z",
    is_mature: false,
  },
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

export type ChannelSocial = {
  icon: "instagram" | "x" | "youtube" | "discord";
  handle: string;
};

export type ChannelPanel =
  | { kind: "text"; title: string; body: string }
  | { kind: "image"; art: string; alt: string };

export type ChannelProfile = {
  channel: Channel;
  banner: string;
  bio: string;
  last_live_at: string;
  socials: ChannelSocial[];
  panels: ChannelPanel[];
  videos: ChannelVideo[];
  recent_categories: { name: string; slug: string; thumbnail: string }[];
};

type VideoSeed = [title: string, duration_seconds: number, view_count: number, created_at: string];

let videoId = 0;

const videos = (catSlug: string, seeds: VideoSeed[]): ChannelVideo[] =>
  seeds.map(([title, duration_seconds, view_count, created_at]) => {
    videoId += 1;
    const c = categories.find((x) => x.slug === catSlug) ?? categories[0];
    return {
      id: videoId,
      title,
      thumbnail: artUrl(`thumb-${c.slug}-${(videoId % 3) + 1}`),
      duration_seconds,
      view_count,
      category: { name: c.name, slug: c.slug },
      created_at,
    };
  });

const catTile = (slug: string) => {
  const c = categories.find((x) => x.slug === slug) ?? categories[0];
  return { name: c.name, slug: c.slug, thumbnail: c.thumbnail };
};

export const channelProfiles: ChannelProfile[] = [
  {
    channel: ironvow,
    banner: artUrl("banner-ironvow"),
    bio: "Hardcore ironman, no bank, no mercy. One death and the whole account starts again.",
    last_live_at: "2026-07-26T09:12:00Z",
    socials: [{ icon: "youtube", handle: "IronVowOSRS" }, { icon: "discord", handle: "ironvow" }],
    panels: [
      { kind: "image", art: artUrl("panel-energy"), alt: "Energy drink sponsor panel" },
      { kind: "text", title: "Account rules", body: "Hardcore ironman. One death ends the account and we start again from tutorial island." },
      { kind: "image", art: artUrl("panel-community"), alt: "Discord community panel" },
    ],
    videos: videos("old-school-runescape", [
      ["RADIANT OATHPLATE TODAY OR THE ACCOUNT GOES", 18240, 142300, "2026-07-25T09:00:00Z"],
      ["fire cape attempt 14, chat is not helping", 9820, 88700, "2026-07-23T10:30:00Z"],
      ["full clear of the quest cape checklist", 21600, 64100, "2026-07-20T08:15:00Z"],
    ]),
    recent_categories: [catTile("old-school-runescape"), catTile("just-chatting")],
  },
  {
    channel: channel("nocturnalnorm", "NocturnalNorm", 512877, true),
    banner: "",
    bio: "I sleep on camera and chat pays for the alarm. Nine days and counting.",
    last_live_at: "2026-07-26T02:40:00Z",
    socials: [{ icon: "instagram", handle: "nocturnalnorm" }, { icon: "x", handle: "NocturnalNorm" }],
    panels: [
      { kind: "text", title: "Nine day sleep run", body: "The camera stays on until day 45. Chat decides when the alarm goes off." },
      { kind: "image", art: artUrl("panel-merch"), alt: "Merch drop panel" },
    ],
    videos: videos("just-sleeping", [
      ["the problem sleeps through his own alarm", 28800, 211400, "2026-07-24T02:00:00Z"],
      ["gym at 4am then straight back to bed", 7200, 96200, "2026-07-21T04:10:00Z"],
    ]),
    recent_categories: [catTile("just-sleeping"), catTile("irl")],
  },
  {
    channel: channel("snoozebaron", "SnoozeBaron", 298310),
    banner: "",
    bio: "Sleep streams, long walks, and whatever chat votes for at 3am.",
    last_live_at: "2026-07-25T20:05:00Z",
    socials: [{ icon: "instagram", handle: "snoozebaron" }],
    panels: [
      { kind: "image", art: artUrl("panel-schedule"), alt: "Stream schedule panel" },
      { kind: "image", art: artUrl("panel-community"), alt: "Discord community panel" },
      { kind: "text", title: "Sleep stream rules", body: "Do not wake me. The alarm belongs to chat and it costs 500 KICKs." },
    ],
    videos: videos("just-sleeping", [
      ["24 HOUR SLEEP STREAM DAY 2, DO NOT WAKE ME", 86400, 318900, "2026-07-24T20:00:00Z"],
      ["day 1 of the sleep marathon, chat is feral", 86400, 274600, "2026-07-23T20:00:00Z"],
    ]),
    recent_categories: [catTile("just-sleeping"), catTile("just-chatting")],
  },
  {
    channel: channel("reelgoblin", "reelgoblin", 44021),
    banner: "",
    bio: "Bonus buys until the balance says no. It usually says no.",
    last_live_at: "2026-07-26T11:30:00Z",
    socials: [{ icon: "x", handle: "reelgoblin" }],
    panels: [
      { kind: "image", art: artUrl("panel-sponsor"), alt: "Official sponsor panel" },
    ],
    videos: videos("slots-casino", [
      ["the balance survived one hour, a record", 5400, 38200, "2026-07-24T11:00:00Z"],
      ["every bonus bought back to back, no thinking", 10800, 51700, "2026-07-22T12:30:00Z"],
    ]),
    recent_categories: [catTile("slots-casino")],
  },
  {
    channel: channel("capequest", "CapeQuest", 71553),
    banner: "",
    bio: "Fire cape or I uninstall. I have said this 40 times.",
    last_live_at: "2026-07-26T10:02:00Z",
    socials: [{ icon: "youtube", handle: "CapeQuest" }],
    panels: [
      { kind: "text", title: "Cape checklist", body: "Fire cape first, infernal after. Chat counts every failed attempt out loud." },
      { kind: "image", art: artUrl("panel-community"), alt: "Discord community panel" },
    ],
    videos: videos("old-school-runescape", [
      ["fight caves until it happens, no breaks", 14400, 42800, "2026-07-24T09:45:00Z"],
      ["slayer grind and honest life advice", 12600, 19300, "2026-07-19T11:00:00Z"],
    ]),
    recent_categories: [catTile("old-school-runescape")],
  },
  {
    channel: channel("chartfairy", "ChartFairy", 9204),
    banner: "",
    bio: "Produce plan week 12. Charts, costumes, and one perfect combo.",
    last_live_at: "2026-07-26T12:15:00Z",
    socials: [{ icon: "x", handle: "chartfairy" }, { icon: "youtube", handle: "ChartFairyLive" }],
    panels: [
      { kind: "image", art: artUrl("panel-merch"), alt: "Merch drop panel" },
      { kind: "text", title: "Produce plan", body: "Week 12 of the current run. Chart requests open at the top of each hour." },
      { kind: "image", art: artUrl("panel-schedule"), alt: "Stream schedule panel" },
    ],
    videos: videos("gakuen-idolmaster", [
      ["produce plan week 11, the comeback arc", 10800, 7400, "2026-07-24T12:00:00Z"],
      ["reading chat in two languages badly", 5400, 3100, "2026-07-18T13:20:00Z"],
    ]),
    recent_categories: [catTile("gakuen-idolmaster"), catTile("music")],
  },
  {
    channel: channel("wanderfuse", "WanderFuse", 402881, true),
    banner: "",
    bio: "Travel, elephants, and whatever happens when the camera stays on.",
    last_live_at: "2026-07-26T06:44:00Z",
    socials: [{ icon: "instagram", handle: "wanderfuse" }, { icon: "x", handle: "wanderfuse" }],
    panels: [
      { kind: "image", art: artUrl("panel-gear"), alt: "Desk gear panel" },
      { kind: "image", art: artUrl("panel-merch"), alt: "Merch drop panel" },
    ],
    videos: videos("irl", [
      ["BLAME THE ELEPHANTS DAY 2, WE FOUND MORE", 25200, 187600, "2026-07-25T06:30:00Z"],
      ["lost the passport, found a better story", 18000, 121400, "2026-07-22T07:15:00Z"],
    ]),
    recent_categories: [catTile("irl"), catTile("just-chatting")],
  },
  {
    channel: channel("tiltcabinet", "TiltCabinet", 66190),
    banner: "",
    bio: "£500 start, we are not stopping until it is gone. It is always gone.",
    last_live_at: "2026-07-26T13:00:00Z",
    socials: [{ icon: "x", handle: "TiltCabinet" }],
    panels: [
      { kind: "image", art: artUrl("panel-sponsor"), alt: "Official sponsor panel" },
      { kind: "text", title: "18+ only", body: "Real money play. Never bet more than you can lose." },
    ],
    videos: videos("slots-casino", [
      ["£500 start and a very short evening", 7200, 44900, "2026-07-24T22:00:00Z"],
      ["chat picks every spin, I take no blame", 9000, 33500, "2026-07-21T23:30:00Z"],
    ]),
    recent_categories: [catTile("slots-casino")],
  },
  {
    channel: channel("notadoc", "NotADoc", 130744),
    banner: "",
    bio: "Reading your medical questions. I am not a doctor. The name is a joke.",
    last_live_at: "2026-07-26T12:50:00Z",
    socials: [{ icon: "x", handle: "NotADoc" }, { icon: "discord", handle: "notadoc" }],
    panels: [
      { kind: "text", title: "Not a doctor", body: "The name is a joke. Ask a real doctor about anything that matters." },
    ],
    videos: videos("just-chatting", [
      ["reading your symptoms and panicking with you", 12600, 71200, "2026-07-24T12:30:00Z"],
      ["chat diagnoses me instead, it goes badly", 9000, 48800, "2026-07-20T13:00:00Z"],
    ]),
    recent_categories: [catTile("just-chatting"), catTile("irl")],
  },
  {
    channel: channel("mudbrickmage", "MudbrickMage", 20117),
    banner: "",
    bio: "Building the worst possible base, on purpose, every single night.",
    last_live_at: "2026-07-26T08:20:00Z",
    socials: [{ icon: "youtube", handle: "MudbrickMage" }],
    panels: [
      { kind: "image", art: artUrl("panel-gear"), alt: "Desk gear panel" },
      { kind: "image", art: artUrl("panel-schedule"), alt: "Stream schedule panel" },
      { kind: "text", title: "Build rules", body: "Chat designs it, I build it, and it falls over before the night ends." },
    ],
    videos: videos("minecraft", [
      ["the tower of bad decisions reaches build limit", 16200, 27400, "2026-07-24T08:00:00Z"],
      ["chat designs the base and it collapses", 10800, 18900, "2026-07-19T09:30:00Z"],
    ]),
    recent_categories: [catTile("minecraft")],
  },
  {
    channel: channel("flickgremlin", "FlickGremlin", 88420),
    banner: "",
    bio: "Silver to global or I log off forever. Still silver. Still here.",
    last_live_at: "2026-07-26T07:55:00Z",
    socials: [{ icon: "x", handle: "FlickGremlin" }, { icon: "discord", handle: "flickgremlin" }],
    panels: [
      { kind: "image", art: artUrl("panel-gear"), alt: "Desk gear panel" },
      { kind: "text", title: "Rank goal", body: "Silver to global. Day 30 and the rank has not moved once." },
      { kind: "image", art: artUrl("panel-energy"), alt: "Energy drink sponsor panel" },
    ],
    videos: videos("counter-strike-2", [
      ["ranked grind day 30, the rank has not moved", 14400, 59300, "2026-07-24T07:30:00Z"],
      ["aim training for six hours then losing anyway", 21600, 41100, "2026-07-18T08:00:00Z"],
    ]),
    recent_categories: [catTile("counter-strike-2"), catTile("league-of-legends")],
  },
  {
    channel: channel("panfriedpaul", "PanfriedPaul", 15308),
    banner: "",
    bio: "Cooking every meal a viewer picks. No refusals. There have been consequences.",
    last_live_at: "2026-07-26T11:05:00Z",
    socials: [{ icon: "instagram", handle: "panfriedpaul" }],
    panels: [
      { kind: "text", title: "Meal requests", body: "Chat picks every meal. No refusals, and there have been consequences." },
      { kind: "image", art: artUrl("panel-schedule"), alt: "Stream schedule panel" },
    ],
    videos: videos("irl", [
      ["chat picked the worst possible breakfast", 7200, 22600, "2026-07-24T10:45:00Z"],
      ["one pot, four ingredients, zero skill", 5400, 14800, "2026-07-20T11:20:00Z"],
    ]),
    recent_categories: [catTile("irl"), catTile("just-chatting")],
  },
  {
    channel: channel("couchsenate", "CouchSenate", 283204, true),
    banner: artUrl("banner-couchsenate"),
    bio: "A talk show on Monday, a slots night on Saturday, opinions the rest of the week.",
    last_live_at: "2026-07-25T16:00:00Z",
    socials: [{ icon: "x", handle: "CouchSenate" }, { icon: "youtube", handle: "CouchSenateTV" }, { icon: "instagram", handle: "couchsenate" }],
    panels: [
      { kind: "image", art: artUrl("panel-sponsor"), alt: "Official sponsor panel" },
      { kind: "image", art: artUrl("panel-community"), alt: "Discord community panel" },
      { kind: "text", title: "Couch Senate", body: "A new episode every Monday with chat in the room." },
    ],
    videos: videos("just-chatting", [
      ["Couch Senate Episode 99 Ft. Chat", 3981, 23700, "2026-07-25T16:00:00Z"],
      ["Saturday Night Reels Episode 376", 7249, 103400, "2026-07-25T09:00:00Z"],
      ["Couch Senate Episode 98 Ft. Chat", 3982, 29500, "2026-07-19T18:00:00Z"],
      ["Saturday Night Reels Episode 375", 7473, 65100, "2026-07-19T09:00:00Z"],
      ["Couch Senate Episode 97 Ft. Chat", 4027, 25800, "2026-07-12T18:00:00Z"],
    ]),
    recent_categories: [catTile("just-chatting"), catTile("slots-casino"), catTile("irl")],
  },
  {
    channel: channel("charcoalchef", "CharcoalChef", 30211),
    banner: artUrl("banner-charcoalchef"),
    bio: "Burnt the roast again. The smoke alarm is part of the show now.",
    last_live_at: "2026-07-22T21:30:00Z",
    socials: [{ icon: "instagram", handle: "charcoalchef" }],
    panels: [
      { kind: "image", art: artUrl("panel-merch"), alt: "Merch drop panel" },
    ],
    videos: videos("irl", [
      ["burnt the roast again, chat is furious", 5210, 8800, "2026-07-22T21:30:00Z"],
      ["one pot, one shot, no recipe", 4400, 6100, "2026-07-18T20:00:00Z"],
    ]),
    recent_categories: [catTile("irl"), catTile("just-chatting")],
  },
  {
    channel: channel("midnightden", "MidnightDen", 51902),
    banner: artUrl("banner-midnightden"),
    bio: "The den opens at midnight. Bring your own luck, we ran out.",
    last_live_at: "2026-07-24T02:15:00Z",
    socials: [{ icon: "x", handle: "MidnightDen" }],
    panels: [
      { kind: "text", title: "18+ only", body: "The den opens at midnight. Real money play, so set a limit first." },
      { kind: "image", art: artUrl("panel-sponsor"), alt: "Official sponsor panel" },
      { kind: "image", art: artUrl("panel-energy"), alt: "Energy drink sponsor panel" },
    ],
    videos: videos("slots-casino", [
      ["the den opens at midnight, bring your own luck", 9100, 41200, "2026-07-24T02:15:00Z"],
      ["chasing one bonus for six hours straight", 21600, 58700, "2026-07-20T01:00:00Z"],
    ]),
    recent_categories: [catTile("slots-casino")],
  },
];

export const profileFor = (slug: string) =>
  channelProfiles.find((p) => p.channel.slug === slug);

export const liveStreamFor = (slug: string) =>
  livestreams.find((s) => s.channel.slug === slug);

export const followedChannels = ["ironvow", "charcoalchef", "midnightden", "couchsenate"].map(
  (slug) => {
    const profile = profileFor(slug);
    if (!profile) throw new Error(`No channel profile for followed channel ${slug}`);
    const live = liveStreamFor(slug);
    return {
      ...profile.channel,
      banner: profile.banner,
      live: Boolean(live),
      category: live ? live.category.name : profile.recent_categories[0].name,
      viewers: live && !live.hide_viewer_count ? live.viewer_count : undefined,
    };
  },
);

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

export const superdude = channel("superdude1337", "SuperDude1337", 18430);

export const currentUser = {
  ...superdude,
  bio: "SuperDude1337's Kick Channel",
  banner: artUrl("banner-midnightden"),
  offlineBanner: artUrl("thumb-just-chatting-1"),
};

// The dashboard runs on a live session, because a raid starts when a stream ends.
export const currentSession = {
  title: "last stream before the break, chat picks where we go next",
  viewer_count: 1240,
  subscriber_count: 312,
  time_live: "3:15:22",
  thumbnail: artUrl("thumb-just-chatting-1"),
};

const knownChannels = [
  superdude,
  ...channelProfiles.map((p) => p.channel),
  ...livestreams.map((s) => s.channel),
];

export const channelBySlug = (slug: string) => {
  const found = knownChannels.find((c) => c.slug === slug);
  if (!found) throw new Error(`No channel for ${slug}. Add it to livestreams or channelProfiles.`);
  return found;
};

export const channelByUsername = (username: string) => {
  const wanted = username.trim().toLowerCase();
  return knownChannels.find((c) => c.username.toLowerCase() === wanted);
};

export function streamPills(stream: Livestream): string[] {
  const pills = [stream.category.name, stream.language];
  if (stream.is_mature) pills.push("18+");
  return pills;
}

export function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}
