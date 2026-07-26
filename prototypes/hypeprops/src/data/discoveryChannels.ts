import type { InteractionBadgeKey } from '../engine/ack'
import type { DiscoveryChannel, DiscoveryCluster, DiscoveryOrigin } from '../discovery/types'

/**
 * Mock geo live catalog for the Discovery globe: ~72 city clusters, 3–5 live
 * channels each (≈250–300 total). Generated from a fixed seed so every demo
 * run shows the identical map. Coordinates are demo scenography — they never
 * claim a streamer's real location.
 */

const SEED = 0x5eed_c0de

/** mulberry32 — tiny deterministic PRNG, plenty for scenography */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** the known-good live source every playable preview reuses for the demo */
export const DEMO_KICK_SLUG = 'maxholloway'

/** default exploration region when geolocation is denied/unavailable */
export const DEFAULT_ORIGIN: DiscoveryOrigin = {
  lat: 37.7749,
  lng: -122.4194,
  label: 'San Francisco (default region)',
  isFallback: true,
}

type City = { city: string; country: string; lat: number; lng: number }

const CITIES: City[] = [
  { city: 'San Francisco', country: 'USA', lat: 37.7749, lng: -122.4194 },
  { city: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437 },
  { city: 'San Diego', country: 'USA', lat: 32.7157, lng: -117.1611 },
  { city: 'Seattle', country: 'USA', lat: 47.6062, lng: -122.3321 },
  { city: 'Portland', country: 'USA', lat: 45.5152, lng: -122.6784 },
  { city: 'Las Vegas', country: 'USA', lat: 36.1699, lng: -115.1398 },
  { city: 'Phoenix', country: 'USA', lat: 33.4484, lng: -112.074 },
  { city: 'Denver', country: 'USA', lat: 39.7392, lng: -104.9903 },
  { city: 'Austin', country: 'USA', lat: 30.2672, lng: -97.7431 },
  { city: 'Dallas', country: 'USA', lat: 32.7767, lng: -96.797 },
  { city: 'Houston', country: 'USA', lat: 29.7604, lng: -95.3698 },
  { city: 'Chicago', country: 'USA', lat: 41.8781, lng: -87.6298 },
  { city: 'Minneapolis', country: 'USA', lat: 44.9778, lng: -93.265 },
  { city: 'Atlanta', country: 'USA', lat: 33.749, lng: -84.388 },
  { city: 'Miami', country: 'USA', lat: 25.7617, lng: -80.1918 },
  { city: 'New York', country: 'USA', lat: 40.7128, lng: -74.006 },
  { city: 'Boston', country: 'USA', lat: 42.3601, lng: -71.0589 },
  { city: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { city: 'Montreal', country: 'Canada', lat: 45.5019, lng: -73.5674 },
  { city: 'Vancouver', country: 'Canada', lat: 49.2827, lng: -123.1207 },
  { city: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332 },
  { city: 'Bogotá', country: 'Colombia', lat: 4.711, lng: -74.0721 },
  { city: 'Lima', country: 'Peru', lat: -12.0464, lng: -77.0428 },
  { city: 'Santiago', country: 'Chile', lat: -33.4489, lng: -70.6693 },
  { city: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816 },
  { city: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
  { city: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lng: -43.1729 },
  { city: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
  { city: 'Dublin', country: 'Ireland', lat: 53.3498, lng: -6.2603 },
  { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { city: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
  { city: 'Barcelona', country: 'Spain', lat: 41.3874, lng: 2.1686 },
  { city: 'Lisbon', country: 'Portugal', lat: 38.7223, lng: -9.1393 },
  { city: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  { city: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405 },
  { city: 'Munich', country: 'Germany', lat: 48.1351, lng: 11.582 },
  { city: 'Zurich', country: 'Switzerland', lat: 47.3769, lng: 8.5417 },
  { city: 'Milan', country: 'Italy', lat: 45.4642, lng: 9.19 },
  { city: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964 },
  { city: 'Vienna', country: 'Austria', lat: 48.2082, lng: 16.3738 },
  { city: 'Prague', country: 'Czechia', lat: 50.0755, lng: 14.4378 },
  { city: 'Warsaw', country: 'Poland', lat: 52.2297, lng: 21.0122 },
  { city: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686 },
  { city: 'Oslo', country: 'Norway', lat: 59.9139, lng: 10.7522 },
  { city: 'Copenhagen', country: 'Denmark', lat: 55.6761, lng: 12.5683 },
  { city: 'Helsinki', country: 'Finland', lat: 60.1699, lng: 24.9384 },
  { city: 'Athens', country: 'Greece', lat: 37.9838, lng: 23.7275 },
  { city: 'Istanbul', country: 'Türkiye', lat: 41.0082, lng: 28.9784 },
  { city: 'Bucharest', country: 'Romania', lat: 44.4268, lng: 26.1025 },
  { city: 'Kyiv', country: 'Ukraine', lat: 50.4501, lng: 30.5234 },
  { city: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
  { city: 'Tel Aviv', country: 'Israel', lat: 32.0853, lng: 34.7818 },
  { city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { city: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  { city: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
  { city: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473 },
  { city: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241 },
  { city: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777 },
  { city: 'Delhi', country: 'India', lat: 28.7041, lng: 77.1025 },
  { city: 'Bangalore', country: 'India', lat: 12.9716, lng: 77.5946 },
  { city: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018 },
  { city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { city: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456 },
  { city: 'Manila', country: 'Philippines', lat: 14.5995, lng: 120.9842 },
  { city: 'Hong Kong', country: 'China', lat: 22.3193, lng: 114.1694 },
  { city: 'Taipei', country: 'Taiwan', lat: 25.033, lng: 121.5654 },
  { city: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.978 },
  { city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { city: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631 },
  { city: 'Auckland', country: 'New Zealand', lat: -36.8485, lng: 174.7633 },
]

/** browse-grid alumni — pinned to specific cities, playable via the demo slug;
 * their odds/badges mirror SIM_CHANNEL_STATS so both surfaces tell one story */
const LEGACY_CHANNELS: Record<string, Omit<DiscoveryChannel, 'id' | 'lat' | 'lng' | 'kickSlug' | 'embeddable'>> = {
  'San Francisco': { name: 'HypeKing', category: 'Just Chatting', language: 'English', viewers: 1804, thumbnail: { seed: 'hypeking', gradient: 'linear-gradient(135deg,#53fc18,#3fc411)', initials: 'HK' }, interaction: { oddsDenominator: 5, badges: ['responsive'] } },
  'Los Angeles': { name: 'NovaStrikes', category: 'Valorant', language: 'English', viewers: 3204, thumbnail: { seed: 'novastrikes', gradient: 'linear-gradient(135deg,#60a5fa,#a78bfa)', initials: 'NS' }, interaction: { oddsDenominator: 9, badges: ['responsive'] } },
  London: { name: 'LootGoblin', category: 'Old School RuneScape', language: 'English', viewers: 2113, thumbnail: { seed: 'lootgoblin', gradient: 'linear-gradient(135deg,#fb923c,#f87171)', initials: 'LG' }, interaction: { oddsDenominator: 4, badges: ['responsive', 'reads_everything'] } },
  'New York': { name: 'ClipFarmer', category: 'Grand Theft Auto V', language: 'English', viewers: 1842, thumbnail: { seed: 'clipfarmer', gradient: 'linear-gradient(135deg,#f472b6,#facc15)', initials: 'CF' }, interaction: { oddsDenominator: 31, badges: [] } },
  Seoul: { name: 'PixelPunk', category: 'Minecraft', language: 'English', viewers: 1390, thumbnail: { seed: 'pixelpunk', gradient: 'linear-gradient(135deg,#34d399,#60a5fa)', initials: 'PP' }, interaction: { oddsDenominator: 6, badges: ['new_chatter_friendly'] } },
  Berlin: { name: 'DriftQueen', category: 'Just Chatting', language: 'English', viewers: 981, thumbnail: { seed: 'driftqueen', gradient: 'linear-gradient(135deg,#a78bfa,#f472b6)', initials: 'DQ' }, interaction: { oddsDenominator: 12, badges: [] } },
  Tokyo: { name: 'HexRunner', category: 'League of Legends', language: 'English', viewers: 845, thumbnail: { seed: 'hexrunner', gradient: 'linear-gradient(135deg,#22d3ee,#3b82f6)', initials: 'HR' }, interaction: { oddsDenominator: 18, badges: [] } },
  'São Paulo': { name: 'StormCaller', category: 'Fortnite', language: 'English', viewers: 612, thumbnail: { seed: 'stormcaller', gradient: 'linear-gradient(135deg,#facc15,#fb923c)', initials: 'SC' }, interaction: { oddsDenominator: 25, badges: [] } },
}

const NAME_PREFIXES = ['Neon', 'Turbo', 'Pixel', 'Shadow', 'Hyper', 'Glitch', 'Cosmic', 'Retro', 'Static', 'Vapor', 'Crimson', 'Frost', 'Ember', 'Volt', 'Lunar', 'Feral', 'Chrome', 'Sonic', 'Nova', 'Drift']
const NAME_SUFFIXES = ['Wolf', 'Viper', 'Queen', 'Baron', 'Gremlin', 'Pilot', 'Mage', 'Rogue', 'Falcon', 'Otter', 'Reaper', 'Samurai', 'Ninja', 'Golem', 'Racer', 'Wizard', 'Panda', 'Comet', 'Riot', 'Byte']

/** every category channels are generated from — the filter bar's source of truth */
export const DISCOVERY_CATEGORIES = ['Just Chatting', 'IRL', 'Slots', 'Grand Theft Auto V', 'Minecraft', 'Valorant', 'Fortnite', 'League of Legends', 'Old School RuneScape', 'Music', 'Chess', 'Retro Games']

/** primary broadcast language per country — channels stream in it most of the
 * time, with English mixed in everywhere (matches how Kick's directory feels,
 * and makes the language filter light up coherent regions of the globe) */
const COUNTRY_LANGUAGE: Record<string, string> = {
  Mexico: 'Español',
  Colombia: 'Español',
  Peru: 'Español',
  Chile: 'Español',
  Argentina: 'Español',
  Spain: 'Español',
  Brazil: 'Português',
  Portugal: 'Português',
  France: 'Français',
  Germany: 'Deutsch',
  Switzerland: 'Deutsch',
  Austria: 'Deutsch',
  Italy: 'Italiano',
  Poland: 'Polski',
  'Türkiye': 'Türkçe',
  Ukraine: 'Українська',
  UAE: 'العربية',
  Egypt: 'العربية',
  Japan: '日本語',
  'South Korea': '한국어',
  China: '中文',
  Taiwan: '中文',
  Thailand: 'ไทย',
  Indonesia: 'Bahasa Indonesia',
}

export const DISCOVERY_LANGUAGES = ['English', ...new Set(Object.values(COUNTRY_LANGUAGE))]

/** how often a channel streams in its country's primary language (vs English) */
const LOCAL_LANGUAGE_RATE = 0.65

const GRADIENT_STOPS = ['#60a5fa', '#a78bfa', '#f472b6', '#facc15', '#fb923c', '#f87171', '#34d399', '#22d3ee', '#3b82f6', '#e879f9', '#4ade80', '#fbbf24']

export type DiscoveryCatalog = {
  clusters: DiscoveryCluster[]
  channels: DiscoveryChannel[]
}

/** pure + deterministic: same seed → identical catalog on every run */
export function buildDiscoveryCatalog(seed = SEED): DiscoveryCatalog {
  const rng = mulberry32(seed)
  const usedNames = new Set(Object.values(LEGACY_CHANNELS).map((c) => c.name))
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)]

  const nextName = () => {
    for (let attempt = 0; attempt < 50; attempt++) {
      const name = `${pick(NAME_PREFIXES)}${pick(NAME_SUFFIXES)}`
      if (!usedNames.has(name)) {
        usedNames.add(name)
        return name
      }
    }
    // pathological seed — disambiguate instead of looping forever
    const name = `${pick(NAME_PREFIXES)}${pick(NAME_SUFFIXES)}${usedNames.size}`
    usedNames.add(name)
    return name
  }

  const gradientFor = () => {
    const a = pick(GRADIENT_STOPS)
    let b = pick(GRADIENT_STOPS)
    if (b === a) b = GRADIENT_STOPS[(GRADIENT_STOPS.indexOf(a) + 5) % GRADIENT_STOPS.length]
    return `linear-gradient(135deg,${a},${b})`
  }

  // skew towards small streams, with a few thousands-strong outliers
  const viewersFor = () => Math.floor(80 + rng() * rng() * 5800)

  // mock interaction-engine profile: most channels have long odds, a minority
  // are genuinely responsive; badges correlate with the odds so the story holds
  const interactionFor = () => {
    const oddsDenominator = Math.max(3, Math.round(3 + rng() * rng() * 37))
    const badges: InteractionBadgeKey[] = []
    if (oddsDenominator <= 10) badges.push('responsive')
    if (oddsDenominator <= 15 && rng() < 0.25) badges.push('reads_everything')
    if (rng() < 0.22) badges.push('new_chatter_friendly')
    return { oddsDenominator, badges }
  }

  const clusters: DiscoveryCluster[] = CITIES.map((cityDef, ci) => {
    const clusterId = `loc-${ci}-${cityDef.city.toLowerCase().replace(/[^a-z]+/g, '-')}`
    const channels: DiscoveryChannel[] = []

    const legacy = LEGACY_CHANNELS[cityDef.city]
    if (legacy) {
      channels.push({
        ...legacy,
        id: `ch-${clusterId}-legacy`,
        kickSlug: DEMO_KICK_SLUG,
        embeddable: true,
        lat: 0, // ring position assigned below, once the cluster size is known
        lng: 0,
      })
    }

    const localLanguage = COUNTRY_LANGUAGE[cityDef.country]
    const targetCount = 3 + Math.floor(rng() * 3) // 3–5 per location
    while (channels.length < targetCount) {
      const name = nextName()
      const embeddable = rng() < 0.35 // the rest demo as static posters (no guaranteed-valid slug)
      channels.push({
        id: `ch-${clusterId}-${channels.length}`,
        name,
        kickSlug: embeddable ? DEMO_KICK_SLUG : name.toLowerCase(),
        category: pick(DISCOVERY_CATEGORIES),
        language: localLanguage && rng() < LOCAL_LANGUAGE_RATE ? localLanguage : 'English',
        viewers: viewersFor(),
        interaction: interactionFor(),
        lat: 0,
        lng: 0,
        thumbnail: {
          seed: name.toLowerCase(),
          gradient: gradientFor(),
          initials: name.replace(/[^A-Z]/g, '').slice(0, 2) || name.slice(0, 2).toUpperCase(),
        },
        embeddable,
      })
    }

    channels.sort((a, b) => b.viewers - a.viewers)

    // evenly-spaced ring around the city, so near-zoom expansion never stacks
    // two channel dots on top of each other (random jitter did exactly that);
    // longitude offset is widened by 1/cos(lat) to stay visually round
    const ringPhase = rng() * Math.PI * 2
    const lngStretch = 1 / Math.max(0.35, Math.cos((cityDef.lat * Math.PI) / 180))
    channels.forEach((channel, i) => {
      const angle = ringPhase + (i / channels.length) * Math.PI * 2
      const radius = 0.85 + rng() * 0.25 // degrees
      channel.lat = cityDef.lat + radius * Math.cos(angle)
      channel.lng = cityDef.lng + radius * Math.sin(angle) * lngStretch
    })

    return {
      id: clusterId,
      city: cityDef.city,
      country: cityDef.country,
      lat: cityDef.lat,
      lng: cityDef.lng,
      channels,
      totalViewers: channels.reduce((sum, ch) => sum + ch.viewers, 0),
    }
  })

  return { clusters, channels: clusters.flatMap((c) => c.channels) }
}

const catalog = buildDiscoveryCatalog()

export const DISCOVERY_CLUSTERS = catalog.clusters
export const DISCOVERY_CHANNELS = catalog.channels

const channelById = new Map(DISCOVERY_CHANNELS.map((ch) => [ch.id, ch]))
const clusterById = new Map(DISCOVERY_CLUSTERS.map((c) => [c.id, c]))

export const findDiscoveryChannel = (id: string) => channelById.get(id)
export const findDiscoveryCluster = (id: string) => clusterById.get(id)

/** static "stream screenshot" placeholder — deterministic per channel */
export const posterUrl = (channel: DiscoveryChannel) => `https://picsum.photos/seed/${channel.thumbnail.seed}/480/270`
