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

export function colorFor(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  return identityColors[hash % identityColors.length];
}

export type BadgeName =
  | "moderator"
  | "og"
  | "sub_gifter"
  | "sub_gifter_teal"
  | "sub_gifter_purple"
  | "verified";

export const chatters: { username: string; badges: BadgeName[] }[] = [
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
  "he dies to the dumbest trap every time",
  "chat i think he dies here",
  "not him dying to that again",
  "bro dies two ticks from safety",
  "why do you keep dying to that same angle",
];

// Lines a moment's own hype score picks between: loud (above threshold) vs the calm pool above.
export const chatHypeLines = [
  "LETS GOOOO",
  "CLIP THAT",
  "NO WAY HE HIT THAT",
  "ACTUAL INSANITY",
  "WWWWW",
  "chat we are so back",
  "THAT WAS FILTHY",
  "HE COOKED",
  "SHEEEESH",
  "framed and on my wall",
  "HE DIES LMAOOO",
  "NO WAY HE DIES THERE",
];
