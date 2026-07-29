export type InteractionBadgeKey = "responsive" | "reads_everything" | "new_chatter_friendly";

// fake-kick GET /public/v1/channels/{slug}/interaction. KICK publishes no response odds, so the
// odds and the badges are ours.
export const INTERACTION_BADGES: Record<InteractionBadgeKey, { label: string; blurb: string }> = {
  responsive: { label: "Responsive", blurb: "answers chat at above baseline odds" },
  reads_everything: { label: "Reads everything", blurb: "high odds, spread across the room" },
  new_chatter_friendly: { label: "New chatter friendly", blurb: "first messages get seen here" },
};

export const BADGE_KEYS = Object.keys(INTERACTION_BADGES) as InteractionBadgeKey[];
