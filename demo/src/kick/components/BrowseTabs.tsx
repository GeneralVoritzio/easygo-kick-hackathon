export type BrowseTab = "livestreams" | "categories" | "clips" | "leaderboard";

const tabs: { id: BrowseTab; label: string }[] = [
  { id: "livestreams", label: "Livestreams" },
  { id: "categories", label: "Categories" },
  { id: "clips", label: "Clips" },
  { id: "leaderboard", label: "Leaderboard" },
];

export function BrowseTabs({
  active,
  onChange,
}: {
  active: BrowseTab;
  onChange: (tab: BrowseTab) => void;
}) {
  return (
    <div
      role="tablist"
      className="relative flex flex-nowrap overflow-x-auto bg-surface-lowest shadow-[inset_0px_-2px_0] shadow-outline-decorative scroll-smooth md:no-scrollbar"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
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
          </button>
        );
      })}
    </div>
  );
}
