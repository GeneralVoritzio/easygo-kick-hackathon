import { useEffect, useRef, useState } from 'react';
import type { StreamCard } from '../types';
import { StreamCardTile } from './StreamCardTile';

interface DiscoveryRailProps {
  title: string;
  subtitle?: string;
  cards: StreamCard[];
}

const APPEND_THRESHOLD_PX = 600;
/** Safety cap on how many times a rail can loop its pool — otherwise a
 *  viewer who just holds down "scroll" grows the DOM forever. High enough
 *  that nobody scrolls a demo session that far. */
const MAX_CYCLES = 20;

/** A two-row strip you keep scrolling through horizontally instead of
 *  paging through categories — no nested clicks to browse. `cards` is a
 *  finite, already-ordered pool; when the viewer scrolls near the end
 *  another copy gets appended (re-keyed, same underlying cards) so the
 *  rail always has more ahead of you. It loops rather than fetching new
 *  data because this is a fixed mock catalog, but the effect reads the
 *  same either way.
 *
 *  `grid-auto-flow: column` with 2 fixed rows is what makes it two rows
 *  rather than one: card 0 and card 1 form the first column, card 2 and
 *  card 3 the next, and so on, with the whole grid scrolling horizontally
 *  as one unit.
 *
 *  Appending more cycles used to happen only on scroll — which never fires
 *  if the content doesn't already overflow the container, so any category
 *  with fewer cards than it takes to fill the viewport width (everything
 *  but the biggest one) never became scrollable at all. This now also
 *  tops itself up after every render (and on window resize) until the
 *  content actually overflows or the cap is hit, so every rail is
 *  scrollable from the moment it's wide enough to need to be. */
export function DiscoveryRail({ title, subtitle, cards }: DiscoveryRailProps) {
  const [cycles, setCycles] = useState(1);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - APPEND_THRESHOLD_PX) {
      setCycles((c) => Math.min(MAX_CYCLES, c + 1));
    }
  };

  useEffect(() => {
    const ensureOverflow = () => {
      const el = scrollerRef.current;
      if (!el) return;
      if (el.scrollWidth <= el.clientWidth) {
        setCycles((c) => (c < MAX_CYCLES ? c + 1 : c));
      }
    };

    ensureOverflow();
    window.addEventListener('resize', ensureOverflow);
    return () => window.removeEventListener('resize', ensureOverflow);
  }, [cycles, cards]);

  if (cards.length === 0) return null;

  return (
    <section className="py-2">
      <div className="mb-3 flex items-baseline gap-2 px-4 sm:px-6">
        <h2 className="text-lg font-extrabold text-ink-bright">{title}</h2>
        {subtitle && <span className="text-xs text-ink-muted">{subtitle}</span>}
      </div>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="no-scrollbar grid grid-flow-col grid-rows-2 gap-3 overflow-x-auto px-4 pb-2 sm:px-6"
      >
        {Array.from({ length: cycles }).map((_, cycle) =>
          cards.map((card) => <StreamCardTile key={`${card.id}::${cycle}`} card={card} />)
        )}
      </div>
    </section>
  );
}
