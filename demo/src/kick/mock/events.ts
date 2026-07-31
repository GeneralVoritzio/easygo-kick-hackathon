import { bannerFor, channelBySlug, posterFor, type Channel } from "./api";

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
  poster: string;
  banner: string;
  visibility: EventVisibility;
  is_partner_only: boolean;
  participants: EventParticipant[];
  chat: EventChatSettings;
};

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
    slug: "couch-senate-summer-sessions",
    title: "Couch Senate Summer Sessions",
    description:
      "Six hours, four couches, one running order. The Senate takes a motion from chat every hour and the channel that loses the vote hands the show to the next seat.",
    host_channel: channelBySlug("couchsenate"),
    start_at: "2026-07-26T12:00:00Z",
    end_at: "2026-07-26T18:00:00Z",
    poster: posterFor("cat-just-chatting"),
    banner: bannerFor("couchsenate"),
    visibility: "public",
    is_partner_only: true,
    participants: [
      host("couchsenate", "Opening address and the first motion"),
      guest("ironvow", "Seat two, hardcore run with chat picking the target"),
      guest("charcoalchef", "Seat three, the Senate lunch"),
      guest("superdude1337", "Seat four, closing remarks"),
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
    slug: "ironman-relay-night",
    title: "Ironman Relay Night",
    description:
      "Four ironmen, one shared account rule set. Every death passes the relay to the next channel, and the last one standing keeps the pet.",
    host_channel: channelBySlug("ironvow"),
    start_at: "2026-07-26T20:00:00Z",
    end_at: "2026-07-26T23:30:00Z",
    poster: posterFor("cat-old-school-runescape"),
    banner: bannerFor("ironvow"),
    visibility: "public",
    is_partner_only: true,
    participants: [
      host("ironvow", "Leg one, Tutorial Island to Lumbridge"),
      guest("cluecrawler", "Leg two, clue scroll gauntlet"),
      guest("capequest", "Leg three, the cape run"),
      guest("mudbrickmage", "Leg four, boss finish", "pending"),
    ],
    chat: {
      moderators: ["TinderboxTina", "RelayRefLarry"],
      slow_mode_seconds: 3,
      is_subscribers_only: false,
      is_followers_only: true,
    },
  },
  {
    event_id: "01k9event0003",
    slug: "midnight-den-highroller-hours",
    title: "Midnight Den Highroller Hours",
    description:
      "The Den opens at ten and closes when the last table folds. Three channels, one shared leaderboard, and every bonus round called out in the event chat.",
    host_channel: channelBySlug("midnightden"),
    start_at: "2026-07-29T22:00:00Z",
    end_at: "2026-07-30T02:00:00Z",
    poster: posterFor("cat-gakuen-idolmaster"),
    banner: bannerFor("midnightden"),
    visibility: "public",
    is_partner_only: true,
    participants: [
      host("midnightden", "Doors open, first table"),
      guest("spinvicar", "The midnight sermon"),
      guest("tiltcabinet", "Last table standing"),
    ],
    chat: {
      moderators: ["DenMotherDot", "CashoutCarl"],
      slow_mode_seconds: 10,
      is_subscribers_only: true,
      is_followers_only: true,
    },
  },
  {
    event_id: "01k9event0004",
    slug: "the-sleep-marathon-handover",
    title: "The Sleep Marathon Handover",
    description:
      "Eight hours of nothing at all, handed from channel to channel every two hours. Whoever wakes up first loses, and chat keeps the score.",
    host_channel: channelBySlug("nocturnalnorm"),
    start_at: "2026-08-02T01:00:00Z",
    end_at: "2026-08-02T09:00:00Z",
    poster: posterFor("cat-just-sleeping"),
    banner: bannerFor("midnightden"),
    visibility: "public",
    is_partner_only: true,
    participants: [
      host("nocturnalnorm", "First watch"),
      guest("snoozebaron", "Second watch"),
      guest("superdude1337", "Third watch", "pending"),
    ],
    chat: {
      moderators: ["PillowFortPam", "QuietHoursQuinn"],
      slow_mode_seconds: 30,
      is_subscribers_only: false,
      is_followers_only: true,
    },
  },
  {
    event_id: "01k9event0005",
    slug: "kitchen-disasters-cook-off",
    title: "Kitchen Disasters Cook Off",
    description:
      "One recipe, three kitchens, no measuring cups. Chat sends the ingredient list and nobody is allowed to say no.",
    host_channel: channelBySlug("superdude1337"),
    start_at: "2026-08-08T17:00:00Z",
    end_at: "2026-08-08T21:00:00Z",
    poster: posterFor("cat-irl"),
    banner: bannerFor("charcoalchef"),
    visibility: "private",
    is_partner_only: true,
    participants: [
      host("superdude1337", "Round one, the ingredient draw"),
      guest("charcoalchef", "Round two, the grill round"),
      guest("notadoc", "Food safety desk", "rejected"),
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
    event_id: "01k9event0006",
    slug: "vanlife-roadshow-finale",
    title: "Vanlife Roadshow Finale",
    description:
      "Three vans, one car park, and six weeks of driving to explain. The roadshow ends where chat voted to end it.",
    host_channel: channelBySlug("wanderfuse"),
    start_at: "2026-09-05T14:00:00Z",
    end_at: "2026-09-05T20:00:00Z",
    poster: posterFor("cat-grand-theft-auto-v"),
    banner: bannerFor("couchsenate"),
    visibility: "public",
    is_partner_only: true,
    participants: [
      host("wanderfuse", "Arrival and the van tour"),
      guest("vanlifevoid", "The breakdown story"),
      guest("flickgremlin", "Roadshow recap reel"),
    ],
    chat: {
      moderators: ["AwningAndy", "DieselDaphne"],
      slow_mode_seconds: 5,
      is_subscribers_only: false,
      is_followers_only: true,
    },
  },
  {
    event_id: "01k9event0007",
    slug: "grill-school-graduation",
    title: "Grill School Graduation",
    description:
      "Six weeks of grill school end in one cook off. Every channel plates the same brief, and chat marks the results out of ten.",
    host_channel: channelBySlug("charcoalchef"),
    start_at: "2026-08-12T18:00:00Z",
    end_at: "2026-08-12T22:00:00Z",
    poster: posterFor("cat-music"),
    banner: bannerFor("charcoalchef"),
    visibility: "public",
    is_partner_only: true,
    participants: [
      host("charcoalchef", "The brief and the marking sheet"),
      guest("panfriedpaul", "Second plate"),
      guest("notadoc", "Health and safety desk"),
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

export const isLiveWindow = (event: KickEvent) =>
  new Date(event.start_at) <= EVENTS_NOW && EVENTS_NOW < new Date(event.end_at);

export const takesPart = (event: KickEvent, username: string) =>
  event.participants.some((p) => p.channel.username === username && p.invite_status === "accepted");

export const eventForChannel = (list: KickEvent[], slug: string) =>
  list.find(
    (e) =>
      isLiveWindow(e) &&
      e.participants.some((p) => p.channel.slug === slug && p.invite_status === "accepted"),
  );

export const byStartAt = (a: KickEvent, b: KickEvent) => a.start_at.localeCompare(b.start_at);

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

export function formatSlowMode(seconds: number): string {
  if (seconds === 0) return "Slow mode off";
  return `Slow mode ${seconds}s`;
}
