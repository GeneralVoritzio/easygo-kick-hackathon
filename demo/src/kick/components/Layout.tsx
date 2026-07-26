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
          className="no-scrollbar h-full flex-1 overflow-y-auto overflow-x-hidden pb-6 outline-none lg:w-full"
        >
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export const oneRowGrid =
  "no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-ps-4 auto-rows-[0] grid-rows-1 gap-y-0 overflow-y-hidden px-4 lg:mx-0 lg:grid lg:px-0 [&>div]:snap-start [&>div]:lg:w-full [&>div]:lg:snap-align-none";

export function PageShell({
  children,
  column = "gap-y-3 pt-3 lg:pt-6",
}: {
  children: React.ReactNode;
  column?: string;
}) {
  return (
    <div className="px-4 lg:px-8 xl:px-10">
      <div className={`m-auto flex max-w-[125rem] flex-col ${column}`}>{children}</div>
    </div>
  );
}
