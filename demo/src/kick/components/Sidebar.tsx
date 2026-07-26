import { NavLink, Link } from "react-router-dom";
import { Icon, type KickIconName } from "../Icon";
import { followedChannels, livestreams, formatViewers } from "../mock/api";

const navItems: { to: string; label: string; icon: KickIconName; activeIcon: KickIconName }[] = [
  { to: "/", label: "Home", icon: "home", activeIcon: "home-active" },
  { to: "/browse", label: "Browse", icon: "browse", activeIcon: "browse" },
  { to: "/following", label: "Following", icon: "following-active", activeIcon: "following-active" },
];

const navLinkClass =
  "group relative box-border inline-flex h-12 w-full select-none items-center justify-start gap-x-4 whitespace-nowrap rounded px-4 py-1 text-base font-semibold text-white outline outline-2 outline-offset-2 outline-transparent transition-all state-layer-surface [&_svg]:size-[1em] [&_svg]:fill-current betterhover:active:scale-[0.98] focus-visible:outline-focusLight";

function ChannelRow({
  slug,
  username,
  avatar,
  category,
  viewers,
  live,
}: {
  slug: string;
  username: string;
  avatar: string;
  category?: string;
  viewers?: number;
  live: boolean;
}) {
  return (
    <Link
      to={`/${slug}`}
      className="flex h-11 w-full flex-row items-center gap-2 rounded px-1.5 state-layer-surface"
    >
      <div className="relative size-7 shrink-0">
        <img
          src={avatar}
          alt={username}
          className={`h-full w-full overflow-hidden rounded-full ${
            live ? "" : "mix-blend-luminosity grayscale"
          }`}
        />
      </div>
      <div className="flex min-w-0 max-w-full shrink grow flex-col gap-0.5">
        <span
          className={`shrink truncate text-sm font-bold leading-[1.2] ${
            live ? "text-white" : "text-neutral-700"
          }`}
        >
          {username}
        </span>
        {category && (
          <span className="truncate text-xs font-bold leading-normal text-subtle">
            {category}
          </span>
        )}
      </div>
      {live ? (
        <div className="flex w-fit shrink-0 flex-nowrap items-center gap-x-1 text-surface-onSurfaceSecondary">
          <div className="size-1.5 rounded-full bg-primary-base" />
          <span className="text-xs font-semibold leading-4">
            {viewers === undefined ? "LIVE" : formatViewers(viewers)}
          </span>
        </div>
      ) : (
        <Icon name="heart-slash" className="size-4 shrink-0 fill-neutral-700" />
      )}
    </Link>
  );
}

export function Sidebar({ open }: { open: boolean }) {
  if (!open) return null;

  return (
    <div className="absolute bottom-0 left-0 top-[var(--navbar-height)] z-[401] flex h-full max-h-[calc(100%-var(--navbar-height))] w-[var(--sidebar-expanded-width)] shrink-0 flex-col overflow-hidden bg-surface-lowest xl:relative xl:inset-0 xl:max-h-full">
      <ul className="flex w-full flex-col px-2">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? "!bg-secondary-base" : "bg-transparent"}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={isActive ? item.activeIcon : item.icon} />
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="w-full px-3">
        <div className="h-px w-full bg-outline-decorative" />
      </div>

      <div className="no-scrollbar flex h-full max-h-full flex-col overflow-y-auto">
        <div className="flex h-fit flex-col pb-3">
          <section className="flex w-full flex-col p-3">
            <div className="flex h-9 w-full items-center px-1.5 text-sm font-semibold leading-[1.2]">
              Following
            </div>
            {followedChannels.map((c) => (
              <ChannelRow key={c.slug} {...c} live={c.live} />
            ))}
          </section>

          <section className="flex w-full flex-col p-3">
            <div className="flex h-9 w-full items-center px-1.5 text-sm font-semibold leading-[1.2]">
              Recommended
            </div>
            {livestreams.slice(0, 10).map((s) => (
              <ChannelRow
                key={s.id}
                slug={s.channel.slug}
                username={s.channel.username}
                avatar={s.channel.avatar}
                category={s.category.name}
                viewers={s.viewer_count}
                live
              />
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
