import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

const WIDE = "(min-width: 1280px)";

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [wide, setWide] = useState(() => window.matchMedia(WIDE).matches);

  useEffect(() => {
    const query = window.matchMedia(WIDE);
    const update = () => setWide(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const rail = collapsed || !wide;

  return (
    <div
      className="group/main flex h-xvh flex-col"
      data-sidebar={!rail}
    >
      <Navbar onToggleSidebar={() => setCollapsed((v) => !v)} />
      <div className="flex w-xvw flex-1 lg:overflow-hidden">
        {/* KICK swaps the rail for a whole new subtree, so the 150ms transition-all on a nav
            link never runs. The key does the same here. Without it React reuses the anchors and
            they animate their width down. */}
        <Sidebar key={rail ? "rail" : "full"} collapsed={rail} />
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

// KICK puts the top padding on the scroll container and the gap on the column.
// Browse is pt-3 lg:pt-6 with gap-y-3, home has no top padding at lg and gap-y-7.
export function PageShell({
  children,
  scroller = "pt-3 lg:pt-6",
  column = "gap-y-3",
}: {
  children: React.ReactNode;
  scroller?: string;
  column?: string;
}) {
  return (
    <div className={`px-4 lg:px-8 xl:px-10 ${scroller}`}>
      <div className={`m-auto flex max-w-[125rem] flex-col ${column}`}>{children}</div>
    </div>
  );
}
