// Run with: node --experimental-strip-types src/kick/mock/score.check.ts
// Section 16: the test that matters asserts scale neutrality, not any specific ordering.
import assert from "node:assert/strict";
import {
  cooldownMinutes,
  engagementScore,
  expectedRetention,
  MIN_SCORE,
  sizeFit,
  type ChannelActivity,
} from "./score.ts";

const typical = (slug: string, viewers: number): ChannelActivity => ({
  slug,
  unique_chatters: Math.round(0.28 * viewers ** 0.75),
  chat_messages: Math.round(1.6 * viewers ** 0.85 * 0.92),
  follows: Math.round(1.6 * viewers ** 0.85 * 0.05),
  kicks: Math.round(1.6 * viewers ** 0.85 * 0.03),
  viewer_delta: 0.05 * viewers ** 0.8 * 0.6,
  chat_rate_delta: 0.05 * viewers ** 0.8 * 0.4,
});

const small = engagementScore(typical("small", 200), 200).score;
const huge = engagementScore(typical("huge", 50000), 50000).score;
assert.ok(Math.abs(small - huge) < 0.01, `scale neutrality: ${small} vs ${huge}`);
assert.ok(Math.abs(small - 0.5) < 0.01, `a typical channel sits at 0.5, got ${small}`);

const punching = { ...typical("punching", 200), unique_chatters: 60 };
assert.ok(engagementScore(punching, 200).score > small);
assert.equal(engagementScore(punching, 200).top, "participation");

const dead = { ...typical("dead", 9000), unique_chatters: 40, chat_messages: 120 };
assert.ok(engagementScore(dead, 9000).score < MIN_SCORE, "the floor drops a dead channel");

// Section 7.3: a small channel keeping 3 percent of a raid 250 times its size beats a big
// channel keeping 40 percent of a same size raid.
const flooded = {
  ...typical("flooded", 200),
  last_raid: { incoming_viewers: 50000, existing_viewers: 200, kept_viewers: 1500 },
};
const evenRaid = {
  ...typical("even", 5000),
  last_raid: { incoming_viewers: 5000, existing_viewers: 5000, kept_viewers: 2000 },
};
assert.ok(engagementScore(flooded, 200).score > engagementScore(evenRaid, 5000).score);
assert.ok(expectedRetention(250) < expectedRetention(1));

assert.equal(sizeFit(3000, 1500), 1);
assert.ok(sizeFit(180, 1800) < 0.2, "a raid too small for the receiver falls sharply");
assert.ok(sizeFit(50000, 200) > 0.3, "a flood onto a small creator falls only gently");

assert.equal(Math.round(cooldownMinutes(5, 180)), 2);
assert.equal(Math.round(cooldownMinutes(4000, 180)), 120);

console.log("score.check.ts: all assertions passed");
