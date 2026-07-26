/** Matched against `catalog.ts` entries by name at render time (not by a
 *  guessed id), so the sidebar can't silently point at a card that no
 *  longer exists. A deliberate mix of live and offline, since "who is
 *  live right now" is the actual point of this list. */
export const FOLLOWED_STREAMERS: { name: string; isLive: boolean }[] = [
  { name: 'maxholloway', isLive: true },
  { name: 'xQc', isLive: true },
  { name: 'Lunarix', isLive: true },
  { name: 'BLKOUT', isLive: false },
  { name: 'KAIDO', isLive: false },
  { name: 'sade_', isLive: false },
];

export interface CommunityEntry {
  id: string;
  name: string;
  icon: string;
  liveMemberCount: number;
}

/** Same "Kick World Cup" / community-flavour names used across these
 *  prototypes' mock data — not wired to a real community page here, just
 *  the at-a-glance list. */
export const COMMUNITIES: CommunityEntry[] = [
  { id: 'nova', name: "NOVA_'s Community", icon: '🟢', liveMemberCount: 214 },
  { id: 'blkout', name: "BLKOUT's Community", icon: '🔥', liveMemberCount: 58 },
  { id: 'rivit', name: "RIVIT's Community", icon: '💧', liveMemberCount: 12 },
];
