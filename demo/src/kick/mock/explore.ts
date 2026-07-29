import type { InteractionBadgeKey } from "../explore/badges";
import { textureUrl } from "../explore/textures";
import type {
  ChannelInteraction,
  ExploreChannel,
  ExploreCluster,
  ExploreOrigin,
  HomeBody,
} from "../explore/types";
import { categories, liveStreamFor, livestreams, type Livestream } from "./api";

// kick GET /public/v2/livestreams gives every field under `stream`. The coordinates, the privacy
// flag and the relay source have no public endpoint, so the map page labels them.
const SEED = 0x5eed_c0de;

const EXPLORE_NOW = new Date("2026-07-26T13:30:00Z").getTime();

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const art = import.meta.glob("../art/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const frame = (categorySlug: string, index: number) => {
  const name = `thumb-${categorySlug}-${(index % 3) + 1}`;
  const url = art[`../art/${name}.svg`];
  if (!url) throw new Error(`No frame for ${categorySlug}. Add demo/src/kick/art/${name}.svg`);
  return url;
};

export const DEFAULT_ORIGIN: ExploreOrigin = {
  lat: 37.7749,
  lng: -122.4194,
  label: "San Francisco (default region)",
  isFallback: true,
};

type City = { city: string; country: string; lat: number; lng: number };

const CITIES: City[] = [
  { city: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194 },
  { city: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437 },
  { city: "San Diego", country: "USA", lat: 32.7157, lng: -117.1611 },
  { city: "Seattle", country: "USA", lat: 47.6062, lng: -122.3321 },
  { city: "Portland", country: "USA", lat: 45.5152, lng: -122.6784 },
  { city: "Las Vegas", country: "USA", lat: 36.1699, lng: -115.1398 },
  { city: "Phoenix", country: "USA", lat: 33.4484, lng: -112.074 },
  { city: "Denver", country: "USA", lat: 39.7392, lng: -104.9903 },
  { city: "Austin", country: "USA", lat: 30.2672, lng: -97.7431 },
  { city: "Dallas", country: "USA", lat: 32.7767, lng: -96.797 },
  { city: "Houston", country: "USA", lat: 29.7604, lng: -95.3698 },
  { city: "Chicago", country: "USA", lat: 41.8781, lng: -87.6298 },
  { city: "Minneapolis", country: "USA", lat: 44.9778, lng: -93.265 },
  { city: "Atlanta", country: "USA", lat: 33.749, lng: -84.388 },
  { city: "Miami", country: "USA", lat: 25.7617, lng: -80.1918 },
  { city: "New York", country: "USA", lat: 40.7128, lng: -74.006 },
  { city: "Boston", country: "USA", lat: 42.3601, lng: -71.0589 },
  { city: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { city: "Montreal", country: "Canada", lat: 45.5019, lng: -73.5674 },
  { city: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207 },
  { city: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332 },
  { city: "Bogota", country: "Colombia", lat: 4.711, lng: -74.0721 },
  { city: "Lima", country: "Peru", lat: -12.0464, lng: -77.0428 },
  { city: "Santiago", country: "Chile", lat: -33.4489, lng: -70.6693 },
  { city: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816 },
  { city: "Sao Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  { city: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729 },
  { city: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  { city: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603 },
  { city: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { city: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038 },
  { city: "Barcelona", country: "Spain", lat: 41.3874, lng: 2.1686 },
  { city: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393 },
  { city: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  { city: "Berlin", country: "Germany", lat: 52.52, lng: 13.405 },
  { city: "Munich", country: "Germany", lat: 48.1351, lng: 11.582 },
  { city: "Zurich", country: "Switzerland", lat: 47.3769, lng: 8.5417 },
  { city: "Milan", country: "Italy", lat: 45.4642, lng: 9.19 },
  { city: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964 },
  { city: "Vienna", country: "Austria", lat: 48.2082, lng: 16.3738 },
  { city: "Prague", country: "Czechia", lat: 50.0755, lng: 14.4378 },
  { city: "Warsaw", country: "Poland", lat: 52.2297, lng: 21.0122 },
  { city: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686 },
  { city: "Oslo", country: "Norway", lat: 59.9139, lng: 10.7522 },
  { city: "Copenhagen", country: "Denmark", lat: 55.6761, lng: 12.5683 },
  { city: "Helsinki", country: "Finland", lat: 60.1699, lng: 24.9384 },
  { city: "Athens", country: "Greece", lat: 37.9838, lng: 23.7275 },
  { city: "Istanbul", country: "Turkiye", lat: 41.0082, lng: 28.9784 },
  { city: "Bucharest", country: "Romania", lat: 44.4268, lng: 26.1025 },
  { city: "Kyiv", country: "Ukraine", lat: 50.4501, lng: 30.5234 },
  { city: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708 },
  { city: "Tel Aviv", country: "Israel", lat: 32.0853, lng: 34.7818 },
  { city: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
  { city: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
  { city: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219 },
  { city: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473 },
  { city: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241 },
  { city: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
  { city: "Delhi", country: "India", lat: 28.7041, lng: 77.1025 },
  { city: "Bangalore", country: "India", lat: 12.9716, lng: 77.5946 },
  { city: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018 },
  { city: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { city: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456 },
  { city: "Manila", country: "Philippines", lat: 14.5995, lng: 120.9842 },
  { city: "Hong Kong", country: "China", lat: 22.3193, lng: 114.1694 },
  { city: "Taipei", country: "Taiwan", lat: 25.033, lng: 121.5654 },
  { city: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978 },
  { city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { city: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631 },
  { city: "Auckland", country: "New Zealand", lat: -36.8485, lng: 174.7633 },
];

// Demo's own live channels, pinned to a city that agrees with the language each one streams in.
const PINNED: { city: string; slug: string; interaction: ChannelInteraction }[] = [
  { city: "San Francisco", slug: "ironvow", interaction: { odds_denominator: 5, badges: ["responsive"] } },
  { city: "Los Angeles", slug: "nocturnalnorm", interaction: { odds_denominator: 34, badges: [] } },
  { city: "Sydney", slug: "snoozebaron", interaction: { odds_denominator: 40, badges: [] } },
  { city: "Amsterdam", slug: "reelgoblin", interaction: { odds_denominator: 12, badges: ["reads_everything"] } },
  { city: "Dublin", slug: "capequest", interaction: { odds_denominator: 8, badges: ["responsive"] } },
  { city: "Tokyo", slug: "chartfairy", interaction: { odds_denominator: 4, badges: ["responsive", "reads_everything"] } },
  { city: "Nairobi", slug: "wanderfuse", interaction: { odds_denominator: 21, badges: ["new_chatter_friendly"] } },
  { city: "London", slug: "tiltcabinet", interaction: { odds_denominator: 9, badges: ["responsive"] } },
  { city: "New York", slug: "notadoc", interaction: { odds_denominator: 6, badges: ["responsive", "new_chatter_friendly"] } },
  { city: "Berlin", slug: "mudbrickmage", interaction: { odds_denominator: 15, badges: ["new_chatter_friendly"] } },
  { city: "Warsaw", slug: "flickgremlin", interaction: { odds_denominator: 27, badges: [] } },
  { city: "Paris", slug: "panfriedpaul", interaction: { odds_denominator: 7, badges: ["responsive"] } },
  { city: "Chicago", slug: "couchsermon", interaction: { odds_denominator: 11, badges: ["reads_everything"] } },
  { city: "Toronto", slug: "yapmerchant", interaction: { odds_denominator: 3, badges: ["responsive", "new_chatter_friendly"] } },
  { city: "Las Vegas", slug: "spinvicar", interaction: { odds_denominator: 18, badges: [] } },
  { city: "Melbourne", slug: "cluecrawler", interaction: { odds_denominator: 13, badges: ["reads_everything"] } },
  { city: "Cape Town", slug: "vanlifevoid", interaction: { odds_denominator: 24, badges: [] } },
];

const NAME_PREFIXES = ["Neon", "Turbo", "Pixel", "Shadow", "Hyper", "Glitch", "Cosmic", "Retro", "Static", "Vapor", "Crimson", "Frost", "Ember", "Volt", "Lunar", "Feral", "Chrome", "Sonic", "Nova", "Drift"];
const NAME_SUFFIXES = ["Wolf", "Viper", "Queen", "Baron", "Gremlin", "Pilot", "Mage", "Rogue", "Falcon", "Otter", "Reaper", "Samurai", "Ninja", "Golem", "Racer", "Wizard", "Panda", "Comet", "Riot", "Byte"];

const CATEGORY_TITLES: Record<string, string[]> = {
  "old-school-runescape": [
    "quest cape or the account gets deleted",
    "dry streak day 40, the pet does not exist",
    "wildy slayer until i lose the whip",
    "chat votes every prayer flick tonight",
    "iron account, zero banked, all nerves",
  ],
  "just-chatting": [
    "reading your terrible advice out loud",
    "six hours, one topic, no conclusion",
    "chat decides what i eat for a week",
    "we are settling this argument tonight",
    "answering everything, regretting most",
  ],
  "slots-casino": [
    "bonus hunt, the balance is not real",
    "one more spin and then i sleep, lying",
    "chat picks every bet size from here",
    "the machine owes me and it knows",
    "hunting the max win, day four",
  ],
  "grand-theft-auto-v": [
    "roleplay night, my character has a job now",
    "heist prep with the worst crew online",
    "chat runs the getaway, we will crash",
    "one wanted level, zero plan",
    "cop shift, please commit less crime",
  ],
  irl: [
    "walking the whole city until my legs quit",
    "market run, chat orders the dinner",
    "the van picked the road, not me",
    "night bus tour with commentary",
    "cooking a viewer recipe, no refusals",
  ],
  "counter-strike-2": [
    "ranked grind, global or i log off",
    "aim warmup then straight into pain",
    "premier climb, chat calls the retakes",
    "clutch or kick, one of the two",
    "smoke lineups until they are muscle memory",
  ],
  "gakuen-idolmaster": [
    "produce plan week 12, we are so back",
    "S rank run, the schedule is perfect",
    "chat picks the lesson every time",
    "one bad audition and we restart",
    "idol grind, sleep is optional",
  ],
  "just-sleeping": [
    "asleep on camera, wake me and get banned",
    "24 hour sleep stream, do not knock",
    "night three, the pillow is winning",
    "sleeping until the alarm loses",
    "camera on, brain off, good night",
  ],
  minecraft: [
    "building the worst base on purpose",
    "hardcore world, one death and it ends",
    "chat designs the build, i suffer",
    "nether run with no armour",
    "redstone until the chunk gives up",
  ],
  "league-of-legends": [
    "climb to master or the account goes",
    "jungle gap, i am the gap",
    "chat picks my champion every game",
    "one more game, said four hours ago",
    "support duty, please follow up",
  ],
  music: [
    "taking requests until my voice quits",
    "beat building live, chat picks the drums",
    "vinyl night, no skips allowed",
    "writing a chorus with chat, badly",
    "cover set, you choose the key",
  ],
  "vr-chat": [
    "avatar tour, some of these are illegal",
    "world hopping until something breaks",
    "chat sends me to the strangest rooms",
    "full body tracking, zero coordination",
    "meeting strangers, staying polite",
  ],
};

// Share of Earth streamers who keep their location private, so they show on the Sun.
const HIDDEN_LOCATION_RATE = 0.12;

// Primary broadcast language per country, in the English exonyms mock/api.ts already uses.
const COUNTRY_LANGUAGE: Record<string, string> = {
  Mexico: "Spanish",
  Colombia: "Spanish",
  Peru: "Spanish",
  Chile: "Spanish",
  Argentina: "Spanish",
  Spain: "Spanish",
  Brazil: "Portuguese",
  Portugal: "Portuguese",
  France: "French",
  Germany: "German",
  Switzerland: "German",
  Austria: "German",
  Italy: "Italian",
  Poland: "Polish",
  Turkiye: "Turkish",
  Ukraine: "Ukrainian",
  UAE: "Arabic",
  Egypt: "Arabic",
  Japan: "Japanese",
  "South Korea": "Korean",
  China: "Chinese",
  Taiwan: "Chinese",
  Thailand: "Thai",
  Indonesia: "Indonesian",
};

const LOCAL_LANGUAGE_RATE = 0.65;

export const EXPLORE_CATEGORIES = categories.map((c) => c.name);

export const EXPLORE_LANGUAGES = ["English", ...new Set(Object.values(COUNTRY_LANGUAGE))];

// A ring offset near the antimeridian would otherwise push a dot out of range.
const wrapLng = (lng: number) => ((((lng + 180) % 360) + 360) % 360) - 180;

// A ring around a polar site (Shackleton sits at -89.9) would otherwise step over the pole.
const clampLat = (lat: number) => Math.max(-89.5, Math.min(89.5, lat));

type RelaySite = {
  place: string;
  region: string;
  lat: number;
  lng: number;
  channels: {
    username: string;
    agency: string;
    instrument: string;
    language?: string;
    viewers: number;
    odds: number;
  }[];
};

const MOON_SITES: RelaySite[] = [
  { place: "Mare Tranquillitatis", region: "Moon, near side", lat: 8.5, lng: 31.4, channels: [
    { username: "TranquillityBase24", agency: "NASA", instrument: "LRO Narrow Angle Camera", viewers: 2840, odds: 14 },
    { username: "ApolloArchiveCam", agency: "NASA", instrument: "Apollo 11 surface photography archive", viewers: 910, odds: 28 },
  ] },
  { place: "Shackleton Crater", region: "Moon, south pole", lat: -89.9, lng: 0, channels: [
    { username: "PolarShadowWatch", agency: "NASA", instrument: "LRO Diviner thermal maps", viewers: 1460, odds: 9 },
    { username: "IceProspector", agency: "ISRO", instrument: "Chandrayaan-2 OHRC", viewers: 620, odds: 22 },
  ] },
  { place: "Copernicus Crater", region: "Moon, near side", lat: 9.6, lng: -20.1, channels: [
    { username: "CraterWallCam", agency: "NASA", instrument: "LROC Wide Angle Camera", viewers: 780, odds: 31 },
    { username: "TerraceHunter", agency: "ESA", instrument: "SMART-1 AMIE archive", language: "German", viewers: 340, odds: 19 },
  ] },
  { place: "Tycho Crater", region: "Moon, southern highlands", lat: -43.3, lng: -11.4, channels: [
    { username: "RaySystemLive", agency: "NASA", instrument: "LRO Narrow Angle Camera", viewers: 1180, odds: 7 },
  ] },
  { place: "Oceanus Procellarum", region: "Moon, western near side", lat: 18.4, lng: -57.4, channels: [
    { username: "RegolithCam", agency: "CNSA", instrument: "Chang'e 5 panoramic camera archive", language: "Chinese", viewers: 2210, odds: 16 },
    { username: "BasaltDrifter", agency: "NASA", instrument: "LROC Wide Angle Camera", viewers: 430, odds: 35 },
  ] },
  { place: "Mare Imbrium", region: "Moon, near side", lat: 32.8, lng: -15.6, channels: [
    { username: "ImbriumRelay", agency: "CNSA", instrument: "Chang'e 3 terrain camera archive", language: "Chinese", viewers: 1520, odds: 12 },
    { username: "SeaOfRainsCast", agency: "JAXA", instrument: "Kaguya HDTV archive", language: "Japanese", viewers: 690, odds: 24 },
  ] },
  { place: "Aristarchus Crater", region: "Moon, near side", lat: 23.7, lng: -47.5, channels: [
    { username: "BrightestSpotCam", agency: "NASA", instrument: "LRO Narrow Angle Camera", viewers: 520, odds: 8 },
  ] },
  { place: "Mare Serenitatis", region: "Moon, near side", lat: 28.0, lng: 17.5, channels: [
    { username: "SelenoStream", agency: "JAXA", instrument: "Kaguya terrain camera archive", language: "Japanese", viewers: 1340, odds: 18 },
    { username: "LunaLurker", agency: "ESA", instrument: "SMART-1 AMIE archive", language: "French", viewers: 260, odds: 40 },
  ] },
];

const MARS_SITES: RelaySite[] = [
  { place: "Jezero Crater", region: "Mars, Syrtis Major", lat: 18.4, lng: 77.7, channels: [
    { username: "JezeroLive", agency: "NASA", instrument: "Perseverance Mastcam-Z", viewers: 4820, odds: 6 },
    { username: "DeltaFrontWatch", agency: "NASA", instrument: "Perseverance Navcam", viewers: 1730, odds: 15 },
    { username: "RotorcraftReplay", agency: "NASA", instrument: "Ingenuity return to Earth imagery", viewers: 2260, odds: 11 },
  ] },
  { place: "Gale Crater", region: "Mars, Aeolis quadrangle", lat: -5.4, lng: 137.8, channels: [
    { username: "MountSharpCam", agency: "NASA", instrument: "Curiosity Mastcam", viewers: 3140, odds: 9 },
    { username: "DustDevilPatrol", agency: "NASA", instrument: "Curiosity Navcam", viewers: 980, odds: 27 },
  ] },
  { place: "Olympus Mons", region: "Mars, Tharsis", lat: 18.65, lng: -133.8, channels: [
    { username: "OlympusOverwatch", agency: "ESA", instrument: "Mars Express HRSC", language: "German", viewers: 2680, odds: 13 },
    { username: "CalderaCast", agency: "NASA", instrument: "MRO HiRISE", viewers: 1120, odds: 21 },
  ] },
  { place: "Valles Marineris", region: "Mars, equatorial canyon", lat: -14, lng: -59, channels: [
    { username: "CanyonRimRelay", agency: "ESA", instrument: "ExoMars TGO CaSSIS", language: "Italian", viewers: 1940, odds: 10 },
    { username: "MarinerValleyCam", agency: "NASA", instrument: "MRO HiRISE", viewers: 760, odds: 33 },
  ] },
  { place: "Utopia Planitia", region: "Mars, northern lowlands", lat: 46.7, lng: 117.5, channels: [
    { username: "ZhurongTrackCam", agency: "CNSA", instrument: "Zhurong NaTeCam archive", language: "Chinese", viewers: 2050, odds: 17 },
    { username: "PlainsDriftWatch", agency: "Roscosmos", instrument: "Mars Express HRSC co-observation", language: "Ukrainian", viewers: 410, odds: 38 },
  ] },
  { place: "Hellas Planitia", region: "Mars, southern basin", lat: -42.4, lng: 70.5, channels: [
    { username: "BasinFloorRelay", agency: "ESA", instrument: "Mars Express HRSC", language: "French", viewers: 890, odds: 20 },
  ] },
];

export type ExploreCatalog = {
  clusters: ExploreCluster[];
  channels: ExploreChannel[];
};

export function buildExploreCatalog(seed = SEED): ExploreCatalog {
  const rng = mulberry32(seed);
  const pick = <T,>(list: T[]) => list[Math.floor(rng() * list.length)];

  const avatarPool = livestreams.map((s) => s.channel.avatar);
  const usedNames = new Set(livestreams.map((s) => s.channel.username));
  let streamId = 90_000;

  const nextName = () => {
    for (let attempt = 0; attempt < 50; attempt++) {
      const name = `${pick(NAME_PREFIXES)}${pick(NAME_SUFFIXES)}`;
      if (!usedNames.has(name)) {
        usedNames.add(name);
        return name;
      }
    }
    const name = `${pick(NAME_PREFIXES)}${pick(NAME_SUFFIXES)}${usedNames.size}`;
    usedNames.add(name);
    return name;
  };

  // Skewed towards small streams, with a few thousands-strong outliers.
  const viewersFor = () => Math.floor(80 + rng() * rng() * 5800);

  const startedAtFor = () =>
    new Date(EXPLORE_NOW - Math.floor(rng() * 12 * 3600) * 1000).toISOString();

  // Most channels have long odds, a minority are genuinely responsive, and the badges follow the
  // odds so both surfaces tell one story.
  const interactionFor = (): ChannelInteraction => {
    const odds = Math.max(3, Math.round(3 + rng() * rng() * 37));
    const badges: InteractionBadgeKey[] = [];
    if (odds <= 10) badges.push("responsive");
    if (odds <= 15 && rng() < 0.25) badges.push("reads_everything");
    if (rng() < 0.22) badges.push("new_chatter_friendly");
    return { odds_denominator: odds, badges };
  };

  const generatedStream = (language: string): Livestream => {
    const username = nextName();
    const category = pick(categories);
    const titles = CATEGORY_TITLES[category.slug];
    streamId += 1;
    return {
      id: streamId,
      channel: {
        slug: username.toLowerCase(),
        username,
        avatar: avatarPool[streamId % avatarPool.length],
        verified: rng() < 0.15,
        followers: Math.floor(400 + rng() * rng() * 240_000),
      },
      session_title: pick(titles),
      category: { name: category.name, slug: category.slug, thumbnail: category.thumbnail },
      viewer_count: viewersFor(),
      is_live: true,
      language,
      thumbnail: frame(category.slug, streamId),
      started_at: startedAtFor(),
      is_mature: rng() < 0.18,
    };
  };

  const relayStream = (
    site: RelaySite,
    def: RelaySite["channels"][number],
    body: "moon" | "mars",
  ): Livestream => {
    const irl = categories.find((c) => c.slug === "irl") ?? categories[0];
    streamId += 1;
    return {
      id: streamId,
      channel: {
        slug: def.username.toLowerCase(),
        username: def.username,
        avatar: avatarPool[streamId % avatarPool.length],
        verified: false,
        followers: def.viewers * 9,
      },
      session_title: `${def.agency} ${def.instrument}, relayed from ${site.place}`,
      category: { name: irl.name, slug: irl.slug, thumbnail: irl.thumbnail },
      viewer_count: def.viewers,
      is_live: true,
      language: def.language ?? "English",
      // A camera pointed at the surface really is this frame, and no gameplay still would fit.
      thumbnail: textureUrl(body),
      started_at: startedAtFor(),
      is_mature: false,
    };
  };

  const ringPlace = (cluster: { lat: number; lng: number }, channels: ExploreChannel[]) => {
    const ringPhase = rng() * Math.PI * 2;
    const lngStretch = 1 / Math.max(0.35, Math.cos((cluster.lat * Math.PI) / 180));
    channels.forEach((channel, i) => {
      const angle = ringPhase + (i / channels.length) * Math.PI * 2;
      const radius = 0.85 + rng() * 0.25;
      channel.lat = clampLat(cluster.lat + radius * Math.cos(angle));
      channel.lng = wrapLng(cluster.lng + radius * Math.sin(angle) * lngStretch);
    });
  };

  const totalViewers = (channels: ExploreChannel[]) =>
    channels.reduce((sum, ch) => sum + ch.stream.viewer_count, 0);

  const earthClusters: ExploreCluster[] = CITIES.map((cityDef, ci) => {
    const clusterId = `loc-${ci}-${cityDef.city.toLowerCase().replace(/[^a-z]+/g, "-")}`;
    const channels: ExploreChannel[] = [];

    const pinned = PINNED.find((p) => p.city === cityDef.city);
    if (pinned) {
      const stream = liveStreamFor(pinned.slug);
      if (!stream) throw new Error(`No livestream for ${pinned.slug}. Add it to mock/api.ts.`);
      channels.push({
        id: `ch-${clusterId}-${pinned.slug}`,
        stream,
        body: "earth",
        location_hidden: false,
        lat: 0,
        lng: 0,
        interaction: pinned.interaction,
      });
    }

    const localLanguage = COUNTRY_LANGUAGE[cityDef.country];
    const targetCount = 3 + Math.floor(rng() * 3);
    while (channels.length < targetCount) {
      const language = localLanguage && rng() < LOCAL_LANGUAGE_RATE ? localLanguage : "English";
      channels.push({
        id: `ch-${clusterId}-${channels.length}`,
        stream: generatedStream(language),
        body: "earth",
        location_hidden: rng() < HIDDEN_LOCATION_RATE,
        lat: 0,
        lng: 0,
        interaction: interactionFor(),
      });
    }

    channels.sort((a, b) => b.stream.viewer_count - a.stream.viewer_count);
    ringPlace(cityDef, channels);

    return {
      id: clusterId,
      city: cityDef.city,
      country: cityDef.country,
      body: "earth" as const,
      lat: cityDef.lat,
      lng: cityDef.lng,
      channels,
      total_viewer_count: totalViewers(channels),
    };
  });

  // A hidden streamer stays in the home cluster, flagged but not moved. clustersForBody derives the
  // Sun at render time, which is what lets the privacy toggle work in both directions.

  const relayClusters = (sites: RelaySite[], body: "moon" | "mars"): ExploreCluster[] =>
    sites.map((site, si) => {
      const slug = site.place.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const channels: ExploreChannel[] = site.channels.map((def, i) => {
        const angle = (i / site.channels.length) * Math.PI * 2;
        const lngStretch = 1 / Math.max(0.3, Math.cos((site.lat * Math.PI) / 180));
        return {
          id: `ch-${body}-${si}-${i}`,
          stream: relayStream(site, def, body),
          body: body as HomeBody,
          location_hidden: false,
          relay: { agency: def.agency, instrument: def.instrument },
          lat: clampLat(site.lat + 2.4 * Math.cos(angle)),
          lng: wrapLng(site.lng + 2.4 * Math.sin(angle) * lngStretch),
          interaction: {
            odds_denominator: def.odds,
            badges: def.odds <= 10 ? (["responsive"] as InteractionBadgeKey[]) : [],
          },
        };
      });
      return {
        id: `${body}-${si}-${slug}`,
        city: site.place,
        country: site.region,
        body,
        lat: site.lat,
        lng: site.lng,
        channels,
        total_viewer_count: totalViewers(channels),
      };
    });

  const clusters = [
    ...earthClusters,
    ...relayClusters(MOON_SITES, "moon"),
    ...relayClusters(MARS_SITES, "mars"),
  ];

  return { clusters, channels: clusters.flatMap((c) => c.channels) };
}

const catalog = buildExploreCatalog();

export const EXPLORE_CLUSTERS = catalog.clusters;
export const EXPLORE_CHANNELS = catalog.channels;

const channelById = new Map(EXPLORE_CHANNELS.map((ch) => [ch.id, ch]));
const clusterById = new Map(EXPLORE_CLUSTERS.map((c) => [c.id, c]));

export const findExploreChannel = (id: string) => channelById.get(id);
export const findExploreCluster = (id: string) => clusterById.get(id);
