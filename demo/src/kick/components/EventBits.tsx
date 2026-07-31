import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { CornerMarks, Pill, ThumbBadge } from "./CardBits";
import { oneRowGrid } from "./Layout";
import { useEvents } from "../EventsStore";
import { liveStreamFor } from "../mock/api";
import {
  eventStreamers,
  formatEventDay,
  formatEventTime,
  isLiveWindow,
  type EventInviteStatus,
  type EventParticipant,
  type KickEvent,
} from "../mock/events";

const statusLabel: Record<EventInviteStatus, string> = {
  accepted: "Accepted",
  pending: "Invited",
  requested: "Asked to join",
  rejected: "Rejected",
};

const statusColor: Record<EventInviteStatus, string> = {
  accepted: "text-primary-base",
  pending: "text-surface-onSurfaceSecondary",
  requested: "text-white",
  rejected: "text-neutral-500",
};

export function InviteStatusPill({ status }: { status: EventInviteStatus }) {
  return (
    <span
      className={`flex h-[22px] shrink-0 items-center rounded-full bg-secondary-base px-2 text-sm font-semibold leading-none ${statusColor[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}

export function PartnerNotice() {
  return (
    <p className="flex items-start gap-2 text-sm leading-5 text-surface-onSurfaceSecondary">
      <Icon name="verified" className="mt-0.5 size-4 shrink-0 fill-primary-base" />
      <span>
        Events are for partners only, and the host invites every channel. A channel that is not a
        partner cannot join.
      </span>
    </p>
  );
}

export function RemindButton({ event, wide }: { event: KickEvent; wide?: boolean }) {
  const { reminders, toggleReminder } = useEvents();
  const set = reminders.includes(event.event_id);

  return (
    <button
      type="button"
      aria-pressed={set}
      data-testid="remind-button"
      onClick={() => toggleReminder(event.event_id)}
      className={`flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded px-3 py-2 text-base font-semibold transition-all select-none betterhover:active:scale-[0.98] ${
        wide ? "grow lg:grow-0" : ""
      } ${set ? "bg-secondary-base text-white" : "bg-primary-base text-primary-onPrimary"}`}
    >
      <Icon name={set ? "heart-filled" : "heart"} className="size-4" />
      {set ? "Reminder set" : "Remind me"}
    </button>
  );
}

export function StreamerRow({ participant }: { participant: EventParticipant }) {
  const { channel, role, slot_title } = participant;
  const live = liveStreamFor(channel.slug);

  return (
    <li className="flex items-center gap-3 rounded px-1.5 py-2 state-layer-surface">
      <Link to={`/${channel.slug}`} className="shrink-0">
        <img src={channel.avatar} alt={channel.username} className="size-11 rounded-full" />
      </Link>
      <div className="flex min-w-0 grow flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <Link
            to={`/${channel.slug}`}
            className="truncate text-sm font-bold leading-5 text-white betterhover:hover:underline"
          >
            {channel.username}
          </Link>
          {channel.verified && <Icon name="verified" className="size-4 shrink-0" />}
          {role === "host" && <Pill>Host</Pill>}
        </div>
        <span className="truncate text-sm font-normal leading-5 text-surface-onSurfaceSecondary">
          {slot_title}
        </span>
      </div>
      {live && (
        <Link
          to={`/${channel.slug}`}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded bg-secondary-base px-3 text-sm font-semibold text-white state-layer-surface"
        >
          <span className="size-2 rounded-full bg-primary-base" />
          Watch
        </Link>
      )}
    </li>
  );
}

function AvatarStack({ participants }: { participants: EventParticipant[] }) {
  return (
    <div
      title={`${participants.length} streamers`}
      className="flex flex-row-reverse items-center pr-2"
    >
      {participants
        .slice(0, 4)
        .reverse()
        .map((p) => (
          <img
            key={p.channel.slug}
            src={p.channel.avatar}
            alt={p.channel.username}
            className="-ml-2 size-6 rounded-full ring-2 ring-surface-lowest"
          />
        ))}
    </div>
  );
}

// A poster is portrait, so the card is a poster with a caption under it, not a stream card.
export function EventCard({ event }: { event: KickEvent }) {
  const { reminders } = useEvents();
  const streamers = eventStreamers(event);
  const live = isLiveWindow(event);
  const reminded = reminders.includes(event.event_id);

  return (
    <div className="group/card relative flex w-full shrink-0 grow-0 flex-col items-start will-change-transform">
      <Link
        to={`/events/${event.slug}`}
        className="relative block aspect-[9/16] w-full select-none overflow-hidden rounded-lg"
      >
        <img
          src={event.poster}
          alt={event.title}
          className="h-full w-full object-cover brightness-110 contrast-[110%]"
        />
        <ThumbBadge
          corner="top-left"
          className={live ? "uppercase text-primary-base" : "text-white"}
        >
          {live ? "Live now" : formatEventDay(event.start_at)}
        </ThumbBadge>
        {event.visibility === "private" && (
          <span
            data-testid="card-private"
            className="absolute left-1.5 top-9 rounded bg-surface-lowest px-1 text-sm font-semibold leading-5 text-subtle"
          >
            Private
          </span>
        )}
        {reminded && (
          <span
            data-testid="card-reminder"
            title="Reminder set"
            className="absolute right-1.5 top-1.5 flex items-center rounded bg-surface-lowest p-1 text-primary-base"
          >
            <Icon name="heart-filled" className="size-3.5 fill-current" />
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-surface-lowest to-transparent pb-1.5 pt-8">
          <span className="shrink-0 pl-2 text-sm font-semibold leading-5 text-white">
            {formatEventTime(event.start_at)} UTC
          </span>
          <AvatarStack participants={streamers} />
        </div>
      </Link>

      <div className="flex w-full min-w-0 flex-row flex-nowrap gap-2 p-1 pt-2 lg:pb-3">
        <Link to={`/${event.host_channel.slug}`} className="shrink-0">
          <img
            src={event.host_channel.avatar}
            alt={event.host_channel.username}
            className="size-9 shrink-0 rounded-full"
          />
        </Link>
        <div className="flex w-full min-w-0 flex-col items-start">
          <Link
            to={`/events/${event.slug}`}
            className="w-full truncate text-base font-semibold leading-6 text-white"
          >
            {event.title}
          </Link>
          <span className="max-w-full truncate text-sm font-normal leading-normal text-surface-onSurfaceSecondary">
            {event.host_channel.username}
          </span>
        </div>
      </div>
      <CornerMarks />
    </div>
  );
}

// A poster is narrower than a stream thumbnail, so a row holds one more of them.
export const eventColumns =
  "h-full grid-cols-2 gap-x-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 group-data-[sidebar=false]/main:xl:grid-cols-6 group-data-[sidebar=false]/main:2xl:grid-cols-7";

export function EventGrid({ events, oneRow }: { events: KickEvent[]; oneRow?: boolean }) {
  return (
    <section
      className={`${eventColumns} ${
        oneRow ? `${oneRowGrid} [&>div]:w-[186px]` : "grid gap-y-3 lg:gap-y-6"
      }`}
    >
      {events.map((event) => (
        <EventCard key={event.event_id} event={event} />
      ))}
    </section>
  );
}
