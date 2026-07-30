import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { EXPLORE_COUNTRIES, EXPLORE_LANGUAGES } from "../mock/explore";
import { BADGE_KEYS, INTERACTION_BADGES, type InteractionBadgeKey } from "./badges";
import { BODIES } from "./bodies";
import { useExplore } from "./exploreStore";
import { hasActiveFilters, VIEWER_TIERS } from "./filters";
import type { BodyId, ViewerTier } from "./types";

type MenuKey = "country" | "language" | "interaction" | "viewers";

// The country list is long, so its menu scrolls. Every other menu fits.
const scrollingPanel = "max-h-[52vh] overflow-y-auto";

const pillClass =
  "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-sm transition-colors";

function FilterMenu({
  label,
  summary,
  open,
  onToggle,
  panelClassName = "w-60",
  children,
}: {
  label: string;
  summary: string | null;
  open: boolean;
  onToggle: () => void;
  panelClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`${pillClass} ${
          summary
            ? "border-primary-base/60 bg-primary-base/10 text-primary-base"
            : open
              ? "border-outline-decorative bg-secondary-base text-white"
              : "border-outline-decorative bg-surface-base/90 text-surface-onSurfaceSecondary betterhover:hover:text-white"
        }`}
      >
        {summary ?? label}
        <Icon
          name="icon-10"
          className={`size-3 shrink-0 opacity-75 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`absolute left-0 top-full z-20 mt-2 rounded-lg border border-outline-decorative bg-surface-base/95 p-1.5 shadow-2xl backdrop-blur-md ${panelClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function OptionRow({
  selected,
  onClick,
  children,
  sub,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-selected={selected}
      role="option"
      className={`state-layer-surface flex w-full items-center justify-between gap-2 rounded px-2.5 py-1.5 text-left text-sm ${
        selected ? "text-surface-onSurfacePrimary" : "text-surface-onSurfaceSecondary"
      }`}
    >
      <span className="min-w-0">
        <span className="block truncate font-semibold">{children}</span>
        {sub && (
          <span className="block truncate text-[11px] font-normal text-surface-onSurfaceSecondary">
            {sub}
          </span>
        )}
      </span>
    </button>
  );
}

// A compact filter rail over the globe. Each pill carries its own selection, the chip counts the
// channels that survive, and every choice restores after a trip to a channel page, because the state
// lives in the store.
export function ExploreFilterBar({
  matchCount,
  emptyLabel,
  elsewhere,
}: {
  matchCount: number;
  emptyLabel: string;
  // Where the matches are, when this body has none.
  elsewhere: { body: BodyId; count: number } | null;
}) {
  const activeBody = useExplore((s) => s.activeBody);
  const filters = useExplore((s) => s.filters);
  const setFilters = useExplore((s) => s.setFilters);
  const resetFilters = useExplore((s) => s.resetFilters);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // A click away or Escape closes the panel. Escape is captured, so the page handler does not also
  // fold the hotspot popover in the same press.
  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpenMenu(null);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, [openMenu]);

  const toggleMenu = (menu: MenuKey) => setOpenMenu((cur) => (cur === menu ? null : menu));

  const toggleBadge = (badge: InteractionBadgeKey) =>
    setFilters({
      badges: filters.badges.includes(badge)
        ? filters.badges.filter((b) => b !== badge)
        : [...filters.badges, badge],
    });

  const badgeSummary =
    filters.badges.length === 0
      ? null
      : filters.badges.length === 1
        ? INTERACTION_BADGES[filters.badges[0]].label
        : `Interaction, ${filters.badges.length}`;

  return (
    <div
      ref={rootRef}
      className="pointer-events-auto absolute left-4 top-4 flex flex-wrap items-center gap-2"
    >
      {/* Only Earth has countries. The Moon and Mars carry relay sites, and the Sun is where a
          location stops existing. */}
      {activeBody === "earth" && (
      <FilterMenu
        label="Country"
        summary={filters.country}
        open={openMenu === "country"}
        onToggle={() => toggleMenu("country")}
        panelClassName={`w-[340px] ${scrollingPanel}`}
      >
        <div className="grid grid-cols-2 gap-x-1">
          <OptionRow
            selected={filters.country === null}
            onClick={() => {
              setFilters({ country: null });
              setOpenMenu(null);
            }}
          >
            Every country
          </OptionRow>
          {EXPLORE_COUNTRIES.map((country) => (
            <OptionRow
              key={country}
              selected={filters.country === country}
              onClick={() => {
                setFilters({ country: filters.country === country ? null : country });
                setOpenMenu(null);
              }}
            >
              {country}
            </OptionRow>
          ))}
        </div>
      </FilterMenu>
      )}

      <FilterMenu
        label="Language"
        summary={filters.language}
        open={openMenu === "language"}
        onToggle={() => toggleMenu("language")}
        panelClassName={`w-[340px] ${scrollingPanel}`}
      >
        <div className="grid grid-cols-2 gap-x-1">
          <OptionRow
            selected={filters.language === null}
            onClick={() => {
              setFilters({ language: null });
              setOpenMenu(null);
            }}
          >
            All languages
          </OptionRow>
          {EXPLORE_LANGUAGES.map((language) => (
            <OptionRow
              key={language}
              selected={filters.language === language}
              onClick={() => {
                setFilters({ language: filters.language === language ? null : language });
                setOpenMenu(null);
              }}
            >
              {language}
            </OptionRow>
          ))}
        </div>
      </FilterMenu>

      <FilterMenu
        label="Interaction"
        summary={badgeSummary}
        open={openMenu === "interaction"}
        onToggle={() => toggleMenu("interaction")}
        panelClassName="w-64"
      >
        {BADGE_KEYS.map((badge) => (
          <OptionRow
            key={badge}
            selected={filters.badges.includes(badge)}
            onClick={() => toggleBadge(badge)}
            sub={INTERACTION_BADGES[badge].blurb}
          >
            {INTERACTION_BADGES[badge].label}
          </OptionRow>
        ))}
      </FilterMenu>

      <FilterMenu
        label="Viewers"
        summary={filters.viewerTier ? `${VIEWER_TIERS[filters.viewerTier].label} viewers` : null}
        open={openMenu === "viewers"}
        onToggle={() => toggleMenu("viewers")}
        panelClassName="w-44"
      >
        <OptionRow
          selected={filters.viewerTier === null}
          onClick={() => {
            setFilters({ viewerTier: null });
            setOpenMenu(null);
          }}
        >
          Any size
        </OptionRow>
        {(Object.keys(VIEWER_TIERS) as ViewerTier[]).map((tier) => (
          <OptionRow
            key={tier}
            selected={filters.viewerTier === tier}
            onClick={() => {
              setFilters({ viewerTier: filters.viewerTier === tier ? null : tier });
              setOpenMenu(null);
            }}
          >
            {VIEWER_TIERS[tier].label} viewers
          </OptionRow>
        ))}
      </FilterMenu>

      <span
        className={`${pillClass} ${
          hasActiveFilters(filters)
            ? "border-primary-base/50 bg-primary-base/10 text-primary-base"
            : "border-outline-decorative bg-surface-base/90 text-surface-onSurfaceSecondary"
        }`}
      >
        <span className="size-1.5 animate-pulse-fast rounded-full bg-primary-base" />
        {matchCount.toLocaleString()} live
      </span>

      {/* An empty body is a dead end unless we say where to look next. This is where filtering and
          interplanetary travel meet. */}
      {matchCount === 0 &&
        (elsewhere ? (
          <button
            type="button"
            onClick={() => useExplore.getState().setActiveBody(elsewhere.body)}
            className={`${pillClass} betterhover:hover:brightness-125`}
            style={{
              borderColor: `${BODIES[elsewhere.body].accent}66`,
              color: BODIES[elsewhere.body].accent,
              backgroundColor: `${BODIES[elsewhere.body].accent}14`,
            }}
          >
            {BODIES[elsewhere.body].name} has {elsewhere.count}
          </button>
        ) : (
          <span
            className={`${pillClass} border-outline-decorative bg-surface-base/90 text-surface-onSurfaceSecondary`}
          >
            {emptyLabel}
          </span>
        ))}

      {hasActiveFilters(filters) && (
        <button
          type="button"
          onClick={() => {
            resetFilters();
            setOpenMenu(null);
          }}
          className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-surface-onSurfaceSecondary underline-offset-2 transition-colors betterhover:hover:text-white betterhover:hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
