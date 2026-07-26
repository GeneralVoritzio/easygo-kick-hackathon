import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { PageShell } from "./Layout";

const tabs = [
  { to: "/settings/profile", label: "Profile" },
  { to: "/settings/security", label: "Security" },
  { to: "/settings/preferences", label: "Preferences" },
  { to: "/settings/notifications", label: "Notifications" },
  { to: "/settings/connections", label: "Connections" },
  { to: "/settings/developer", label: "Developer" },
  { to: "/settings/payment-methods", label: "Payment methods" },
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

      <nav aria-label="Settings" className="flex items-center gap-6 overflow-x-auto border-b border-outline-decorative">
        {tabs.map((tab) => {
          const isActive = pathname === tab.to;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              data-state={isActive ? "active" : "inactive"}
              className={`relative flex h-11 shrink-0 items-center whitespace-nowrap text-sm font-semibold transition-colors ${
                isActive ? "text-white" : "text-surface-onSurfaceSecondary betterhover:hover:text-white"
              }`}
            >
              <div
                className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full ${
                  isActive ? "bg-primary-base" : "bg-transparent"
                }`}
              />
              {tab.label}
            </NavLink>
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
