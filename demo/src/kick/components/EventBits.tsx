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
  hasFinished,
  isLiveWindow,
  liveParticipant,
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

// A live event does not need a reminder, it needs a way in. A finished one needs neither.
export function EventAction({ event }: { event: KickEvent }) {
  const live = isLiveWindow(event);
  const joinable = live ? liveParticipant(event) : undefined;

  if (hasFinished(event)) return null;

  if (live) {
    return joinable ? (
      <Link
        to={`/${joinable.channel.slug}`}
        data-testid="join-event"
        className="flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded bg-primary-base px-3 py-2 text-base font-semibold text-primary-onPrimary transition-all select-none state-layer-base betterhover:active:scale-[0.98]"
      >
        <span className="size-2 shrink-0 rounded-full bg-primary-onPrimary" />
        Join event
      </Link>
    ) : (
      <span
        data-testid="join-event-waiting"
        className="flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded bg-secondary-base px-3 py-2 text-base font-semibold text-subtle"
      >
        Nobody is live yet
      </span>
    );
  }

  return <RemindButton event={event} />;
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

export function StreamerRow({
  participant,
  eventLive,
}: {
  participant: EventParticipant;
  eventLive?: boolean;
}) {
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
      {live ? (
        <Link
          to={`/${channel.slug}`}
          data-testid={`watch-${channel.slug}`}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded bg-secondary-base px-3 text-sm font-semibold text-white state-layer-surface"
        >
          <span className="size-2 rounded-full bg-primary-base" />
          Watch
        </Link>
      ) : (
        eventLive && (
          <span className="shrink-0 whitespace-nowrap px-1 text-sm font-semibold text-subtle">
            Not live yet
          </span>
        )
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

// The card is landscape like every other card on the site. The portrait poster belongs to the
// detail page. The card is still its own component: no tags, a host line, and the running order.
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
          src={event.poster}
          alt={event.title}
          // A poster carries its title at the top, so a landscape crop keeps the top.
          className="h-full w-full object-cover object-top"
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
        {reminded && !live && (
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

      <div className="flex w-full min-w-0 flex-row flex-nowrap gap-2 lg:px-1.5 lg:py-2">
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
            className="w-full truncate text-sm font-semibold leading-5 text-white"
          >
            {event.title}
          </Link>
          <span className="max-w-full truncate text-base font-normal leading-6 text-surface-onSurfaceSecondary">
            {event.host_channel.username}
          </span>
        </div>
      </div>
      <CornerMarks />
    </div>
  );
}

const EVENT_CARD_WIDTH = "[&>div]:w-[248px] [&>div]:max-w-full";

// A stretching grid gave a card one size in the full width Upcoming view and another in the
// narrower Calendar column, because a column count reads the viewport and not the box. A wrapping
// row of fixed width cards is one size everywhere, and RewardGrid already does this.
const eventWrap = `flex flex-wrap gap-x-4 gap-y-5 lg:gap-y-6 ${EVENT_CARD_WIDTH}`;

// A one row scroller turns into a grid at lg, so that path still needs a column count.
const eventRowColumns =
  "h-full grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 group-data-[sidebar=false]/main:xl:grid-cols-5 group-data-[sidebar=false]/main:2xl:grid-cols-6 group-data-[sidebar=false]/main:3xl:grid-cols-7";

export function EventGrid({ events, oneRow }: { events: KickEvent[]; oneRow?: boolean }) {
  return (
    <section
      className={
        oneRow ? `${eventRowColumns} ${oneRowGrid} ${EVENT_CARD_WIDTH}` : eventWrap
      }
    >
      {events.map((event) => (
        <EventCard key={event.event_id} event={event} />
      ))}
    </section>
  );
}
