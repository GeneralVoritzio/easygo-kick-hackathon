// A linear congruential generator. The engine uses it for every roll, so one seed gives the
// same stream every run, and a rehearsal matches the demo.
export function createRandom(seed: number) {
  let state = seed;
  const next = () => {
    state = (state * 1664525 + 1013904223) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  return {
    next,
    chance: (probability: number) => next() < probability,
    pick: <T>(list: T[]) => list[Math.floor(next() * list.length)],
    int: (low: number, high: number) => low + Math.floor(next() * (high - low + 1)),
  };
}

export type Random = ReturnType<typeof createRandom>;
