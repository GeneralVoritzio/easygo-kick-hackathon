import { cat } from "./api";

const rewardArt = import.meta.glob("../art/reward-*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const art = (name: string) => {
  const url = rewardArt[`../art/reward-${name}.svg`];
  if (!url) throw new Error(`No reward art for ${name}. Add demo/src/kick/art/reward-${name}.svg`);
  return url;
};

export type DropReward = {
  reward_id: string;
  name: string;
  image: string;
  watch_minutes: number;
};

export type DropCampaign = {
  campaign_id: string;
  name: string;
  start_at: string;
  end_at: string;
  rewards: DropReward[];
};

export type DropCampaignGroup = {
  group_id: string;
  organization: string;
  category: { name: string; slug: string; thumbnail: string };
  start_at: string;
  end_at: string;
  restrictions: string[];
  campaign_info_url: string;
  connect_url: string;
  participating_channel: string;
  campaigns: DropCampaign[];
};

export type DropClaim = {
  claim_id: string;
  reward: DropReward;
  external_status: "in_progress" | "expired";
  progress: number;
  minutes_remaining: number;
};

export type InventoryDrop = {
  campaign_id: string;
  name: string;
  organization: string;
  category: { name: string; slug: string; thumbnail: string };
  end_at: string;
  campaign_info_url: string;
  connect_url: string;
  participating_channel: string;
  claims: DropClaim[];
};

const reward = (
  reward_id: string,
  name: string,
  image: string,
  watch_minutes: number,
): DropReward => ({ reward_id, name, image, watch_minutes });

const vaultRun = [
  reward("01k9vault0001", "Ironvow Vault Key", art("vault-key"), 60),
  reward("01k9vault0002", "Blackpowder Supply Crate", art("powder-crate"), 300),
  reward("01k9vault0003", "Blackpowder Emote Pack", art("emote-pack"), 900),
  reward("01k9vault0004", "Vault Run Finisher Jersey", art("club-jersey"), 1800),
];

const spinWeek = [
  reward("01k9spin00001", "Golden Spin Token", art("golden-spin"), 60),
  reward("01k9spin00002", "Highroller Raffle Ticket x5", art("raffle-ticket"), 300),
  reward("01k9spin00003", "Felt Table Emote Pack", art("emote-pack"), 1200),
];

const trawlRun = [
  reward("01k9trawl0001", "Deep Sea Trawl Badge", art("trawl-badge"), 600),
  reward("01k9trawl0002", "Runed Pickaxe Skin", art("rune-pickaxe"), 1200),
];

// kick GET /public/v1/drops/claims
export const inventoryDrops: InventoryDrop[] = [
  {
    campaign_id: "01k9camp00001",
    name: "Vault Run Season 3",
    organization: "Blackpowder Interactive",
    category: cat("counter-strike-2"),
    end_at: "2026-08-12T10:00:00Z",
    campaign_info_url: "https://blackpowder.gg/kick-drops",
    connect_url: "https://blackpowder.gg/connect",
    participating_channel: "ironvow",
    claims: [
      {
        claim_id: "01k9claim0001",
        reward: vaultRun[0],
        external_status: "in_progress",
        progress: 0.62,
        minutes_remaining: 23,
      },
      {
        claim_id: "01k9claim0002",
        reward: vaultRun[1],
        external_status: "in_progress",
        progress: 0.18,
        minutes_remaining: 246,
      },
      {
        claim_id: "01k9claim0006",
        reward: vaultRun[2],
        external_status: "in_progress",
        progress: 0.02,
        minutes_remaining: 882,
      },
    ],
  },
  {
    campaign_id: "01k9camp00002",
    name: "Highroller Spin Week",
    organization: "Highroller Labs",
    category: cat("slots-casino"),
    end_at: "2026-08-18T10:00:00Z",
    campaign_info_url: "https://highrollerlabs.com/kick-drops",
    connect_url: "https://highrollerlabs.com/connect",
    participating_channel: "midnightden",
    claims: [
      {
        claim_id: "01k9claim0003",
        reward: spinWeek[0],
        external_status: "in_progress",
        progress: 0.88,
        minutes_remaining: 7,
      },
      {
        claim_id: "01k9claim0004",
        reward: spinWeek[1],
        external_status: "in_progress",
        progress: 0.05,
        minutes_remaining: 285,
      },
      {
        claim_id: "01k9claim0007",
        reward: spinWeek[2],
        external_status: "in_progress",
        progress: 0.01,
        minutes_remaining: 1188,
      },
    ],
  },
];

export const expiredDrops: InventoryDrop[] = [
  {
    campaign_id: "01k9camp00003",
    name: "Deep Sea Trawl",
    organization: "Grimhollow Games",
    category: cat("old-school-runescape"),
    end_at: "2026-07-26T03:59:00Z",
    campaign_info_url: "https://grimhollow.games/kick-drops",
    connect_url: "https://grimhollow.games/connect",
    participating_channel: "charcoalchef",
    claims: [
      {
        claim_id: "01k9claim0005",
        reward: trawlRun[0],
        external_status: "expired",
        progress: 1,
        minutes_remaining: 0,
      },
    ],
  },
];

export const openCampaigns: DropCampaignGroup[] = [
  {
    group_id: "01k9group0001",
    organization: "Blackpowder Interactive",
    category: cat("counter-strike-2"),
    start_at: "2026-07-21T20:25:00Z",
    end_at: "2026-08-12T10:00:00Z",
    restrictions: [],
    campaign_info_url: "https://blackpowder.gg/kick-drops",
    connect_url: "https://blackpowder.gg/connect",
    participating_channel: "ironvow",
    campaigns: [
      {
        campaign_id: "01k9camp00001",
        name: "Vault Run Season 3",
        start_at: "2026-07-21T20:25:00Z",
        end_at: "2026-08-12T10:00:00Z",
        rewards: vaultRun,
      },
    ],
  },
  {
    group_id: "01k9group0002",
    organization: "Highroller Labs",
    category: cat("slots-casino"),
    start_at: "2026-07-28T00:01:00Z",
    end_at: "2026-08-18T10:00:00Z",
    restrictions: ["Age restricted", "Region restricted"],
    campaign_info_url: "https://highrollerlabs.com/kick-drops",
    connect_url: "https://highrollerlabs.com/connect",
    participating_channel: "midnightden",
    campaigns: [
      {
        campaign_id: "01k9camp00002",
        name: "Highroller Spin Week",
        start_at: "2026-07-28T00:01:00Z",
        end_at: "2026-08-18T10:00:00Z",
        rewards: spinWeek,
      },
    ],
  },
];

export const closedCampaigns: DropCampaignGroup[] = [
  {
    group_id: "01k9group0003",
    organization: "Grimhollow Games",
    category: cat("old-school-runescape"),
    start_at: "2026-06-12T05:45:00Z",
    end_at: "2026-07-26T03:59:00Z",
    restrictions: [],
    campaign_info_url: "https://grimhollow.games/kick-drops",
    connect_url: "https://grimhollow.games/connect",
    participating_channel: "charcoalchef",
    campaigns: [
      {
        campaign_id: "01k9camp00003",
        name: "Deep Sea Trawl",
        start_at: "2026-06-12T05:45:00Z",
        end_at: "2026-07-26T03:59:00Z",
        rewards: trawlRun,
      },
    ],
  },
  {
    group_id: "01k9group0004",
    organization: "Sandpit Softworks",
    category: cat("minecraft"),
    start_at: "2026-05-04T10:00:00Z",
    end_at: "2026-06-22T10:00:00Z",
    restrictions: [],
    campaign_info_url: "https://sandpitsoftworks.com/kick-drops",
    connect_url: "https://sandpitsoftworks.com/connect",
    participating_channel: "charcoalchef",
    campaigns: [
      {
        campaign_id: "01k9camp00004",
        name: "Founders Dig Week",
        start_at: "2026-05-04T10:00:00Z",
        end_at: "2026-05-18T10:00:00Z",
        rewards: [
          reward("01k9dig000001", "Sandpit Founders Pickaxe", art("rune-pickaxe"), 600),
          reward("01k9dig000002", "Deep Slate Supply Crate", art("powder-crate"), 1200),
        ],
      },
      {
        campaign_id: "01k9camp00005",
        name: "Founders Dig Week 2",
        start_at: "2026-06-08T10:00:00Z",
        end_at: "2026-06-22T10:00:00Z",
        rewards: [
          reward("01k9dig000003", "Redstone Vault Key", art("vault-key"), 600),
          reward("01k9dig000004", "Sandpit Emote Pack", art("emote-pack"), 1800),
        ],
      },
    ],
  },
  {
    group_id: "01k9group0005",
    organization: "Couch Senate Media",
    category: cat("just-chatting"),
    start_at: "2026-04-29T10:00:00Z",
    end_at: "2026-05-20T10:00:00Z",
    restrictions: [],
    campaign_info_url: "https://couchsenate.tv/kick-drops",
    connect_url: "https://couchsenate.tv/connect",
    participating_channel: "couchsenate",
    campaigns: [
      {
        campaign_id: "01k9camp00006",
        name: "Senate Session One",
        start_at: "2026-04-29T10:00:00Z",
        end_at: "2026-05-20T10:00:00Z",
        rewards: [
          reward("01k9senate0001", "Couch Senate Emote Pack", art("emote-pack"), 60),
          reward("01k9senate0002", "Senate Seat Jersey", art("club-jersey"), 600),
          reward("01k9senate0003", "Gavel Raffle Ticket x5", art("raffle-ticket"), 1200),
        ],
      },
    ],
  },
];

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

export const formatDropDate = (iso: string) => dateFormat.format(new Date(iso));

export const formatDateRange = (start: string, end: string) =>
  `${formatDropDate(start)} - ${formatDropDate(end)}`;

// kick.com writes whole units only: "1 min to unlock", "Watch 10 hr". Never a decimal.
export function formatWatchTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.round(minutes / 60)} hr`;
}
