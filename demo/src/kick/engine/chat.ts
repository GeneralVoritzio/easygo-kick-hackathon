export type BadgeName =
  "moderator" | "og" | "sub_gifter" | "sub_gifter_teal" | "sub_gifter_purple" | "verified";

export const badgeLabel: Record<BadgeName, string> = {
  moderator: "Moderator",
  og: "OG",
  sub_gifter: "Sub gifter",
  sub_gifter_teal: "Sub gifter",
  sub_gifter_purple: "Sub gifter",
  verified: "Verified",
};

// Identity colours resolved from assets/reference/kick-neon-tokens.css (--neon-identity-*).
const identityColors = [
  "#fea0cf", // bubblegum
  "#a0f6fe", // celeste
  "#fea0a0", // coral
  "#18e9fb", // cyan
  "#eacdfe", // lavender
  "#b8fea0", // lime
  "#fecdcd", // melon
  "#18fbb0", // mint
  "#a0fede", // mist
  "#75fd45", // neon
  "#a0d5fe", // powder
  "#fd72b8", // rose
  "#fedaa0", // sand
  "#45adfc", // sky
  "#fcb645", // sunshine
  "#d8a0fe", // violet
];

export function hashOf(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  return hash;
}

export const colorFor = (username: string) => identityColors[hashOf(username) % identityColors.length];

export type Chatter = { username: string; badges: BadgeName[] };

export const chatters: Chatter[] = [
  { username: "GielinorGremlin", badges: ["og", "sub_gifter_purple"] },
  { username: "IronmanIsobel", badges: ["sub_gifter_teal"] },
  { username: "HardcoreHubert", badges: [] },
  { username: "ScytheOrBust", badges: ["sub_gifter_teal"] },
  { username: "VoidKnightVal", badges: [] },
  { username: "DegenDruid", badges: [] },
  { username: "NoDeathsNoah", badges: ["sub_gifter"] },
  { username: "ZulrahZane", badges: [] },
  { username: "PrayerFlickPip", badges: ["sub_gifter"] },
  { username: "WildyWanderer", badges: [] },
  { username: "SlayerSlander", badges: [] },
  { username: "MaxCapeMara", badges: ["moderator", "sub_gifter_purple"] },
  { username: "ClueScrollCarl", badges: ["og", "sub_gifter"] },
  { username: "BarrowsBandit", badges: ["moderator"] },
  { username: "TickPerfectTia", badges: ["sub_gifter_teal"] },
  { username: "GrindOrGraveGio", badges: [] },
  { username: "FiremakeFinn", badges: [] },
  { username: "OSRS_Oracle", badges: ["verified"] },
  { username: "SkillerSage", badges: ["sub_gifter_teal"] },
  { username: "PkerPaz", badges: [] },
  { username: "IronVowSimp42", badges: ["og"] },
  { username: "ChinFlickChad", badges: [] },
  { username: "RunecraftRon", badges: [] },
  { username: "BossMageBea", badges: ["sub_gifter_purple"] },
];

export const chatLines = [
  "one death and it's over lol",
  "GET THE FIRE CAPE",
  "chat this is actually insane",
  "pray flick or you're dying",
  "did he just tick manip that",
  "ironman mentality W",
  "no deaths challenge is diabolical",
  "zulrah phase check",
  "clip that for the vod",
  "praying to rng gods rn",
  "this drop rate is criminal",
  "hardcore nerves are unmatched",
  "someone send a clue scroll",
  "chat calm down it's fine",
  "restock the food before wildy",
  "that was way too close",
  "W stream honestly",
  "how many hours in ironman now",
  "sub goal when",
  "run it back",
];

// The room when it is loud. The engine picks from here while a surge is running.
export const hypeLines = [
  "LETS GOOOO",
  "CLIP THAT",
  "NO WAY HE HIT THAT",
  "chat we are so back",
  "ACTUAL INSANITY",
  "HE COOKED",
  "WWWWW",
  "framed and on my wall",
];

// The room when it is unimpressed. Kept short, because salt is a minority of any chat.
export const saltLines = [
  "that was a throw ngl",
  "mid diff",
  "unlucky",
  "copium",
  "we ball anyway",
];

// kick GET /public/v1/emotes. Names and ids read off the live emote picker on 27 July 2026.
export const emoteCatalog = [
  { id: 1730753, name: "emojiAngry" },
  { id: 1579033, name: "emojiAstonished" },
  { id: 1730752, name: "emojiAngel" },
  { id: 1730754, name: "emojiAwake" },
  { id: 1579036, name: "emojiBlowKiss" },
  { id: 1730755, name: "emojiBubbly" },
  { id: 1730756, name: "emojiCheerful" },
  { id: 1730758, name: "emojiClown" },
  { id: 1730759, name: "emojiCool" },
  { id: 1730760, name: "emojiCrave" },
];

export const emoteToken = (id: number, name: string) => `[emote:${id}:${name}]`;
