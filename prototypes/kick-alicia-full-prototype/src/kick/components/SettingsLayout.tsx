import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { PageShell } from "./Layout";

// Only two of these have a page. The rest render and do nothing, they do not navigate.
const tabs = [
  { to: "/settings/profile", label: "Profile", routed: true },
  { to: "/settings/watch-history", label: "Watch History", routed: true },
  { to: "/settings/security", label: "Security", routed: false },
  { to: "/settings/preferences", label: "Preferences", routed: true },
  { to: "/settings/notifications", label: "Notifications", routed: false },
  { to: "/settings/connections", label: "Connections", routed: false },
  { to: "/settings/developer", label: "Developer", routed: false },
  { to: "/settings/payment-methods", label: "Payment methods", routed: false },
];

const tabClass =
  "state-layer-surface relative flex cursor-pointer items-center overflow-hidden whitespace-nowrap rounded-t-sm font-semibold transition-all border-b px-2 text-base h-12";

export function SettingsLayout({ title, children }: { title: string; children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <PageShell scroller="pt-3" column="gap-y-0" width="max-w-none">
      <h1 className="text-white text-base font-bold leading-[1.2] lg:text-2xl lg:leading-8 block py-2.5">
        Settings
      </h1>

      {/* KICK uses -top-3 because their 12px top padding is on the scroll container. Ours is on
          the page shell inside it, so top-0 sticks the rail to the same place. */}
      <div className="flex-nowrap overflow-x-auto md:no-scrollbar shadow-outline-decorative scroll-smooth shadow-[inset_0px_-2px_0] bg-surface-lowest sticky top-0 z-absolute flex">
        {tabs.map((tab) => {
          const isActive = pathname === tab.to;
          const testId = `tab-${tab.to.split("/").pop()}`;
          const className = `${tabClass} ${
            isActive
              ? "border-surface-onSurfacePrimary text-surface-onSurfacePrimary"
              : "border-transparent text-white"
          }`;
          const underline = isActive ? (
            <div className="bg-surface-onSurfacePrimary absolute inset-x-0 bottom-[-2px] h-0.5 rounded-full" />
          ) : null;

          if (!tab.routed) {
            return (
              <button key={tab.to} type="button" data-testid={testId} className={className}>
                {underline}
                {tab.label}
              </button>
            );
          }

          return (
            <Link
              key={tab.to}
              to={tab.to}
              data-testid={testId}
              data-state={isActive ? "active" : "inactive"}
              className={className}
            >
              {underline}
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* w-full is ours. KICK's panel is a block child of main, but PageShell puts it in a flex
          column, where mx-auto makes the item shrink to its content instead of filling 844. */}
      <div className="mx-auto flex w-full max-w-[844px] flex-col gap-y-5 lg:pt-6">
        <div className="p-2.5">
          <h2 className="text-white text-xl font-bold leading-[1.2]">{title}</h2>
        </div>
        {children}
      </div>
    </PageShell>
  );
}
