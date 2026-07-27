import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/following", label: "Live Channels" },
  { to: "/following/categories", label: "Categories" },
  { to: "/following/channels", label: "Channels" },
];

export function FollowingTabs() {
  return (
    <div className="relative flex flex-nowrap overflow-x-auto scroll-smooth bg-surface-lowest shadow-[inset_0px_-2px_0] shadow-outline-decorative md:no-scrollbar">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
          className={({ isActive }) =>
            `state-layer-surface relative flex h-12 cursor-pointer items-center overflow-hidden whitespace-nowrap rounded-t-sm border-b px-2 text-base font-semibold transition-all ${
              isActive
                ? "border-surface-onSurfacePrimary text-surface-onSurfacePrimary"
                : "border-transparent"
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <div className="absolute inset-x-0 bottom-[-2px] h-0.5 rounded-full bg-surface-onSurfacePrimary" />
              )}
              {tab.label}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
