import { currentUser, type Livestream } from "../mock/api";
import { chatters } from "../mock/chatIdentities";

/*
  Kick Expedition: a shared, scheduled hop between several random live streamers, one minute
  each, that any viewer can join or leave. Runs on its own clock regardless of whether anyone in
  particular is riding it, the same way a real raid is already moving before a given viewer
  joins it. Ported from kick-web-redesign's src/mock/expeditions.ts and
  src/context/ExpeditionContext.tsx, re-expressed against our own Livestream type (stops are our
  17 live channels, keyed by slug) instead of that project's StreamCard.

  KICK has no public expedition surface: this is invented end to end, fake-kick throughout.
*/

export const STOP_DURATION_SECONDS = 60;
export const MAX_EXPEDITION_VIEWERS = 20;
const STOPS_PER_EXPEDITION = 6;

// "45s" under a minute, "3m" under an hour, "1h 20m" beyond that — a countdown reads easier once
// it's more than a couple of minutes out.
export function formatCountdown(seconds: number): string {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

const EXPEDITION_NAMES = [
  "Late Night Wander",
  "Variety Roulette",
  "Rising Talent Run",
  "Just Chatting Marathon",
  "Slots & Chill",
];

export type ExpeditionStatus = "boarding" | "in-progress";

/*
  Quick: what kick mods have already stood up — nothing to configure, always public, a fixed
  1-minute-per-stop route. Custom: viewer-created, with the full knob list below. Kick Break: a
  streamer's own dashboard-triggered raid-like rotation — see createKickBreak.
*/
export type ExpeditionKind = "quick" | "custom" | "kick-break";
/** "unlisted": a Kick Break only — never shows up in the lobby, reached only by the redirect
 *  that starts it. */
export type ExpeditionVisibility = "public" | "private" | "unlisted";
/** "chat": no fixed timer at all — a recurring vote decides when the group moves on. */
export type StopDurationMode = "1min" | "custom" | "whole-stream" | "chat";
export type StreamerSelectionMode = "preselected" | "chat";
/** "expedition-only": Explorer Chat is the only room. "both": expeditors can switch between
 *  Explorer Chat and the current stop's own live channel chat (view only). "main-only": the
 *  current stop's channel chat replaces Explorer Chat entirely, still view only. "origin-only":
 *  a Kick Break only — the triggering streamer's own chat, pinned for the whole rotation, and
 *  writable rather than view only, since it's just that streamer's regular chat carrying on. */
export type ChatVisibility = "expedition-only" | "both" | "main-only" | "origin-only";
/** Where everyone lands when a leader with nobody to hand off to ends the expedition. Every
 *  Quick expedition is always "last-stream" — only Custom ever exposes the other two. */
export type EndBehaviorMode = "last-stream" | "specific-streamer" | "chat-decides";

/*
  `boarding`: still in the lobby, ticking down to its first departure. `in-progress`: already
  hopping between stops. `transitionUntil` is set the moment a departure fires and cleared once
  the transit view has had its moment on screen — non-null means "don't switch the video yet."
*/
export type Expedition = {
  id: string;
  name: string;
  stops: Livestream[];
  viewerCount: number;
  maxViewers: number;
  status: ExpeditionStatus;
  stopIndex: number;
  secondsRemaining: number;
  transitionUntil: number | null;

  kind: ExpeditionKind;
  createdByViewer: boolean;
  visibility: ExpeditionVisibility;
  /** Set only for a private custom expedition — the only way in besides an invite. */
  password?: string;
  /** Informational only — there's no real per-viewer identity to check an invite against. */
  invitedUsernames: string[];
  stopDurationMode: StopDurationMode;
  /** Only meaningful when stopDurationMode is "custom". */
  stopDurationSeconds?: number;
  streamerSelectionMode: StreamerSelectionMode;
  /** Whether the Kick Vote mini-game can run on this expedition at all. */
  allowKicking: boolean;
  /** Whether expeditors can switch to the current stop's own channel chat, or only ever see
   *  Explorer Chat. */
  chatVisibility: ChatVisibility;
  /** A subset of MY_FRIENDS, seeded per expedition — the lobby card's "N friends hopping along". */
  friendsHopping: string[];
  /** Who set this one up: "Kick" for a platform-run expedition, a community member's name for
   *  one someone else built, or your own username for one you created. */
  creator: string;
  /** Saved but never published — sits out of the tick loop entirely, and only ever shows up in
   *  the lobby for the viewer who saved it (only they can ever create one). */
  isDraft: boolean;
  /** True once a viewer has handed this one off to someone else — separate from createdByViewer
   *  so the lobby can label it even after it's no longer "yours." */
  wasHandedOff: boolean;
  /** Where everyone pours out to if this one ends with nobody to hand off to. */
  endBehavior: EndBehaviorMode;
  /** Only meaningful when endBehavior is "specific-streamer" — one of this expedition's own
   *  stops, chosen at creation time. */
  endStreamerSlug?: string;
  /** Kick Break only — the streamer who triggered it, for the "origin-only" chat tab's label.
   *  Never resolved against a real channel profile; ChatFeed itself is channel-agnostic. */
  originStreamerSlug?: string;
};

export type ExplorerMessage = {
  id: string;
  username: string;
  text: string;
  /** A journey narration line ("Now arriving at X") rather than a real viewer message —
   *  rendered without a username, centered and muted. */
  system?: boolean;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// "Your friends," for the lobby card's "N friends hopping along" — the same reused-identity
// pattern every other mock list here follows, not a second invented roster.
export const MY_FRIENDS = chatters.slice(0, 6).map((c) => c.username);

function seededRng(seedText: string) {
  let seed = 0;
  for (let i = 0; i < seedText.length; i++) seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  if (seed === 0) seed = 0x5f3c21;
  return function rnd() {
    seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Deterministic per expedition id, so a given expedition always shows the same friends hopping
// along rather than reshuffling on every render.
export function pickFriendsHopping(seed: string): string[] {
  const rnd = seededRng(seed);
  return MY_FRIENDS.filter(() => rnd() < 0.35);
}

// Flavor only, shown on a full lobby card ("Full · 3 waiting") — how many mocked viewers are
// already queued ahead of any real viewer who joins the waitlist.
export function waitlistSize(seed: string): number {
  const rnd = seededRng(`${seed}-waitlist`);
  return 1 + Math.floor(rnd() * 5);
}

// Deterministic per expedition id, so a community-run seeded expedition always credits the
// same chatter instead of reshuffling on every render.
function pickCreator(seed: string): string {
  const rnd = seededRng(`${seed}-creator`);
  return chatters[Math.floor(rnd() * chatters.length)].username;
}

// Everyone the creator could hand leadership to — anyone not already leading an expedition of
// their own. "Kick" itself never counts as busy, since it isn't a person who can only run one
// at a time. An empty list is the trigger for falling back to ending it instead.
export function findHandoffCandidates(expeditions: Expedition[], excludeExpeditionId: string): string[] {
  const busy = new Set(
    expeditions.filter((e) => e.id !== excludeExpeditionId && e.creator !== "Kick").map((e) => e.creator),
  );
  return chatters.map((c) => c.username).filter((name) => name !== currentUser.username && !busy.has(name));
}

// A couple of the seeded expeditions are viewer-made Custom ones rather than mod-run Quick ones
// — "Variety Roulette" shows what a public Custom expedition looks like in the lobby, "Just
// Chatting Marathon" a private one — so both show up as real, joinable examples instead of only
// existing once someone builds one via Create Expedition.
const CUSTOM_INDEXES = new Set([1, 3]);
const PRIVATE_INDEX = 3;
// Each of the five seeded expeditions demos one distinct thing, so there's always a reliable
// place to see it rather than waiting on random timing or a random tally:
// "Late Night Wander" (0) never departs — the waiting room, permanently (see ExpeditionContext's
//   tick loop, which loops its boarding countdown instead of ever letting it depart).
// "Variety Roulette" (1) gets no special treatment at all — a plain Custom expedition example.
// "Rising Talent Run" (2) is pinned in-progress, always reads "Ending soon" on its lobby card
//   (Expeditions.tsx's isEndingSoon is keyed to this one expedition id, never a plain threshold
//   check, so it never lights up anywhere else), and really does end shortly after you ride it —
//   see Expedition.tsx's own ENDING_SOON_DEMO_EXPEDITION_ID countdown, which pours everyone onto
//   its last stop a few seconds in, rather than looping forever like every other expedition.
// "Just Chatting Marathon" (3) is the private Custom example, nothing more.
// "Slots & Chill" (4) is pinned in-progress and is the one expedition Expedition.tsx's Kick Vote
//   always targets "you" on and always resolves as kicked — a reliable demo of the kicked-off
//   notification, rather than a random chance any expedition could hit.
const WAITING_ROOM_DEMO_INDEX = 0;
const ENDING_SOON_DEMO_INDEX = 2;
const KICK_VOTE_DEMO_INDEX = 4;

export const WAITING_ROOM_DEMO_EXPEDITION_ID = `expedition-${WAITING_ROOM_DEMO_INDEX}`;
export const ENDING_SOON_DEMO_EXPEDITION_ID = `expedition-${ENDING_SOON_DEMO_INDEX}`;
export const KICK_VOTE_DEMO_EXPEDITION_ID = `expedition-${KICK_VOTE_DEMO_INDEX}`;

/*
  Half the roster is already under way — a viewer catching one mid-journey is the "hop onto a
  moving expedition" case the lobby's own "Jump in now" covers. The other half is still
  boarding, with a real departure to count down to. Every expedition draws its stops from the
  same live channels the rest of the site uses, so a name might already be familiar from the
  sidebar or a browse card.
*/
export function createExpeditions(livestreams: Livestream[]): Expedition[] {
  return EXPEDITION_NAMES.map((name, i) => {
    const isEndingSoonDemo = i === ENDING_SOON_DEMO_INDEX;
    const isKickVoteDemo = i === KICK_VOTE_DEMO_INDEX;
    const boarding = !isEndingSoonDemo && !isKickVoteDemo && i % 2 === 0;
    const stops = shuffle(livestreams).slice(0, Math.min(STOPS_PER_EXPEDITION, livestreams.length));
    const id = `expedition-${i}`;
    const isCustom = CUSTOM_INDEXES.has(i);
    const isPrivate = i === PRIVATE_INDEX;

    return {
      id,
      name,
      stops,
      viewerCount: 4 + Math.floor(Math.random() * 15),
      maxViewers: MAX_EXPEDITION_VIEWERS,
      status: boarding ? "boarding" : "in-progress",
      stopIndex: boarding ? 0 : Math.floor(Math.random() * stops.length),
      secondsRemaining: boarding
        ? 20 + Math.floor(Math.random() * 45)
        : 8 + Math.floor(Math.random() * (STOP_DURATION_SECONDS - 8)),
      transitionUntil: null,
      kind: isCustom ? "custom" : "quick",
      createdByViewer: false,
      visibility: isPrivate ? "private" : "public",
      password: isPrivate ? "hopalong" : undefined,
      invitedUsernames: [],
      stopDurationMode: "1min",
      stopDurationSeconds: undefined,
      streamerSelectionMode: "preselected",
      allowKicking: true,
      // Both the ending-soon and Kick Vote demo expeditions mirror their events into Main Chat
      // too (Expedition.tsx) — needs a Main Chat pane actually on screen to be visible at all,
      // which "expedition-only" (every other seeded expedition) never shows.
      chatVisibility: isEndingSoonDemo || isKickVoteDemo ? "both" : "expedition-only",
      friendsHopping: pickFriendsHopping(id),
      // Quick expeditions are what Kick's own mods stand up; the seeded Custom ones are
      // credited to a community member instead, same as a real viewer-built one would be.
      creator: isCustom ? pickCreator(id) : "Kick",
      isDraft: false,
      wasHandedOff: false,
      endBehavior: "last-stream",
    };
  });
}

export type CreateQuickExpeditionInput = {
  name?: string;
};

// One click, per the user's answer: always public, fixed 1-minute stops, no other config.
export function createQuickExpedition(
  input: CreateQuickExpeditionInput,
  livestreams: Livestream[],
): Expedition {
  const id = `expedition-quick-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const stops = shuffle(livestreams).slice(0, Math.min(STOPS_PER_EXPEDITION, livestreams.length));

  return {
    id,
    name: input.name?.trim() || `${currentUser.username} Quick Expedition`,
    stops,
    viewerCount: 1,
    maxViewers: MAX_EXPEDITION_VIEWERS,
    status: "in-progress",
    stopIndex: 0,
    secondsRemaining: STOP_DURATION_SECONDS,
    transitionUntil: null,
    kind: "quick",
    createdByViewer: true,
    visibility: "public",
    invitedUsernames: [],
    stopDurationMode: "1min",
    streamerSelectionMode: "preselected",
    allowKicking: true,
    chatVisibility: "expedition-only",
    friendsHopping: pickFriendsHopping(id),
    creator: currentUser.username,
    isDraft: false,
    wasHandedOff: false,
    // Per the user's answer: a Quick expedition never exposes this choice — it always pours
    // into whatever stop is showing when it ends.
    endBehavior: "last-stream",
  };
}

export type CreateCustomExpeditionInput = {
  name: string;
  visibility: ExpeditionVisibility;
  password?: string;
  invitedUsernames: string[];
  stopDurationMode: StopDurationMode;
  stopDurationSeconds?: number;
  streamerSelectionMode: StreamerSelectionMode;
  /** Only read when streamerSelectionMode is "preselected". */
  preselectedSlugs: string[];
  allowKicking: boolean;
  chatVisibility: ChatVisibility;
  endBehavior: EndBehaviorMode;
  /** Only read when endBehavior is "specific-streamer". */
  endStreamerSlug?: string;
};

/*
  When streamerSelectionMode is "chat", the route starts with exactly one seed stop — the rest
  of it is filled in by the next-stop vote (Expedition.tsx / NextStopVotePanel.tsx), not
  pre-built here.
*/
export function createCustomExpedition(
  input: CreateCustomExpeditionInput,
  livestreams: Livestream[],
): Expedition {
  const id = `expedition-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const stops =
    input.streamerSelectionMode === "chat"
      ? shuffle(livestreams).slice(0, 1)
      : livestreams.filter((s) => input.preselectedSlugs.includes(s.channel.slug));

  return {
    id,
    name: input.name.trim() || `${currentUser.username} Custom Expedition`,
    stops: stops.length ? stops : shuffle(livestreams).slice(0, 1),
    viewerCount: 1,
    maxViewers: MAX_EXPEDITION_VIEWERS,
    status: "in-progress",
    stopIndex: 0,
    secondsRemaining:
      input.stopDurationMode === "1min"
        ? STOP_DURATION_SECONDS
        : input.stopDurationMode === "custom"
          ? (input.stopDurationSeconds ?? STOP_DURATION_SECONDS)
          : STOP_DURATION_SECONDS,
    transitionUntil: null,
    kind: "custom",
    createdByViewer: true,
    visibility: input.visibility,
    password: input.visibility === "private" ? input.password || undefined : undefined,
    invitedUsernames: input.visibility === "private" ? input.invitedUsernames : [],
    stopDurationMode: input.stopDurationMode,
    stopDurationSeconds: input.stopDurationMode === "custom" ? input.stopDurationSeconds : undefined,
    streamerSelectionMode: input.streamerSelectionMode,
    allowKicking: input.allowKicking,
    chatVisibility: input.chatVisibility,
    friendsHopping: pickFriendsHopping(id),
    creator: currentUser.username,
    isDraft: false,
    wasHandedOff: false,
    endBehavior: input.endBehavior,
    endStreamerSlug: input.endBehavior === "specific-streamer" ? input.endStreamerSlug : undefined,
  };
}

// Channel points for staying through an entire Kick Break, start to finish, without hopping off.
export const KICK_BREAK_REWARD_POINTS = 150;

export type CreateKickBreakInput = {
  /** Order matters — the rotation plays in this order, never the origin streamer's own stream. */
  preselectedSlugs: string[];
  stopDurationSeconds: number;
};

/*
  A streamer's own "raid, but a whole rotation" — triggered from the Creator Dashboard, not the
  Expeditions lobby. Unlisted (never browsable), origin-only chat (the streamer's own chat room
  carries on, not Explorer Chat or whichever stop is live), no Kick Vote, and a fixed, streamer-
  picked order and duration — never chat-decided. Ends itself after one full lap (see
  ExpeditionContext's tick loop), rather than looping forever like every other expedition kind.
*/
export function createKickBreak(input: CreateKickBreakInput, livestreams: Livestream[]): Expedition {
  const id = `expedition-kickbreak-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const stops = input.preselectedSlugs
    .map((slug) => livestreams.find((s) => s.channel.slug === slug))
    .filter((s): s is Livestream => Boolean(s));

  return {
    id,
    name: `${currentUser.username}'s Kick Break`,
    stops,
    viewerCount: 1,
    maxViewers: MAX_EXPEDITION_VIEWERS,
    status: "in-progress",
    stopIndex: 0,
    secondsRemaining: input.stopDurationSeconds,
    transitionUntil: null,
    kind: "kick-break",
    createdByViewer: true,
    visibility: "unlisted",
    invitedUsernames: [],
    stopDurationMode: "custom",
    stopDurationSeconds: input.stopDurationSeconds,
    streamerSelectionMode: "preselected",
    allowKicking: false,
    chatVisibility: "origin-only",
    friendsHopping: [],
    creator: currentUser.username,
    isDraft: false,
    wasHandedOff: false,
    endBehavior: "last-stream",
    originStreamerSlug: currentUser.username,
  };
}

// The next-stop vote's 3 options: never the current stop, never one already visited this trip.
export function pickVoteCandidates(exclude: Livestream[], livestreams: Livestream[], count = 3): Livestream[] {
  const excludedSlugs = new Set(exclude.map((s) => s.channel.slug));
  const pool = livestreams.filter((s) => !excludedSlugs.has(s.channel.slug));
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

const EXPLORER_MESSAGE_TEMPLATES = [
  "where are we headed next",
  "captain take us somewhere good this time",
  "this is actually so fun",
  "expedition gang rise up",
  "1 min stops go brutal",
  "bring back the guy from 2 stops ago",
  "left my own stream open for this lol worth it",
  "who else is hopping all night",
  "never been to this one before",
  "okay this stop is actually kind of fire",
  "vote we stay here",
  "next stop better be good",
  "the random hop energy is unmatched",
  "is it always this fast",
  "day 3 of never leaving an expedition",
];

// The same viewer identities the rest of the site's chat already uses (mock/chatIdentities.ts),
// not a second invented name pool.
function pickExplorer() {
  return chatters[Math.floor(Math.random() * chatters.length)].username;
}

export function createExplorerMessage(): ExplorerMessage {
  return {
    id: `explorer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    username: pickExplorer(),
    text: EXPLORER_MESSAGE_TEMPLATES[Math.floor(Math.random() * EXPLORER_MESSAGE_TEMPLATES.length)],
  };
}

export function createExplorerMessages(count = 10) {
  return Array.from({ length: count }, () => createExplorerMessage());
}

/*
  Kick Vote: a running joke, not a real consequence. Every stop, the (mocked) crowd proposes
  booting a random fellow rider. Nobody actually leaves the expedition — it resolves into a line
  in Explorer Chat, named after the platform on purpose. Ported from kick-web-redesign's
  mock/expeditions.ts.
*/
export const KICK_VOTE_DURATION_SECONDS = 25;

// The target is always one of the mocked crowd, never "you" — reuses the same identities
// Explorer Chat itself draws from.
export function randomKickVoteTarget(): string {
  return pickExplorer();
}
