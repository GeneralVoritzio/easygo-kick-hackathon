import { Link, useParams } from "react-router-dom";
import { Icon } from "../Icon";
import { RemindButton, StreamerRow } from "../components/EventBits";
import { useEvents } from "../EventsStore";
import {
  eventFor,
  eventStreamers,
  formatEventTime,
  formatEventWindow,
  formatSlowMode,
  isLiveWindow,
  startsInLabel,
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

// The banner block copies the offline page: a full width banner with one card over it, top left.
function EventBanner({ event }: { event: KickEvent }) {
  const live = isLiveWindow(event);

  return (
    <div className="relative block h-[var(--channel-desktop-banner-height)] w-full shrink-0 overflow-hidden bg-black">
      <img
        src={event.banner}
        alt=""
        className="absolute inset-x-0 top-0 h-full w-full object-cover"
      />
      <div className="z-player absolute left-7 top-7 flex h-fit w-fit items-center gap-4 rounded bg-surface-base p-5 font-bold leading-[1.2]">
        <span
          className={`rounded-[2px] p-1 text-sm font-bold uppercase leading-5 ${
            live ? "bg-green-500 text-surface-lowest" : "bg-white text-surface-lowest"
          }`}
        >
          {live ? "Live" : "Event"}
        </span>
        <h2 className="text-2xl font-bold leading-8 text-white">
          {live ? `Runs until ${formatEventTime(event.end_at)} UTC` : startsInLabel(event)}
        </h2>
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

  if (!event) return <EventNotFound slug={slug} />;

  const streamers = eventStreamers(event);

  return (
    <div className="flex w-full flex-col">
      <EventBanner event={event} />

      <div className="flex w-full flex-row items-start justify-between gap-4 px-4 py-4 lg:px-7">
        <div className="flex min-w-0 flex-row items-start gap-3 lg:gap-4">
          <img
            src={event.poster}
            alt={event.title}
            className="aspect-[9/16] w-[64px] shrink-0 rounded object-cover lg:w-[84px]"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="truncate text-xl font-bold leading-[1.4] text-white">{event.title}</h1>
            <Link
              to={`/${event.host_channel.slug}`}
              className="flex items-center gap-1.5 text-sm font-semibold leading-[1.2] text-white betterhover:hover:underline"
            >
              <img src={event.host_channel.avatar} alt="" className="size-5 shrink-0 rounded-full" />
              {event.host_channel.username}
              {event.host_channel.verified && <Icon name="verified" className="size-4 shrink-0" />}
            </Link>
            <span className="flex items-center gap-1 text-sm font-bold leading-[1.2] text-white">
              <Icon name="chatters" className="size-4 shrink-0 fill-white" />
              <span className="text-primary-base">{streamers.length}</span> streamers
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <RemindButton event={event} />
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 px-4 pb-6 lg:flex-row lg:gap-8 lg:px-7">
        <section className="flex min-w-0 grow flex-col gap-3">
          <h2 className="text-base font-bold leading-[1.2] text-white lg:text-xl">
            Streamers in this event
          </h2>
          <ul className="flex flex-col" data-testid="event-streamers">
            {streamers.map((p) => (
              <StreamerRow key={p.channel.slug} participant={p} />
            ))}
          </ul>
        </section>

        <aside className="flex shrink-0 flex-col gap-4 lg:w-[320px]">
          <section className="flex flex-col gap-2">
            <h2 className="text-base font-bold leading-[1.2] text-white lg:text-xl">Description</h2>
            <p className="text-sm font-normal leading-6 text-surface-onSurfaceSecondary">
              {event.description}
            </p>
          </section>

          <div className="h-px w-full bg-outline-decorative" />

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold leading-[1.2] text-white lg:text-xl">
              Event details
            </h2>
            <DetailRow label="When">{formatEventWindow(event.start_at, event.end_at)}</DetailRow>
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
