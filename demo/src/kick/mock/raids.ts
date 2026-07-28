import { livestreams, profileFor, type Livestream } from "./api";
import {
  cooldownMinutes,
  engagementScore,
  FEATURED_COOLDOWN_MINUTES,
  MIN_SCORE,
  RECOVERY_HOURS,
  sizeFit,
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
];

const activityFor = (slug: string) => {
  const found = activity.find((a) => a.slug === slug);
  if (!found) throw new Error(`No raid activity for ${slug}. Add it to mock/raids.ts`);
  return found;
};

// Section 10: the only consent toggle. Off means never eligible for a tank.
const tankOptOut = new Set(["notadoc"]);

export const joinsTanks = (slug: string) => !tankOptOut.has(slug);

export function setJoinsTanks(slug: string, joins: boolean) {
  if (joins) tankOptOut.delete(slug);
  else tankOptOut.add(slug);
}

export const tankCandidates = (candidates: Candidate[]) =>
  candidates.filter((c) => joinsTanks(c.stream.channel.slug));

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
