import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="group/main flex h-screen flex-col"
      data-sidebar={!collapsed}
    >
      <Navbar onToggleSidebar={() => setCollapsed((v) => !v)} />
      <div className="flex w-screen flex-1 lg:overflow-hidden">
        <Sidebar collapsed={collapsed} />
        <div
          id="main-container"
          className="no-scrollbar h-full flex-1 overflow-y-auto overflow-x-hidden pb-6 pt-3 outline-none lg:w-full lg:pt-6"
        >
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 lg:px-8 xl:px-10">
      <div className="m-auto flex max-w-[125rem] flex-col gap-y-3">{children}</div>
    </div>
  );
}
