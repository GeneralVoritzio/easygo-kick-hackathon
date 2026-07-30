import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "../Icon";
import { SectionHeading } from "./CardBits";
import { StreamCard, streamColumns } from "./StreamCard";
import { CategoryCard, categoryColumns } from "./CategoryCard";
import { ClipCard } from "./ClipCard";
import type { Livestream, Category } from "../mock/api";
import type { Clip } from "../mock/clips";

const APPEND_THRESHOLD_PX = 600;
// Safety cap on how many times a rail can loop its pool — otherwise a viewer who just holds down
// "scroll" grows the DOM forever. High enough that nobody scrolls a demo session that far.
const MAX_CYCLES = 20;

/*
  A real horizontally-scrolling rail, on every screen size, not just the responsive-collapse
  "oneRow" grid Section/StreamGrid/CategoryGrid/ClipGrid already use for matching kick.com's own
  static layout — ported from kick-web-redesign's DiscoveryRail.tsx. `items` is a finite,
  already-ordered pool; scrolling near the end appends another copy (re-keyed, same items) so
  there's always more ahead, cycling rather than fetching new data since this is a fixed mock
  catalog. Also tops itself up after every render and on resize, so a rail narrower than the
  viewport (fewer items than it takes to overflow) still becomes scrollable the moment it's wide
  enough to need to be.

  "Show more" swaps the rail for a wrapping grid of the same, uncycled pool — unlike Section's
  own "Show more" (which never offers "Show less," matching kick.com), this one toggles both
  ways, matching the source component's own behaviour. Generic over the card type so streams,
  categories and clips can all share one cycling implementation instead of three copies of it.
*/
function InfiniteRail<T>({
  cyan,
  white,
  subtitle,
  viewAllHref,
  items,
  itemKey,
  renderItem,
  rows,
  itemWrapperClass,
  expandedGridClass,
}: {
  cyan?: string;
  white: string;
  subtitle?: string;
  viewAllHref?: string;
  items: T[];
  itemKey: (item: T) => string | number;
  renderItem: (item: T) => ReactNode;
  /** 1 row for Categories, 2 for Streams and Clips. */
  rows: 1 | 2;
  /** Full literal class fragment for the scroller's direct children, e.g. "[&>div]:w-[268px]". */
  itemWrapperClass: string;
  /** The same responsive column classes the "Show more" static grid already uses elsewhere. */
  expandedGridClass: string;
}) {
  const [cycles, setCycles] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - APPEND_THRESHOLD_PX) {
      setCycles((c) => Math.min(MAX_CYCLES, c + 1));
    }
  }

  useEffect(() => {
    function ensureOverflow() {
      const el = scrollerRef.current;
      if (!el) return;
      if (el.scrollWidth <= el.clientWidth) {
        setCycles((c) => (c < MAX_CYCLES ? c + 1 : c));
      }
    }
    ensureOverflow();
    window.addEventListener("resize", ensureOverflow);
    return () => window.removeEventListener("resize", ensureOverflow);
  }, [cycles, items]);

  if (items.length === 0) return null;

  return (
    <section className="relative flex flex-col gap-y-3 lg:gap-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2 truncate">
          <SectionHeading cyan={cyan} white={white} viewAllHref={viewAllHref} />
          {subtitle && <span className="shrink-0 text-xs text-subtle">{subtitle}</span>}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-subtle transition-colors betterhover:hover:text-white"
        >
          {expanded ? "Show less" : "Show more"}
          <Icon name="chevron-right" className={`size-3 ${expanded ? "-rotate-90" : "rotate-90"}`} />
        </button>
      </div>

      {expanded ? (
        <section className={`grid ${expandedGridClass} gap-y-5 lg:gap-y-6`}>
          {items.map((item) => (
            <div key={itemKey(item)}>{renderItem(item)}</div>
          ))}
        </section>
      ) : (
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className={`no-scrollbar grid grid-flow-col ${rows === 1 ? "grid-rows-1" : "grid-rows-2"} gap-x-4 gap-y-5 overflow-x-auto pb-1 ${itemWrapperClass}`}
        >
          {Array.from({ length: cycles }).map((_, cycle) =>
            items.map((item) => <div key={`${itemKey(item)}::${cycle}`}>{renderItem(item)}</div>),
          )}
        </div>
      )}
    </section>
  );
}

export function DiscoveryRail({
  cyan,
  white,
  subtitle,
  streams,
}: {
  cyan?: string;
  white: string;
  subtitle?: string;
  streams: Livestream[];
}) {
  return (
    <InfiniteRail
      cyan={cyan}
      white={white}
      subtitle={subtitle}
      items={streams}
      itemKey={(s) => s.id}
      renderItem={(s) => <StreamCard stream={s} />}
      rows={2}
      itemWrapperClass="[&>div]:w-[268px]"
      expandedGridClass={streamColumns}
    />
  );
}

export function CategoryDiscoveryRail({
  cyan,
  white,
  subtitle,
  viewAllHref,
  categories,
}: {
  cyan?: string;
  white: string;
  subtitle?: string;
  viewAllHref?: string;
  categories: Category[];
}) {
  return (
    <InfiniteRail
      cyan={cyan}
      white={white}
      subtitle={subtitle}
      viewAllHref={viewAllHref}
      items={categories}
      itemKey={(c) => c.slug}
      renderItem={(c) => <CategoryCard category={c} />}
      rows={1}
      itemWrapperClass="[&>div]:w-[108px]"
      expandedGridClass={categoryColumns}
    />
  );
}

export function ClipDiscoveryRail({
  cyan,
  white,
  subtitle,
  clips,
}: {
  cyan?: string;
  white: string;
  subtitle?: string;
  clips: Clip[];
}) {
  return (
    <InfiniteRail
      cyan={cyan}
      white={white}
      subtitle={subtitle}
      items={clips}
      itemKey={(c) => c.id}
      renderItem={(c) => <ClipCard clip={c} />}
      rows={2}
      itemWrapperClass="[&>div]:w-[268px]"
      expandedGridClass={streamColumns}
    />
  );
}
