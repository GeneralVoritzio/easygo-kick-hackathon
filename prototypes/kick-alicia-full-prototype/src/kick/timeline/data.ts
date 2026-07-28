import { formatDuration, livestreams, profileFor, type Livestream } from "../mock/api";
import { chatters, chatLines, chatHypeLines } from "../mock/chatIdentities";

/*
  Per-channel timeline data. kick-timeline-with-recap hand-authored one streamer's storyline
  (a raid, two polls, a gift train, three category changes). This generalises the same shape
  (buckets, markers, hype, moments, a searchable chat log) to any of the site's live channels,
  seeded off the channel's own slug so a given channel always regenerates the same stream.

  The rail only ever covers the last WINDOW_SECONDS of a stream, the same thing the source's
  own invented fake-kick GET /public/v1/timelines/{id}/window stands for. Every local time value
  (bucket.t, marker offsets, moment.t) is relative to the window's own start, not to the real
  stream.started_at, which can be days in the past in the mock data.
*/

export const BUCKET_SECONDS = 15;
export const WINDOW_SECONDS = 4 * 3600;

export type Bucket = {
  t: number;
  viewer_count: number;
  messages_count: number;
  follows_count: number;
  subscriptions_count: number;
  kicks_amount: number;
  hype_score: number;
};

export type MomentGroup =
  | "peak"
  | "clip"
  | "raid"
  | "kicks"
  | "poll"
  | "category_change"
  | "search_moment"
  | "search_chat"
  | "bookmark";

export type Moment = {
  id: string;
  group: MomentGroup;
  label: string;
  t: number;
  center?: number;
  duration?: number;
  view_count?: number;
  title: string;
  byline: string;
  viewer_count: number;
  hype: number;
  reactions_count: number;
  has_reacted?: boolean;
};

export type ChatLogEntry = { id: string; t: number; username: string; content: string };

const GROUP_LABEL: Record<MomentGroup, string> = {
  peak: "Peak",
  clip: "Clip",
  raid: "Raid",
  kicks: "Gift",
  poll: "Poll",
  category_change: "Category",
  search_moment: "Search",
  search_chat: "Chat",
  bookmark: "Bookmark",
};

// What the recorder flagged in the reaction right after each surge, grouped by what caused the
// surge so the title reads like it's actually about that moment. Several in every group mention
// dying on purpose: it is the single most common thing a viewer searches a stream for, and
// kick-timeline-with-recap's own mock clip titles ("Dies to an AWP flick through smoke", "Dies
// in a fireball missing the ramp") leaned on it the same way, so a plain "dies" query, or "@chat
// dies", always turns up something to find.
const CLIP_TITLES: Record<"raid" | "poll" | "kicks" | "peak", string[]> = {
  raid: [
    "Dies mid raid-shoutout, chat is not okay",
    "Almost dies reading the raid message out loud",
    "The raid reaction",
    "Welcomes the raiders, dies two seconds later",
  ],
  poll: [
    "Dies immediately after the poll picks it",
    "The poll result nobody expected",
    "Chat's pick backfires and he dies instantly",
    "Reading the poll result out loud",
  ],
  kicks: [
    "Dies mid sentence reading the gift message",
    "Reading the kicks message",
    "The reaction to the gift",
    "Nearly dies laughing at the donation message",
  ],
  peak: [
    "Dies to the dumbest possible thing",
    "Chat goes feral, he dies right after",
    "Nearly dies, chat panics",
    "Dies right after saying he wouldn't",
    "Clean clear until he dies at the last second",
    "That was way too close",
  ],
};

// Every moment group carries a glyph, so the rail's notches and the Highlights panel's badges
// read the same icon for the same kind of point. `icons.ts` (Step 2) added the five KICK holds
// none of.
export const GROUP_ICON: Record<MomentGroup, string> = {
  peak: "peak",
  clip: "clip",
  raid: "raid",
  kicks: "gift",
  poll: "poll",
  category_change: "category_change",
  search_moment: "search",
  search_chat: "chatters",
  bookmark: "bookmark",
};

function seededRng(seedText: string) {
  let seed = 0;
  for (let i = 0; i < seedText.length; i++) seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  if (seed === 0) seed = 0x5f3c21;
  return function rnd() {
    seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function makePicker(rnd: () => number) {
  return {
    rint: (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1)),
    pick: <T,>(list: T[]) => list[Math.floor(rnd() * list.length)],
  };
}

// A KICK handle is camel case as often as it is split by a separator: ClutchGoblin reads as
// CG, not CL. A capital after the first letter wins, then a separator, then the first two.
export function initials(name: string) {
  const letters = name.replace(/[^A-Za-z]/g, "");
  if (!letters) return "??";
  const capital = letters.slice(1).match(/[A-Z]/);
  if (capital) return (letters[0] + capital[0]).toUpperCase();
  const words = name.split(/[^A-Za-z]+/).filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  return letters.slice(0, 2).toUpperCase();
}

type Surge = { at: number; peak: number; rise: number; decay: number; mult: number };

function surgeAt(t: number, surges: Surge[]) {
  let add = 0;
  let mult = 1;
  for (const s of surges) {
    const d = t - s.at;
    if (d < -s.rise || d > s.decay * 2.2) continue;
    const f = d < 0 ? 1 - -d / s.rise : Math.exp(-d / s.decay);
    if (f <= 0) continue;
    add += s.peak * f;
    mult = Math.max(mult, 1 + (s.mult - 1) * f);
  }
  return { add, mult };
}

function buildBuckets(baseline: number, windowLen: number, surges: Surge[], rnd: () => number) {
  const rows: Bucket[] = [];
  const n = Math.floor(windowLen / BUCKET_SECONDS) + 1;
  for (let i = 0; i < n; i++) {
    const t = i * BUCKET_SECONDS;
    const sg = surgeAt(t, surges);
    const wobble = 1 + Math.sin(t / 260) * 0.05 + (rnd() - 0.5) * 0.05;
    const viewers = Math.max(1, Math.round((baseline + sg.add) * wobble));
    const perMinute = (viewers / 100) * 1.8 * sg.mult * (0.82 + rnd() * 0.36);
    let kicks = 0;
    if (rnd() < (viewers / 180000) * sg.mult * 3) {
      kicks = [100, 100, 200, 250, 300, 500, 500, 1000, 2000][Math.floor(rnd() * 9)];
    }
    rows.push({
      t,
      viewer_count: viewers,
      messages_count: Math.max(0, Math.round(perMinute * (BUCKET_SECONDS / 60))),
      follows_count:
        rnd() < (viewers / 90000) * sg.mult * 3
          ? Math.max(1, Math.round(rnd() * 2 * sg.mult))
          : 0,
      subscriptions_count:
        rnd() < (viewers / 260000) * sg.mult * 3
          ? Math.max(1, Math.round(rnd() * 1.5 * sg.mult))
          : 0,
      kicks_amount: kicks,
      hype_score: 0,
    });
  }
  return rows;
}

function computeHype(rows: Bucket[]) {
  let maxM = 1;
  let maxF = 1;
  let maxS = 1;
  let maxK = 1;
  for (const r of rows) {
    maxM = Math.max(maxM, r.messages_count);
    maxF = Math.max(maxF, r.follows_count);
    maxS = Math.max(maxS, r.subscriptions_count);
    maxK = Math.max(maxK, r.kicks_amount);
  }
  const raw = rows.map(
    (r) =>
      0.45 * (r.messages_count / maxM) +
      0.15 * (r.follows_count / maxF) +
      0.15 * (r.subscriptions_count / maxS) +
      0.25 * (r.kicks_amount / maxK),
  );
  let top = 0.0001;
  const smoothed = rows.map((_, i) => {
    const a = raw[Math.max(0, i - 1)];
    const b = raw[i];
    const c = raw[Math.min(raw.length - 1, i + 1)];
    const v = (a + b * 2 + c) / 4;
    top = Math.max(top, v);
    return v;
  });
  rows.forEach((r, i) => {
    r.hype_score = Math.round((smoothed[i] / top) * 1000) / 10;
  });
}

function bucketAt(buckets: Bucket[], t: number) {
  const i = Math.max(0, Math.min(buckets.length - 1, Math.round(t / BUCKET_SECONDS)));
  return buckets[i];
}

function findPeaks(buckets: Bucket[], minGap: number, limit: number) {
  const values = buckets.map((r) => r.hype_score);
  const sorted = values.slice().sort((a, b) => a - b);
  const cut = sorted[Math.floor(sorted.length * 0.9)] || 0;
  const found: { t: number; value: number }[] = [];
  for (let i = 2; i < values.length - 2; i++) {
    if (values[i] <= cut) continue;
    if (
      values[i] >= values[i - 1] &&
      values[i] >= values[i + 1] &&
      values[i] > values[i - 2] &&
      values[i] > values[i + 2]
    ) {
      found.push({ t: i * BUCKET_SECONDS, value: values[i] });
    }
  }
  found.sort((a, b) => b.value - a.value);
  const out: { t: number; value: number }[] = [];
  for (const c of found) {
    if (out.some((o) => Math.abs(o.t - c.t) < minGap)) continue;
    if (out.length < limit) out.push(c);
  }
  return out;
}

function reactionsAt(buckets: Bucket[], t: number) {
  const row = bucketAt(buckets, t);
  return Math.round(row.viewer_count * (row.hype_score / 100) * 0.12);
}

export type Timeline = {
  stream: Livestream;
  windowStart: number;
  windowLen: number;
  buckets: Bucket[];
  moments: Moment[];
  categoryChanges: CategoryChange[];
  chatLog: ChatLogEntry[];
  joinedAt: number;
  bucketAt: (t: number) => Bucket;
  nearest: (t: number, windowSeconds: number, extra?: Moment[]) => Moment | null;
  missed: (joinedAt: number, limit: number) => Moment[];
  byGroup: (group: MomentGroup | "all") => Moment[];
};

export type CategoryChange = { t: number; toName: string; toSlug: string };

function buildMarkersAndMoments(
  stream: Livestream,
  windowLen: number,
  buckets: Bucket[],
  rnd: () => number,
) {
  const { rint, pick } = makePicker(rnd);
  const moments: Moment[] = [];
  const categoryChanges: CategoryChange[] = [];
  let seq = 0;
  const nextId = (prefix: string) => `${prefix}_${stream.channel.slug}_${seq++}`;

  const surgeCount = rint(4, 7);
  const surgeTs: number[] = [];
  for (let i = 0; i < surgeCount; i++) {
    const t = Math.round(((i + 0.5) / surgeCount) * windowLen + rint(-600, 600));
    surgeTs.push(Math.max(300, Math.min(windowLen - 300, t)));
  }

  const others = livestreams.filter((s) => s.channel.slug !== stream.channel.slug);
  const cycle: MomentGroup[] = ["raid", "poll", "kicks", "peak"];

  surgeTs.forEach((t) => {
    // A random pick per surge, not a strict rotation, so two channels with the same surge
    // count still read as different streams rather than the same four beats replayed.
    const group = pick(cycle);
    const row = bucketAt(buckets, t);
    const gifter = pick(chatters);

    if (group === "raid" && others.length) {
      const source = pick(others);
      const gained = Math.round(row.viewer_count * (0.3 + rnd() * 0.5));
      moments.push({
        id: nextId("raid"),
        group: "raid",
        label: GROUP_LABEL.raid,
        t,
        title: `Raid from ${source.channel.username}`,
        byline: `${gained.toLocaleString()} viewers arrived`,
        viewer_count: row.viewer_count,
        hype: row.hype_score,
        reactions_count: reactionsAt(buckets, t),
      });
    } else if (group === "poll") {
      const options = [
        ["Keep going, no excuses", 0.55],
        ["Switch it up", 0.3],
        ["Chat's call, whatever wins", 0.15],
      ] as const;
      const winner = options[0][0];
      moments.push({
        id: nextId("poll"),
        group: "poll",
        label: GROUP_LABEL.poll,
        t,
        title: "Chat picks the next segment",
        byline: `Chat picked: ${winner}`,
        viewer_count: row.viewer_count,
        hype: row.hype_score,
        reactions_count: reactionsAt(buckets, t),
      });
    } else if (group === "kicks" && rnd() < 0.5) {
      const amount = pick([500, 1000, 2000, 5000]);
      moments.push({
        id: nextId("kicks"),
        group: "kicks",
        label: GROUP_LABEL.kicks,
        t,
        title: `${amount.toLocaleString()} kicks from ${gifter.username}`,
        byline: `"worth every cent, ${stream.channel.username}"`,
        viewer_count: row.viewer_count,
        hype: row.hype_score,
        reactions_count: reactionsAt(buckets, t),
      });
    } else if (group === "kicks") {
      const giftees = rint(5, 30);
      moments.push({
        id: nextId("milestone"),
        group: "kicks",
        label: GROUP_LABEL.kicks,
        t,
        title: `Sub train, ${giftees} subs in 90s`,
        byline: `${giftees} subs gifted by ${gifter.username}`,
        viewer_count: row.viewer_count,
        hype: row.hype_score,
        reactions_count: reactionsAt(buckets, t),
      });
    } else {
      moments.push({
        id: nextId("peak"),
        group: "peak",
        label: GROUP_LABEL.peak,
        t,
        title: "Chat went off",
        byline: `${Math.round(row.messages_count * (60 / BUCKET_SECONDS)).toLocaleString()} messages a minute`,
        viewer_count: row.viewer_count,
        hype: row.hype_score,
        reactions_count: reactionsAt(buckets, t),
      });
    }

    // A clip shortly after each surge, the way the source's recorder flags the reaction to it.
    const clipT = Math.min(windowLen - 30, t + rint(30, 90));
    const clipRow = bucketAt(buckets, clipT);
    const byBroadcaster = rnd() < 0.5;
    const clipper = byBroadcaster ? stream.channel.username : gifter.username;
    const clipGroup = group === "raid" || group === "poll" || group === "kicks" ? group : "peak";
    moments.push({
      id: nextId("clip"),
      group: "clip",
      label: GROUP_LABEL.clip,
      t: clipT,
      duration: rint(20, 55),
      view_count: Math.round(clipRow.viewer_count * (2 + rnd() * 6)),
      title: pick(CLIP_TITLES[clipGroup]),
      byline: `Clipped by ${clipper}`,
      viewer_count: clipRow.viewer_count,
      hype: clipRow.hype_score,
      reactions_count: reactionsAt(buckets, clipT),
    });
  });

  const profile = profileFor(stream.channel.slug);
  if (profile && profile.recent_categories.length > 1) {
    // One switch for a two-category channel, up to two for a channel with a third to bounce
    // to and back from.
    const swings = profile.recent_categories.length > 2 && rnd() < 0.6 ? 2 : 1;
    const fractions = swings === 2 ? [0.3, 0.65] : [0.4];
    fractions.forEach((frac, i) => {
      const t = Math.round(windowLen * frac + rint(-300, 300));
      const to = profile.recent_categories[(i % (profile.recent_categories.length - 1)) + 1];
      const impactUp = rnd() < 0.5;
      moments.push({
        id: nextId("category"),
        group: "category_change",
        label: GROUP_LABEL.category_change,
        t,
        title: `Switched to ${to.name}`,
        byline: `${impactUp ? "Viewers up" : "Viewers down"} ${rint(4, 22)}% in the next 10 minutes`,
        viewer_count: bucketAt(buckets, t).viewer_count,
        hype: bucketAt(buckets, t).hype_score,
        reactions_count: 0,
      });
      categoryChanges.push({ t, toName: to.name, toSlug: to.slug });
    });
  }

  findPeaks(buckets, 240, 10).forEach((p) => {
    const covered = moments.some((m) => Math.abs(m.t - p.t) < 180);
    if (!covered) {
      const row = bucketAt(buckets, p.t);
      moments.push({
        id: nextId("peak"),
        group: "peak",
        label: GROUP_LABEL.peak,
        t: p.t,
        title: "Chat went off",
        byline: `${Math.round(row.messages_count * (60 / BUCKET_SECONDS)).toLocaleString()} messages a minute`,
        viewer_count: row.viewer_count,
        hype: row.hype_score,
        reactions_count: reactionsAt(buckets, p.t),
      });
    }
  });

  moments.sort((a, b) => a.t - b.t);
  categoryChanges.sort((a, b) => a.t - b.t);
  return { moments, categoryChanges };
}

function buildChatLog(buckets: Bucket[], rnd: () => number) {
  const { pick, rint } = makePicker(rnd);
  const log: ChatLogEntry[] = [];
  let seq = 0;
  buckets.forEach((r) => {
    if (r.messages_count <= 0) return;
    const pool = r.hype_score > 70 ? chatHypeLines : chatLines;
    const n = Math.min(3, r.messages_count);
    for (let i = 0; i < n; i++) {
      log.push({
        id: `chat_${seq++}`,
        t: r.t + rint(0, BUCKET_SECONDS - 1),
        username: pick(chatters).username,
        content: pick(pool),
      });
    }
  });
  log.sort((a, b) => a.t - b.t);
  return log;
}

const cache = new Map<string, Timeline>();

export function getTimeline(stream: Livestream): Timeline {
  const cached = cache.get(stream.channel.slug);
  if (cached) return cached;

  const rnd = seededRng(stream.channel.slug);
  const { rint } = makePicker(rnd);
  const elapsedSeconds = Math.max(0, (Date.now() - new Date(stream.started_at).getTime()) / 1000);
  const windowLen = Math.max(600, Math.min(WINDOW_SECONDS, elapsedSeconds || WINDOW_SECONDS));
  const windowStart = Math.max(0, elapsedSeconds - windowLen);

  const surgeCount = rint(2, 4);
  const surges: Surge[] = Array.from({ length: surgeCount }, (_, i) => ({
    at: Math.max(300, Math.min(windowLen - 300, Math.round(((i + 0.5) / surgeCount) * windowLen))),
    peak: stream.viewer_count * (0.15 + rnd() * 0.45),
    rise: rint(40, 90),
    decay: rint(400, 1400),
    mult: 1.5 + rnd() * 2,
  }));

  const buckets = buildBuckets(stream.viewer_count, windowLen, surges, rnd);
  computeHype(buckets);
  const { moments, categoryChanges } = buildMarkersAndMoments(stream, windowLen, buckets, rnd);
  const chatLog = buildChatLog(buckets, rnd);
  const joinedAt = Math.round(windowLen * (0.15 + rnd() * 0.35));

  const timeline: Timeline = {
    stream,
    windowStart,
    windowLen,
    buckets,
    moments,
    categoryChanges,
    chatLog,
    joinedAt,
    bucketAt: (t) => bucketAt(buckets, t),
    nearest: (t, windowSeconds, extra = []) => {
      let best: Moment | null = null;
      let bestGap = Infinity;
      for (const m of moments.concat(extra)) {
        const gap = Math.abs(m.t - t);
        if (gap <= windowSeconds && gap < bestGap) {
          best = m;
          bestGap = gap;
        }
      }
      return best;
    },
    missed: (joined, limit) =>
      moments
        .filter((m) => m.t < joined && m.group !== "category_change")
        .sort((a, b) => b.hype - a.hype)
        .slice(0, limit)
        .sort((a, b) => a.t - b.t),
    byGroup: (group) => (group === "all" ? moments : moments.filter((m) => m.group === group)),
  };

  cache.set(stream.channel.slug, timeline);
  return timeline;
}

export const SHARE_PAD_SECONDS = 20;

/*
  Every point on the rail opens the clip viewer, not only a recorded clip: a point with
  nothing recorded on it gets one built on the spot, a 40 second window centred on wherever
  the pointer was. `near`, if given, lends its title/byline/label so the viewer still reads as
  about something rather than a bare timestamp. Ported from kick-timeline-with-recap/js/clip.js.
*/
export function fromPoint(timeline: Timeline, t: number, near?: Moment | null): Moment {
  const centre = Math.round(near ? near.t : t);
  const row = timeline.bucketAt(centre);
  return {
    id: `preview_${Math.round(centre)}`,
    group: "clip",
    center: centre,
    label: near ? near.label : "Preview",
    t: Math.max(0, centre - SHARE_PAD_SECONDS),
    duration: SHARE_PAD_SECONDS * 2,
    view_count: row.viewer_count,
    title: near ? near.title : "Stream preview",
    byline: near ? near.byline : `${formatDuration(centre)} into the stream`,
    viewer_count: row.viewer_count,
    hype: row.hype_score,
    reactions_count: 0,
  };
}

export function categoryAt(timeline: Timeline, t: number) {
  let current = { name: timeline.stream.category.name, slug: timeline.stream.category.slug };
  for (const change of timeline.categoryChanges) {
    if (change.t <= t) current = { name: change.toName, slug: change.toSlug };
  }
  return current;
}
