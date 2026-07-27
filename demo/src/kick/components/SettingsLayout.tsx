import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { PageShell } from "./Layout";

// Only two of these have a page. The rest render and do nothing, they do not navigate.
const tabs = [
  { to: "/settings/profile", label: "Profile", routed: true },
  { to: "/settings/security", label: "Security", routed: false },
  { to: "/settings/preferences", label: "Preferences", routed: true },
  { to: "/settings/notifications", label: "Notifications", routed: false },
  { to: "/settings/connections", label: "Connections", routed: false },
  { to: "/settings/developer", label: "Developer", routed: false },
  { to: "/settings/payment-methods", label: "Payment methods", routed: false },
];

type SettingsLayoutProps = {
  title: string;
  children: ReactNode;
};

export function SettingsLayout({ title, children }: SettingsLayoutProps) {
  const { pathname } = useLocation();

  return (
    <PageShell>
      <h1 className="text-base font-bold leading-[1.2] text-white lg:text-2xl">Settings</h1>

      <nav
        aria-label="Settings"
        className="relative flex flex-nowrap overflow-x-auto bg-surface-lowest shadow-[inset_0px_-2px_0] shadow-outline-decorative scroll-smooth md:no-scrollbar"
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.to;
          const testId = `tab-${tab.to.split("/").pop()}`;
          const className = `state-layer-surface relative flex h-12 shrink-0 cursor-pointer items-center overflow-hidden whitespace-nowrap rounded-t-sm border-b px-2 text-base font-semibold transition-all ${
            isActive
              ? "border-surface-onSurfacePrimary text-surface-onSurfacePrimary"
              : "border-transparent text-white"
          }`;

          if (!tab.routed) {
            return (
              <button key={tab.to} type="button" data-testid={testId} className={className}>
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
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex w-full max-w-[824px] flex-col">
        <div className="py-6">
          <h2 className="text-lg font-semibold leading-6 text-white">{title}</h2>
        </div>
        <div className="flex flex-col divide-y divide-outline-decorative">{children}</div>
      </div>
    </PageShell>
  );
}
