import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { Icon, type KickIconName } from "../Icon";
import { currentUser } from "../mock/api";

const LEVEL = 11;
const PROGRESS = 41;

type Row = {
  label: string;
  icon: KickIconName;
  to?: string;
  iconClass?: string;
};

const accountRows: Row[] = [
  { label: "Creator dashboard", icon: "dash-revenue", to: "/dashboard/stream" },
  { label: "Subscriptions", icon: "subscriptions" },
  { label: "Drops & rewards", icon: "dash-drops" },
  { label: "Collectibles", icon: "collectibles", iconClass: "size-5 shrink-0" },
];

const itemClass =
  "state-layer-surface flex min-h-12 w-full items-center justify-start gap-4 rounded bg-transparent px-4 py-1 text-base font-normal text-white";

const iconClass = "size-4 shrink-0";

const separatorClass = "h-px w-full bg-outline-decorative";

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
      <div className="flex flex-col gap-4 px-6 py-4">
        <div className="flex max-w-[262px] flex-col items-center justify-center gap-2">
          {/* ponytail: KICK serves a per-level badge PNG we cannot commit, so we draw the level 11 tier */}
          <div
            className="grid size-[50px] shrink-0 place-items-center rounded-[11px] border-2 border-[#FFD400] text-[22px] font-extrabold leading-none text-black"
            style={{ backgroundImage: "linear-gradient(180deg, #FFF6A8, #FFE96B 45%, #FFDA2E)" }}
          >
            {LEVEL}
          </div>
          <span className="text-lg font-bold leading-7 text-surface-onSurface">
            {currentUser.username}
          </span>
          <span className="text-center text-xs font-normal leading-4 text-surface-onSurfaceSecondary">
            Level up by watching streams and showcase your global badge everywhere you chat on KICK
          </span>
          <div className="flex w-full flex-col gap-1.5">
            <div role="progressbar" className="mt-2 flex h-2 w-full items-center">
              <div className="relative h-2 min-w-px flex-1 rounded-lg bg-outline-region">
                <div
                  className="absolute inset-y-0 left-0 rounded-lg bg-surface-onSurface"
                  style={{ width: `${PROGRESS}%` }}
                />
              </div>
            </div>
            <span className="text-center text-xs font-normal text-surface-onSurfaceSecondary">
              <span className="font-semibold text-primary-base">{PROGRESS}%</span> towards Level{" "}
              {LEVEL + 1}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="state-layer-surface relative flex h-8 w-full items-center justify-center rounded bg-secondary-base px-3 py-1.5 text-sm font-semibold text-secondary-onSecondary"
        >
          View your channel
        </button>
      </div>

      <div className={separatorClass} />

      <div className="flex flex-col gap-1 px-2">
        {accountRows.map((row) =>
          row.to ? (
            <Link key={row.label} to={row.to} onClick={onClose} className={itemClass}>
              <Icon name={row.icon} className={row.iconClass ?? iconClass} />
              {row.label}
            </Link>
          ) : (
            <button key={row.label} type="button" className={itemClass}>
              <Icon name={row.icon} className={row.iconClass ?? iconClass} />
              {row.label}
            </button>
          ),
        )}
      </div>

      <div className="mx-4 h-px w-[calc(100%-32px)] bg-outline-decorative" />

      <div className="flex flex-col gap-1 px-2">
        <div className="py-1">
          <button
            type="button"
            className="state-layer-surface flex h-10 w-full items-center justify-start gap-4 rounded px-4 font-normal text-white"
          >
            <Icon name="language-globe" className={iconClass} />
            <span className="flex-1 text-left text-base">Display language</span>
            <span className="text-sm text-surface-onSurfaceSecondary">English</span>
            <Icon name="chevron-right" className="size-3 shrink-0" />
          </button>
        </div>
        <Link to="/settings/profile" onClick={onClose} className={itemClass}>
          <Icon name="settings-menu" className={iconClass} />
          Settings
        </Link>
      </div>

      <div className={separatorClass} />

      <div className="w-full px-2 py-1">
        <button type="button" className={`${itemClass} py-2`}>
          <Icon name="log-out" className={iconClass} />
          Log out
        </button>
      </div>
    </div>
  );
}
