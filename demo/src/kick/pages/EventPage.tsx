import { Link, useParams } from "react-router-dom";
import { Icon } from "../Icon";
import { RemindButton, StreamerRow } from "../components/EventBits";
import { useEvents } from "../EventsStore";
import { currentUser } from "../mock/api";
import {
  canSee,
  eventFor,
  eventStreamers,
  formatEventDay,
  formatEventTime,
  formatEventWindow,
  formatSlowMode,
  isLiveWindow,
  runsFor,
  startsInLabel,
  type EventParticipant,
  type KickEvent,
} from "../mock/events";

function EventNotFound({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
      <p className="text-2xl font-bold leading-8 text-white">This event does not exist</p>
      <p className="text-sm font-normal text-surface-onSurfaceSecondary">
        Nothing runs at kick.com/events/{slug}.
      </p>
      <Link
        to="/browse/events"
        className="mt-2 flex h-9 items-center rounded bg-primary-base px-3 text-sm font-semibold text-primary-onPrimary"
      >
        Browse events
      </Link>
    </div>
  );
}

function StreamerAvatars({ participants }: { participants: EventParticipant[] }) {
  return (
    <div className="flex flex-row-reverse items-center">
      {participants
        .slice(0, 5)
        .reverse()
        .map((p) => (
          <img
            key={p.channel.slug}
            src={p.channel.avatar}
            alt={p.channel.username}
            title={p.channel.username}
            className="-ml-2 size-7 rounded-full ring-2 ring-surface-lowest"
          />
        ))}
    </div>
  );
}

// The poster is the page. The banner runs behind it under a scrim, the way the home hero puts a
// gradient over a still, so the poster and the title are the only things a reader lands on.
function EventHero({ event }: { event: KickEvent }) {
  const live = isLiveWindow(event);
  const streamers = eventStreamers(event);

  return (
    <div className="relative w-full overflow-hidden">
      <img src={event.banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,#0B0B0C_0%,rgba(11,11,12,0.88)_38%,rgba(11,11,12,0.45)_72%,rgba(11,11,12,0.15)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface-lowest to-transparent"
      />

      <div className="relative flex flex-row items-end gap-4 px-4 py-5 lg:gap-6 lg:px-7 lg:py-7">
        <img
          src={event.poster}
          alt={event.title}
          className="aspect-[9/16] w-[132px] shrink-0 rounded-lg object-cover shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9)] ring-1 ring-white/10 sm:w-[168px] lg:w-[228px]"
        />

        <div className="flex min-w-0 flex-col gap-2 pb-1 lg:gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-[2px] px-1.5 py-1 text-[10px] font-bold uppercase leading-3 ${
                live ? "bg-green-500 text-[#171A1C]" : "bg-white text-surface-lowest"
              }`}
            >
              {live ? "Live" : "Event"}
            </span>
            <span className="truncate text-sm font-semibold leading-[1.2] text-surface-onSurfacePrimary lg:text-base">
              {live
                ? `Runs until ${formatEventTime(event.end_at)} UTC`
                : `${startsInLabel(event)}, ${formatEventDay(event.start_at)}`}
            </span>
          </div>

          <h1 className="truncate text-2xl font-bold leading-[1.1] text-white lg:text-4xl">
            {event.title}
          </h1>

          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              to={`/${event.host_channel.slug}`}
              className="flex min-w-0 items-center gap-2 text-sm font-bold leading-[1.2] text-white betterhover:hover:underline lg:text-base"
            >
              <img
                src={event.host_channel.avatar}
                alt=""
                className="size-7 shrink-0 rounded-full lg:size-8"
              />
              <span className="truncate">{event.host_channel.username}</span>
              {event.host_channel.verified && <Icon name="verified" className="size-4 shrink-0" />}
            </Link>

            <div className="flex items-center gap-2">
              <StreamerAvatars participants={streamers} />
              <span className="whitespace-nowrap text-sm font-semibold leading-[1.2] text-subtle">
                <span className="text-white">{streamers.length}</span> streamers
              </span>
            </div>
          </div>

          <p className="line-clamp-2 max-w-[68ch] text-sm font-normal leading-6 text-surface-onSurfaceSecondary lg:text-base">
            {event.description}
          </p>

          <div className="flex flex-row items-center gap-2 pt-1">
            <RemindButton event={event} />
            <button
              type="button"
              aria-label="Share"
              className="flex size-10 shrink-0 items-center justify-center rounded bg-secondary-base text-white state-layer-surface"
            >
              <Icon name="share" className="size-4 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold leading-[1.2] text-subtle">{label}</span>
      <span className="text-sm font-normal leading-5 text-white">{children}</span>
    </div>
  );
}

export function EventPage() {
  const { slug = "" } = useParams();
  const { events } = useEvents();
  const event = eventFor(events, slug);

  if (!event || !canSee(event, currentUser.username)) return <EventNotFound slug={slug} />;

  const streamers = eventStreamers(event);

  return (
    <div className="flex w-full flex-col">
      <EventHero event={event} />

      <div className="flex w-full flex-col gap-6 px-4 py-6 lg:flex-row lg:gap-8 lg:px-7">
        <section className="flex min-w-0 grow flex-col gap-3">
          <h2 className="text-base font-bold leading-[1.2] text-white lg:text-xl">
            Streamers in this event
          </h2>
          <ul className="flex max-w-[640px] flex-col" data-testid="event-streamers">
            {streamers.map((p) => (
              <StreamerRow key={p.channel.slug} participant={p} />
            ))}
          </ul>
        </section>

        <aside className="flex shrink-0 flex-col gap-4 lg:w-[320px]">
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold leading-[1.2] text-white lg:text-xl">
              Event details
            </h2>
            <DetailRow label="When">{formatEventWindow(event.start_at, event.end_at)}</DetailRow>
            <DetailRow label="Runs for">{runsFor(event.start_at, event.end_at)}</DetailRow>
            <DetailRow label="Event chat">
              Hosted by {event.host_channel.username}.{" "}
              {formatSlowMode(event.chat.slow_mode_seconds)}.
              {event.chat.is_subscribers_only && " Subscribers only."}
            </DetailRow>
          </section>
        </aside>
      </div>
    </div>
  );
}
