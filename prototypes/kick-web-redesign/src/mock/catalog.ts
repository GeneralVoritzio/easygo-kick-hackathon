import type { StreamCard, StreamTier } from '../types';

function streamGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const hueA = hash % 360;
  const hueB = (hueA + 40 + (hash % 60)) % 360;
  return `linear-gradient(135deg, hsl(${hueA} 70% 22%), hsl(${hueB} 65% 12%))`;
}

interface CardTemplate {
  name: string;
  category: string;
  tags: string[];
  tier: StreamTier;
  /** Real Kick channel slug — omit for fictional catalog entries. */
  embedId?: string;
}

const VIEWER_RANGE: Record<StreamTier, [number, number]> = {
  rising: [20, 450],
  growing: [500, 4800],
  popular: [5000, 92000],
};

/** Every category the catalog has real depth in — this is also the pool the
 *  homepage's infinite vertical category list cycles through. */
export const CATEGORY_POOL = [
  'Just Chatting',
  'Valorant',
  'Grand Theft Auto V',
  'League of Legends',
  'Minecraft',
  'Fortnite',
  'Slots',
  'Chess',
  'Music',
  'Old School RuneScape',
  'Software and Game Development',
];

/** Six real Kick channels get real embeds wherever video actually renders.
 *  Everything else is fictional — we can't know real small streamers'
 *  names without live API access, so the "rising" tier especially has to
 *  be invented, in the KICK-streamer-flavour style the working agreement
 *  asks for (never a generic "Streamer1" placeholder). */
const TEMPLATES: CardTemplate[] = [
  { name: 'maxholloway', category: 'Just Chatting', tags: ['IRL', 'English'], tier: 'popular', embedId: 'maxholloway' },
  { name: 'Adin Ross', category: 'Just Chatting', tags: ['IRL', 'English'], tier: 'popular', embedId: 'adinross' },
  { name: 'xQc', category: 'Just Chatting', tags: ['Variety', 'English'], tier: 'popular', embedId: 'xqc' },
  { name: 'Amouranth', category: 'Just Chatting', tags: ['IRL', 'English'], tier: 'popular', embedId: 'amouranth' },
  { name: 'Trainwreckstv', category: 'Slots', tags: ['Slots', 'English'], tier: 'popular', embedId: 'trainwreckstv' },
  { name: 'N3on', category: 'Just Chatting', tags: ['IRL', 'Collab'], tier: 'popular', embedId: 'n3on' },

  { name: 'BLKOUT', category: 'Grand Theft Auto V', tags: ['Roleplay'], tier: 'popular' },
  { name: 'Lunarix', category: 'Valorant', tags: ['Competitive'], tier: 'popular' },
  { name: 'KAIDO', category: 'Just Chatting', tags: ['IRL'], tier: 'popular' },
  { name: 'RIVIT', category: 'League of Legends', tags: ['Competitive'], tier: 'popular' },
  { name: 'sade_', category: 'Just Chatting', tags: ['IRL'], tier: 'popular' },
  { name: 'VortexKing', category: 'Fortnite', tags: ['Competitive'], tier: 'popular' },

  { name: 'NovaStrikes', category: 'Valorant', tags: ['Competitive'], tier: 'growing' },
  { name: 'ClipFarmer', category: 'Grand Theft Auto V', tags: ['Roleplay'], tier: 'growing' },
  { name: 'kelpy_dev', category: 'Software and Game Development', tags: ['Coding'], tier: 'growing' },
  { name: 'thorne_', category: 'Chess', tags: ['Strategy'], tier: 'growing' },
  { name: 'BunsenBurner', category: 'Just Chatting', tags: ['Science'], tier: 'growing' },
  { name: 'nightowl22', category: 'Music', tags: ['DJ'], tier: 'growing' },

  { name: 'PixelPunk', category: 'Minecraft', tags: ['Building'], tier: 'rising' },
  { name: 'DriftQueen', category: 'Just Chatting', tags: ['IRL'], tier: 'rising' },
  { name: 'HexRunner', category: 'League of Legends', tags: ['Ranked'], tier: 'rising' },
  { name: 'StormCaller', category: 'Fortnite', tags: ['Solo'], tier: 'rising' },
  { name: 'LootGoblin', category: 'Old School RuneScape', tags: ['Grinding'], tier: 'rising' },
  { name: 'mossy_dev', category: 'Software and Game Development', tags: ['Coding'], tier: 'rising' },
  { name: 'echo_lynn', category: 'Just Chatting', tags: ['Music'], tier: 'rising' },
  { name: 'quiet_riot99', category: 'Minecraft', tags: ['Survival'], tier: 'rising' },
  { name: 'zerocool', category: 'Valorant', tags: ['Ranked'], tier: 'rising' },
  { name: 'flickerbulb', category: 'Just Chatting', tags: ['Art'], tier: 'rising' },
  { name: 'triple_axel', category: 'Just Chatting', tags: ['IRL'], tier: 'rising' },
  { name: 'ghostie', category: 'Grand Theft Auto V', tags: ['Roleplay'], tier: 'rising' },
];

/** Combinatorial handle generator for filler cards — every category needs
 *  enough depth for a real 2-row rail, and we can't hand-write a real small
 *  streamer's name for the same reason we can't hand-write a real one
 *  anywhere else in this catalog. `PREFIXES.length * SUFFIXES.length` (360)
 *  combinations is enough headroom to never repeat at our catalog size. */
const NAME_PREFIXES = [
  'Shadow', 'Neon', 'Cosmic', 'Frost', 'Blaze', 'Echo', 'Storm', 'Lunar', 'Ember', 'Ghost',
  'Vortex', 'Nova', 'Pixel', 'Quantum', 'Crimson', 'Astro', 'Drift', 'Static', 'Volt', 'Rogue',
];
const NAME_SUFFIXES = [
  'Wolf', 'Byte', 'Phantom', 'Reign', 'Runner', 'Spire', 'Fox', 'Wave', 'Strike', 'Punk',
  'Craft', 'Vibe', 'Core', 'Flux', 'Rush', 'Hex', 'Fang', 'Storm',
];

function generatedHandle(seed: number): string {
  const prefix = NAME_PREFIXES[seed % NAME_PREFIXES.length];
  const suffix = NAME_SUFFIXES[Math.floor(seed / NAME_PREFIXES.length) % NAME_SUFFIXES.length];
  return seed % 3 === 0 ? `${prefix.toLowerCase()}_${suffix.toLowerCase()}` : `${prefix}${suffix}`;
}

/** Filler cards so every category in `CATEGORY_POOL` has enough depth for a
 *  real 2-row rail, not just the 1-3 hand-written entries some categories
 *  would otherwise have. Weighted toward rising/growing — most streamers in
 *  any real category are small, only a few are popular, and that
 *  distribution is itself part of the discoverability point. */
const MIN_PER_CATEGORY = 7;
const FILLER_TIER_WEIGHTS: StreamTier[] = ['rising', 'rising', 'rising', 'growing', 'growing', 'popular'];

function generateFillerTemplates(existing: CardTemplate[]): CardTemplate[] {
  const filler: CardTemplate[] = [];
  let seed = 0;

  for (const category of CATEGORY_POOL) {
    const have = existing.filter((t) => t.category === category).length;
    for (let i = have; i < MIN_PER_CATEGORY; i++) {
      filler.push({
        name: generatedHandle(seed),
        category,
        tags: [],
        tier: FILLER_TIER_WEIGHTS[seed % FILLER_TIER_WEIGHTS.length],
      });
      seed++;
    }
  }

  return filler;
}

function randomViewers(tier: StreamTier): number {
  const [min, max] = VIEWER_RANGE[tier];
  return Math.floor(min + Math.random() * (max - min));
}

/** The full catalog — six real, currently-live-ish Kick channels, the
 *  hand-written fictional roster, and generated filler so every category
 *  has real depth. Generated once per page load. */
export function createCatalog(): StreamCard[] {
  const templates = [...TEMPLATES, ...generateFillerTemplates(TEMPLATES)];
  const seen = new Set<string>();

  return templates.map((t) => {
    let id = t.embedId ?? t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    while (seen.has(id)) id = `${id}-2`;
    seen.add(id);

    return {
      id,
      name: t.name,
      category: t.category,
      tags: t.tags,
      tier: t.tier,
      viewerCount: randomViewers(t.tier),
      isLive: true,
      embedId: t.embedId,
      gradient: streamGradient(id),
    };
  });
}

/** Cards grouped by category, in `CATEGORY_POOL` order — what the homepage's
 *  infinite vertical category list reads from. */
export function groupByCategory(cards: StreamCard[]): Record<string, StreamCard[]> {
  const groups: Record<string, StreamCard[]> = {};
  for (const category of CATEGORY_POOL) groups[category] = [];
  for (const card of cards) {
    (groups[card.category] ??= []).push(card);
  }
  return groups;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const RISING_SLOT_EVERY = 4;

/** The core discoverability move: a pure viewer-count sort always buries
 *  small streamers at the bottom of an infinite rail nobody scrolls that
 *  far into. This guarantees a rising-tier card every 4th slot instead,
 *  so small streamers get regular, predictable placement in the main feed
 *  rather than only existing in their own separate row. */
export function interleaveForDiscovery(cards: StreamCard[]): StreamCard[] {
  const rising = shuffle(cards.filter((c) => c.tier === 'rising'));
  const others = shuffle(cards.filter((c) => c.tier !== 'rising'));
  const result: StreamCard[] = [];
  let ri = 0;
  let oi = 0;

  while (ri < rising.length || oi < others.length) {
    const risingSlot = (result.length + 1) % RISING_SLOT_EVERY === 0;
    if (risingSlot && ri < rising.length) {
      result.push(rising[ri++]);
    } else if (oi < others.length) {
      result.push(others[oi++]);
    } else {
      result.push(rising[ri++]);
    }
  }

  return result;
}
