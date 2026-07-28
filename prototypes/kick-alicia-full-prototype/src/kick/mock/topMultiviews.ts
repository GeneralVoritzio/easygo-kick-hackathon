/*
  fake-kick: KICK has no public "trending multiview" surface — this is invented end to end, the
  same way Kick Expedition is. Every slug is one of our own 17 live channels (mock/api.ts), never
  an invented streamer, so a combo always resolves to a real, pinnable stream.
*/
export type TopMultiview = {
  id: string;
  name: string;
  slugs: string[];
  /** Other viewers with this exact combo pinned right now, mocked. */
  watching: number;
};

export const topMultiviews: TopMultiview[] = [
  { id: "slots-roulette", name: "Slots Roulette", slugs: ["tiltcabinet", "reelgoblin", "chartfairy", "spinvicar"], watching: 3200 },
  { id: "osrs-grind-night", name: "OSRS Grind Night", slugs: ["ironvow", "capequest"], watching: 1800 },
  { id: "clue-scroll-chaos", name: "Clue Scroll Chaos", slugs: ["cluecrawler", "ironvow", "capequest"], watching: 1120 },
  { id: "irl-chaos", name: "IRL Chaos", slugs: ["wanderfuse", "panfriedpaul", "vanlifevoid"], watching: 950 },
  { id: "hot-takes-hour", name: "Hot Takes Hour", slugs: ["couchsermon", "yapmerchant"], watching: 780 },
  { id: "sleep-double-feature", name: "Sleep Stream Double Feature", slugs: ["nocturnalnorm", "snoozebaron"], watching: 640 },
  { id: "gamer-variety-pack", name: "Gamer Variety Pack", slugs: ["flickgremlin", "mudbrickmage"], watching: 560 },
  { id: "cozy-corner", name: "Cozy Corner", slugs: ["notadoc", "mudbrickmage"], watching: 410 },
];
