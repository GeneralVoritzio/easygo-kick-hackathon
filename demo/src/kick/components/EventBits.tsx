import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { CornerMarks, Pill, PillRow, ThumbBadge } from "./CardBits";
import { oneRowGrid } from "./Layout";
import { streamColumns } from "./StreamCard";
import { useEvents } from "../EventsStore";
import { liveStreamFor } from "../mock/api";
import {
  eventStreamers,
  formatEventDay,
  formatEventTime,
  isLiveWindow,
  startsInLabel,
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

export function EventTimeRow({ event }: { event: KickEvent }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold leading-5">
      <Icon name="event" className="size-4 shrink-0 fill-current" />
      <span className={isLiveWindow(event) ? "text-primary-base" : "text-white"}>
        {startsInLabel(event)}
      </span>
      <span className="text-subtle">{formatEventDay(event.start_at)}</span>
    </div>
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
      className="absolute bottom-1.5 right-1.5 flex flex-row-reverse items-center"
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

export function EventCard({ event }: { event: KickEvent }) {
  const { reminders } = useEvents();
  const streamers = eventStreamers(event);
  const live = isLiveWindow(event);
  const reminded = reminders.includes(event.event_id);

  return (
    <div className="group/card relative flex w-full shrink-0 grow-0 flex-col gap-2 will-change-transform lg:gap-0">
      <Link
        to={`/events/${event.slug}`}
        className="relative block aspect-video w-full select-none overflow-hidden rounded"
      >
        <img
          src={event.category.thumbnail}
          alt={event.title}
          className="aspect-video w-full object-cover brightness-110 contrast-[110%]"
        />
        <ThumbBadge
          corner="top-left"
          className={live ? "uppercase text-primary-base" : "text-white"}
        >
          {live ? "Live now" : formatEventDay(event.start_at)}
        </ThumbBadge>
        <ThumbBadge corner="bottom-left">{formatEventTime(event.start_at)} UTC</ThumbBadge>
        {reminded && (
          <span
            data-testid="card-reminder"
            title="Reminder set"
            className="absolute right-1.5 top-1.5 flex items-center rounded bg-surface-lowest px-1 py-1 text-primary-base"
          >
            <Icon name="heart-filled" className="size-3.5 fill-current" />
          </span>
        )}
        <AvatarStack participants={streamers} />
      </Link>

      <div className="flex w-full flex-row flex-nowrap gap-2 lg:px-1.5 lg:py-2">
        <Link to={`/${event.host_channel.slug}`} className="shrink-0">
          <img
            src={event.host_channel.avatar}
            alt={event.host_channel.username}
            className="size-11 shrink-0 rounded-full"
          />
        </Link>
        <div className="flex w-full min-w-0 flex-col items-start">
          <Link
            to={`/events/${event.slug}`}
            className="max-w-full truncate text-sm font-semibold leading-5 text-white"
          >
            {event.title}
          </Link>
          <span className="max-w-full truncate text-base font-normal leading-6 text-surface-onSurfaceSecondary">
            Hosted by {event.host_channel.username}
          </span>
          <PillRow pills={[event.category.name]} />
        </div>
      </div>
      <CornerMarks />
    </div>
  );
}

export function EventGrid({ events, oneRow }: { events: KickEvent[]; oneRow?: boolean }) {
  return (
    <section
      className={`${streamColumns} ${
        oneRow ? `${oneRowGrid} [&>div]:w-[268px]` : "grid gap-y-5 lg:gap-y-6"
      }`}
    >
      {events.map((event) => (
        <EventCard key={event.event_id} event={event} />
      ))}
    </section>
  );
}
