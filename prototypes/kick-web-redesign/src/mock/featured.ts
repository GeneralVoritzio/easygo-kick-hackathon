import type { FeaturedStreamer, StreamCard } from '../types';

const BLURBS = [
  "This week's pick, chosen for a run of standout streams — drop in and see what the buzz is about.",
  'Featured for a strong week of content. New here? This is a great place to start.',
  "Editor's pick this week — consistently one of the best watches on Kick right now.",
];

function weekRangeLabel(): string {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

/** Rotates weekly through the real, embeddable channels — the hero always
 *  gets a real live embed, since it's the single highest-visibility slot on
 *  the homepage and deserves the real thing over a placeholder. Picks
 *  deterministically off the week number, so it's stable all week rather
 *  than re-rolling on every page load. */
export function createFeaturedStreamer(catalog: StreamCard[]): FeaturedStreamer | null {
  const eligible = catalog.filter((c) => c.embedId);
  if (eligible.length === 0) return null;

  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const card = eligible[weekNumber % eligible.length];
  const blurb = BLURBS[weekNumber % BLURBS.length];

  return { card, weekLabel: weekRangeLabel(), blurb };
}
