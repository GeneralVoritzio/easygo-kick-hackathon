import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, Link } from "react-router-dom";
import { Icon, type KickIconName } from "../Icon";
import { followedChannels, livestreams, formatViewers, type Livestream } from "../mock/api";
import { usePinnedStreams } from "../expedition/PinnedStreamsContext";

const navItems: { to: string; label: string; icon: KickIconName; activeIcon: KickIconName }[] = [
  { to: "/", label: "Home", icon: "nav-home", activeIcon: "nav-home-active" },
  { to: "/browse", label: "Browse", icon: "nav-browse", activeIcon: "nav-browse-active" },
  { to: "/following", label: "Following", icon: "nav-following", activeIcon: "nav-following-active" },
  // Both fake-kick: KICK has no expedition or multiview surface. kick.com's own sidebar has no
  // room for extra links either, so these live here alongside Home/Browse/Following rather than
  // in the navbar (source project put them there, but ours mirrors kick.com's real navbar).
  { to: "/multiview", label: "Multiview", icon: "multiview", activeIcon: "multiview" },
  { to: "/expeditions", label: "Expeditions", icon: "expedition", activeIcon: "expedition" },
];

const navLinkClass =
  "group relative box-border inline-flex h-12 w-full select-none items-center justify-start gap-x-4 whitespace-nowrap rounded px-4 py-1 text-base font-semibold text-white outline outline-2 outline-offset-2 outline-transparent transition-all state-layer-surface [&_svg]:size-[1em] [&_svg]:fill-current betterhover:active:scale-[0.98] focus-visible:outline-focusLight";

// Rendered into document.body via a portal, not as an absolutely-positioned child of the nav
// item: both sidebar wrappers carry overflow-hidden, so a popover positioned inside them would
// be clipped at the sidebar's own edge.
function PinnedSummaryPopover({ anchorRef }: { anchorRef: React.RefObject<HTMLAnchorElement | null> }) {
  const { pinnedSlugs } = usePinnedStreams();
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setRect(anchorRef.current?.getBoundingClientRect() ?? null);
  }, [anchorRef]);

  const pinnedStreams = pinnedSlugs
    .map((slug) => livestreams.find((s) => s.channel.slug === slug))
    .filter((s): s is Livestream => Boolean(s));

  // Nothing to summarize, so show nothing — not a popover that only says "Nothing pinned yet."
  if (!rect || pinnedStreams.length === 0) return null;

  return createPortal(
    <div
      style={{ position: "fixed", top: rect.top, left: rect.right + 8 }}
      className="z-[500] w-64 rounded-lg border border-outline-decorative bg-surface-base p-3 shadow-2xl"
    >
      <div className="mb-2 text-xs font-semibold text-subtle">{pinnedStreams.length} pinned for Multiview</div>
      <ul className="flex flex-col gap-1.5">
        {pinnedStreams.slice(0, 6).map((s) => (
          <li key={s.channel.slug} className="flex items-center gap-2">
            <img src={s.channel.avatar} alt="" className="size-5 shrink-0 rounded-full" />
            <span className="truncate text-xs text-white">{s.channel.username}</span>
          </li>
        ))}
        {pinnedStreams.length > 6 && (
          <li className="text-[11px] text-subtle">+{pinnedStreams.length - 6} more</li>
        )}
      </ul>
    </div>,
    document.body,
  );
}

// The Multiview link gets a pinned-count badge and a hover summary the other nav items don't —
// pinning is invisible everywhere else on the site, so this is the one place a viewer can check
// what's waiting there without opening the page.
function MultiviewNavItem({ collapsed }: { collapsed: boolean }) {
  const { pinnedSlugs } = usePinnedStreams();
  const [hovering, setHovering] = useState(false);
  const anchorRef = useRef<HTMLAnchorElement>(null);

  return (
    <div onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      <NavLink
        ref={anchorRef}
        to="/multiview"
        title={collapsed ? "Multiview" : undefined}
        data-testid={collapsed ? undefined : "sidebar-multiview"}
        className={({ isActive }) =>
          collapsed
            ? `group relative box-border flex h-12 w-full items-center justify-center rounded py-1 transition-all state-layer-surface ${
                isActive ? "bg-surface-highest text-white" : "bg-transparent text-white"
              }`
            : `${navLinkClass} ${isActive ? "!bg-secondary-base" : "bg-transparent"}`
        }
      >
        <span className="relative flex shrink-0 items-center justify-center">
          <Icon name="multiview" className="size-4 shrink-0 fill-current" />
          {collapsed && pinnedSlugs.length > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex size-3.5 items-center justify-center rounded-full bg-primary-base text-[9px] font-bold text-primary-onPrimary">
              {pinnedSlugs.length}
            </span>
          )}
        </span>
        {!collapsed && "Multiview"}
        {!collapsed && pinnedSlugs.length > 0 && (
          <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-base px-1 text-[10px] font-bold tabular-nums text-primary-onPrimary">
            {pinnedSlugs.length}
          </span>
        )}
      </NavLink>
      {hovering && <PinnedSummaryPopover anchorRef={anchorRef} />}
    </div>
  );
}

function ChannelRow({
  slug,
  username,
  avatar,
  category,
  viewers,
  live,
  testId,
}: {
  slug: string;
  username: string;
  avatar: string;
  category?: string;
  viewers?: number;
  live: boolean;
  testId?: string;
}) {
  return (
    <Link
      to={`/${slug}`}
      data-testid={testId}
      className="flex h-11 w-full flex-row items-center gap-x-2 rounded px-1.5 py-1 state-layer-surface"
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
        <div className="flex w-fit shrink-0 flex-nowrap items-center gap-x-1 self-start text-white">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-semibold">
            {viewers === undefined ? "LIVE" : formatViewers(viewers)}
          </span>
        </div>
      ) : (
        <Icon name="heart-slash" className="size-4 shrink-0 self-start fill-neutral-700" />
      )}
    </Link>
  );
}

const STEP = 5;

const followedSlugs = new Set(followedChannels.map((c) => c.slug));
const recommended = livestreams.filter((s) => !followedSlugs.has(s.channel.slug));

function RailRow({ slug, username, avatar, live }: { slug: string; username: string; avatar: string; live: boolean }) {
  return (
    <Link
      to={`/${slug}`}
      title={username}
      className="flex h-11 w-full shrink-0 items-center justify-center rounded state-layer-surface"
    >
      <img
        src={avatar}
        alt={username}
        className={`size-7 shrink-0 rounded-full ${
          live
            ? "ring-2 ring-primary-base ring-offset-2 ring-offset-surface-lowest"
            : "mix-blend-luminosity grayscale"
        }`}
      />
    </Link>
  );
}

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const [shown, setShown] = useState(10);

  if (collapsed) {
    return (
      <div
        id="sidebar-wrapper"
        className="absolute bottom-0 left-0 top-[var(--navbar-height)] z-[401] flex h-full max-h-[calc(100%-var(--navbar-height))] w-[var(--sidebar-collapsed-width)] shrink-0 select-none flex-col overflow-hidden bg-surface-lowest xl:relative xl:inset-0 xl:max-h-full"
      >
        <ul className="flex w-full flex-col px-2">
          {navItems.map((item) =>
            item.to === "/multiview" ? (
              <li key={item.to}>
                <MultiviewNavItem collapsed />
              </li>
            ) : (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  title={item.label}
                  className={({ isActive }) =>
                    `group relative box-border flex h-12 w-full items-center justify-center rounded py-1 transition-all state-layer-surface ${
                      isActive ? "bg-surface-highest text-white" : "bg-transparent text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <Icon
                      name={isActive ? item.activeIcon : item.icon}
                      className="size-4 shrink-0 fill-current"
                    />
                  )}
                </NavLink>
              </li>
            ),
          )}
        </ul>

        <div className="w-full">
          <div className="h-px w-full bg-outline-decorative" />
        </div>

        <div className="no-scrollbar flex h-full max-h-full flex-col overflow-y-auto px-2">
          <div className="flex h-9 w-full items-center justify-center text-subtle">
            <Icon name="nav-following-active" className="size-4" />
          </div>
          {followedChannels.map((c) => (
            <RailRow key={c.slug} slug={c.slug} username={c.username} avatar={c.avatar} live={c.live} />
          ))}
          <div className="flex h-9 w-full items-center justify-center text-subtle">
            <Icon name="nav-browse-active" className="size-4" />
          </div>
          {recommended.map((s) => (
            <RailRow
              key={s.id}
              slug={s.channel.slug}
              username={s.channel.username}
              avatar={s.channel.avatar}
              live
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      id="sidebar-wrapper"
      className="absolute bottom-0 left-0 top-[var(--navbar-height)] z-[401] flex h-full max-h-[calc(100%-var(--navbar-height))] w-[var(--sidebar-expanded-width)] shrink-0 select-none flex-col overflow-hidden bg-surface-lowest xl:relative xl:inset-0 xl:max-h-full"
    >
      <ul className="flex w-full flex-col px-2">
        {navItems.map((item) =>
          item.to === "/multiview" ? (
            <li key={item.to}>
              <MultiviewNavItem collapsed={false} />
            </li>
          ) : (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                data-testid={`sidebar-${item.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `${navLinkClass} ${isActive ? "!bg-secondary-base" : "bg-transparent"}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      name={isActive ? item.activeIcon : item.icon}
                      className="size-4 shrink-0 fill-current"
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ),
        )}
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
            {followedChannels.map((c, i) => (
              <ChannelRow
                key={c.slug}
                {...c}
                category={c.live ? c.category : undefined}
                testId={`sidebar-following-channel-${i + 1}`}
              />
            ))}
          </section>

          <section className="flex w-full flex-col p-3">
            <div className="flex h-9 w-full items-center px-1.5 text-sm font-semibold leading-[1.2]">
              Recommended
            </div>
            {recommended.slice(0, shown).map((s, i) => (
              <ChannelRow
                key={s.id}
                slug={s.channel.slug}
                username={s.channel.username}
                avatar={s.channel.avatar}
                category={s.category.name}
                viewers={s.hide_viewer_count ? undefined : s.viewer_count}
                live
                testId={`sidebar-recommended-channel-${i + 1}`}
              />
            ))}
            <div className="flex h-9 w-full items-center justify-between px-1.5">
              {shown < recommended.length ? (
                <button
                  type="button"
                  onClick={() => setShown((n) => Math.min(n + STEP, recommended.length))}
                  className="text-xs font-semibold text-subtle betterhover:hover:text-white"
                >
                  Show More
                </button>
              ) : (
                <span />
              )}
              {shown > STEP ? (
                <button
                  type="button"
                  data-testid="sidebar-show-less-recommended"
                  onClick={() => setShown((n) => Math.max(n - STEP, STEP))}
                  className="text-xs font-semibold text-subtle betterhover:hover:text-white"
                >
                  Show Less
                </button>
              ) : (
                <span />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
