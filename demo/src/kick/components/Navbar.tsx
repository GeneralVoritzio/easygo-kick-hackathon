import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { EventSearch } from "../events/EventSearch";
import { ProfileMenu } from "./ProfileMenu";
import kickLogo from "../brand/kick-logo.svg";
import { currentUser } from "../mock/api";

type NavbarProps = {
  onToggleSidebar: () => void;
};

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      data-testid="navbar"
      className="relative top-0 z-[402] flex h-[var(--navbar-height)] items-center justify-between gap-0 bg-surface-lowest pl-3 pr-10 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.2)]"
    >
      <div className="flex grow-0 items-center gap-2.5">
        <button
          type="button"
          aria-label="Collapse sidebar"
          data-testid="sidebar-collapse"
          onClick={onToggleSidebar}
          className="group flex size-10 shrink-0 items-center justify-center rounded state-layer-surface"
        >
          <Icon name="collapse-sidebar" className="size-4 fill-current" />
        </button>
        <Link to="/" title="Home" className="shrink-0">
          <img src={kickLogo} alt="Kick Logo" width={97} height={26} />
        </Link>
      </div>

      <div className="flex grow items-center justify-center lg:absolute lg:inset-x-96 lg:inset-y-0">
        <div className="w-[450px] shrink-0">
          <EventSearch />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Claim Your Daily Reward"
          className="group flex size-9 shrink-0 items-center justify-center rounded bg-secondary-base"
        >
          <Icon name="claim-daily-reward" className="size-4" />
        </button>
        <button
          type="button"
          data-testid="kicks-top-nav"
          className="group inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded bg-secondary-base px-2 text-sm font-semibold text-white transition-all select-none betterhover:active:scale-[0.98]"
        >
          <Icon name="get-kicks" className="size-4" />
          Get KICKs
        </button>
        <button
          type="button"
          aria-label={currentUser.username}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="shrink-0 rounded"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.username}
            className="size-8 rounded-full lg:box-content"
          />
        </button>
        {menuOpen && <ProfileMenu onClose={() => setMenuOpen(false)} />}
      </div>
    </nav>
  );
}
