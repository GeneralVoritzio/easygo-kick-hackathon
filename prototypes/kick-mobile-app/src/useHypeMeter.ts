import { useEffect, useState } from 'react';

const HYPE_DURATION_MIN_MS = 6_000;
const HYPE_DURATION_MAX_MS = 14_000;
const CALM_DURATION_MIN_MS = 10_000;
const CALM_DURATION_MAX_MS = 30_000;

function hashSeed(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Simulates a stream's chat energy cresting and fading: waves of "hyping"
 *  and "calm", not a fabricated viewer/chat number (there's no real chat
 *  feed behind these live embeds to derive one from). Seeded per stream id
 *  so tiles don't all crest in lockstep, same "schedule the next fake
 *  event" shape as useLiveChat. */
export function useHypeMeter(streamId: string): boolean {
  const [isHyping, setIsHyping] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    const initialDelay = hashSeed(streamId) % CALM_DURATION_MAX_MS;

    const scheduleNext = (hyping: boolean) => {
      const delay = hyping
        ? randomBetween(HYPE_DURATION_MIN_MS, HYPE_DURATION_MAX_MS)
        : randomBetween(CALM_DURATION_MIN_MS, CALM_DURATION_MAX_MS);
      timer = window.setTimeout(() => {
        setIsHyping(hyping);
        scheduleNext(!hyping);
      }, delay);
    };

    setIsHyping(false);
    timer = window.setTimeout(() => {
      setIsHyping(true);
      scheduleNext(false);
    }, initialDelay);

    return () => window.clearTimeout(timer);
  }, [streamId]);

  return isHyping;
}
