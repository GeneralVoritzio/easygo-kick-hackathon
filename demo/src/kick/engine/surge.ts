// A surge is one burst of attention. It adds viewers and it multiplies the chat rate. Both
// climb over `rise` seconds and then decay. A raid, a big tip and a sub train are all surges
// with different numbers.
export type Surge = {
  at: number;
  peak: number;
  rise: number;
  decay: number;
  mult: number;
};

export const surgeIsOver = (surge: Surge, now: number) =>
  now - surge.at > surge.rise + surge.decay * 3;

export function surgeFactor(surges: Surge[], now: number) {
  let add = 0;
  let mult = 1;
  for (const surge of surges) {
    const age = now - surge.at;
    if (age < 0) continue;
    const shape =
      age < surge.rise ? age / surge.rise : Math.exp(-(age - surge.rise) / surge.decay);
    add += surge.peak * shape;
    mult = Math.max(mult, 1 + (surge.mult - 1) * shape);
  }
  return { add, mult };
}
