import { artFor, cat, channelBySlug, liveStreamFor, type Channel, type Livestream } from "./api";

export const EVENTS_NOW = new Date("2026-07-26T13:30:00Z");

// pending: the host invited them and they have not answered.
// requested: they asked to join and the host has not answered.
export type EventInviteStatus = "pending" | "requested" | "accepted" | "rejected";

export type EventParticipant = {
  channel: Channel;
  role: "host" | "guest";
  invite_status: EventInviteStatus;
  invited_at: string;
  responded_at: string | null;
  slot_title: string;
};

export type EventChatSettings = {
  moderators: string[];
  slow_mode_seconds: number;
  is_subscribers_only: boolean;
  is_followers_only: boolean;
};

// An event stays private until the host has an answer from everybody they invited. Only a public
// event reaches a viewer surface.
export type EventVisibility = "private" | "public";

export type EventCategory = { name: string; slug: string };

export type KickEvent = {
  event_id: string;
  slug: string;
  title: string;
  description: string;
  host_channel: Channel;
  category: EventCategory;
  start_at: string;
  end_at: string;
  // The event artwork. The detail page shows it at its own ratio and uses a blurred copy as the
  // background. A card crops it to the landscape box every other card on the site uses.
  poster: string;
  visibility: EventVisibility;
  // How many viewers set a reminder. A live event counts heads instead, off the channels on the
  // running order, so this is the number an event carries before it starts.
  reminder_count: number;
  is_partner_only: boolean;
  participants: EventParticipant[];
  chat: EventChatSettings;
};

const TODAY_CATEGORY: EventCategory = { name: "Today", slug: "today" };

// A host who uploads nothing gets a plain plate, never one of the fourteen drawn posters. A poster
// carries the name of the event it was drawn for, so handing it to a second event contradicts both.
const POSTER_PLATES = [
  "cat-just-chatting",
  "cat-old-school-runescape",
  "cat-slots-casino",
  "cat-irl",
  "cat-gakuen-idolmaster",
  "cat-just-sleeping",
  "cat-league-of-legends",
  "cat-minecraft",
  "cat-music",
  "cat-grand-theft-auto-v",
  "cat-counter-strike-2",
  "cat-vr-chat",
];

export const randomPoster = () =>
  artFor(POSTER_PLATES[Math.floor(Math.random() * POSTER_PLATES.length)]);

const INVITED_AT = "2026-07-18T09:00:00Z";
const RESPONDED_AT = "2026-07-19T21:00:00Z";

const host = (slug: string, slot_title: string): EventParticipant => ({
  channel: channelBySlug(slug),
  role: "host",
  invite_status: "accepted",
  invited_at: INVITED_AT,
  responded_at: INVITED_AT,
  slot_title,
});

const guest = (
  slug: string,
  slot_title: string,
  invite_status: EventInviteStatus = "accepted",
): EventParticipant => ({
  channel: channelBySlug(slug),
  role: "guest",
  invite_status,
  invited_at: INVITED_AT,
  responded_at: invite_status === "accepted" || invite_status === "rejected" ? RESPONDED_AT : null,
  slot_title,
});

const coreEvents: KickEvent[] = [
  {
    event_id: "01k9event0061",
    slug: "easygo-mini-hackathon-fortress",
    title: "Easygo Mini Hackathon - Fortress",
    description:
      "Team Fortress builds the hype tracker live for the Easygo Mini Hackathon, powered by KICK. One stream, one challenge, and the running order is whatever chat wants to see shipped next.",
    host_channel: channelBySlug("superdude1337"),
    category: TODAY_CATEGORY,
    start_at: "2026-07-26T09:00:00Z",
    end_at: "2026-07-26T18:00:00Z",
    poster: artFor("poster-easygo-mini-hackathon-fortress"),
    visibility: "public",
    reminder_count: 128,
    is_partner_only: true,
    participants: [
      host("superdude1337", "Team Fortress, the build"),
      guest("couchsenate", "The desk, judging the demo"),
      guest("wanderfuse", "Crowd cam, floor reactions"),
      guest("tiltcabinet", "Second build seat"),
      guest("spinvicar", "Third build seat"),
      guest("notadoc", "The mentor seat"),
    ],
    chat: {
      moderators: ["HypeTrackerHQ"],
      slow_mode_seconds: 0,
      is_subscribers_only: false,
      is_followers_only: false,
    },
  },
  {
    event_id: "01k9event0001",
    slug: "final-showdown",
    title: "Final Showdown",
    description:
      "Team Alpha against Team Omega, and every channel on the running order carries its own angle of the same arena. Chat picks the map every round, and the losing side hands the show to the next seat.",
    host_channel: channelBySlug("couchsenate"),
    category: cat("counter-strike-2"),
    start_at: "2026-07-26T12:00:00Z",
    end_at: "2026-07-26T18:00:00Z",
    poster: artFor("poster-final-showdown"),
    visibility: "public",
    reminder_count: 18420,
    is_partner_only: true,
    participants: [
      host("couchsenate", "The desk and the map vote"),
      guest("ironvow", "Alpha side, first player"),
      guest("charcoalchef", "Omega side, first player"),
      guest("capequest", "Alpha side, second player"),
      guest("cluecrawler", "Omega side, second player"),
      guest("flickgremlin", "Alpha side, third player"),
      guest("mudbrickmage", "Omega side, third player"),
      guest("notadoc", "The medic desk"),
      guest("wanderfuse", "The crowd cam"),
      guest("superdude1337", "The closing game"),
      guest("spinvicar", "Standby seat", "pending"),
    ],
    chat: {
      moderators: ["GavelGoblin", "MotionToVibe"],
      slow_mode_seconds: 5,
      is_subscribers_only: false,
      is_followers_only: true,
    },
  },
  {
    event_id: "01k9event0002",
    slug: "power-play-arena",
    title: "Power Play Arena",
    description:
      "Nightfury against Valor Prime for the last spot in the final. One arena, one goal, and the crowd cam runs on every channel.",
    host_channel: channelBySlug("nocturnalnorm"),
    category: cat("league-of-legends"),
    start_at: "2026-07-26T20:30:00Z",
    end_at: "2026-07-26T23:30:00Z",
    poster: artFor("poster-power-play-arena"),
    visibility: "public",
    reminder_count: 9130,
    is_partner_only: true,
    participants: [
      host("nocturnalnorm", "Desk and the coin toss"),
      guest("snoozebaron", "Nightfury side"),
      guest("superdude1337", "Valor Prime side", "pending"),
    ],
    chat: {
      moderators: ["PillowFortPam", "QuietHoursQuinn"],
      slow_mode_seconds: 10,
      is_subscribers_only: false,
      is_followers_only: true,
    },
  },
  {
    event_id: "01k9event0003",
    slug: "arena-clash",
    title: "Arena Clash",
    description:
      "Friday night, three channels, one bracket. Every match runs to two wins and the winner picks the next opponent live on stream.",
    host_channel: channelBySlug("ironvow"),
    category: cat("league-of-legends"),
    start_at: "2026-07-31T21:00:00Z",
    end_at: "2026-08-01T00:30:00Z",
    poster: artFor("poster-arena-clash"),
    visibility: "public",
    reminder_count: 4207,
    is_partner_only: true,
    participants: [
      host("ironvow", "Round one and the bracket draw"),
      guest("cluecrawler", "Round two"),
      guest("capequest", "The final"),
      guest("mudbrickmage", "Reserve", "pending"),
    ],
    chat: {
      moderators: ["TinderboxTina", "RelayRefLarry"],
      slow_mode_seconds: 3,
      is_subscribers_only: false,
      is_followers_only: true,
    },
  },
  {
    event_id: "01k9event0004",
    slug: "squad-rush",
    title: "Squad Rush",
    description:
      "Four squads drop on the same island and every channel holds one squad cam. Falcon, Viper, Shadow and Reaper, and chat calls the rotations.",
    host_channel: channelBySlug("superdude1337"),
    category: cat("grand-theft-auto-v"),
    start_at: "2026-08-08T19:00:00Z",
    end_at: "2026-08-08T23:00:00Z",
    poster: artFor("poster-squad-rush"),
    visibility: "private",
    reminder_count: 312,
    is_partner_only: true,
    participants: [
      host("superdude1337", "Falcon squad and the drop call"),
      guest("charcoalchef", "Viper squad"),
      guest("notadoc", "Shadow squad", "rejected"),
      guest("spinvicar", "Asked to join", "requested"),
      guest("tiltcabinet", "Asked to join", "requested"),
    ],
    chat: {
      moderators: ["SpatulaSheriff", "MiseEnPlaceMo"],
      slow_mode_seconds: 5,
      is_subscribers_only: false,
      is_followers_only: false,
    },
  },
  {
    event_id: "01k9event0005",
    slug: "battle-night-live",
    title: "Battle Night Live",
    description:
      "Saturday night and the whole roster is on. Every channel runs a different lane of the same match, so pick a seat and stay there.",
    host_channel: channelBySlug("midnightden"),
    category: cat("league-of-legends"),
    start_at: "2026-08-22T20:00:00Z",
    end_at: "2026-08-22T23:59:00Z",
    poster: artFor("poster-battle-night-live"),
    visibility: "public",
    reminder_count: 6640,
    is_partner_only: true,
    participants: [
      host("midnightden", "Main stage"),
      guest("spinvicar", "Second lane"),
      guest("tiltcabinet", "Third lane"),
    ],
    chat: {
      moderators: ["DenMotherDot", "CashoutCarl"],
      slow_mode_seconds: 10,
      is_subscribers_only: true,
      is_followers_only: true,
    },
  },
  {
    event_id: "01k9event0006",
    slug: "cyber-warfare",
    title: "Cyber Warfare",
    description:
      "The tournament final, blue side against red side, and each channel carries one team's comms. Nobody knows the map until the drop.",
    host_channel: channelBySlug("tiltcabinet"),
    category: cat("counter-strike-2"),
    start_at: "2026-10-12T20:00:00Z",
    end_at: "2026-10-12T23:00:00Z",
    poster: artFor("poster-cyber-warfare"),
    visibility: "public",
    reminder_count: 22140,
    is_partner_only: true,
    participants: [
      host("tiltcabinet", "Blue side comms"),
      guest("spinvicar", "Red side comms"),
      guest("reelgoblin", "The desk"),
    ],
    chat: {
      moderators: ["CashoutCarl", "DenMotherDot"],
      slow_mode_seconds: 5,
      is_subscribers_only: false,
      is_followers_only: true,
    },
  },
  {
    event_id: "01k9event0007",
    slug: "arena-champions",
    title: "Arena Champions",
    description:
      "The grand final of the season, live on every channel on the running order. One million on the line and chat votes the most valuable player.",
    host_channel: channelBySlug("wanderfuse"),
    category: cat("league-of-legends"),
    start_at: "2026-10-20T19:30:00Z",
    end_at: "2026-10-20T23:00:00Z",
    poster: artFor("poster-arena-champions"),
    visibility: "public",
    reminder_count: 41380,
    is_partner_only: true,
    participants: [
      host("wanderfuse", "The grand final"),
      guest("vanlifevoid", "Second seat"),
      guest("flickgremlin", "The recap reel"),
    ],
    chat: {
      moderators: ["AwningAndy", "DieselDaphne"],
      slow_mode_seconds: 5,
      is_subscribers_only: false,
      is_followers_only: true,
    },
  },
  {
    event_id: "01k9event0008",
    slug: "fps-ultimate",
    title: "FPS Ultimate",
    description:
      "The pro showdown. Three channels, one lobby, and the last squad standing takes the night. Special guests join between rounds.",
    host_channel: channelBySlug("spinvicar"),
    category: cat("counter-strike-2"),
    start_at: "2026-10-28T21:00:00Z",
    end_at: "2026-10-29T01:00:00Z",
    poster: artFor("poster-fps-ultimate"),
    visibility: "public",
    reminder_count: 15720,
    is_partner_only: true,
    participants: [
      host("spinvicar", "The pro lobby"),
      guest("tiltcabinet", "Second lobby"),
      guest("notadoc", "The medic desk"),
    ],
    chat: {
      moderators: ["CashoutCarl", "RelayRefLarry"],
      slow_mode_seconds: 5,
      is_subscribers_only: false,
      is_followers_only: true,
    },
  },
  {
    event_id: "01k9event0009",
    slug: "legends-awaken",
    title: "Legends Awaken",
    description:
      "The raid night that closes the season. Two channels ride in, one holds the wall, and chat calls the boss timers.",
    host_channel: channelBySlug("charcoalchef"),
    category: cat("old-school-runescape"),
    start_at: "2026-11-01T19:00:00Z",
    end_at: "2026-11-01T23:00:00Z",
    poster: artFor("poster-legends-awaken"),
    visibility: "public",
    reminder_count: 8890,
    is_partner_only: true,
    participants: [
      host("charcoalchef", "The gate"),
      guest("panfriedpaul", "The wall"),
      guest("notadoc", "The healer cam"),
    ],
    chat: {
      moderators: ["SpatulaSheriff", "MiseEnPlaceMo"],
      slow_mode_seconds: 5,
      is_subscribers_only: false,
      is_followers_only: false,
    },
  },
  {
    event_id: "01k9event0062",
    slug: "nexus-clash",
    title: "Nexus Clash",
    description:
      "The grand final, and the prize pool is 750,000 dollars. Four channels hold four lanes of the same nexus fight, and chat calls the objective timers.",
    host_channel: channelBySlug("ironvow"),
    category: cat("league-of-legends"),
    start_at: "2026-12-06T20:00:00Z",
    end_at: "2026-12-06T23:30:00Z",
    poster: artFor("poster-nexus-clash"),
    visibility: "public",
    reminder_count: 31460,
    is_partner_only: true,
    participants: [
      host("ironvow", "Mid lane and the draft"),
      guest("couchsenate", "Top lane"),
      guest("charcoalchef", "Bottom lane"),
      guest("snoozebaron", "The jungle cam"),
    ],
    chat: {
      moderators: ["BracketBrett", "RunningOrderRhi"],
      slow_mode_seconds: 5,
      is_subscribers_only: false,
      is_followers_only: true,
    },
  },
  {
    event_id: "01k9event0063",
    slug: "turbo-circuit",
    title: "Turbo Circuit",
    description:
      "The championship round on the night circuit. Every channel carries one car camera, so pick a driver and ride the whole race with them.",
    host_channel: channelBySlug("wanderfuse"),
    category: cat("grand-theft-auto-v"),
    start_at: "2026-12-12T21:00:00Z",
    end_at: "2026-12-13T00:00:00Z",
    poster: artFor("poster-turbo-circuit"),
    visibility: "public",
    reminder_count: 12730,
    is_partner_only: true,
    participants: [
      host("wanderfuse", "Car 07 and the grid walk"),
      guest("tiltcabinet", "Car 12"),
      guest("superdude1337", "The pit lane"),
      guest("spinvicar", "Standby seat", "pending"),
    ],
    chat: {
      moderators: ["SeatSwapSam", "DieselDaphne"],
      slow_mode_seconds: 3,
      is_subscribers_only: false,
      is_followers_only: true,
    },
  },
  {
    event_id: "01k9event0064",
    slug: "king-of-combos",
    title: "King of Combos",
    description:
      "The final match of the pro showdown, red corner against blue corner. Special guests break down every round, and the winner picks the last stage.",
    host_channel: channelBySlug("superdude1337"),
    category: cat("counter-strike-2"),
    start_at: "2026-12-14T19:30:00Z",
    end_at: "2026-12-14T23:00:00Z",
    poster: artFor("poster-king-of-combos"),
    visibility: "public",
    reminder_count: 19080,
    is_partner_only: true,
    participants: [
      host("superdude1337", "Red corner and the stage pick"),
      guest("spinvicar", "Blue corner"),
      guest("tiltcabinet", "The frame data desk"),
      guest("notadoc", "Special guest seat", "pending"),
    ],
    chat: {
      moderators: ["BracketBrett", "CrossChatCass"],
      slow_mode_seconds: 5,
      is_subscribers_only: false,
      is_followers_only: true,
    },
  },
  {
    event_id: "01k9event0065",
    slug: "virtual-cup",
    title: "Virtual Cup",
    description:
      "The world series final. Top teams, one trophy, and each channel holds a different camera on the pitch. Chat votes the player of the match.",
    host_channel: channelBySlug("notadoc"),
    category: cat("just-chatting"),
    start_at: "2026-12-18T20:00:00Z",
    end_at: "2026-12-18T23:00:00Z",
    poster: artFor("poster-virtual-cup"),
    visibility: "public",
    reminder_count: 27510,
    is_partner_only: true,
    participants: [
      host("notadoc", "The desk and the team news"),
      guest("couchsenate", "Home end camera"),
      guest("panfriedpaul", "Away end camera"),
      guest("midnightden", "The trophy lift"),
    ],
    chat: {
      moderators: ["RunningOrderRhi", "HandoverHana"],
      slow_mode_seconds: 10,
      is_subscribers_only: false,
      is_followers_only: true,
    },
  },
  {
    event_id: "01k9event0066",
    slug: "arcane-decks",
    title: "Arcane Decks",
    description:
      "The championship stream for the card meta. Two channels show the board and one shows the hands, so you see every play as it lands.",
    host_channel: channelBySlug("midnightden"),
    category: cat("slots-casino"),
    start_at: "2026-12-20T20:30:00Z",
    end_at: "2026-12-21T00:00:00Z",
    poster: artFor("poster-arcane-decks"),
    visibility: "public",
    reminder_count: 14290,
    is_partner_only: true,
    participants: [
      host("midnightden", "The board cam"),
      guest("nocturnalnorm", "The hand cam"),
      guest("snoozebaron", "The deck list desk", "pending"),
      guest("charcoalchef", "Asked to join", "requested"),
    ],
    chat: {
      moderators: ["SlotOneSteve", "CrossChatCass"],
      slow_mode_seconds: 5,
      is_subscribers_only: true,
      is_followers_only: true,
    },
  },
];

type NewEventSeed = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  host: string;
  hostTitle: string;
  guests: [string, string, EventInviteStatus?][];
  start: string;
  end: string;
  reminder: number;
  mods: [string, string];
};

// Each of these carries its own poster, one per slug, built on the same typographic template
// as the fourteen bespoke posters above rather than the flat category plate.
const buildEvent = (seed: NewEventSeed): KickEvent => ({
  event_id: seed.id,
  slug: seed.slug,
  title: seed.title,
  description: seed.description,
  host_channel: channelBySlug(seed.host),
  category: cat(seed.category),
  start_at: seed.start,
  end_at: seed.end,
  poster: artFor(`poster-${seed.slug}`),
  visibility: "public",
  reminder_count: seed.reminder,
  is_partner_only: true,
  participants: [
    host(seed.host, seed.hostTitle),
    ...seed.guests.map(([slug, slot_title, status]) => guest(slug, slot_title, status)),
  ],
  chat: {
    moderators: seed.mods,
    slow_mode_seconds: 5,
    is_subscribers_only: false,
    is_followers_only: true,
  },
});

const NEW_EVENT_SEEDS: NewEventSeed[] = [
  // Old School RuneScape
  {
    id: "01k9event0010",
    slug: "theatre-of-blood-hard-mode",
    title: "Theatre of Blood, Hard Mode",
    description:
      "Five channels, one raid team, and a wipe sends everybody back to the lobby. Chat calls the tank swaps and the Nylocas prayer flicks.",
    category: "old-school-runescape",
    host: "ironvow",
    hostTitle: "Tank and the prayer calls",
    guests: [
      ["capequest", "Melee DPS"],
      ["mudbrickmage", "Range DPS"],
      ["notadoc", "Support and the vengeance timer"],
    ],
    start: "2026-08-02T18:00:00Z",
    end: "2026-08-02T21:00:00Z",
    reminder: 3210,
    mods: ["WildyWarden", "BarrowsBrian"],
  },
  {
    id: "01k9event0011",
    slug: "wilderness-bounty-hunter-special",
    title: "Wilderness Bounty Hunter Special",
    description:
      "Every channel hunts a different target in the deep wilderness, and the loot splits live on stream. One life, full risk, and the Emblem Trader is watching.",
    category: "old-school-runescape",
    host: "capequest",
    hostTitle: "First target, deep wilderness",
    guests: [
      ["ironvow", "Second target"],
      ["flickgremlin", "PJ watch, edge of the wildy"],
    ],
    start: "2026-08-05T20:00:00Z",
    end: "2026-08-05T23:00:00Z",
    reminder: 5460,
    mods: ["WildyWarden", "BarrowsBrian"],
  },
  {
    id: "01k9event0012",
    slug: "50v50-deep-wilderness-clan-war",
    title: "50v50 Deep Wilderness Clan War",
    description:
      "Two clans, one obelisk, and every channel carries a different flank. Chat back at base calls the retreat before the freeze traps land.",
    category: "old-school-runescape",
    host: "wanderfuse",
    hostTitle: "Front line, west flank",
    guests: [
      ["ironvow", "East flank"],
      ["mudbrickmage", "Freeze caller"],
      ["capequest", "Loot runner"],
    ],
    start: "2026-08-09T19:00:00Z",
    end: "2026-08-09T22:00:00Z",
    reminder: 8890,
    mods: ["WildyWarden", "BarrowsBrian"],
  },
  {
    id: "01k9event0013",
    slug: "chambers-of-xeric-speedrun-gauntlet",
    title: "Chambers of Xeric Speedrun Gauntlet",
    description:
      "Three teams race the same raid back to back, and the fastest clear takes the night. Every channel carries its own team's Olm fight.",
    category: "old-school-runescape",
    host: "notadoc",
    hostTitle: "Team one, healer",
    guests: [
      ["capequest", "Team two, tank"],
      ["ironvow", "Team three, DPS lead"],
    ],
    start: "2026-08-16T17:00:00Z",
    end: "2026-08-16T20:30:00Z",
    reminder: 4120,
    mods: ["WildyWarden", "BarrowsBrian"],
  },
  {
    id: "01k9event0014",
    slug: "barrows-brothers-bingo-night",
    title: "Barrows Brothers Bingo Night",
    description:
      "Chat fills the bingo card while six channels dig up the crypt, and the first full row splits the chest. Dharok's is always the last brother standing.",
    category: "old-school-runescape",
    host: "mudbrickmage",
    hostTitle: "The crypt dig",
    guests: [
      ["flickgremlin", "The chest count"],
      ["panfriedpaul", "The prayer drain watch"],
    ],
    start: "2026-08-23T18:30:00Z",
    end: "2026-08-23T21:00:00Z",
    reminder: 2870,
    mods: ["WildyWarden", "BarrowsBrian"],
  },
  {
    id: "01k9event0015",
    slug: "fire-cape-gauntlet",
    title: "Fire Cape Gauntlet",
    description:
      "Four hopefuls queue the Fight Cave back to back, and chat is not allowed to look away during the Jad phase. One cape, four attempts, and the run resets on death.",
    category: "old-school-runescape",
    host: "capequest",
    hostTitle: "Attempt one",
    guests: [
      ["ironvow", "Attempt two"],
      ["notadoc", "Attempt three"],
      ["mudbrickmage", "Attempt four, standby", "pending"],
    ],
    start: "2026-09-06T19:00:00Z",
    end: "2026-09-06T23:00:00Z",
    reminder: 6740,
    mods: ["WildyWarden", "BarrowsBrian"],
  },
  {
    id: "01k9event0016",
    slug: "zulrah-solo-mass",
    title: "Zulrah Solo Mass",
    description:
      "Every channel runs its own Zulrah kill count in parallel, and the highest total by midnight wins the pot. The rotation calls stay in chat, not in game.",
    category: "old-school-runescape",
    host: "ironvow",
    hostTitle: "The kill count",
    guests: [
      ["capequest", "The second lane"],
      ["flickgremlin", "The third lane"],
    ],
    start: "2026-09-13T18:00:00Z",
    end: "2026-09-13T22:00:00Z",
    reminder: 3980,
    mods: ["WildyWarden", "BarrowsBrian"],
  },
  {
    id: "01k9event0017",
    slug: "skill-race-to-99-woodcutting",
    title: "Skill Race to 99: Woodcutting Edition",
    description:
      "Six channels start at the same level and the first axe to hit 99 ends the stream early for everybody else. Ivy respawns are the only thing anyone is watching.",
    category: "old-school-runescape",
    host: "wanderfuse",
    hostTitle: "Lane one",
    guests: [
      ["mudbrickmage", "Lane two"],
      ["panfriedpaul", "Lane three"],
      ["notadoc", "Lane four"],
    ],
    start: "2026-09-20T16:00:00Z",
    end: "2026-09-20T20:00:00Z",
    reminder: 5120,
    mods: ["WildyWarden", "BarrowsBrian"],
  },
  {
    id: "01k9event0018",
    slug: "group-ironman-drop-party-finale",
    title: "Group Ironman Drop Party Finale",
    description:
      "The season ends here. The group empties the bank on stream and chat calls who gets first pick off the pile.",
    category: "old-school-runescape",
    host: "capequest",
    hostTitle: "The bank tip",
    guests: [
      ["ironvow", "Second pick caller"],
      ["mudbrickmage", "Third pick caller"],
      ["flickgremlin", "The overflow pile"],
    ],
    start: "2026-09-27T20:00:00Z",
    end: "2026-09-27T22:30:00Z",
    reminder: 9210,
    mods: ["WildyWarden", "BarrowsBrian"],
  },

  // Grand Theft Auto V
  {
    id: "01k9event0019",
    slug: "the-cayo-perico-redo",
    title: "The Cayo Perico Redo",
    description:
      "Last month's heist went wrong on stream, so four channels run it again with a new approach. The primary target stays secret until the boat leaves the dock.",
    category: "grand-theft-auto-v",
    host: "tiltcabinet",
    hostTitle: "The infiltration",
    guests: [
      ["spinvicar", "The getaway boat"],
      ["vanlifevoid", "The distraction team"],
    ],
    start: "2026-08-03T20:00:00Z",
    end: "2026-08-03T23:00:00Z",
    reminder: 4310,
    mods: ["HeistHelga", "GetawayGareth"],
  },
  {
    id: "01k9event0020",
    slug: "los-santos-street-race-grand-prix",
    title: "Los Santos Street Race Grand Prix",
    description:
      "Eight channels, one circuit, and the loser buys the winner a new paint job. Chat votes the track between every heat.",
    category: "grand-theft-auto-v",
    host: "spinvicar",
    hostTitle: "Heat one",
    guests: [
      ["tiltcabinet", "Heat two"],
      ["yapmerchant", "Heat three"],
      ["cluecrawler", "Heat four"],
    ],
    start: "2026-08-10T19:30:00Z",
    end: "2026-08-10T22:00:00Z",
    reminder: 7650,
    mods: ["HeistHelga", "GetawayGareth"],
  },
  {
    id: "01k9event0021",
    slug: "cops-and-robbers-city-wide",
    title: "Cops and Robbers, City Wide",
    description:
      "Half the channels run the heist and half run the badge, and every channel keeps its own dispatch open. The city stays live until somebody flips.",
    category: "grand-theft-auto-v",
    host: "midnightden",
    hostTitle: "Dispatch lead",
    guests: [
      ["tiltcabinet", "The crew"],
      ["vanlifevoid", "Undercover"],
    ],
    start: "2026-08-17T18:00:00Z",
    end: "2026-08-17T21:30:00Z",
    reminder: 5890,
    mods: ["HeistHelga", "GetawayGareth"],
  },
  {
    id: "01k9event0022",
    slug: "diamond-casino-heist-live",
    title: "Diamond Casino Heist Live",
    description:
      "Silent and sneaky or loud and aggressive, chat votes the approach before the vault door opens. Every channel carries a different crew role.",
    category: "grand-theft-auto-v",
    host: "spinvicar",
    hostTitle: "The vault",
    guests: [
      ["tiltcabinet", "Security"],
      ["yapmerchant", "The getaway driver"],
    ],
    start: "2026-08-24T20:00:00Z",
    end: "2026-08-24T23:30:00Z",
    reminder: 6120,
    mods: ["HeistHelga", "GetawayGareth"],
  },
  {
    id: "01k9event0023",
    slug: "demolition-derby-friday",
    title: "Demolition Derby Friday",
    description:
      "Twelve channels, one scrapyard arena, and the last engine still running takes the pot. Chat picks who gets rammed first.",
    category: "grand-theft-auto-v",
    host: "tiltcabinet",
    hostTitle: "The arena",
    guests: [
      ["cluecrawler", "Lane two"],
      ["vanlifevoid", "Lane three"],
    ],
    start: "2026-08-31T19:00:00Z",
    end: "2026-08-31T21:00:00Z",
    reminder: 3450,
    mods: ["HeistHelga", "GetawayGareth"],
  },
  {
    id: "01k9event0024",
    slug: "freemode-free-for-all",
    title: "Freemode Free-for-All",
    description:
      "No teams, no rules, and every channel is a target. The last name on the leaderboard by midnight gets the bounty pot.",
    category: "grand-theft-auto-v",
    host: "yapmerchant",
    hostTitle: "The open lobby",
    guests: [
      ["spinvicar", "Second lobby"],
      ["midnightden", "Third lobby"],
    ],
    start: "2026-09-07T20:30:00Z",
    end: "2026-09-07T23:30:00Z",
    reminder: 4780,
    mods: ["HeistHelga", "GetawayGareth"],
  },
  {
    id: "01k9event0025",
    slug: "drift-kings-of-vinewood",
    title: "Drift Kings of Vinewood",
    description:
      "Six channels run the canyon course back to back and chat scores every run on style, not on time. The judges panel is the whole comment section.",
    category: "grand-theft-auto-v",
    host: "cluecrawler",
    hostTitle: "Run one",
    guests: [
      ["tiltcabinet", "Run two"],
      ["spinvicar", "Run three"],
    ],
    start: "2026-09-14T19:00:00Z",
    end: "2026-09-14T21:30:00Z",
    reminder: 3120,
    mods: ["HeistHelga", "GetawayGareth"],
  },
  {
    id: "01k9event0026",
    slug: "bank-job-the-union-depository",
    title: "Bank Job: The Union Depository",
    description:
      "The oldest heist in the city, run with a new crew on every channel. The vault code changes every attempt, so nobody can call it early.",
    category: "grand-theft-auto-v",
    host: "spinvicar",
    hostTitle: "The vault code",
    guests: [
      ["tiltcabinet", "The lookout"],
      ["yapmerchant", "The drill"],
    ],
    start: "2026-09-21T18:30:00Z",
    end: "2026-09-21T22:00:00Z",
    reminder: 5340,
    mods: ["HeistHelga", "GetawayGareth"],
  },
  {
    id: "01k9event0027",
    slug: "gang-wars-turf-takeover",
    title: "Gang Wars: Turf Takeover",
    description:
      "Four crews, one map, and the turf that holds the most channels by sunrise keeps it for the season. Every takeover streams live from both sides.",
    category: "grand-theft-auto-v",
    host: "midnightden",
    hostTitle: "North turf",
    guests: [
      ["tiltcabinet", "South turf"],
      ["vanlifevoid", "East turf"],
      ["cluecrawler", "West turf"],
    ],
    start: "2026-09-28T20:00:00Z",
    end: "2026-09-28T23:00:00Z",
    reminder: 6980,
    mods: ["HeistHelga", "GetawayGareth"],
  },

  // Counter-Strike 2
  {
    id: "01k9event0028",
    slug: "community-cup-semifinal",
    title: "Community Cup Semifinal",
    description:
      "The bracket narrows to two, and every channel carries one side of the server. The winner books the final, the loser books a rematch request.",
    category: "counter-strike-2",
    host: "tiltcabinet",
    hostTitle: "Blue side",
    guests: [
      ["spinvicar", "Red side"],
      ["reelgoblin", "The desk"],
    ],
    start: "2026-08-04T19:00:00Z",
    end: "2026-08-04T22:00:00Z",
    reminder: 7230,
    mods: ["ClutchClara", "SmokeStackSam"],
  },
  {
    id: "01k9event0029",
    slug: "retake-royale",
    title: "Retake Royale",
    description:
      "One bomb site, one defuser, and every round is a new five against one. Chat picks who plants and the retake starts the second the timer runs.",
    category: "counter-strike-2",
    host: "spinvicar",
    hostTitle: "The plant side",
    guests: [["tiltcabinet", "The retake side"]],
    start: "2026-08-11T20:00:00Z",
    end: "2026-08-11T22:30:00Z",
    reminder: 4560,
    mods: ["ClutchClara", "SmokeStackSam"],
  },
  {
    id: "01k9event0030",
    slug: "ace-or-nothing-invitational",
    title: "Ace or Nothing Invitational",
    description:
      "Every round only ends one way, five kills or a loss, and every channel carries a different lobby. The scoreboard resets the second somebody trades.",
    category: "counter-strike-2",
    host: "tiltcabinet",
    hostTitle: "Lobby one",
    guests: [
      ["spinvicar", "Lobby two"],
      ["flickgremlin", "Lobby three"],
    ],
    start: "2026-08-18T19:30:00Z",
    end: "2026-08-18T22:00:00Z",
    reminder: 5980,
    mods: ["ClutchClara", "SmokeStackSam"],
  },
  {
    id: "01k9event0031",
    slug: "pistol-round-purgatory",
    title: "Pistol Round Purgatory",
    description:
      "Every round is a pistol round, no buy menu, all night. Chat votes the loadout between rounds and the desk reads the votes live.",
    category: "counter-strike-2",
    host: "spinvicar",
    hostTitle: "The desk and the vote",
    guests: [
      ["tiltcabinet", "Team one"],
      ["reelgoblin", "Team two"],
    ],
    start: "2026-08-25T18:00:00Z",
    end: "2026-08-25T20:30:00Z",
    reminder: 3670,
    mods: ["ClutchClara", "SmokeStackSam"],
  },
  {
    id: "01k9event0032",
    slug: "lan-qualifier-group-a",
    title: "LAN Qualifier: Group A",
    description:
      "Four teams fight for the last LAN slot, and every channel runs a different bracket seat. The group standings update live between matches.",
    category: "counter-strike-2",
    host: "tiltcabinet",
    hostTitle: "Group A, seat one",
    guests: [
      ["spinvicar", "Seat two"],
      ["flickgremlin", "Seat three"],
      ["cluecrawler", "Seat four"],
    ],
    start: "2026-09-01T19:00:00Z",
    end: "2026-09-01T23:00:00Z",
    reminder: 8940,
    mods: ["ClutchClara", "SmokeStackSam"],
  },
  {
    id: "01k9event0033",
    slug: "clutch-gauntlet",
    title: "Clutch Gauntlet",
    description:
      "One player, four opponents, and the round only ends when somebody dies. Every channel runs a fresh gauntlet with a new lineup.",
    category: "counter-strike-2",
    host: "spinvicar",
    hostTitle: "The gauntlet seat",
    guests: [
      ["tiltcabinet", "First opponent"],
      ["reelgoblin", "Second opponent"],
    ],
    start: "2026-09-08T20:00:00Z",
    end: "2026-09-08T22:00:00Z",
    reminder: 4210,
    mods: ["ClutchClara", "SmokeStackSam"],
  },
  {
    id: "01k9event0034",
    slug: "deagle-duels-showcase",
    title: "Deagle Duels Showcase",
    description:
      "Pistols only, one tap or nothing, and every channel runs its own bracket. The final round streams on every seat at once.",
    category: "counter-strike-2",
    host: "tiltcabinet",
    hostTitle: "Bracket one",
    guests: [
      ["spinvicar", "Bracket two"],
      ["flickgremlin", "Bracket three"],
    ],
    start: "2026-09-15T18:30:00Z",
    end: "2026-09-15T21:00:00Z",
    reminder: 3890,
    mods: ["ClutchClara", "SmokeStackSam"],
  },

  // League of Legends
  {
    id: "01k9event0035",
    slug: "aram-chaos-cup",
    title: "ARAM Chaos Cup",
    description:
      "Random champions, one lane, and every channel carries a different lobby's chaos. The bracket resets between rounds so nobody can dodge a bad roll.",
    category: "league-of-legends",
    host: "couchsenate",
    hostTitle: "Lobby one",
    guests: [
      ["wanderfuse", "Lobby two"],
      ["chartfairy", "Lobby three"],
    ],
    start: "2026-08-06T19:00:00Z",
    end: "2026-08-06T22:00:00Z",
    reminder: 6210,
    mods: ["WardWendy", "BaronBrent"],
  },
  {
    id: "01k9event0036",
    slug: "jungle-diff-decider",
    title: "Jungle Diff Decider",
    description:
      "Two junglers, one scoreboard, and the rest of the roster just watches the gank timers. Chat calls the invade every single time.",
    category: "league-of-legends",
    host: "couchsenate",
    hostTitle: "Blue jungle",
    guests: [["wanderfuse", "Red jungle"]],
    start: "2026-08-13T20:00:00Z",
    end: "2026-08-13T22:30:00Z",
    reminder: 4780,
    mods: ["WardWendy", "BaronBrent"],
  },
  {
    id: "01k9event0037",
    slug: "worlds-watch-party-and-pickem",
    title: "Worlds Watch Party and Pick'em",
    description:
      "Every channel runs the same broadcast with its own reaction cam, and chat locks in a pick'em bracket before the first game starts.",
    category: "league-of-legends",
    host: "wanderfuse",
    hostTitle: "Main reaction cam",
    guests: [
      ["couchsenate", "Second cam"],
      ["chartfairy", "The stats desk"],
    ],
    start: "2026-08-20T17:00:00Z",
    end: "2026-08-20T21:00:00Z",
    reminder: 12340,
    mods: ["WardWendy", "BaronBrent"],
  },
  {
    id: "01k9event0038",
    slug: "all-star-scrimmage-night",
    title: "All-Star Scrimmage Night",
    description:
      "The roster mixes into two new teams for one night only, and chat drafts both sides before the first minion spawns.",
    category: "league-of-legends",
    host: "couchsenate",
    hostTitle: "Draft desk",
    guests: [
      ["wanderfuse", "Team one"],
      ["chartfairy", "Team two"],
    ],
    start: "2026-08-27T19:30:00Z",
    end: "2026-08-27T22:00:00Z",
    reminder: 5340,
    mods: ["WardWendy", "BaronBrent"],
  },
  {
    id: "01k9event0039",
    slug: "promotion-gauntlet-diamond-to-master",
    title: "Promotion Gauntlet, Diamond to Master",
    description:
      "One account, one goal, and every channel carries a different game of the climb live. A loss does not end the stream, only a win ends the gauntlet.",
    category: "league-of-legends",
    host: "wanderfuse",
    hostTitle: "The climb",
    guests: [["couchsenate", "The coach seat"]],
    start: "2026-09-03T18:00:00Z",
    end: "2026-09-03T22:00:00Z",
    reminder: 7120,
    mods: ["WardWendy", "BaronBrent"],
  },
  {
    id: "01k9event0040",
    slug: "draft-pick-showmatch",
    title: "Draft Pick Showmatch",
    description:
      "Chat drafts both teams pick by pick before either roster sees the board. Every channel carries one side of the draft reveal.",
    category: "league-of-legends",
    host: "couchsenate",
    hostTitle: "Blue side draft",
    guests: [
      ["wanderfuse", "Red side draft"],
      ["chartfairy", "The analyst desk"],
    ],
    start: "2026-09-10T19:00:00Z",
    end: "2026-09-10T21:30:00Z",
    reminder: 4980,
    mods: ["WardWendy", "BaronBrent"],
  },

  // Just Chatting
  {
    id: "01k9event0041",
    slug: "charity-telethon-round-the-clock",
    title: "Charity Telethon: Round the Clock",
    description:
      "Twelve channels split a twenty four hour shift and every dollar raised unlocks a new dare. The board updates live on every seat.",
    category: "just-chatting",
    host: "panfriedpaul",
    hostTitle: "The opening shift",
    guests: [
      ["notadoc", "Midday shift"],
      ["couchsermon", "Night shift"],
      ["yapmerchant", "The overnight shift"],
    ],
    start: "2026-08-01T12:00:00Z",
    end: "2026-08-02T12:00:00Z",
    reminder: 15230,
    mods: ["CouchCritic", "ChatWranglerChaz"],
  },
  {
    id: "01k9event0042",
    slug: "the-roundtable-ask-us-anything",
    title: "The Roundtable: Ask Us Anything",
    description:
      "Five channels, one long table, and chat writes every question. Nothing is off the list until the desk says it is.",
    category: "just-chatting",
    host: "couchsermon",
    hostTitle: "The host seat",
    guests: [
      ["panfriedpaul", "Second seat"],
      ["yapmerchant", "Third seat"],
    ],
    start: "2026-08-08T19:00:00Z",
    end: "2026-08-08T21:30:00Z",
    reminder: 4120,
    mods: ["CouchCritic", "ChatWranglerChaz"],
  },
  {
    id: "01k9event0043",
    slug: "reaction-roulette-internets-weirdest",
    title: "Reaction Roulette: Internet's Weirdest",
    description:
      "Chat submits the clip, the desk has never seen it, and the reaction airs raw across every channel. Nobody gets a preview, not even the host.",
    category: "just-chatting",
    host: "yapmerchant",
    hostTitle: "The reaction seat",
    guests: [["couchsermon", "Second seat"]],
    start: "2026-08-15T20:00:00Z",
    end: "2026-08-15T22:00:00Z",
    reminder: 5670,
    mods: ["CouchCritic", "ChatWranglerChaz"],
  },
  {
    id: "01k9event0044",
    slug: "roast-battle-live",
    title: "Roast Battle Live",
    description:
      "Six channels take turns on the hot seat and chat scores every line. The loser buys the winner's next stream setup upgrade.",
    category: "just-chatting",
    host: "panfriedpaul",
    hostTitle: "The hot seat",
    guests: [
      ["notadoc", "The judge"],
      ["couchsermon", "The judge", "pending"],
    ],
    start: "2026-08-22T19:30:00Z",
    end: "2026-08-22T22:00:00Z",
    reminder: 6890,
    mods: ["CouchCritic", "ChatWranglerChaz"],
  },
  {
    id: "01k9event0045",
    slug: "subathon-finale-countdown",
    title: "Subathon Finale Countdown",
    description:
      "The subathon clock hits zero on stream, and every channel carries the final hour live. Every sub in the last sixty minutes adds ten more.",
    category: "just-chatting",
    host: "yapmerchant",
    hostTitle: "The clock",
    guests: [
      ["panfriedpaul", "The tally"],
      ["couchsermon", "The tally"],
    ],
    start: "2026-08-29T18:00:00Z",
    end: "2026-08-29T23:59:00Z",
    reminder: 21400,
    mods: ["CouchCritic", "ChatWranglerChaz"],
  },
  {
    id: "01k9event0046",
    slug: "collab-game-night-mafia",
    title: "Collab Game Night: Mafia",
    description:
      "Eight channels play one game of Mafia across the whole roster, and the mafia's identity stays secret from every seat but its own. Chat only sees what its own channel sees.",
    category: "just-chatting",
    host: "couchsermon",
    hostTitle: "The narrator seat",
    guests: [
      ["panfriedpaul", "Player one"],
      ["notadoc", "Player two"],
      ["yapmerchant", "Player three"],
    ],
    start: "2026-09-05T20:00:00Z",
    end: "2026-09-05T22:30:00Z",
    reminder: 4560,
    mods: ["CouchCritic", "ChatWranglerChaz"],
  },
  {
    id: "01k9event0047",
    slug: "storytime-worst-stream-ever",
    title: "Storytime: Worst Stream Ever",
    description:
      "Every channel tells the story of its worst stream on record, and chat votes the worst of the worst at the end. Nobody gets to edit the story before it airs.",
    category: "just-chatting",
    host: "notadoc",
    hostTitle: "First story",
    guests: [
      ["panfriedpaul", "Second story"],
      ["couchsermon", "Third story"],
    ],
    start: "2026-09-12T19:00:00Z",
    end: "2026-09-12T21:00:00Z",
    reminder: 3980,
    mods: ["CouchCritic", "ChatWranglerChaz"],
  },
  {
    id: "01k9event0048",
    slug: "karaoke-night-no-refunds",
    title: "Karaoke Night, No Refunds",
    description:
      "Chat picks the song, the singer does not get a preview, and the queue does not skip anybody. Every channel carries its own mic live.",
    category: "just-chatting",
    host: "yapmerchant",
    hostTitle: "The mic",
    guests: [
      ["couchsermon", "Second mic"],
      ["panfriedpaul", "Third mic"],
    ],
    start: "2026-09-19T20:30:00Z",
    end: "2026-09-19T23:00:00Z",
    reminder: 5230,
    mods: ["CouchCritic", "ChatWranglerChaz"],
  },
  {
    id: "01k9event0049",
    slug: "the-debate-desk",
    title: "The Debate Desk",
    description:
      "Two channels, one topic chat picks in advance, and a timer that does not care who is winning. The desk calls time and the room votes the winner.",
    category: "just-chatting",
    host: "couchsermon",
    hostTitle: "Position one",
    guests: [["notadoc", "Position two"]],
    start: "2026-09-26T19:00:00Z",
    end: "2026-09-26T20:30:00Z",
    reminder: 3120,
    mods: ["CouchCritic", "ChatWranglerChaz"],
  },
  {
    id: "01k9event0050",
    slug: "podcast-crossover-special",
    title: "Podcast Crossover Special",
    description:
      "Two shows record one episode across every channel on the running order, and chat submits the questions live. Neither host has seen the other's notes.",
    category: "just-chatting",
    host: "panfriedpaul",
    hostTitle: "Show one",
    guests: [["yapmerchant", "Show two"]],
    start: "2026-10-03T19:00:00Z",
    end: "2026-10-03T21:00:00Z",
    reminder: 4670,
    mods: ["CouchCritic", "ChatWranglerChaz"],
  },

  // Minecraft
  {
    id: "01k9event0051",
    slug: "smp-season-finale",
    title: "SMP Season Finale",
    description:
      "The server's last day before the world resets, and every channel carries a different base's final defense. Nothing survives the finale except the loot.",
    category: "minecraft",
    host: "midnightden",
    hostTitle: "Home base",
    guests: [
      ["flickgremlin", "The outpost"],
      ["vanlifevoid", "The mine"],
    ],
    start: "2026-08-02T18:00:00Z",
    end: "2026-08-02T21:00:00Z",
    reminder: 6780,
    mods: ["CreeperCarla", "RedstoneRick"],
  },
  {
    id: "01k9event0052",
    slug: "manhunt-four-hunters-one-speedrunner",
    title: "Manhunt: Four Hunters, One Speedrunner",
    description:
      "One channel runs, four channels hunt, and the dragon egg is the only thing that ends the chase. Chat on the runner's channel is the only one that can see the compass.",
    category: "minecraft",
    host: "midnightden",
    hostTitle: "The speedrunner",
    guests: [
      ["flickgremlin", "Hunter one"],
      ["vanlifevoid", "Hunter two"],
      ["mudbrickmage", "Hunter three"],
    ],
    start: "2026-08-09T19:00:00Z",
    end: "2026-08-09T22:00:00Z",
    reminder: 5340,
    mods: ["CreeperCarla", "RedstoneRick"],
  },
  {
    id: "01k9event0053",
    slug: "build-battle-grand-final",
    title: "Build Battle Grand Final",
    description:
      "Six channels get the same theme and the same block limit, and chat votes the winner build by build. The timer does not pause for anybody.",
    category: "minecraft",
    host: "flickgremlin",
    hostTitle: "Build one",
    guests: [
      ["midnightden", "Build two"],
      ["vanlifevoid", "Build three"],
    ],
    start: "2026-08-16T20:00:00Z",
    end: "2026-08-16T22:30:00Z",
    reminder: 4120,
    mods: ["CreeperCarla", "RedstoneRick"],
  },
  {
    id: "01k9event0054",
    slug: "any-percent-speedrun-race-night",
    title: "Any% Speedrun Race Night",
    description:
      "Four channels start the same fresh seed at the same second, and the first Ender Dragon kill ends every run at once. Nobody gets to see the others' splits.",
    category: "minecraft",
    host: "midnightden",
    hostTitle: "Runner one",
    guests: [
      ["flickgremlin", "Runner two"],
      ["vanlifevoid", "Runner three"],
    ],
    start: "2026-08-23T19:30:00Z",
    end: "2026-08-23T21:30:00Z",
    reminder: 6890,
    mods: ["CreeperCarla", "RedstoneRick"],
  },
  {
    id: "01k9event0055",
    slug: "hardcore-permadeath-marathon",
    title: "Hardcore Permadeath Marathon",
    description:
      "One death ends the world for good, so every channel plays its own hardcore save side by side. The marathon ends when the last world falls.",
    category: "minecraft",
    host: "vanlifevoid",
    hostTitle: "World one",
    guests: [
      ["midnightden", "World two"],
      ["flickgremlin", "World three"],
    ],
    start: "2026-08-30T18:00:00Z",
    end: "2026-08-30T22:00:00Z",
    reminder: 8120,
    mods: ["CreeperCarla", "RedstoneRick"],
  },
  {
    id: "01k9event0056",
    slug: "redstone-contraption-showcase",
    title: "Redstone Contraption Showcase",
    description:
      "Every channel demos its own build live, and chat votes the most useless contraption of the night. The winner gets bragging rights, nothing else.",
    category: "minecraft",
    host: "flickgremlin",
    hostTitle: "Demo one",
    guests: [
      ["mudbrickmage", "Demo two"],
      ["vanlifevoid", "Demo three"],
    ],
    start: "2026-09-06T19:00:00Z",
    end: "2026-09-06T21:00:00Z",
    reminder: 3450,
    mods: ["CreeperCarla", "RedstoneRick"],
  },
  {
    id: "01k9event0057",
    slug: "dropper-challenge-elimination",
    title: "Dropper Challenge Elimination",
    description:
      "One miss and the channel is out, and the course gets harder every round. The last channel standing streams the final drop alone.",
    category: "minecraft",
    host: "midnightden",
    hostTitle: "Round one host",
    guests: [
      ["flickgremlin", "Challenger one"],
      ["vanlifevoid", "Challenger two"],
      ["mudbrickmage", "Challenger three"],
    ],
    start: "2026-09-13T20:00:00Z",
    end: "2026-09-13T22:00:00Z",
    reminder: 4980,
    mods: ["CreeperCarla", "RedstoneRick"],
  },
  {
    id: "01k9event0058",
    slug: "pvp-arena-rumble",
    title: "PvP Arena Rumble",
    description:
      "Full loot, one arena, and every channel drops in with whatever it looted on the way. The last inventory standing takes the chest at the center.",
    category: "minecraft",
    host: "flickgremlin",
    hostTitle: "The arena",
    guests: [
      ["midnightden", "Lane two"],
      ["vanlifevoid", "Lane three"],
    ],
    start: "2026-09-20T19:00:00Z",
    end: "2026-09-20T21:30:00Z",
    reminder: 5670,
    mods: ["CreeperCarla", "RedstoneRick"],
  },
  {
    id: "01k9event0059",
    slug: "ender-dragon-co-op-raid",
    title: "Ender Dragon Co-op Raid",
    description:
      "Six channels gear up together for one dragon fight, and every channel carries a different crystal tower. Nobody respawns until the fight ends.",
    category: "minecraft",
    host: "midnightden",
    hostTitle: "Crystal tower one",
    guests: [
      ["flickgremlin", "Crystal tower two"],
      ["vanlifevoid", "Crystal tower three"],
      ["mudbrickmage", "The bow lane"],
    ],
    start: "2026-09-27T18:30:00Z",
    end: "2026-09-27T21:00:00Z",
    reminder: 6230,
    mods: ["CreeperCarla", "RedstoneRick"],
  },
  {
    id: "01k9event0060",
    slug: "block-by-block-survival-relay",
    title: "Block by Block Survival Relay",
    description:
      "Every channel survives one hour on hardcore before handing the world to the next seat, and a death passes the world early. The relay does not stop for anybody's bedtime.",
    category: "minecraft",
    host: "vanlifevoid",
    hostTitle: "First leg",
    guests: [
      ["midnightden", "Second leg"],
      ["flickgremlin", "Third leg"],
      ["mudbrickmage", "Fourth leg"],
    ],
    start: "2026-10-04T17:00:00Z",
    end: "2026-10-04T23:00:00Z",
    reminder: 5340,
    mods: ["CreeperCarla", "RedstoneRick"],
  },
];

export const events: KickEvent[] = [...coreEvents, ...NEW_EVENT_SEEDS.map(buildEvent)];

export const eventStreamers = (event: KickEvent) =>
  event.participants.filter((p) => p.invite_status === "accepted");

// /boost <name> in the event chat resolves the name against this event's running order.
export const slugInEvent = (event: KickEvent, name: string) => {
  const wanted = name.trim().replace(/^@/, "").toLowerCase();
  return eventStreamers(event).find(
    (p) => p.channel.username.toLowerCase() === wanted || p.channel.slug === wanted,
  )?.channel.slug;
};

export const eventFor = (list: KickEvent[], slug: string) => list.find((e) => e.slug === slug);

const statusIn = (event: KickEvent, username: string) =>
  event.participants.find((p) => p.channel.username === username)?.invite_status;

export const invitesFor = (list: KickEvent[], username: string) =>
  list.filter((e) => statusIn(e, username) === "pending");

export const requestsOn = (event: KickEvent) =>
  event.participants.filter((p) => p.invite_status === "requested");

// The seats that are live right now, as livestreams, which is what multiview pins and what the
// event filter in the search bar offers.
export const liveSeats = (event: KickEvent): Livestream[] =>
  eventStreamers(event)
    .map((p) => liveStreamFor(p.channel.slug))
    .filter((s): s is Livestream => Boolean(s));

// A channel that hides its own viewer count stays out of the sum, so the total never reveals it.
export const watchingNow = (event: KickEvent) =>
  eventStreamers(event).reduce((total, p) => {
    const stream = liveStreamFor(p.channel.slug);
    return total + (stream && !stream.hide_viewer_count ? stream.viewer_count : 0);
  }, 0);

export const hasFinished = (event: KickEvent) => new Date(event.end_at) <= EVENTS_NOW;

// Where Join sends a viewer: the first channel on the running order that is live right now.
export const liveParticipant = (event: KickEvent) =>
  eventStreamers(event).find((p) => liveStreamFor(p.channel.slug));

export const isLiveWindow = (event: KickEvent) =>
  new Date(event.start_at) <= EVENTS_NOW && EVENTS_NOW < new Date(event.end_at);

export const takesPart = (event: KickEvent, username: string) =>
  event.participants.some((p) => p.channel.username === username && p.invite_status === "accepted");

export const eventForChannel = (list: KickEvent[], slug: string) =>
  list.find(
    (e) =>
      e.visibility === "public" &&
      isLiveWindow(e) &&
      e.participants.some((p) => p.channel.slug === slug && p.invite_status === "accepted"),
  );

// A private event is only for the host and the channels on its running order.
export const canSee = (event: KickEvent, username: string) =>
  event.visibility === "public" ||
  event.participants.some((p) => p.channel.username === username);

export const byStartAt = (a: KickEvent, b: KickEvent) => a.start_at.localeCompare(b.start_at);

// Every public event this channel is on the running order for, soonest first. The channel page
// shows these, so a viewer who lands on a channel can see what it takes part in.
export const eventsWith = (list: KickEvent[], slug: string) =>
  list
    .filter(
      (e) =>
        e.visibility === "public" &&
        new Date(e.end_at) > EVENTS_NOW &&
        e.participants.some((p) => p.channel.slug === slug && p.invite_status === "accepted"),
    )
    .sort(byStartAt);

// A private event is only visible to the host and to the channels they invited.
export const publicUpcoming = (list: KickEvent[]) =>
  list
    .filter((e) => new Date(e.end_at) > EVENTS_NOW && e.visibility === "public")
    .sort(byStartAt);

// The host can publish once nobody is left to answer. A decline does not block the event.
export const waitingOn = (event: KickEvent) =>
  event.participants.filter(
    (p) => p.invite_status === "pending" || p.invite_status === "requested",
  );

const DAY = 86400000;

export type EventBucket = "today" | "week" | "month" | "later";

export function eventBucket(iso: string): EventBucket {
  const start = new Date(iso);
  if (start.toISOString().slice(0, 10) === EVENTS_NOW.toISOString().slice(0, 10)) return "today";
  const days = (start.getTime() - EVENTS_NOW.getTime()) / DAY;
  if (days < 7) return "week";
  if (days < 31) return "month";
  return "later";
}

const dayFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

export const formatEventDay = (iso: string) => dayFormat.format(new Date(iso));

export const formatEventTime = (iso: string) => timeFormat.format(new Date(iso));

export function formatEventWindow(start_at: string, end_at: string): string {
  const sameDay = start_at.slice(0, 10) === end_at.slice(0, 10);
  const end = sameDay
    ? formatEventTime(end_at)
    : `${formatEventDay(end_at)}, ${formatEventTime(end_at)}`;
  return `${formatEventDay(start_at)}, ${formatEventTime(start_at)} - ${end} UTC`;
}

export function startsInLabel(event: KickEvent): string {
  if (isLiveWindow(event)) return "Live now";
  const minutes = Math.round((new Date(event.start_at).getTime() - EVENTS_NOW.getTime()) / 60000);
  if (minutes < 0) return "Finished";
  if (minutes < 60) return `In ${minutes} minutes`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `In ${hours} ${hours === 1 ? "hour" : "hours"}`;
  const days = Math.round(hours / 24);
  return `In ${days} ${days === 1 ? "day" : "days"}`;
}

export function runsFor(start_at: string, end_at: string): string {
  const minutes = Math.round(
    (new Date(end_at).getTime() - new Date(start_at).getTime()) / 60000,
  );
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} minutes`;
  return rest === 0 ? `${hours} hours` : `${hours} hours ${rest} minutes`;
}

// One line for how many people the event has. Live counts heads, upcoming counts reminders, and
// your own reminder counts towards it.
export function attendance(event: KickEvent, remindedByMe: boolean) {
  if (isLiveWindow(event)) {
    return { count: watchingNow(event), label: "watching" };
  }
  return { count: event.reminder_count + (remindedByMe ? 1 : 0), label: "going" };
}

export function formatSlowMode(seconds: number): string {
  if (seconds === 0) return "Slow mode off";
  return `Slow mode ${seconds}s`;
}
