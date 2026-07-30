import { livestreams, profileFor, type Livestream } from "./api";
import {
  cooldownMinutes,
  engagementScore,
  FEATURED_COOLDOWN_MINUTES,
  MIN_SCORE,
  RECOVERY_HOURS,
  relativeSignals,
  sizeFit,
  squash,
  type ChannelActivity,
} from "./score";

// Counts of real KICK events per channel over the last 30 minutes, which is what the webhooks
// plus polling would yield: kick chat.message.sent, kick channel.followed, kick kicks.gifted,
// and kick GET /public/v2/livestreams for the viewer counts and the deltas.
const activity: ChannelActivity[] = [
  { slug: "chartfairy", unique_chatters: 5, chat_messages: 19, follows: 1, kicks: 1, viewer_delta: 0, chat_rate_delta: 0.3, last_raid: { incoming_viewers: 3100, existing_viewers: 9, kept_viewers: 182 } },
  { slug: "capequest", unique_chatters: 25, chat_messages: 182, follows: 10, kicks: 6, viewer_delta: 5, chat_rate_delta: 3.3, last_raid: { incoming_viewers: 2400, existing_viewers: 140, kept_viewers: 600 } },
  { slug: "cluecrawler", unique_chatters: 99, chat_messages: 1004, follows: 55, kicks: 33, viewer_delta: 13, chat_rate_delta: 8.9, last_raid: { incoming_viewers: 900, existing_viewers: 1100, kept_viewers: 1134 } },
  { slug: "panfriedpaul", unique_chatters: 52, chat_messages: 756, follows: 41, kicks: 25, viewer_delta: 10, chat_rate_delta: 6.4 },
  { slug: "mudbrickmage", unique_chatters: 89, chat_messages: 717, follows: 39, kicks: 23, viewer_delta: 10, chat_rate_delta: 6.3, last_raid: { incoming_viewers: 1500, existing_viewers: 800, kept_viewers: 764 } },
  { slug: "yapmerchant", unique_chatters: 77, chat_messages: 415, follows: 23, kicks: 14, viewer_delta: 7, chat_rate_delta: 4.5, last_raid: { incoming_viewers: 400, existing_viewers: 700, kept_viewers: 215 } },
  { slug: "vanlifevoid", unique_chatters: 96, chat_messages: 1069, follows: 58, kicks: 35, viewer_delta: 20, chat_rate_delta: 13.3, last_raid: { incoming_viewers: 2000, existing_viewers: 1500, kept_viewers: 989 } },
  { slug: "couchsermon", unique_chatters: 126, chat_messages: 1127, follows: 61, kicks: 37, viewer_delta: 14, chat_rate_delta: 9.5, last_raid: { incoming_viewers: 1800, existing_viewers: 2000, kept_viewers: 762 } },
  { slug: "notadoc", unique_chatters: 29, chat_messages: 305, follows: 17, kicks: 10, viewer_delta: 5, chat_rate_delta: 3.3 },
  { slug: "flickgremlin", unique_chatters: 124, chat_messages: 1622, follows: 88, kicks: 53, viewer_delta: 22, chat_rate_delta: 14.7, last_raid: { incoming_viewers: 2600, existing_viewers: 3000, kept_viewers: 1237 } },
  { slug: "wanderfuse", unique_chatters: 101, chat_messages: 1232, follows: 67, kicks: 40, viewer_delta: 20, chat_rate_delta: 13.5, last_raid: { incoming_viewers: 3200, existing_viewers: 2500, kept_viewers: 1070 } },
  { slug: "tiltcabinet", unique_chatters: 41, chat_messages: 658, follows: 36, kicks: 21, viewer_delta: 5, chat_rate_delta: 3.6, last_raid: { incoming_viewers: 1200, existing_viewers: 900, kept_viewers: 346 } },
  { slug: "spinvicar", unique_chatters: 135, chat_messages: 3133, follows: 170, kicks: 102, viewer_delta: 19, chat_rate_delta: 13, last_raid: { incoming_viewers: 4400, existing_viewers: 4800, kept_viewers: 1851 } },
  { slug: "reelgoblin", unique_chatters: 10, chat_messages: 143, follows: 8, kicks: 5, viewer_delta: 2, chat_rate_delta: 1.2, last_raid: { incoming_viewers: 700, existing_viewers: 210, kept_viewers: 121 } },
  { slug: "snoozebaron", unique_chatters: 49, chat_messages: 850, follows: 46, kicks: 28, viewer_delta: 6, chat_rate_delta: 3.7, last_raid: { incoming_viewers: 5000, existing_viewers: 6800, kept_viewers: 1251 } },
  { slug: "nocturnalnorm", unique_chatters: 12, chat_messages: 186, follows: 10, kicks: 6, viewer_delta: 2, chat_rate_delta: 1.4, last_raid: { incoming_viewers: 2200, existing_viewers: 1400, kept_viewers: 342 } },
  { slug: "ironvow", unique_chatters: 233, chat_messages: 2646, follows: 144, kicks: 86, viewer_delta: 33, chat_rate_delta: 22.1, last_raid: { incoming_viewers: 2800, existing_viewers: 3600, kept_viewers: 2067 } },
  { slug: "heistgremlin", unique_chatters: 35, chat_messages: 520, follows: 28, kicks: 17, viewer_delta: 8, chat_rate_delta: 5.2 },
  { slug: "getawaydriver", unique_chatters: 78, chat_messages: 980, follows: 55, kicks: 33, viewer_delta: 15, chat_rate_delta: 10.1, last_raid: { incoming_viewers: 1900, existing_viewers: 1600, kept_viewers: 704 } },
  { slug: "midlanemartyr", unique_chatters: 22, chat_messages: 310, follows: 16, kicks: 9, viewer_delta: 4, chat_rate_delta: 2.8 },
  { slug: "junglediff", unique_chatters: 118, chat_messages: 1480, follows: 82, kicks: 49, viewer_delta: 21, chat_rate_delta: 14.2, last_raid: { incoming_viewers: 2900, existing_viewers: 3300, kept_viewers: 1349 } },
  { slug: "lofigremlin", unique_chatters: 13, chat_messages: 160, follows: 9, kicks: 5, viewer_delta: 2, chat_rate_delta: 1.3 },
  { slug: "chordwitch", unique_chatters: 54, chat_messages: 690, follows: 38, kicks: 23, viewer_delta: 10, chat_rate_delta: 6.9 },
  { slug: "polygonpaladin", unique_chatters: 29, chat_messages: 410, follows: 23, kicks: 14, viewer_delta: 6, chat_rate_delta: 4.1 },
  { slug: "avatarorchard", unique_chatters: 101, chat_messages: 1250, follows: 70, kicks: 42, viewer_delta: 18, chat_rate_delta: 12, last_raid: { incoming_viewers: 2400, existing_viewers: 2900, kept_viewers: 1096 } },
  { slug: "clutchmortician", unique_chatters: 198, chat_messages: 2580, follows: 140, kicks: 84, viewer_delta: 30, chat_rate_delta: 21.5, last_raid: { incoming_viewers: 3800, existing_viewers: 4900, kept_viewers: 2214 } },
  { slug: "blockfeud", unique_chatters: 6, chat_messages: 75, follows: 4, kicks: 2, viewer_delta: 1, chat_rate_delta: 0.6 },
  { slug: "smokelineoracle", unique_chatters: 44, chat_messages: 560, follows: 31, kicks: 19, viewer_delta: 9, chat_rate_delta: 5.9 },
  { slug: "produceruprising", unique_chatters: 9, chat_messages: 110, follows: 6, kicks: 4, viewer_delta: 2, chat_rate_delta: 1.2 },
  { slug: "idolinsomnia", unique_chatters: 4, chat_messages: 45, follows: 2, kicks: 1, viewer_delta: 1, chat_rate_delta: 0.5 },
  { slug: "sidequestsinner", unique_chatters: 68, chat_messages: 870, follows: 48, kicks: 29, viewer_delta: 14, chat_rate_delta: 9.4, last_raid: { incoming_viewers: 1600, existing_viewers: 1400, kept_viewers: 611 } },
  { slug: "napkingdom", unique_chatters: 110, chat_messages: 1400, follows: 77, kicks: 46, viewer_delta: 22, chat_rate_delta: 14.9, last_raid: { incoming_viewers: 3400, existing_viewers: 2600, kept_viewers: 1197 } },
  { slug: "supportmartyr", unique_chatters: 17, chat_messages: 230, follows: 12, kicks: 7, viewer_delta: 3, chat_rate_delta: 2.2 },
  { slug: "redstonewidow", unique_chatters: 39, chat_messages: 500, follows: 27, kicks: 16, viewer_delta: 8, chat_rate_delta: 5.2 },
  { slug: "basslinebandit", unique_chatters: 26, chat_messages: 340, follows: 18, kicks: 11, viewer_delta: 5, chat_rate_delta: 3.4 },
  { slug: "quantumkoala", unique_chatters: 19, chat_messages: 250, follows: 13, kicks: 8, viewer_delta: 4, chat_rate_delta: 2.5 },
  { slug: "wildyrisk", unique_chatters: 89, chat_messages: 1130, follows: 62, kicks: 37, viewer_delta: 18, chat_rate_delta: 12, last_raid: { incoming_viewers: 2700, existing_viewers: 2300, kept_viewers: 1220 } },
  { slug: "sidewalkscholar", unique_chatters: 48, chat_messages: 610, follows: 34, kicks: 20, viewer_delta: 10, chat_rate_delta: 6.4 },
  { slug: "confessionbooth", unique_chatters: 34, chat_messages: 430, follows: 24, kicks: 14, viewer_delta: 7, chat_rate_delta: 4.5 },
  { slug: "bonusbuybishop", unique_chatters: 130, chat_messages: 1660, follows: 92, kicks: 55, viewer_delta: 26, chat_rate_delta: 17.6, last_raid: { incoming_viewers: 4000, existing_viewers: 5400, kept_viewers: 1791 } },
];

// Invented surface: fake-kick GET /public/v1/channels/{slug}/raids/history?target=<host>, how
// many times this channel has raided the host before, and when it last happened.
const raidHistory: Record<string, { count: number; lastAt: string }> = {
  capequest: { count: 1, lastAt: "2026-07-24T10:15:00Z" },
  cluecrawler: { count: 2, lastAt: "2026-07-20T18:40:00Z" },
  mudbrickmage: { count: 4, lastAt: "2026-06-15T12:00:00Z" },
  yapmerchant: { count: 1, lastAt: "2026-07-10T09:00:00Z" },
};

export function raidHistoryFor(slug: string): { count: number; lastAt?: string } {
  return raidHistory[slug] ?? { count: 0 };
}

const activityFor = (slug: string) => {
  const found = activity.find((a) => a.slug === slug);
  if (!found) throw new Error(`No raid activity for ${slug}. Add it to mock/raids.ts`);
  return found;
};

// Section 10: the only consent toggle. Off means never eligible for a showdown.
const showdownOptOut = new Set(["notadoc"]);

export const joinsShowdowns = (slug: string) => !showdownOptOut.has(slug);

export function setJoinsShowdowns(slug: string, joins: boolean) {
  if (joins) showdownOptOut.delete(slug);
  else showdownOptOut.add(slug);
}

export const showdownCandidates = (candidates: Candidate[]) =>
  candidates.filter((c) => joinsShowdowns(c.stream.channel.slug));

type Exposure = { readyAt: number; recoveredAt: number };

const exposure = new Map<string, Exposure>();

function record(slug: string, minutes: number) {
  const readyAt = Date.now() + minutes * 60_000;
  exposure.set(slug, { readyAt, recoveredAt: readyAt + RECOVERY_HOURS * 3_600_000 });
}

// Section 8: everyone featured goes on cooldown, and the winner's scales with what it received.
export function recordRaid(winner: Candidate, featured: Candidate[], hostViewers: number) {
  record(winner.stream.channel.slug, cooldownMinutes(hostViewers, winner.stream.viewer_count));
  for (const c of featured) {
    if (c.stream.channel.slug === winner.stream.channel.slug) continue;
    record(c.stream.channel.slug, FEATURED_COOLDOWN_MINUTES);
  }
}

// Ineligible while cooling, then back at 60 percent and recovering to full over 6 hours.
function exposureFactor(slug: string) {
  const e = exposure.get(slug);
  if (!e) return 1;
  const now = Date.now();
  if (now < e.readyAt) return 0;
  if (now >= e.recoveredAt) return 1;
  return 0.6 + 0.4 * ((now - e.readyAt) / (e.recoveredAt - e.readyAt));
}

export type Candidate = {
  stream: Livestream;
  score: number;
  reason: string;
};

// Section 7.4's participation signal, read back out as a plain percentage for the preview
// popover: how far past (or short of) what a channel this size would normally see.
export function interactivityPercent(candidate: Candidate): number {
  const relative = relativeSignals(activityFor(candidate.stream.channel.slug), candidate.stream.viewer_count);
  return Math.round(squash(relative.participation) * 100);
}

// Section 7.4, in order: the floor, then the exposure factor, then the size-fit multiplier.
export function recommendationsFor(hostSlug: string, hostViewers: number): Candidate[] {
  return livestreams
    .filter((s) => s.is_live && s.channel.slug !== hostSlug)
    .map((s) => {
      const { score, reason } = engagementScore(activityFor(s.channel.slug), s.viewer_count);
      return { stream: s, score, reason };
    })
    .filter((c) => c.score >= MIN_SCORE)
    .map((c) => ({
      ...c,
      score:
        c.score *
        exposureFactor(c.stream.channel.slug) *
        sizeFit(hostViewers, c.stream.viewer_count),
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);
}

export type HandleResult =
  | { found: false }
  | { found: true; live: true; stream: Livestream }
  | { found: true; live: false; username: string; avatar: string };

// Section 9: typing an exact handle is the only surface that can show an offline channel.
export function findHandle(handle: string): HandleResult {
  const slug = handle.trim().replace(/^@/, "").toLowerCase();
  if (!slug) return { found: false };
  const stream = livestreams.find((s) => s.channel.slug === slug);
  if (stream) return { found: true, live: true, stream };
  const profile = profileFor(slug);
  if (!profile) return { found: false };
  return {
    found: true,
    live: false,
    username: profile.channel.username,
    avatar: profile.channel.avatar,
  };
}
