// The one runtime network exception: tiles and the player can embed the real
// player.kick.com, so the demo shows live motion. Each event channel maps to a
// real KICK streamer, drawn from the roster in KICK-API-CONVENTIONS.md Part 3.
// An offline channel still renders KICK's own offline player, which reads real.
// kaneljoseph, adrienbroner and deenthegreat were live when Sam checked on
// 31 July 2026, so they sit on the host and the first two pins.
const embedChannels: Record<string, string> = {
  ironvow: "kaneljoseph",
  capequest: "adrienbroner",
  flickgremlin: "deenthegreat",
  mudbrickmage: "clavicular",
  wanderfuse: "ac7ionman",
  notadoc: "nickmercs",
  reelgoblin: "roshtein",
  panfriedpaul: "suslong",
  snoozebaron: "amouranth",
};

export function embedUrlFor(slug: string, muted: boolean): string | undefined {
  const channel = embedChannels[slug];
  if (!channel) return undefined;
  return `https://player.kick.com/${channel}?autoplay=true&muted=${muted}`;
}
