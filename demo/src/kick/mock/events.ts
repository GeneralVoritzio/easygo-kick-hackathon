import { artFor, channelBySlug, liveStreamFor, type Channel } from "./api";

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

export type KickEvent = {
  event_id: string;
  slug: string;
  title: string;
  description: string;
  host_channel: Channel;
  start_at: string;
  end_at: string;
  // The event artwork. The detail page shows it at its own ratio and uses a blurred copy as the
  // background. A card crops it to the landscape box every other card on the site uses.
  poster: string;
  visibility: EventVisibility;
  is_partner_only: boolean;
  participants: EventParticipant[];
  chat: EventChatSettings;
};

// A host who uploads nothing gets a plain plate, never one of the nine posters. A poster carries
// the name of the event it was drawn for, so handing it to a second event contradicts both.
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

export const events: KickEvent[] = [
  {
    event_id: "01k9event0001",
    slug: "final-showdown",
    title: "Final Showdown",
    description:
      "Team Alpha against Team Omega, and four channels carry the same arena feed. Chat picks the map every round, and the losing side hands the show to the next seat.",
    host_channel: channelBySlug("couchsenate"),
    start_at: "2026-07-26T12:00:00Z",
    end_at: "2026-07-26T18:00:00Z",
    poster: artFor("poster-final-showdown"),
    visibility: "public",
    is_partner_only: true,
    participants: [
      host("couchsenate", "Opening game and the first map vote"),
      guest("ironvow", "Seat two, the Alpha side"),
      guest("charcoalchef", "Seat three, the Omega side"),
      guest("superdude1337", "Seat four, the closing game"),
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
    start_at: "2026-07-26T20:30:00Z",
    end_at: "2026-07-26T23:30:00Z",
    poster: artFor("poster-power-play-arena"),
    visibility: "public",
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
    start_at: "2026-07-31T21:00:00Z",
    end_at: "2026-08-01T00:30:00Z",
    poster: artFor("poster-arena-clash"),
    visibility: "public",
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
    start_at: "2026-08-08T19:00:00Z",
    end_at: "2026-08-08T23:00:00Z",
    poster: artFor("poster-squad-rush"),
    visibility: "private",
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
    start_at: "2026-08-22T20:00:00Z",
    end_at: "2026-08-22T23:59:00Z",
    poster: artFor("poster-battle-night-live"),
    visibility: "public",
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
    start_at: "2026-10-12T20:00:00Z",
    end_at: "2026-10-12T23:00:00Z",
    poster: artFor("poster-cyber-warfare"),
    visibility: "public",
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
    start_at: "2026-10-20T19:30:00Z",
    end_at: "2026-10-20T23:00:00Z",
    poster: artFor("poster-arena-champions"),
    visibility: "public",
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
    start_at: "2026-10-28T21:00:00Z",
    end_at: "2026-10-29T01:00:00Z",
    poster: artFor("poster-fps-ultimate"),
    visibility: "public",
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
    start_at: "2026-11-01T19:00:00Z",
    end_at: "2026-11-01T23:00:00Z",
    poster: artFor("poster-legends-awaken"),
    visibility: "public",
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
];

export const eventStreamers = (event: KickEvent) =>
  event.participants.filter((p) => p.invite_status === "accepted");

export const eventFor = (list: KickEvent[], slug: string) => list.find((e) => e.slug === slug);

const statusIn = (event: KickEvent, username: string) =>
  event.participants.find((p) => p.channel.username === username)?.invite_status;

export const invitesFor = (list: KickEvent[], username: string) =>
  list.filter((e) => statusIn(e, username) === "pending");

export const requestsOn = (event: KickEvent) =>
  event.participants.filter((p) => p.invite_status === "requested");

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

export function formatSlowMode(seconds: number): string {
  if (seconds === 0) return "Slow mode off";
  return `Slow mode ${seconds}s`;
}
