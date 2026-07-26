interface MetallicTier {
  base: string;
  highlight: string;
  shadow: string;
}

/** Metallic tiers by current standing (not a fixed team identity) — gold
 *  for 1st, silver for 2nd, bronze for 3rd, a cool gunmetal for 4th and
 *  below. A segment's color updates live as the lead changes. Each tier is
 *  a shadow→base→highlight→base→shadow band so it reads as shiny metal
 *  rather than a flat fill. */
const RANK_TIERS: MetallicTier[] = [
  { base: '#D9A521', highlight: '#FFEFB0', shadow: '#8A6508' },
  { base: '#C0C0C0', highlight: '#FFFFFF', shadow: '#6E6E6E' },
  { base: '#B5722C', highlight: '#F0B67D', shadow: '#5C3410' },
  { base: '#4A4E54', highlight: '#B8C4CC', shadow: '#1C1E22' },
];

/** Only the gunmetal tier (4th+) is dark enough to need light text — gold/
 *  silver/bronze are all bright enough for dark text. */
const RANK_NEEDS_LIGHT_TEXT = [false, false, false, true];

const BLOWOUT_FADED_TIER: MetallicTier = { base: '#3A3A3A', highlight: '#5A5A5A', shadow: '#1E1E1E' };

function tierGradient(tier: MetallicTier): string {
  return `linear-gradient(135deg, ${tier.shadow} 0%, ${tier.base} 30%, ${tier.highlight} 50%, ${tier.base} 70%, ${tier.shadow} 100%)`;
}

function tierForPlacement(placement: number): MetallicTier {
  return RANK_TIERS[placement % RANK_TIERS.length];
}

export function gradientForPlacement(
  placement: number,
  sideId: string,
  isBlowout: boolean,
  leaderId: string | null
): string {
  if (isBlowout && sideId !== leaderId) return tierGradient(BLOWOUT_FADED_TIER);
  return tierGradient(tierForPlacement(placement));
}

export function glowForPlacement(placement: number, sideId: string, isBlowout: boolean, leaderId: string | null): string {
  if (isBlowout && sideId !== leaderId) return BLOWOUT_FADED_TIER.highlight;
  return tierForPlacement(placement).highlight;
}

export function textIsLightForPlacement(
  placement: number,
  isBlowout: boolean,
  sideId: string,
  leaderId: string | null
): boolean {
  if (isBlowout) return sideId !== leaderId;
  return RANK_NEEDS_LIGHT_TEXT[placement % RANK_NEEDS_LIGHT_TEXT.length];
}
