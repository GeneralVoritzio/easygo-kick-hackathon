// Invented surface, named as if KICK's engineers built it:
//   fake-kick POST   /public/v1/breaks
//   fake-kick POST   /public/v1/breaks/{break_id}/choice
//   fake-kick DELETE /public/v1/breaks/{break_id}
//   fake-kick break.started, break.choice.changed, break.ended

export const BREAK_DURATION_DEFAULT = 300;
export const BREAK_DURATION_PRESETS = [120, 300, 600, 900];

export type Break = {
  hostSlug: string;
  options: string[];
  votes: Record<string, number>;
  myChoice: string | null;
  seconds: number;
  duration: number;
  // Section 5.2-style: like a landed raid, ending doesn't clear the state outright. It sits
  // here until the viewer dismisses it, so "you're back" is a moment, not a vanish.
  ended: boolean;
};

export function startBreak(hostSlug: string, options: string[], duration: number): Break {
  return {
    hostSlug,
    options,
    votes: Object.fromEntries(options.map((slug) => [slug, 0])),
    myChoice: null,
    seconds: duration,
    duration,
    ended: false,
  };
}

// Never locks, unlike a raid vote: switching choices moves the vote instead of casting a second
// one, and choosing Stay (null) just withdraws it. Always re-selectable for as long as the
// break runs.
export function chooseBreak(b: Break, choice: string | null): Break {
  if (choice === b.myChoice) return b;
  const votes = { ...b.votes };
  if (b.myChoice) votes[b.myChoice] = Math.max(0, (votes[b.myChoice] ?? 0) - 1);
  if (choice) votes[choice] = (votes[choice] ?? 0) + 1;
  return { ...b, myChoice: choice, votes };
}

export function addBreakVotes(b: Break, votes: Record<string, number>): Break {
  const next = { ...b.votes };
  for (const [slug, count] of Object.entries(votes)) next[slug] = (next[slug] ?? 0) + count;
  return { ...b, votes: next };
}
