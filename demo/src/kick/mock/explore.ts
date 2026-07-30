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

// The origin only aims the camera. It is a country, like everything else on this map.
export const DEFAULT_ORIGIN: ExploreOrigin = {
  lat: 39.5,
  lng: -98.35,
  label: "the United States (default region)",
  isFallback: true,
};

type Country = { country: string; region: string; lat: number; lng: number; language?: string };

// One anchor per country, chosen by hand to sit on land and to read as that country. An average of
// city coordinates puts the United States in the sea off Alaska and Russia in the Arctic.
const COUNTRIES: Country[] = [
  { country: "United States", region: "North America", lat: 39.5, lng: -98.35 },
  { country: "Canada", region: "North America", lat: 56.0, lng: -106.0 },
  { country: "Mexico", region: "North America", lat: 23.6, lng: -102.5, language: "Spanish" },
  { country: "Brazil", region: "South America", lat: -10.3, lng: -52.0, language: "Portuguese" },
  { country: "Argentina", region: "South America", lat: -34.6, lng: -64.0, language: "Spanish" },
  { country: "Chile", region: "South America", lat: -35.0, lng: -71.4, language: "Spanish" },
  { country: "Peru", region: "South America", lat: -9.2, lng: -75.0, language: "Spanish" },
  { country: "Colombia", region: "South America", lat: 4.0, lng: -73.0, language: "Spanish" },
  { country: "Ecuador", region: "South America", lat: -1.4, lng: -78.4, language: "Spanish" },
  { country: "Uruguay", region: "South America", lat: -32.8, lng: -56.0, language: "Spanish" },
  { country: "United Kingdom", region: "Western Europe", lat: 53.0, lng: -1.5 },
  { country: "Ireland", region: "Western Europe", lat: 53.2, lng: -8.0 },
  { country: "France", region: "Western Europe", lat: 46.6, lng: 2.4, language: "French" },
  { country: "Spain", region: "Southern Europe", lat: 40.2, lng: -3.6, language: "Spanish" },
  { country: "Portugal", region: "Southern Europe", lat: 39.6, lng: -8.0, language: "Portuguese" },
  { country: "Netherlands", region: "Western Europe", lat: 52.2, lng: 5.6, language: "Dutch" },
  { country: "Belgium", region: "Western Europe", lat: 50.6, lng: 4.6, language: "Dutch" },
  { country: "Germany", region: "Central Europe", lat: 51.1, lng: 10.4, language: "German" },
  { country: "Switzerland", region: "Central Europe", lat: 46.8, lng: 8.2, language: "German" },
  { country: "Austria", region: "Central Europe", lat: 47.6, lng: 14.1, language: "German" },
  { country: "Italy", region: "Southern Europe", lat: 42.8, lng: 12.6, language: "Italian" },
  { country: "Poland", region: "Central Europe", lat: 52.1, lng: 19.4, language: "Polish" },
  { country: "Czechia", region: "Central Europe", lat: 49.8, lng: 15.5, language: "Czech" },
  { country: "Hungary", region: "Central Europe", lat: 47.2, lng: 19.4, language: "Hungarian" },
  { country: "Romania", region: "Eastern Europe", lat: 45.9, lng: 25.0, language: "Romanian" },
  { country: "Bulgaria", region: "Eastern Europe", lat: 42.7, lng: 25.3, language: "Bulgarian" },
  { country: "Serbia", region: "Eastern Europe", lat: 44.2, lng: 20.9, language: "Serbian" },
  { country: "Croatia", region: "Southern Europe", lat: 45.1, lng: 15.9, language: "Croatian" },
  { country: "Greece", region: "Southern Europe", lat: 39.1, lng: 22.0, language: "Greek" },
  { country: "Sweden", region: "Northern Europe", lat: 62.0, lng: 15.5, language: "Swedish" },
  { country: "Norway", region: "Northern Europe", lat: 61.5, lng: 9.0, language: "Norwegian" },
  { country: "Denmark", region: "Northern Europe", lat: 56.0, lng: 9.6, language: "Danish" },
  { country: "Finland", region: "Northern Europe", lat: 63.5, lng: 26.0, language: "Finnish" },
  { country: "Ukraine", region: "Eastern Europe", lat: 49.0, lng: 31.5, language: "Ukrainian" },
  { country: "Turkiye", region: "Middle East", lat: 39.0, lng: 35.2, language: "Turkish" },
  { country: "Israel", region: "Middle East", lat: 31.4, lng: 35.0, language: "Hebrew" },
  { country: "United Arab Emirates", region: "Middle East", lat: 24.0, lng: 54.0, language: "Arabic" },
  { country: "Saudi Arabia", region: "Middle East", lat: 24.0, lng: 45.0, language: "Arabic" },
  { country: "Egypt", region: "Africa", lat: 26.8, lng: 30.0, language: "Arabic" },
  { country: "Morocco", region: "Africa", lat: 31.8, lng: -6.5, language: "Arabic" },
  { country: "Nigeria", region: "Africa", lat: 9.1, lng: 8.7 },
  { country: "Ghana", region: "Africa", lat: 7.9, lng: -1.0 },
  { country: "Kenya", region: "Africa", lat: 0.2, lng: 37.8 },
  { country: "South Africa", region: "Africa", lat: -29.0, lng: 25.0 },
  { country: "India", region: "South Asia", lat: 22.5, lng: 79.0, language: "Hindi" },
  { country: "Pakistan", region: "South Asia", lat: 30.2, lng: 69.4, language: "Urdu" },
  { country: "Bangladesh", region: "South Asia", lat: 23.8, lng: 90.3, language: "Bengali" },
  { country: "Thailand", region: "Southeast Asia", lat: 15.4, lng: 101.0, language: "Thai" },
  { country: "Vietnam", region: "Southeast Asia", lat: 16.0, lng: 106.3, language: "Vietnamese" },
  { country: "Malaysia", region: "Southeast Asia", lat: 4.0, lng: 102.2, language: "Malay" },
  { country: "Singapore", region: "Southeast Asia", lat: 1.35, lng: 103.82 },
  { country: "Indonesia", region: "Southeast Asia", lat: -2.5, lng: 117.0, language: "Indonesian" },
  { country: "Philippines", region: "Southeast Asia", lat: 12.5, lng: 122.0, language: "Filipino" },
  { country: "China", region: "East Asia", lat: 35.0, lng: 104.0, language: "Chinese" },
  { country: "Hong Kong", region: "East Asia", lat: 22.35, lng: 114.15, language: "Chinese" },
  { country: "Taiwan", region: "East Asia", lat: 23.7, lng: 121.0, language: "Chinese" },
  { country: "South Korea", region: "East Asia", lat: 36.5, lng: 127.9, language: "Korean" },
  { country: "Japan", region: "East Asia", lat: 36.2, lng: 138.3, language: "Japanese" },
  { country: "Australia", region: "Oceania", lat: -25.0, lng: 134.0 },
  { country: "New Zealand", region: "Oceania", lat: -41.0, lng: 173.0 },
];

// Demo's own live channels, one country each, so the map opens on real channels.
const PINNED: { country: string; slug: string; interaction: ChannelInteraction }[] = [
  { country: "United States", slug: "ironvow", interaction: { odds_denominator: 5, badges: ["responsive"] } },
  { country: "Canada", slug: "nocturnalnorm", interaction: { odds_denominator: 34, badges: [] } },
  { country: "Australia", slug: "snoozebaron", interaction: { odds_denominator: 40, badges: [] } },
  { country: "Netherlands", slug: "reelgoblin", interaction: { odds_denominator: 12, badges: ["reads_everything"] } },
  { country: "Ireland", slug: "capequest", interaction: { odds_denominator: 8, badges: ["responsive"] } },
  { country: "Japan", slug: "chartfairy", interaction: { odds_denominator: 4, badges: ["responsive", "reads_everything"] } },
  { country: "Kenya", slug: "wanderfuse", interaction: { odds_denominator: 21, badges: ["new_chatter_friendly"] } },
  { country: "United Kingdom", slug: "tiltcabinet", interaction: { odds_denominator: 9, badges: ["responsive"] } },
  { country: "United States", slug: "notadoc", interaction: { odds_denominator: 6, badges: ["responsive", "new_chatter_friendly"] } },
  { country: "Germany", slug: "mudbrickmage", interaction: { odds_denominator: 15, badges: ["new_chatter_friendly"] } },
  { country: "Poland", slug: "flickgremlin", interaction: { odds_denominator: 27, badges: [] } },
  { country: "France", slug: "panfriedpaul", interaction: { odds_denominator: 7, badges: ["responsive"] } },
  { country: "Brazil", slug: "couchsermon", interaction: { odds_denominator: 11, badges: ["reads_everything"] } },
  { country: "Canada", slug: "yapmerchant", interaction: { odds_denominator: 3, badges: ["responsive", "new_chatter_friendly"] } },
  { country: "United States", slug: "spinvicar", interaction: { odds_denominator: 18, badges: [] } },
  { country: "New Zealand", slug: "cluecrawler", interaction: { odds_denominator: 13, badges: ["reads_everything"] } },
  { country: "South Africa", slug: "vanlifevoid", interaction: { odds_denominator: 24, badges: [] } },
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

const LOCAL_LANGUAGE_RATE = 0.65;

export const EXPLORE_CATEGORIES = categories.map((c) => c.name);

export const EXPLORE_LANGUAGES = [
  "English",
  ...new Set(COUNTRIES.map((c) => c.language).filter((l): l is string => Boolean(l))),
];

export const EXPLORE_COUNTRIES = COUNTRIES.map((c) => c.country);

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

  const totalViewers = (channels: ExploreChannel[]) =>
    channels.reduce((sum, ch) => sum + ch.stream.viewer_count, 0);

  // Four to twelve channels per country, weighted small, so no single country swamps the map. The
  // whole point of the country level map is that every country reads as one dot among many.
  const countFor = () => 4 + Math.floor(rng() * rng() * 9);

  const earthClusters: ExploreCluster[] = COUNTRIES.map((countryDef, ci) => {
    const clusterId = `country-${ci}-${countryDef.country.toLowerCase().replace(/[^a-z]+/g, "-")}`;
    const channels: ExploreChannel[] = [];

    for (const pinned of PINNED.filter((p) => p.country === countryDef.country)) {
      const stream = liveStreamFor(pinned.slug);
      if (!stream) throw new Error(`No livestream for ${pinned.slug}. Add it to mock/api.ts.`);
      channels.push({
        id: `ch-${clusterId}-${pinned.slug}`,
        stream,
        body: "earth",
        location_hidden: false,
        interaction: pinned.interaction,
      });
    }

    const localLanguage = countryDef.language;
    const targetCount = Math.max(channels.length + 1, countFor());
    while (channels.length < targetCount) {
      const language = localLanguage && rng() < LOCAL_LANGUAGE_RATE ? localLanguage : "English";
      channels.push({
        id: `ch-${clusterId}-${channels.length}`,
        stream: generatedStream(language),
        body: "earth",
        location_hidden: rng() < HIDDEN_LOCATION_RATE,
        interaction: interactionFor(),
      });
    }

    channels.sort((a, b) => b.stream.viewer_count - a.stream.viewer_count);

    return {
      id: clusterId,
      place: countryDef.country,
      region: countryDef.region,
      body: "earth" as const,
      lat: countryDef.lat,
      lng: countryDef.lng,
      channels,
      total_viewer_count: totalViewers(channels),
    };
  });

  // A hidden streamer stays in the home cluster, flagged but not moved. clustersForBody derives the
  // Sun at render time, which is what lets the privacy toggle work in both directions.

  const relayClusters = (sites: RelaySite[], body: "moon" | "mars"): ExploreCluster[] =>
    sites.map((site, si) => {
      const slug = site.place.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const channels: ExploreChannel[] = site.channels.map((def, i) => ({
        id: `ch-${body}-${si}-${i}`,
        stream: relayStream(site, def, body),
        body: body as HomeBody,
        location_hidden: false,
        relay: { agency: def.agency, instrument: def.instrument },
        interaction: {
          odds_denominator: def.odds,
          badges: def.odds <= 10 ? (["responsive"] as InteractionBadgeKey[]) : [],
        },
      }));
      return {
        id: `${body}-${si}-${slug}`,
        place: site.place,
        region: site.region,
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

const streamBySlug = new Map(EXPLORE_CHANNELS.map((ch) => [ch.stream.channel.slug, ch.stream]));

export const exploreStreamFor = (slug: string) => streamBySlug.get(slug);
