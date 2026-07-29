import { useState } from "react";
import { Link } from "react-router-dom";

export function CornerMarks() {
  return (
    <>
      <div className="absolute bottom-0 left-0 flex items-baseline opacity-0 transition-opacity betterhover:group-hover/card:opacity-100">
        <div className="h-3 w-1 bg-green-500" />
        <div className="h-1 w-2 bg-green-500" />
      </div>
      <div className="absolute bottom-0 right-0 flex items-baseline opacity-0 transition-opacity betterhover:group-hover/card:opacity-100">
        <div className="h-1 w-2 bg-green-500" />
        <div className="h-3 w-1 bg-green-500" />
      </div>
    </>
  );
}

const pillClass =
  "flex h-[22px] max-w-full shrink-0 items-center truncate whitespace-nowrap rounded-full bg-secondary-base px-2 py-1 text-sm font-normal leading-none text-secondary-onSecondary transition-colors betterhover:hover:bg-neutral-700";

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className={pillClass}>
      {/* leading-[22px] keeps the descender inside the clip box, so a g is not cut */}
      <span className="max-w-full truncate leading-[22px]">{children}</span>
    </button>
  );
}

export function PillRow({ pills, className = "mt-2" }: { pills: string[]; className?: string }) {
  return (
    <div className={`flex max-h-[22px] w-full flex-row flex-wrap gap-x-1 overflow-hidden ${className}`}>
      {pills.map((pill) => (
        <Pill key={pill}>{pill}</Pill>
      ))}
    </div>
  );
}

export function ThumbBadge({
  corner,
  children,
  className = "text-white",
}: {
  corner: "top-left" | "bottom-left";
  children: React.ReactNode;
  className?: string;
}) {
  const place = corner === "top-left" ? "top-1.5 left-1.5" : "bottom-1.5 left-1.5";
  return (
    <div
      className={`absolute ${place} rounded bg-surface-lowest px-1 text-sm font-semibold leading-5 ${className}`}
    >
      {children}
    </div>
  );
}

// A section with no page behind it still shows View all. It just does not navigate.
export function SectionHeading({
  cyan,
  white,
  viewAllHref,
  viewAll,
}: {
  cyan?: string;
  white: string;
  viewAllHref?: string;
  viewAll?: boolean;
}) {
  const titleClass = "max-w-full truncate text-base font-bold text-white lg:text-2xl";
  const linkClass =
    "shrink-0 text-xs font-semibold text-surface-onSurface focus-visible:underline lg:text-sm betterhover:hover:text-white";
  const title = (
    <>
      {cyan && <span className="text-identity-cyan">{cyan} </span>}
      {white}
    </>
  );
  const showViewAll = viewAll || Boolean(viewAllHref);

  return (
    <div className="flex items-center justify-between">
      {viewAllHref ? (
        <Link to={viewAllHref} className={titleClass}>
          {title}
        </Link>
      ) : showViewAll ? (
        <button type="button" className={`${titleClass} text-left`}>
          {title}
        </button>
      ) : (
        <h2 className={titleClass}>{title}</h2>
      )}
      {showViewAll &&
        (viewAllHref ? (
          <Link to={viewAllHref} className={linkClass}>
            View all
          </Link>
        ) : (
          <button type="button" className={linkClass}>
            View all
          </button>
        ))}
    </div>
  );
}

// Show more opens the second row, then removes itself. kick.com has no Show less.
export function Section({
  cyan,
  white,
  viewAllHref,
  viewAll,
  showMore,
  children,
}: {
  cyan?: string;
  white: string;
  viewAllHref?: string;
  viewAll?: boolean;
  showMore?: boolean;
  children: React.ReactNode;
}) {
  const [showingMore, setShowingMore] = useState(false);

  return (
    <section className="relative flex flex-col gap-y-3 lg:gap-y-4">
      <SectionHeading cyan={cyan} white={white} viewAllHref={viewAllHref} viewAll={viewAll} />
      <div
        className="group/section relative flex h-full flex-col gap-4"
        data-showingmore={showingMore}
      >
        {children}
        {showMore && !showingMore && (
          <div className="hidden items-center lg:flex">
            <div className="h-px w-full bg-outline-decorative" />
            <div className="px-3">
              <button
                type="button"
                onClick={() => setShowingMore(true)}
                className="inline-flex h-9 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded px-2 text-sm font-semibold text-surface-onSurfaceSecondary transition-all state-layer-surface betterhover:active:scale-[0.98]"
              >
                Show more
              </button>
            </div>
            <div className="h-px w-full bg-outline-decorative" />
          </div>
        )}
      </div>
    </section>
  );
}
