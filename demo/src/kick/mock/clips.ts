import { categories } from "./api";

export type Clip = {
  id: number;
  title: string;
  thumbnail: string;
  duration_seconds: number;
  view_count: number;
  creator_username: string;
  category: { name: string; slug: string };
  created_at: string;
};

export const CLIPS_NOW = new Date("2026-07-26T12:00:00Z");

const thumb = (seed: string) => `https://picsum.photos/seed/${seed}/640/360`;

const cat = (slug: string) => {
  const c = categories.find((x) => x.slug === slug) ?? categories[0];
  return { name: c.name, slug: c.slug };
};

export const clips: Clip[] = [
  {
    id: 1,
    title: "JAD DIED IN ONE TICK, FIRE CAPE SECURED",
    thumbnail: thumb("clip-firecape"),
    duration_seconds: 42,
    view_count: 58200,
    creator_username: "evscape",
    category: cat("old-school-runescape"),
    created_at: "2026-07-25T18:40:00Z",
  },
  {
    id: 2,
    title: "wrong world hop, lost the whole raid team",
    thumbnail: thumb("clip-worldhop"),
    duration_seconds: 28,
    view_count: 12300,
    creator_username: "clipfarm3r",
    category: cat("old-school-runescape"),
    created_at: "2026-07-23T14:10:00Z",
  },
  {
    id: 3,
    title: "chat convinced me to send it on a wildy boss, regret immediate",
    thumbnail: thumb("clip-wildyboss"),
    duration_seconds: 35,
    view_count: 21500,
    creator_username: "ratioed_again",
    category: cat("old-school-runescape"),
    created_at: "2026-07-21T20:05:00Z",
  },
  {
    id: 4,
    title: "twisted bow drop, I do not believe it",
    thumbnail: thumb("clip-tbow"),
    duration_seconds: 19,
    view_count: 94100,
    creator_username: "evscape",
    category: cat("old-school-runescape"),
    created_at: "2026-07-17T11:22:00Z",
  },
  {
    id: 5,
    title: "explaining ironman rules for the 400th time",
    thumbnail: thumb("clip-ironmanrules"),
    duration_seconds: 51,
    view_count: 8700,
    creator_username: "kekw_enjoyer",
    category: cat("just-chatting"),
    created_at: "2026-07-14T09:15:00Z",
  },
  {
    id: 6,
    title: "accidentally alched the whip, chat lost it",
    thumbnail: thumb("clip-alchwhip"),
    duration_seconds: 24,
    view_count: 33900,
    creator_username: "TurboRaccoon_",
    category: cat("old-school-runescape"),
    created_at: "2026-07-11T16:48:00Z",
  },
  {
    id: 7,
    title: "duo raid wipe because I forgot prayer",
    thumbnail: thumb("clip-raidwipe"),
    duration_seconds: 46,
    view_count: 15400,
    creator_username: "sleepygoose204",
    category: cat("old-school-runescape"),
    created_at: "2026-07-08T13:30:00Z",
  },
  {
    id: 8,
    title: "the barbarian assault queue took 40 minutes and this happened",
    thumbnail: thumb("clip-baqueue"),
    duration_seconds: 39,
    view_count: 6200,
    creator_username: "evscape",
    category: cat("old-school-runescape"),
    created_at: "2026-07-24T21:12:00Z",
  },
  {
    id: 9,
    title: "gave a random f2p player a bond, he cried",
    thumbnail: thumb("clip-bondgift"),
    duration_seconds: 33,
    view_count: 41200,
    creator_username: "vibecheckerr",
    category: cat("irl"),
    created_at: "2026-07-04T10:05:00Z",
  },
  {
    id: 10,
    title: "chat asked what rank and I lied on stream",
    thumbnail: thumb("clip-rankquestion"),
    duration_seconds: 27,
    view_count: 5100,
    creator_username: "notacop_promise",
    category: cat("just-chatting"),
    created_at: "2026-06-29T19:44:00Z",
  },
  {
    id: 11,
    title: "raid team disbanded mid fight, HCIM PANIC",
    thumbnail: thumb("clip-hcimpanic"),
    duration_seconds: 55,
    view_count: 118000,
    creator_username: "evscape",
    category: cat("old-school-runescape"),
    created_at: "2026-06-16T15:20:00Z",
  },
  {
    id: 12,
    title: "hit a 0 on the boss and rage quit for real",
    thumbnail: thumb("clip-ragequit"),
    duration_seconds: 22,
    view_count: 27600,
    creator_username: "crispymoth42",
    category: cat("old-school-runescape"),
    created_at: "2026-07-20T08:57:00Z",
  },
  {
    id: 13,
    title: "gym cameo mid stream, chat did not expect that",
    thumbnail: thumb("clip-gymcameo"),
    duration_seconds: 44,
    view_count: 19800,
    creator_username: "mid_diff_andy",
    category: cat("irl"),
    created_at: "2026-06-06T12:00:00Z",
  },
  {
    id: 14,
    title: "pet finally dropped after 3200 kc, I screamed",
    thumbnail: thumb("clip-petdrop"),
    duration_seconds: 31,
    view_count: 76300,
    creator_username: "evscape",
    category: cat("old-school-runescape"),
    created_at: "2026-07-25T07:33:00Z",
  },
];
