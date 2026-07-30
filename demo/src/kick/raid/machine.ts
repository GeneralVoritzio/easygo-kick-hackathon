import { recommendationsFor, showdownCandidates, type Candidate } from "../mock/raids";

// Invented surface, named as if KICK's engineers built it. The state below is what these
// would carry:
//   fake-kick POST   /public/v1/raids
//   fake-kick GET    /public/v1/raids/recommendations
//   fake-kick POST   /public/v1/raids/{raid_id}/votes
//   fake-kick POST   /public/v1/raids/{raid_id}/showdown/entries/{slug}/accept
//   fake-kick DELETE /public/v1/raids/{raid_id}
//   fake-kick raid.started, raid.vote.opened, raid.vote.closed, raid.showdown.entry.declined,
//   fake-kick raid.showdown.abandoned, raid.completed, raid.cancelled
//   scopes raids:read and raids:write

export const TIMING = {
  countdown: 15,
  chatPreview: 30,
  showdownBrowse: 20,
  showdownTile: 30,
  pitch: 60,
  accept: 20,
  vote: 20,
  // The roulette reel's own spin (4.2s) plus its landed hold (0.9s), Section 5.1: long enough
  // that the reel always finishes landing before this phase's own timer advances it on.
  rouletteReveal: 6,
};

export const MIN_HOST_VIEWERS = 5;

export type RaidMode = "random" | "pick" | "chat" | "showdown";

export type Phase =
  | "preview"
  | "vote"
  | "showdown-browse"
  | "showdown-accept"
  | "showdown-pitch"
  | "reveal"
  | "countdown"
  | "landed"
  | "cancelled";

export type Poll = {
  round: 1 | 2;
  picks: number;
  slot?: number;
  options: string[];
  votes: Record<string, number>;
  myVote?: string;
};

export type Raid = {
  mode: RaidMode;
  phase: Phase;
  seconds: number;
  hostSlug: string;
  hostViewers: number;
  // On the viewer side the streamer's own decisions arrive on a script, so the panel hides
  // the streamer controls.
  viewer: boolean;
  candidates: Candidate[];
  featured: string[];
  previewIndex: number;
  stage?: string;
  poll?: Poll;
  finalists: string[];
  accepted: string[];
  pitchIndex: number;
  targetSlug?: string;
  note?: string;
};

export const candidateFor = (raid: Raid, slug: string) =>
  raid.candidates.find((c) => c.stream.channel.slug === slug);

const viewersOf = (raid: Raid, slug: string) => candidateFor(raid, slug)?.stream.viewer_count ?? 0;

const slugsOf = (candidates: Candidate[]) => candidates.map((c) => c.stream.channel.slug);

const feature = (raid: Raid, slugs: string[]) => [...new Set([...raid.featured, ...slugs])];

const openPoll = (round: 1 | 2, options: string[], picks: number, slot?: number): Poll => ({
  round,
  picks,
  slot,
  options,
  votes: Object.fromEntries(options.map((o) => [o, 0])),
});

// Section 5.3: a tie goes to the candidate with fewer viewers.
function ranked(raid: Raid, poll: Poll) {
  return [...poll.options].sort(
    (a, b) => poll.votes[b] - poll.votes[a] || viewersOf(raid, a) - viewersOf(raid, b),
  );
}

export type RaidStart = {
  mode: RaidMode;
  hostSlug: string;
  hostViewers: number;
  pickedSlug?: string;
  pickedSlugs?: string[];
  viewer?: boolean;
};

// Section 4.4: the streamer curates who is in play for Chat pick (3) and showdown (2) from
// the browse dialog. That replaces the old auto-top-N selection, it does not add a step.
export function startRaid({
  mode,
  hostSlug,
  hostViewers,
  pickedSlug,
  pickedSlugs,
  viewer,
}: RaidStart): Raid {
  const all = recommendationsFor(hostSlug, hostViewers);
  const candidates = mode === "showdown" ? showdownCandidates(all) : all;
  const base: Raid = {
    mode,
    phase: "countdown",
    seconds: TIMING.countdown,
    hostSlug,
    hostViewers,
    viewer: Boolean(viewer),
    candidates,
    featured: [],
    previewIndex: 0,
    finalists: [],
    accepted: [],
    pitchIndex: 0,
  };

  if (mode === "random") {
    // The dialog's roulette already rolled the winner and animated the reel onto it, so a
    // pickedSlug here is that same winner, not a second, silent roll. The chat side gets its
    // own reveal phase so viewers see the same roulette land, not just a done deal.
    const roll = pickedSlug
      ? (candidateFor(base, pickedSlug) ?? candidates[0])
      : candidates[Math.floor(Math.random() * Math.min(10, candidates.length))];
    return {
      ...base,
      phase: "reveal",
      seconds: TIMING.rouletteReveal,
      targetSlug: roll.stream.channel.slug,
      featured: [roll.stream.channel.slug],
    };
  }
  if (mode === "pick") {
    // Section 13: on the viewer side nobody is browsing a candidate list to pick from, so the
    // streamer's choice is simulated the same way their other decisions are, standing in with
    // their top recommendation rather than leaving the raid with no target at all.
    const target = pickedSlug ? candidateFor(base, pickedSlug) : candidates[0];
    return {
      ...base,
      targetSlug: target?.stream.channel.slug,
      featured: target ? [target.stream.channel.slug] : [],
    };
  }
  if (mode === "chat") {
    const three = pickedSlugs && pickedSlugs.length === 3 ? pickedSlugs : slugsOf(candidates.slice(0, 3));
    return {
      ...base,
      phase: "preview",
      seconds: TIMING.chatPreview,
      stage: three[0],
      featured: three,
    };
  }
  // Section 4.4: the streamer curates the pool of 6 in the dialog. That pool becomes the
  // raid's whole candidate set, so the player grid, the vote, and the pitch only ever consider
  // streamers the streamer actually chose, not a wider auto-picked list.
  const pool =
    pickedSlugs && pickedSlugs.length === 6
      ? (pickedSlugs.map((slug) => candidateFor(base, slug)).filter(Boolean) as Candidate[])
      : candidates.slice(0, 6);
  return {
    ...base,
    candidates: pool,
    phase: "showdown-browse",
    seconds: TIMING.showdownBrowse,
    featured: slugsOf(pool),
  };
}

function closeVote(raid: Raid): Raid {
  const poll = raid.poll!;
  const order = ranked(raid, poll);

  // Section 5.3: a vote already is the reveal, so the winner goes straight to the countdown
  // instead of a second, unneeded random-picker animation on top of a result chat just decided.
  if (poll.round === 2 || raid.mode === "chat") {
    return { ...raid, phase: "countdown", seconds: TIMING.countdown, targetSlug: order[0], poll: undefined };
  }
  if (poll.slot === undefined) {
    return {
      ...raid,
      phase: "showdown-accept",
      seconds: TIMING.accept,
      finalists: order.slice(0, poll.picks),
      poll: undefined,
    };
  }
  const finalists = [...raid.finalists];
  finalists[poll.slot] = order[0];
  return {
    ...raid,
    phase: "showdown-accept",
    seconds: TIMING.accept,
    finalists,
    featured: feature(raid, [order[0]]),
    poll: undefined,
  };
}

// A finalist who says nothing has not agreed, so the accept timer treats silence as a decline.
function closeAccept(raid: Raid): Raid {
  const accepted = raid.finalists.filter((slug) => raid.accepted.includes(slug));
  if (accepted.length === raid.finalists.length) {
    return {
      ...raid,
      phase: "showdown-pitch",
      pitchIndex: 0,
      stage: raid.finalists[0],
      seconds: TIMING.pitch,
    };
  }
  if (accepted.length === 1) return walkover(raid, accepted[0]);
  return {
    ...raid,
    phase: "cancelled",
    seconds: 0,
    note: "Nobody accepted the showdown. Pick someone else.",
  };
}

// One finalist left standing means there is nothing to pitch against, so they take the raid. Chat is
// told why, because Section 9 forbids a silent substitution.
function walkover(raid: Raid, winnerSlug: string): Raid {
  const name = (slug: string) => candidateFor(raid, slug)?.stream.channel.username ?? slug;
  const other = raid.finalists.find((slug) => slug !== winnerSlug);
  return {
    ...raid,
    phase: "countdown",
    seconds: TIMING.countdown,
    targetSlug: winnerSlug,
    finalists: [winnerSlug],
    poll: undefined,
    note: other
      ? `${name(other)} turned the showdown down, so ${name(winnerSlug)} takes the raid.`
      : `${name(winnerSlug)} takes the raid.`,
  };
}

export function advance(raid: Raid): Raid {
  switch (raid.phase) {
    case "preview": {
      const order = slugsOf(raid.candidates.slice(0, 3));
      const next = raid.previewIndex + 1;
      if (next < order.length)
        return { ...raid, previewIndex: next, stage: order[next], seconds: TIMING.chatPreview };
      return {
        ...raid,
        phase: "vote",
        stage: undefined,
        seconds: TIMING.vote,
        poll: openPoll(1, order, 1),
      };
    }
    case "showdown-browse":
      // A tile's own preview timer expiring just returns to the grid, with the browse timer
      // restarted. The browse timer itself expiring opens the vote.
      return raid.stage
        ? { ...raid, stage: undefined, seconds: TIMING.showdownBrowse }
        : openShowdownVote(raid);
    case "vote":
      return closeVote(raid);
    case "showdown-accept":
      return closeAccept(raid);
    case "showdown-pitch": {
      const next = raid.pitchIndex + 1;
      if (next < raid.finalists.length)
        return { ...raid, pitchIndex: next, stage: raid.finalists[next], seconds: TIMING.pitch };
      return {
        ...raid,
        phase: "vote",
        stage: undefined,
        seconds: TIMING.vote,
        poll: openPoll(2, raid.finalists, 1),
      };
    }
    case "reveal":
      return { ...raid, phase: "countdown", seconds: TIMING.countdown };
    case "countdown":
      return { ...raid, phase: "landed", seconds: 0 };
    default:
      return raid;
  }
}

// Section 5.3: a vote locks once cast.
export function castVote(raid: Raid, slug: string): Raid {
  const poll = raid.poll;
  if (!poll || poll.myVote || !poll.options.includes(slug)) return raid;
  return {
    ...raid,
    poll: { ...poll, myVote: slug, votes: { ...poll.votes, [slug]: poll.votes[slug] + 1 } },
  };
}

export function addChatVotes(raid: Raid, votes: Record<string, number>): Raid {
  const poll = raid.poll;
  if (!poll) return raid;
  const next = { ...poll.votes };
  for (const [slug, count] of Object.entries(votes)) next[slug] = (next[slug] ?? 0) + count;
  return { ...raid, poll: { ...poll, votes: next } };
}

export function openShowdownVote(raid: Raid): Raid {
  const options = slugsOf(raid.candidates.slice(0, 6));
  return {
    ...raid,
    phase: "vote",
    stage: undefined,
    seconds: TIMING.vote,
    poll: openPoll(1, options, 2),
  };
}

export const playTile = (raid: Raid, slug: string): Raid => ({
  ...raid,
  stage: slug,
  seconds: TIMING.showdownTile,
});

export function acceptEntry(raid: Raid, slug: string): Raid {
  if (raid.phase !== "showdown-accept" || !raid.finalists.includes(slug)) return raid;
  return { ...raid, accepted: [...new Set([...raid.accepted, slug])] };
}

// fake-kick raid.showdown.entry.declined. The other finalist takes the raid, and if both decline the
// showdown is abandoned rather than reassigned.
export function declineEntry(raid: Raid, slug: string): Raid {
  if (raid.phase !== "showdown-accept" || !raid.finalists.includes(slug)) return raid;
  const remaining = raid.finalists.filter((s) => s !== slug);
  if (remaining.length === 1) return walkover(raid, remaining[0]);
  return {
    ...raid,
    phase: "cancelled",
    seconds: 0,
    note: "Both finalists turned the showdown down. Pick someone else.",
  };
}

// Section 9: never a silent substitution. Offline mid-countdown cancels, offline mid-vote
// removes the candidate and voids its votes.
export function channelOffline(raid: Raid, slug: string): Raid {
  if (raid.phase === "countdown" && raid.targetSlug === slug) {
    return {
      ...raid,
      phase: "cancelled",
      seconds: 0,
      note: "The target went offline. Pick someone else.",
    };
  }
  const poll = raid.poll;
  if (!poll || !poll.options.includes(slug)) return raid;
  const options = poll.options.filter((o) => o !== slug);
  const votes = { ...poll.votes };
  delete votes[slug];
  return {
    ...raid,
    poll: { ...poll, options, votes, myVote: poll.myVote === slug ? undefined : poll.myVote },
    candidates: raid.candidates.filter((c) => c.stream.channel.slug !== slug),
  };
}
