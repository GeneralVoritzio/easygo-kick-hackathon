import { Link } from "react-router-dom";

export type BrowseTab = "livestreams" | "categories" | "clips";

const tabs: { id: BrowseTab; label: string; path: string }[] = [
  { id: "livestreams", label: "Livestreams", path: "/browse" },
  { id: "categories", label: "Categories", path: "/browse/categories" },
  { id: "clips", label: "Clips", path: "/browse/clips" },
];

export function BrowseTabs({ active }: { active: BrowseTab }) {
  return (
    <nav
      aria-label="Browse"
      className="relative flex flex-nowrap overflow-x-auto bg-surface-lowest shadow-[inset_0px_-2px_0] shadow-outline-decorative scroll-smooth md:no-scrollbar"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            to={tab.path}
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
