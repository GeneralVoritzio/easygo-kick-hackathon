import type { EngagementPoint, StreamSession } from '../types';

const SAMPLE_INTERVAL_SEC = 20;
const STREAM_DURATION_SEC = 48 * 60;
const BASELINE = 30;

/** Deliberate bumps layered onto the random walk so a demo run reliably
 *  produces a few real spikes, rather than hoping the walk clears the
 *  detection threshold on its own. Real usage would just be the random
 *  walk, since real engagement isn't scripted. */
const SCRIPTED_BUMPS: { atSec: number; peak: number }[] = [
  { atSec: 6 * 60, peak: 80 },
  { atSec: 19 * 60, peak: 95 },
  { atSec: 31 * 60, peak: 70 },
  { atSec: 41 * 60, peak: 88 },
];

function bumpContribution(t: number): number {
  let contribution = 0;
  for (const bump of SCRIPTED_BUMPS) {
    const distance = Math.abs(t - bump.atSec);
    if (distance < 90) contribution += bump.peak * (1 - distance / 90);
  }
  return contribution;
}

function generateEngagement(durationSec: number): EngagementPoint[] {
  const points: EngagementPoint[] = [];
  let value = BASELINE;
  for (let t = 0; t <= durationSec; t += SAMPLE_INTERVAL_SEC) {
    value += Math.random() * 10 - 5;
    value = Math.max(10, Math.min(60, value));
    const point = Math.max(0, Math.min(100, value + bumpContribution(t)));
    points.push({ t, value: Math.round(point) });
  }
  return points;
}

/** A stream that's been live for a while, with the viewer joining right
 *  now — the recap covers everything from `streamStartedAt` up to this
 *  moment. */
export function createMockStreamSession(): StreamSession {
  const now = Date.now();
  return {
    streamerName: 'maxholloway',
    kickChannel: 'maxholloway',
    streamStartedAt: new Date(now - STREAM_DURATION_SEC * 1000).toISOString(),
    viewerJoinedAt: new Date(now).toISOString(),
    engagement: generateEngagement(STREAM_DURATION_SEC),
  };
}
