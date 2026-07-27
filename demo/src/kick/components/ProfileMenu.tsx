import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Icon, type KickIconName } from "../Icon";
import { currentUser } from "../mock/api";

const LEVEL = 9;
const PROGRESS = 73;

type Row = {
  label: string;
  icon: KickIconName;
  to?: string;
  value?: string;
};

const rows: Row[] = [
  { label: "Creator dashboard", icon: "dash-revenue", to: "/dashboard/stream" },
  { label: "Subscriptions", icon: "subscriptions" },
  { label: "Drops & rewards", icon: "dash-drops" },
  { label: "Collectibles", icon: "collectibles" },
];

const itemClass =
  "state-layer-surface flex h-12 w-full items-center gap-4 rounded px-4 py-1 text-base font-normal text-white";

export function ProfileMenu({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest('[aria-haspopup="menu"]')) return;
      if (ref.current && !ref.current.contains(target)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute right-10 top-[var(--navbar-height)] z-popover flex h-fit w-[316px] flex-col gap-1 rounded-lg bg-surface-highest text-sm"
    >
      <div className="flex flex-col items-center gap-2 px-6 pb-2 pt-6">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary-base text-lg font-bold text-primary-onPrimary">
          {LEVEL}
        </div>
        <span className="text-base font-bold text-white">{currentUser.username}</span>
        <p className="text-center text-xs font-normal leading-[1.4] text-subtle">
          Level up by watching streams and showcase your global badge everywhere you chat on KICK
        </p>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-lowest">
          <div className="h-full rounded-full bg-primary-base" style={{ width: `${PROGRESS}%` }} />
        </div>
        <span className="text-xs font-semibold text-surface-onSurfacePrimary">
          {PROGRESS}% towards Level {LEVEL + 1}
        </span>
        <button
          type="button"
          className="mt-2 flex h-8 w-full items-center justify-center rounded bg-secondary-base px-3 py-1.5 text-sm font-semibold text-white betterhover:hover:bg-neutral-600"
        >
          View your channel
        </button>
      </div>

      <div className="px-2 pb-1">
        {rows.map((row) =>
          row.to ? (
            <Link key={row.label} to={row.to} onClick={onClose} className={itemClass}>
              <Icon name={row.icon} className="size-5 shrink-0" />
              {row.label}
            </Link>
          ) : (
            <button key={row.label} type="button" className={itemClass}>
              <Icon name={row.icon} className="size-5 shrink-0" />
              {row.label}
            </button>
          ),
        )}

        <button
          type="button"
          className="state-layer-surface flex h-10 w-full items-center gap-4 px-4 py-1 text-sm font-normal text-white"
        >
          <Icon name="language-globe" className="size-5 shrink-0" />
          Display language
          <span className="ml-auto flex items-center gap-1 text-subtle">
            English
            <Icon name="chevron-right" className="size-3" />
          </span>
        </button>

        <Link to="/settings/profile" onClick={onClose} className={itemClass}>
          <Icon name="settings-menu" className="size-5 shrink-0" />
          Settings
        </Link>
      </div>

      <div className="mx-4 h-px bg-outline-decorative" />

      <div className="px-2 pb-2">
        <button type="button" className={`${itemClass} py-2`}>
          <Icon name="log-out" className="size-5 shrink-0" />
          Log out
        </button>
      </div>
    </div>
  );
}
