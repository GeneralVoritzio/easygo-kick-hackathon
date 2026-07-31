import { Link } from "react-router-dom";

export type PageTab = { label: string; to: string };

export function PageTabs({
  label,
  tabs,
  active,
  className = "",
}: {
  label: string;
  tabs: PageTab[];
  active: string;
  className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={`relative flex flex-nowrap overflow-x-auto bg-surface-lowest shadow-[inset_0px_-2px_0] shadow-outline-decorative scroll-smooth md:no-scrollbar ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.to === active;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            aria-current={isActive ? "page" : undefined}
            className={`state-layer-surface relative flex h-12 cursor-pointer items-center overflow-hidden whitespace-nowrap rounded-t-sm border-b px-2 text-base font-semibold transition-all ${
              isActive
                ? "border-surface-onSurfacePrimary text-surface-onSurfacePrimary"
                : "border-transparent text-white"
            }`}
          >
            {isActive && (
              <div className="absolute inset-x-0 bottom-[-2px] h-0.5 rounded-full bg-surface-onSurfacePrimary" />
            )}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
