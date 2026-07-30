// The engagement score, Product Spec Section 7. Every signal is scored against what is expected
// for a channel of that size, so a typical 200 viewer channel and a typical 50,000 viewer channel
// score the same. BASE, EXP, K and B are estimates to calibrate against real data.
//
// This file holds no data and no KICK surface, so score.check.ts can run it on plain node.

export type ChannelActivity = {
  slug: string;
  unique_chatters: number;
  chat_messages: number;
  follows: number;
  kicks: number;
  viewer_delta: number;
  chat_rate_delta: number;
  last_raid?: { incoming_viewers: number; existing_viewers: number; kept_viewers: number };
};

export type Signal = "participation" | "momentum" | "retention" | "volume";

const BASE = { participation: 0.28, momentum: 0.05, volume: 1.6 };
const EXP = { participation: 0.75, momentum: 0.8, volume: 0.85 };
const K = 1.2;
const B = 0.6;

export const WEIGHT: Record<Signal, number> = {
  participation: 0.35,
  momentum: 0.25,
  retention: 0.25,
  volume: 0.15,
};

// Section 7.5: a row shows its top signal in plain words, never a number.
export const REASON: Record<Signal, string> = {
  participation: "more of the chat is talking than usual",
  momentum: "warming up right now",
  retention: "keeps the viewers it is sent",
  volume: "chat is spending",
};

export const MIN_SCORE = 0.44;

const signals: Signal[] = ["participation", "momentum", "retention", "volume"];

const expected = (signal: keyof typeof BASE, viewers: number) =>
  BASE[signal] * viewers ** EXP[signal];

export const squash = (relative: number) => relative / (relative + 1);

export const expectedRetention = (ratio: number) => 1 / (1 + K * ratio ** B);

export function relativeSignals(a: ChannelActivity, viewers: number): Record<Signal, number> {
  const momentum = Math.max(0, a.viewer_delta) + Math.max(0, a.chat_rate_delta);
  const volume = a.chat_messages + a.follows + a.kicks;
  const raid = a.last_raid;
  return {
    participation: a.unique_chatters / expected("participation", viewers),
    momentum: momentum / expected("momentum", viewers),
    volume: volume / expected("volume", viewers),
    // A channel with no raid history scores exactly 1.0, so new creators are neither
    // rewarded nor punished.
    retention: raid
      ? raid.kept_viewers /
        raid.incoming_viewers /
        expectedRetention(raid.incoming_viewers / raid.existing_viewers)
      : 1,
  };
}

export function engagementScore(a: ChannelActivity, viewers: number) {
  const relative = relativeSignals(a, viewers);
  const contribution = (s: Signal) => WEIGHT[s] * (squash(relative[s]) - 0.5);
  const score = signals.reduce((sum, s) => sum + WEIGHT[s] * squash(relative[s]), 0);
  const top = signals.reduce((best, s) => (contribution(s) > contribution(best) ? s : best));
  return { score, top, reason: REASON[top] };
}

// Section 7.6: the list depends on who is raiding. The band peaks over 1 to 3, falls sharply
// below 0.1, and falls gently above 20 because a flood that retains 5 percent still
// transforms a small creator.
export function sizeFit(hostViewers: number, candidateViewers: number) {
  const ratio = hostViewers / candidateViewers;
  if (ratio < 1) return Math.max(0.05, ratio ** 0.85);
  if (ratio <= 3) return 1;
  return Math.max(0.35, (3 / ratio) ** 0.28);
}

// Section 8: cooldown scales with what the receiver actually got.
export const COOLDOWN_BASE_MINUTES = 60;
export const FEATURED_COOLDOWN_MINUTES = 8;
export const RECOVERY_HOURS = 6;

export const cooldownMinutes = (receivedViewers: number, ownViewers: number) =>
  Math.min(120, Math.max(2, COOLDOWN_BASE_MINUTES * (receivedViewers / ownViewers)));
