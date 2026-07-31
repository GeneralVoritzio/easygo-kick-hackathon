import { Link, useParams } from "react-router-dom";
import { Icon } from "../Icon";
import { PageShell } from "../components/Layout";
import { Divider } from "../components/DropBits";
import { PartnerNotice, RemindButton, StreamerRow } from "../components/EventBits";
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

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold leading-5 text-subtle">{label}</span>
      <span className="text-sm font-normal leading-5 text-white">{children}</span>
    </div>
  );
}

function EventHero({ event }: { event: KickEvent }) {
  const live = isLiveWindow(event);

  return (
    <div className="relative overflow-hidden rounded-lg bg-surface-base">
      <img src={event.banner} alt="" className="h-[96px] w-full object-cover lg:h-[132px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-surface-base to-transparent" />
      <div className="relative flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between lg:p-6">
        <div className="flex min-w-0 items-center gap-3 lg:gap-4">
          <img
            src={event.category.thumbnail}
            alt={event.category.name}
            className="h-[86px] w-[64px] shrink-0 rounded object-cover lg:h-[112px] lg:w-[84px]"
          />
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {live && (
                <span className="rounded-[2px] bg-green-500 px-1.5 py-1 text-[10px] font-bold uppercase leading-3 text-[#171A1C]">
                  Live
                </span>
              )}
              <span className="text-sm font-semibold leading-5 text-surface-onSurfacePrimary">
                {live ? `Runs until ${formatEventTime(event.end_at)} UTC` : startsInLabel(event)}
              </span>
            </div>
            <h1 className="truncate text-xl font-bold leading-[1.2] text-white lg:text-3xl">
              {event.title}
            </h1>
            <Link
              to={`/${event.host_channel.slug}`}
              className="flex items-center gap-1.5 text-sm font-semibold leading-5 text-white betterhover:hover:underline"
            >
              <img
                src={event.host_channel.avatar}
                alt=""
                className="size-6 shrink-0 rounded-full"
              />
              Hosted by {event.host_channel.username}
              {event.host_channel.verified && <Icon name="verified" className="size-4 shrink-0" />}
            </Link>
          </div>
        </div>
        <RemindButton event={event} wide />
      </div>
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
    <PageShell column="gap-y-5 lg:gap-y-6">
      <EventHero event={event} />

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <div className="flex min-w-0 grow flex-col gap-5">
          <section className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-white lg:text-xl">About this event</h2>
            <p className="text-sm font-normal leading-6 text-surface-onSurfaceSecondary">
              {event.description}
            </p>
          </section>

          <Divider />

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-white lg:text-xl">
              Streamers in this event
              <span className="pl-2 text-sm font-semibold text-subtle">{streamers.length}</span>
            </h2>
            <ul className="flex flex-col" data-testid="event-streamers">
              {streamers.map((p) => (
                <StreamerRow key={p.channel.slug} participant={p} />
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex shrink-0 flex-col gap-4 rounded-lg bg-surface-base p-4 lg:w-[320px]">
          <h2 className="text-base font-bold text-white">Event details</h2>
          <DetailRow label="When">{formatEventWindow(event.start_at, event.end_at)}</DetailRow>
          <DetailRow label="Category">
            <Link to="/browse/categories" className="betterhover:hover:underline">
              {event.category.name}
            </Link>
          </DetailRow>
          <DetailRow label="Event chat">
            Hosted by {event.host_channel.username}.{" "}
            {formatSlowMode(event.chat.slow_mode_seconds)}.
          </DetailRow>
          <Divider />
          <PartnerNotice />
        </aside>
      </div>
    </PageShell>
  );
}
