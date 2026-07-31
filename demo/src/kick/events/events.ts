import { liveStreamFor, type Livestream } from "../mock/api";

// Invented surface, named as if KICK's engineers built it:
//   fake-kick GET   /public/v1/events
//   fake-kick GET   /public/v1/events/{event_id}
//   fake-kick POST  /public/v1/events/{event_id}/invites
//   fake-kick PATCH /public/v1/events/{event_id}/invites/{invite_id}
//   fake-kick POST  /public/v1/events/{event_id}/boosts
//   fake-kick events.started, events.ended, events.invite.created, events.invite.updated
//   fake-kick events.boost.created, events.boost.expired
//   scopes events:read and events:write
// The discovery and detail pages consume the same fixture, so the shape lives here.

export type KickEvent = {
  id: string;
  slug: string;
  name: string;
  host_slug: string;
  participant_slugs: string[];
  starts_at: string;
  ends_at: string;
};

export const ironCup: KickEvent = {
  id: "01J2E6M4V8XQ0PTZ5RCHD7KWAN",
  slug: "iron-cup-2026",
  name: "Iron Cup 2026",
  host_slug: "ironvow",
  // Every slug here holds a live stream and a channel profile, so a tile click
  // always lands on a real watch page.
  participant_slugs: [
    "ironvow",
    "capequest",
    "flickgremlin",
    "mudbrickmage",
    "wanderfuse",
    "notadoc",
    "reelgoblin",
    "panfriedpaul",
    "snoozebaron",
  ],
  starts_at: "2026-07-31T08:00:00Z",
  ends_at: "2026-07-31T22:00:00Z",
};

export const MULTIVIEW_CAP = 9;
export const BOOST_MINUTES = 10;

export function slugByUsername(name: string): string | undefined {
  const q = name.trim().replace(/^@/, "").toLowerCase();
  const hit = eventStreams().find(
    (s) => s.channel.username.toLowerCase() === q || s.channel.slug === q,
  );
  return hit?.channel.slug;
}

export function formatBoostLeft(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export const isInEvent = (slug: string) => ironCup.participant_slugs.includes(slug);

export const eventStreams = (): Livestream[] =>
  ironCup.participant_slugs
    .map((slug) => liveStreamFor(slug))
    .filter((s): s is Livestream => Boolean(s));

export const hostStream = () => liveStreamFor(ironCup.host_slug);

export const eventChatLines = [
  "iron cup hype",
  "who is winning the cup rn",
  "capequest is throwing again",
  "ironvow carrying the whole bracket",
  "flickgremlin got knocked out already lol",
  "the cup chat is faster than my stream chat",
  "reelgoblin bonus buying the trophy",
  "notadoc diagnosing the losers",
  "GET THE FIRE CAPE",
  "nine streams and i am watching all of them",
  "multiview goes hard",
  "mudbrick building the trophy in minecraft",
];
