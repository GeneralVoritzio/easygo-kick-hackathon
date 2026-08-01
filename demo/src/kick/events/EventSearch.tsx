import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../Icon";
import {
  categories,
  channelProfiles,
  formatViewers,
  livestreams,
  liveStreamFor,
  type Livestream,
} from "../mock/api";
import { MULTIVIEW_CAP } from "./events";
import { useEvent } from "./EventProvider";
import { HypeStars } from "./HypeStars";
import { useEvents } from "../EventsStore";
import {
  eventForChannel,
  eventStreamers,
  isLiveWindow,
  liveSeats,
  publicUpcoming,
  type KickEvent,
} from "../mock/events";

function ResultRow({
  stream,
  pinned,
  full,
  onPin,
  onOpen,
}: {
  stream: Livestream;
  pinned: boolean;
  full: boolean;
  onPin: () => void;
  onOpen: () => void;
}) {
  const { hypeTiers } = useEvent();
  const hypeTier = hypeTiers[stream.channel.slug] ?? 0;
  return (
    <div
      role="button"
      tabIndex={0}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onOpen}
      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 state-layer-surface"
    >
      <img src={stream.channel.avatar} alt="" className="size-7 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1">
          <span className="truncate text-sm font-bold text-white">
            {stream.channel.username}
          </span>
          {hypeTier > 0 && <HypeStars tier={hypeTier} size="size-3.5" />}
        </span>
        <span className="block truncate text-xs text-surface-onSurfaceSecondary">
          {stream.category.name}
        </span>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-white">
        <span className="size-1.5 rounded-full bg-green-500" />
        {formatViewers(stream.viewer_count)}
      </span>
      <button
        type="button"
        disabled={pinned || full}
        onClick={(e) => {
          e.stopPropagation();
          onPin();
        }}
        className="h-7 shrink-0 rounded bg-secondary-base px-2 text-xs font-semibold text-secondary-onSecondary disabled:bg-disabled-base disabled:text-disabled-onSurface"
      >
        {pinned ? "Pinned" : "Pin"}
      </button>
    </div>
  );
}

function LivePill() {
  return (
    <span className="shrink-0 rounded-[2px] bg-green-500 px-1.5 py-0.5 text-xs font-bold leading-3 text-[#171A1C]">
      Live
    </span>
  );
}

function Row({ onOpen, children }: { onOpen: () => void; children: ReactNode }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onOpen}
      className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 state-layer-surface"
    >
      {children}
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-outline-decorative pb-1 last:border-b-0">
      <span className="block px-2 pb-1 pt-2 text-sm text-neutral-400">{label}</span>
      {children}
    </div>
  );
}

// The sections copy the live kick.com search dropdown: Channels, Categories and
// Livestreams. Events is ours, and it is the only new section.
function GlobalResults({ query, onOpen }: { query: string; onOpen: (to: string) => void }) {
  const q = query.toLowerCase();
  const { events: allEvents } = useEvents();
  const { hypeTiers } = useEvent();
  const channels = channelProfiles
    .filter((p) => p.channel.username.toLowerCase().includes(q))
    .slice(0, 3);
  const cats = categories.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 3);
  const streams = livestreams
    .filter((s) => s.session_title.toLowerCase().includes(q))
    .slice(0, 3);
  const events = publicUpcoming(allEvents)
    .filter((e) => e.title.toLowerCase().includes(q))
    .slice(0, 3);
  const empty = !channels.length && !cats.length && !streams.length && !events.length;

  return (
    <>
      {empty && (
        <span className="block px-2 py-2 text-sm text-surface-onSurfaceSecondary">
          No result for {query}.
        </span>
      )}
      {channels.length > 0 && (
        <Section label="Channels">
          {channels.map((p) => (
            <Row key={p.channel.slug} onOpen={() => onOpen(`/${p.channel.slug}`)}>
              <img src={p.channel.avatar} alt="" className="size-8 shrink-0 rounded-full" />
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="truncate text-sm font-bold text-white">
                  {p.channel.username}
                </span>
                {p.channel.verified && <Icon name="verified" className="size-4 shrink-0" />}
                {(hypeTiers[p.channel.slug] ?? 0) > 0 && (
                  <HypeStars tier={hypeTiers[p.channel.slug]} size="size-3.5" />
                )}
              </span>
              {liveStreamFor(p.channel.slug) && <LivePill />}
            </Row>
          ))}
        </Section>
      )}
      {events.length > 0 && (
        <Section label="Events">
          {events.map((e) => (
            <Row key={e.slug} onOpen={() => onOpen(`/events/${e.slug}`)}>
              <Icon name="dash-broadcast" className="size-6 shrink-0 p-0.5 text-primary-base" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-white">{e.title}</span>
                <span className="block truncate text-xs text-surface-onSurfaceSecondary">
                  {eventStreamers(e).length} streamers
                </span>
              </span>
              <LivePill />
            </Row>
          ))}
        </Section>
      )}
      {cats.length > 0 && (
        <Section label="Categories">
          {cats.map((c) => (
            <Row key={c.slug} onOpen={() => onOpen("/browse/categories")}>
              <img src={c.thumbnail} alt="" className="h-10 w-8 shrink-0 rounded object-cover" />
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">
                {c.name}
              </span>
            </Row>
          ))}
        </Section>
      )}
      {streams.length > 0 && (
        <Section label="Livestreams">
          {streams.map((s) => (
            <Row key={s.id} onOpen={() => onOpen(`/${s.channel.slug}`)}>
              <img
                src={s.thumbnail}
                alt=""
                className="h-8 w-14 shrink-0 rounded object-cover"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">
                {s.session_title}
              </span>
            </Row>
          ))}
        </Section>
      )}
    </>
  );
}

// The global search carries the event filter while the viewer sits in the event.
// Removing the chip turns it back into a plain search across KICK.
export function EventSearch() {
  const { multiview, pin, boosts } = useEvent();
  const { events } = useEvents();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [chipDismissed, setChipDismissed] = useState(false);
  const [focused, setFocused] = useState(false);

  const slug = location.pathname.split("/")[1] ?? "";
  // The chip follows the event of the channel you are on. Multiview keeps it while it is open.
  const onChannelEvent = eventForChannel(events, slug);
  const contextEvent: KickEvent | undefined =
    onChannelEvent ?? (multiview.active ? events.find(isLiveWindow) : undefined);
  const inEventContext = Boolean(contextEvent);
  const chipOn = inEventContext && !chipDismissed;
  const full = multiview.slots.length >= MULTIVIEW_CAP;

  const boosted = (slug: string) => (boosts[slug] ?? 0) > Date.now();
  const pool = (contextEvent ? liveSeats(contextEvent) : [])
    .filter((s) =>
      query ? s.channel.username.toLowerCase().includes(query.toLowerCase()) : true,
    )
    .sort((a, b) => Number(boosted(b.channel.slug)) - Number(boosted(a.channel.slug)));
  const open = focused && (chipOn || query.trim().length > 0);

  function openResult(to: string) {
    setFocused(false);
    navigate(to);
  }

  return (
    <form
      data-testid="search"
      className="relative flex items-center gap-2"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="min-w-0 flex-1">
        <div className="flex h-8 items-center gap-2 rounded border border-outline-region px-3 transition-colors duration-200 ease-in-out betterhover:hover:border-neutral-300 focus-within:border-white">
          <Icon name="search" className="size-4 shrink-0 fill-current" />
          {chipOn && (
            <button
              type="button"
              onClick={() => setChipDismissed(true)}
              title="Remove the event filter"
              className="flex shrink-0 items-center gap-1 rounded-full bg-secondary-base px-2 py-0.5 text-xs font-semibold leading-4 text-secondary-onSecondary"
            >
              {contextEvent?.title}
              <Icon name="close" className="size-2.5" />
            </button>
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search"
            aria-label="Search"
            className="flex w-full border-solid bg-transparent text-base text-white outline-none placeholder:text-surface-onSurfaceSecondary"
          />
          <div
            className={`transition-all ease-out ${
              query ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
            }`}
          >
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="flex size-[13px] items-center justify-center"
            >
              <Icon name="clear-search" className="size-[13px] fill-current" />
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="absolute inset-x-0 top-full mt-1 max-h-96 overflow-y-auto rounded bg-surface-base p-1 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
          {chipOn ? (
            <>
              {pool.length === 0 && (
                <span className="block px-2 py-2 text-sm text-surface-onSurfaceSecondary">
                  No streamer in the event matches.
                </span>
              )}
              {pool.map((s) => (
                <ResultRow
                  key={s.id}
                  stream={s}
                  pinned={multiview.slots.includes(s.channel.slug)}
                  full={full}
                  onPin={() => pin(s.channel.slug)}
                  onOpen={() => openResult(`/${s.channel.slug}`)}
                />
              ))}
            </>
          ) : (
            <GlobalResults query={query} onOpen={openResult} />
          )}
        </div>
      )}
    </form>
  );
}
