// Invented surface, named as if KICK's engineers built it. Channel Rewards
// (kick GET /public/v1/channels/rewards) is the closest real loop, so a claim
// follows its accept flow. The state below is what these would carry:
//   fake-kick GET   /public/v1/drops/campaigns
//   fake-kick GET   /public/v1/drops/campaigns/{campaign_id}/inventory
//   fake-kick GET   /public/v1/drops/campaigns/{campaign_id}/partners
//   fake-kick POST  /public/v1/drops/trades
//   fake-kick PATCH /public/v1/drops/trades/{trade_id}
//   fake-kick POST  /public/v1/drops/claims
//   fake-kick drops.card.awarded, drops.trade.offered, drops.trade.completed,
//   fake-kick drops.set.completed, drops.claim.delivered
//   scopes drops:read and drops:write

export type Rarity = "common" | "rare";

export type SetCard = {
  id: string;
  name: string;
  rarity: Rarity;
  // Accent hex values come from KICK's own identity palette (--neon-identity-*).
  accent: string;
};

export const campaign = {
  id: "01J1Q9V7Y0N9MHZ0F3T8B2K4RD",
  name: "Wilderness Relics",
  game: "Old School RuneScape",
  category_slug: "old-school-runescape",
  reward: "Radiant Oathplate",
  ends_at: "2026-08-09T23:59:00Z",
};

export const setCards: SetCard[] = [
  { id: "obsidian-ward", name: "Obsidian Ward", rarity: "common", accent: "#18e9fb" },
  { id: "serpent-sigil", name: "Serpent Sigil", rarity: "common", accent: "#b8fea0" },
  { id: "bloodrune-crest", name: "Bloodrune Crest", rarity: "common", accent: "#fea0a0" },
  { id: "wyvern-fang", name: "Wyvern Fang", rarity: "common", accent: "#fedaa0" },
  { id: "ashen-grimoire", name: "Ashen Grimoire", rarity: "rare", accent: "#d8a0fe" },
  { id: "kraken-eye", name: "Kraken Eye", rarity: "rare", accent: "#45adfc" },
];

export const cardFor = (id: string) => {
  const card = setCards.find((c) => c.id === id);
  if (!card) throw new Error(`No card ${id} in the ${campaign.name} set`);
  return card;
};

export type Inventory = Record<string, number>;

export type Partner = {
  userId: number;
  username: string;
  coWatchSeconds: number;
  inventory: Inventory;
};

// The co-presence gate: a trade needs shared watch time in this channel during
// this campaign, so farm accounts cannot consolidate cards.
export const CO_WATCH_MINIMUM = 30 * 60;

export const partners: Partner[] = [
  {
    userId: 4127033,
    username: "ClueScrollCarl",
    coWatchSeconds: 4 * 3600 + 12 * 60,
    inventory: { "kraken-eye": 2, "bloodrune-crest": 2, "obsidian-ward": 1 },
  },
  {
    userId: 5540211,
    username: "MaxCapeMara",
    coWatchSeconds: 2 * 3600 + 41 * 60,
    inventory: { "bloodrune-crest": 3, "wyvern-fang": 1, "serpent-sigil": 1 },
  },
  {
    userId: 7811940,
    username: "GielinorGremlin",
    coWatchSeconds: 1 * 3600 + 6 * 60,
    inventory: { "serpent-sigil": 2, "obsidian-ward": 2 },
  },
  {
    userId: 9083172,
    username: "WildyWanderer",
    coWatchSeconds: 14 * 60,
    inventory: { "obsidian-ward": 1 },
  },
];

export const partnerFor = (userId: number) => partners.find((p) => p.userId === userId);

export const isEligible = (partner: Partner) => partner.coWatchSeconds >= CO_WATCH_MINIMUM;

export const MILESTONE_SECONDS = 3600;

// The drop order is scripted so the first drop lands a card the set still needs.
const scriptedDrops = ["ashen-grimoire", "serpent-sigil", "obsidian-ward", "wyvern-fang"];

export type Trade = {
  partnerUserId: number;
  theirOffer: string[];
  status: "requested" | "open";
};

export type CardSetsState = {
  watchSeconds: number;
  dropIndex: number;
  inventory: Inventory;
  freshCardId?: string;
  trade?: Trade;
  claimed: boolean;
};

export const startState: CardSetsState = {
  watchSeconds: 5 * 3600 + 52 * 60,
  dropIndex: 0,
  inventory: {
    "obsidian-ward": 1,
    "serpent-sigil": 1,
    "bloodrune-crest": 1,
    "wyvern-fang": 2,
  },
  claimed: false,
};

export function tickWatch(state: CardSetsState, seconds: number): CardSetsState {
  const watchSeconds = state.watchSeconds + seconds;
  const before = Math.floor(state.watchSeconds / MILESTONE_SECONDS);
  const after = Math.floor(watchSeconds / MILESTONE_SECONDS);
  if (after === before || state.dropIndex >= scriptedDrops.length)
    return { ...state, watchSeconds };
  const cardId = scriptedDrops[state.dropIndex];
  return {
    ...state,
    watchSeconds,
    dropIndex: state.dropIndex + 1,
    freshCardId: cardId,
    inventory: { ...state.inventory, [cardId]: (state.inventory[cardId] ?? 0) + 1 },
  };
}

export const nextMilestoneIn = (state: CardSetsState) =>
  MILESTONE_SECONDS - (state.watchSeconds % MILESTONE_SECONDS);

export const ownedCount = (inventory: Inventory) =>
  setCards.filter((card) => (inventory[card.id] ?? 0) > 0).length;

export const isSetComplete = (inventory: Inventory) => ownedCount(inventory) === setCards.length;

// Only a duplicate leaves your set.
export const duplicateIds = (inventory: Inventory) =>
  setCards.filter((card) => (inventory[card.id] ?? 0) > 1).map((card) => card.id);

// One tile per copy, in set order, for the trade grids.
export const instancesOf = (inventory: Inventory) =>
  setCards.flatMap((card) => Array.from({ length: inventory[card.id] ?? 0 }, () => card.id));

export function requestTrade(state: CardSetsState, partnerUserId: number): CardSetsState {
  return { ...state, trade: { partnerUserId, theirOffer: [], status: "requested" } };
}

// The partner puts up the duplicates you still need, or their first duplicate.
export function acceptRequest(state: CardSetsState): CardSetsState {
  const trade = state.trade;
  if (!trade || trade.status !== "requested") return state;
  const partner = partnerFor(trade.partnerUserId);
  if (!partner) return state;
  const dupes = duplicateIds(partner.inventory);
  const needed = dupes.filter((id) => (state.inventory[id] ?? 0) === 0);
  return { ...state, trade: { ...trade, theirOffer: needed.length > 0 ? needed : dupes.slice(0, 1), status: "open" } };
}

export function completeTrade(state: CardSetsState, giveIds: string[]): CardSetsState {
  const trade = state.trade;
  if (!trade || trade.status !== "open") return state;
  const inventory = { ...state.inventory };
  for (const id of giveIds) inventory[id] = (inventory[id] ?? 1) - 1;
  for (const id of trade.theirOffer) inventory[id] = (inventory[id] ?? 0) + 1;
  return { ...state, inventory, trade: undefined, freshCardId: trade.theirOffer[0] };
}

export const cancelTrade = (state: CardSetsState): CardSetsState => ({
  ...state,
  trade: undefined,
});

export const claimDrop = (state: CardSetsState): CardSetsState => ({ ...state, claimed: true });

export const clearFresh = (state: CardSetsState): CardSetsState => ({
  ...state,
  freshCardId: undefined,
});

export function formatWatch(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
