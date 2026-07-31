import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Icon, type KickIconName } from "../Icon";
import { isInEvent } from "../events/events";
import { followedChannels, livestreams, formatViewers } from "../mock/api";
import { eventForChannel, type KickEvent } from "../mock/events";
import { useEvents } from "../EventsStore";

const navItems: { to: string; label: string; icon: KickIconName; activeIcon: KickIconName }[] = [
  { to: "/", label: "Home", icon: "nav-home", activeIcon: "nav-home-active" },
  { to: "/browse", label: "Browse", icon: "nav-browse", activeIcon: "nav-browse-active" },
  { to: "/following", label: "Following", icon: "nav-following", activeIcon: "nav-following-active" },
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
  testId,
  event,
}: {
  slug: string;
  username: string;
  avatar: string;
  category?: string;
  viewers?: number;
  live: boolean;
  testId?: string;
  event?: KickEvent;
}) {
  return (
    // The event chip is a link of its own, so the channel link stretches over the row instead of
    // wrapping it. A link cannot hold a link. The stretched link comes last, so it paints above the
    // row content, and the chip lifts itself back above the link.
    <div className="relative flex h-11 w-full flex-row items-center gap-x-2 rounded px-1.5 py-1 state-layer-surface">
      <div className="relative size-7 shrink-0">
        <img
          src={avatar}
          alt={username}
          className={`h-full w-full overflow-hidden rounded-full ${
            live ? "" : "mix-blend-luminosity grayscale"
          }`}
        />
      </div>
      <div className="relative flex min-w-0 max-w-full shrink grow flex-col gap-0.5">
        <span
          className={`flex min-w-0 items-center gap-1 text-sm font-bold leading-[1.2] ${
            live ? "text-white" : "text-neutral-700"
          }`}
        >
          <span className="truncate">{username}</span>
          {live && isInEvent(slug) && (
            <Icon
              name="dash-broadcast"
              title="In the Iron Cup 2026 event"
              className="size-3 shrink-0 text-primary-base"
            />
          )}
        </span>
        {event ? (
          <Link
            to={`/events/${event.slug}`}
            data-testid="sidebar-event-chip"
            title={event.title}
            className="relative z-10 flex w-fit max-w-full items-center gap-1 truncate text-xs font-bold leading-normal text-surface-onSurfacePrimary betterhover:hover:underline"
          >
            <Icon name="event" className="size-3 shrink-0 fill-current" />
            <span className="truncate">{event.title}</span>
          </Link>
        ) : (
          category && (
            <span className="truncate text-xs font-bold leading-normal text-subtle">
              {category}
            </span>
          )
        )}
      </div>
      {live ? (
        <div className="relative flex w-fit shrink-0 flex-nowrap items-center gap-x-1 self-start text-white">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-semibold">
            {viewers === undefined ? "LIVE" : formatViewers(viewers)}
          </span>
        </div>
      ) : (
        <Icon name="heart-slash" className="size-4 shrink-0 self-start fill-neutral-700" />
      )}
      <Link
        to={`/${slug}`}
        data-testid={testId}
        aria-label={username}
        className="absolute inset-0"
      />
    </div>
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
  const { events } = useEvents();
  const eventFor = (slug: string) => eventForChannel(events, slug);

  if (collapsed) {
    return (
      <div
        id="sidebar-wrapper"
        className="absolute bottom-0 left-0 top-[var(--navbar-height)] z-[401] flex h-full max-h-[calc(100%-var(--navbar-height))] w-[var(--sidebar-collapsed-width)] shrink-0 select-none flex-col overflow-hidden bg-surface-lowest xl:relative xl:inset-0 xl:max-h-full"
      >
        <ul className="flex w-full flex-col px-2">
          {navItems.map((item) => (
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
          ))}
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
        {navItems.map((item) => (
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
            {followedChannels.map((c, i) => (
              <ChannelRow
                key={c.slug}
                {...c}
                category={c.live ? c.category : undefined}
                event={eventFor(c.slug)}
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
                event={eventFor(s.channel.slug)}
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
