import { categories, followedChannels, livestreams, type Channel } from "./api";

export type Clip = {
  id: number;
  title: string;
  thumbnail: string;
  duration_seconds: number;
  view_count: number;
  channel: Channel;
  category: { name: string; slug: string };
  created_at: string;
  clipper: string;
  start_time: number;
};

export const CLIPS_NOW = new Date("2026-07-26T12:00:00Z");

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatClipAge(createdAt: string): string {
  const diffMs = CLIPS_NOW.getTime() - new Date(createdAt).getTime();
  const diffHours = Math.floor(diffMs / 3_600_000);
  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
}

const art = import.meta.glob("../art/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const bySlug = new Map<string, Channel>(
  [...livestreams.map((stream) => stream.channel), ...followedChannels].map((c) => [c.slug, c]),
);

const chan = (slug: string) => {
  const c = bySlug.get(slug);
  if (!c) throw new Error(`No channel for ${slug}. Add it to livestreams or followedChannels.`);
  return c;
};

const cat = (slug: string) => {
  const c = categories.find((x) => x.slug === slug) ?? categories[0];
  return { name: c.name, slug: c.slug };
};

const clippers = [
  "TickManipTanya",
  "VodGoblin",
  "ClipfarmClive",
  "LurkerLoretta",
  "SecondScreenSid",
  "FrameGrabFreya",
  "ChatHistorianHal",
  "HighlightHelga",
];

const clip = (
  id: number,
  channelSlug: string,
  categorySlug: string,
  title: string,
  duration_seconds: number,
  view_count: number,
  created_at: string,
): Clip => ({
  id,
  title,
  thumbnail: art[`../art/thumb-${categorySlug}-${(id % 3) + 1}.svg`] ?? "",
  duration_seconds,
  view_count,
  channel: chan(channelSlug),
  category: cat(categorySlug),
  created_at,
  clipper: clippers[id % clippers.length],
  // The clock time of the clip stands in for its offset in the stream, so no row carries a second date.
  start_time: new Date(created_at).getUTCMinutes() * 60 + new Date(created_at).getUTCSeconds(),
});

export const clips: Clip[] = [
  clip(1, "ironvow", "old-school-runescape", "JAD DIED IN ONE TICK, FIRE CAPE SECURED", 42, 58200, "2026-07-25T18:40:00Z"),
  clip(2, "capequest", "old-school-runescape", "wrong world hop, lost the whole raid team", 28, 12300, "2026-07-23T14:10:00Z"),
  clip(3, "ironvow", "old-school-runescape", "chat convinced me to send it on a wildy boss, regret immediate", 35, 21500, "2026-07-21T20:05:00Z"),
  clip(4, "ironvow", "old-school-runescape", "twisted bow drop, I do not believe it", 19, 94100, "2026-07-17T11:22:00Z"),
  clip(5, "notadoc", "just-chatting", "explaining ironman rules for the 400th time", 51, 8700, "2026-07-14T09:15:00Z"),
  clip(6, "capequest", "old-school-runescape", "accidentally alched the whip, chat lost it", 24, 33900, "2026-07-11T16:48:00Z"),
  clip(7, "ironvow", "old-school-runescape", "duo raid wipe because I forgot prayer", 46, 15400, "2026-07-08T13:30:00Z"),
  clip(8, "ironvow", "old-school-runescape", "the barbarian assault queue took 40 minutes and this happened", 39, 6200, "2026-07-24T21:12:00Z"),
  clip(9, "wanderfuse", "irl", "gave a random stranger a bond, he cried", 33, 41200, "2026-07-04T10:05:00Z"),
  clip(10, "notadoc", "just-chatting", "chat asked what rank and I lied on stream", 27, 5100, "2026-06-29T19:44:00Z"),
  clip(11, "ironvow", "old-school-runescape", "raid team disbanded mid fight, HCIM PANIC", 55, 118000, "2026-06-16T15:20:00Z"),
  clip(12, "capequest", "old-school-runescape", "hit a 0 on the boss and rage quit for real", 22, 27600, "2026-07-20T08:57:00Z"),
  clip(13, "panfriedpaul", "irl", "gym cameo mid stream, chat did not expect that", 44, 19800, "2026-06-06T12:00:00Z"),
  clip(14, "ironvow", "old-school-runescape", "pet finally dropped after 3200 kc, I screamed", 31, 76300, "2026-07-25T07:33:00Z"),
  clip(15, "reelgoblin", "slots-casino", "max win on the last spin of the balance", 47, 132400, "2026-07-25T22:18:00Z"),
  clip(16, "tiltcabinet", "slots-casino", "bonus buy number 11 finally pays for the other ten", 36, 64800, "2026-07-22T23:41:00Z"),
  clip(17, "mudbrickmage", "minecraft", "the worst base in the world collapses on camera", 29, 38700, "2026-07-24T15:26:00Z"),
  clip(18, "flickgremlin", "counter-strike-2", "1v5 clutch with a pistol and no armour", 41, 87500, "2026-07-23T19:03:00Z"),
  clip(19, "snoozebaron", "just-sleeping", "day 3 of the sleep stream and the alarm went off", 25, 45900, "2026-07-24T04:12:00Z"),
  clip(20, "chartfairy", "gakuen-idolmaster", "perfect combo on the hardest chart, hands shaking", 38, 9400, "2026-07-26T02:55:00Z"),
  clip(21, "panfriedpaul", "irl", "chat picked the meal and I regret every bite", 52, 23100, "2026-07-19T17:37:00Z"),
  clip(22, "nocturnalnorm", "just-sleeping", "woke up to 40 thousand people watching", 21, 71200, "2026-07-26T06:09:00Z"),
  clip(23, "couchsenate", "slots-casino", "the balance hit seven figures and nobody breathed", 50, 65400, "2026-07-01T12:00:00Z"),
  clip(24, "couchsenate", "just-chatting", "a rare sensible take, live on the couch", 50, 32900, "2026-06-14T12:00:00Z"),
  clip(25, "couchsenate", "slots-casino", "the weekly stream ends the only way it can", 60, 27100, "2026-05-02T12:00:00Z"),
  clip(26, "charcoalchef", "irl", "the smoke alarm becomes a bit", 42, 19400, "2026-06-30T12:00:00Z"),
  clip(27, "charcoalchef", "irl", "chat orders the worst possible topping", 55, 12200, "2026-05-11T12:00:00Z"),
  clip(28, "midnightden", "slots-casino", "the den has never been louder", 48, 88300, "2026-07-02T12:00:00Z"),
  clip(29, "midnightden", "slots-casino", "balance goes up, den goes feral", 31, 44100, "2026-06-08T12:00:00Z"),
];
