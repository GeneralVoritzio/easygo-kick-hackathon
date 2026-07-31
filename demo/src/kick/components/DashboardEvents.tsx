import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { Pane, Panel } from "./DashboardPanel";
import { buttonClass, inputClass, labelClass } from "./FormBits";
import { InviteStatusPill, PartnerNotice } from "./EventBits";
import { useEvents, type EventNotification } from "../EventsStore";
import { currentUser } from "../mock/api";
import {
  byStartAt,
  formatEventWindow,
  invitesFor,
  requestsOn,
  isLiveWindow,
  startsInLabel,
  waitingOn,
  takesPart,
  type KickEvent,
} from "../mock/events";

const blankDraft = {
  title: "",
  description: "",
  startsAt: "2026-08-15T18:00",
  endsAt: "2026-08-15T22:00",
};

// A datetime-local field reads as local time, and every fixture time is UTC.
const asUtc = (local: string) => `${local}:00Z`;

function CreateEventForm() {
  const { createEvent } = useEvents();
  const [draft, setDraft] = useState(blankDraft);
  const [created, setCreated] = useState<KickEvent | null>(null);

  const set = (key: keyof typeof blankDraft) => (value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <form
      className="no-scrollbar flex h-full w-full flex-col gap-3 overflow-y-auto p-4 text-white"
      onSubmit={(e) => {
        e.preventDefault();
        setCreated(
          createEvent({
            title: draft.title,
            description: draft.description,
            start_at: asUtc(draft.startsAt),
            end_at: asUtc(draft.endsAt),
          }),
        );
        setDraft(blankDraft);
      }}
    >
      <PartnerNotice />

      <div>
        <label className={labelClass} htmlFor="event-title">
          Event title
        </label>
        <input
          id="event-title"
          required
          value={draft.title}
          onChange={(e) => set("title")(e.target.value)}
          placeholder="Couch Senate Winter Sessions"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="event-description">
          What happens
        </label>
        <input
          id="event-description"
          required
          value={draft.description}
          onChange={(e) => set("description")(e.target.value)}
          placeholder="Four channels, one running order."
          className={inputClass}
        />
      </div>

      <div className="flex gap-3">
        <div className="min-w-0 grow">
          <label className={labelClass} htmlFor="event-starts">
            Starts (UTC)
          </label>
          <input
            id="event-starts"
            type="datetime-local"
            required
            value={draft.startsAt}
            onChange={(e) => set("startsAt")(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="min-w-0 grow">
          <label className={labelClass} htmlFor="event-ends">
            Ends (UTC)
          </label>
          <input
            id="event-ends"
            type="datetime-local"
            required
            value={draft.endsAt}
            onChange={(e) => set("endsAt")(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <button type="submit" className={`${buttonClass.primary} mt-1 h-9 w-full`}>
        <Icon name="plus" className="size-4" />
        Create event
      </button>

      {created && (
        <p data-testid="create-result" className="text-sm font-normal text-primary-base">
          {created.title} is private. Invite your streamers on the left, then switch it to public.
        </p>
      )}
    </form>
  );
}

function InviteForm({ event }: { event: KickEvent }) {
  const { inviteStreamer } = useEvents();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        const failed = inviteStreamer(event.event_id, username);
        setError(failed);
        if (!failed) setUsername("");
      }}
    >
      <div className="flex items-end gap-2">
        <div className="min-w-0 grow">
          <label className={labelClass} htmlFor={`invite-${event.event_id}`}>
            Invite a streamer by username
          </label>
          <input
            id={`invite-${event.event_id}`}
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="IronVow"
            className={inputClass}
          />
        </div>
        <button type="submit" className={`${buttonClass.secondary} h-9 shrink-0`}>
          <Icon name="plus" className="size-4" />
          Invite
        </button>
      </div>
      {error && (
        <p data-testid="invite-error" className="text-sm font-normal text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}

function PublishRow({ event }: { event: KickEvent }) {
  const { publishEvent } = useEvents();
  const waiting = waitingOn(event);

  if (event.visibility === "public") {
    return (
      <span className="flex w-fit items-center gap-1.5 rounded-full bg-secondary-base px-2 py-1 text-sm font-semibold leading-none text-primary-base">
        <Icon name="event" className="size-3.5 fill-current" />
        Public
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex w-fit items-center gap-1.5 rounded-full bg-secondary-base px-2 py-1 text-sm font-semibold leading-none text-white">
        <Icon name="event" className="size-3.5 fill-current" />
        Private
      </span>
      <button
        type="button"
        disabled={waiting.length > 0}
        data-testid={`publish-${event.slug}`}
        onClick={() => publishEvent(event.event_id)}
        className={`${buttonClass.primary} h-8`}
      >
        Switch to public
      </button>
      {waiting.length > 0 && (
        <span data-testid="publish-blocked" className="text-sm font-normal text-subtle">
          {waiting.length} {waiting.length === 1 ? "streamer has" : "streamers have"} not answered
          yet.
        </span>
      )}
    </div>
  );
}

function MyEvent({ event }: { event: KickEvent }) {
  const { goLiveEventId, answerRequest } = useEvents();
  const hosting = event.host_channel.username === currentUser.username;
  const mySlot = event.participants.find((p) => p.channel.username === currentUser.username);
  const requests = requestsOn(event);

  return (
    <li
      data-testid={`my-event-${event.slug}`}
      className="flex flex-col gap-3 border-b border-outline-decorative px-4 py-4 last:border-b-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            to={`/events/${event.slug}`}
            className="truncate text-sm font-bold text-white betterhover:hover:underline"
          >
            {event.title}
          </Link>
          <span className="text-sm font-normal text-surface-onSurfaceSecondary">
            {formatEventWindow(event.start_at, event.end_at)}
          </span>
        </div>
        <span
          className={`shrink-0 text-sm font-semibold ${
            isLiveWindow(event) ? "text-primary-base" : "text-subtle"
          }`}
        >
          {startsInLabel(event)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex w-fit items-center gap-1.5 rounded-full bg-secondary-base px-2 py-1 text-sm font-semibold leading-none text-white">
          <Icon name="event" className="size-3.5 fill-current" />
          {hosting ? "You host this event" : `You accepted, ${event.host_channel.username} hosts`}
        </span>
        {!hosting && mySlot && (
          <span className="text-sm font-normal text-surface-onSurfaceSecondary">
            {mySlot.slot_title}
          </span>
        )}
        {goLiveEventId === event.event_id && (
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-secondary-base px-2 py-1 text-sm font-semibold leading-none text-primary-base">
            <Icon name="event" className="size-3.5 fill-current" />
            Selected for your next stream
          </span>
        )}
      </div>

      {hosting && <PublishRow event={event} />}

      <ul className="flex flex-col gap-2">
        {event.participants.map((p) => (
          <li key={p.channel.slug} className="flex items-center gap-2">
            <img src={p.channel.avatar} alt="" className="size-7 shrink-0 rounded-full" />
            <span className="min-w-0 grow truncate text-sm font-semibold text-white">
              {p.channel.username}
              {p.role === "host" && (
                <span className="pl-1.5 text-sm font-normal text-subtle">host</span>
              )}
            </span>
            <InviteStatusPill status={p.invite_status} />
          </li>
        ))}
      </ul>

      {hosting && requests.length > 0 && (
        <div className="flex flex-col gap-2 rounded bg-surface-lowest p-3">
          <span className={labelClass}>
            Requests to join
            <span className="pl-1.5 font-normal text-subtle">{requests.length}</span>
          </span>
          {requests.map((p) => (
            <div key={p.channel.slug} className="flex items-center gap-2">
              <img src={p.channel.avatar} alt="" className="size-7 shrink-0 rounded-full" />
              <span className="min-w-0 grow truncate text-sm font-semibold text-white">
                {p.channel.username}
              </span>
              <button
                type="button"
                data-testid={`approve-${p.channel.slug}`}
                onClick={() => answerRequest(event.event_id, p.channel.username, "accepted")}
                className={`${buttonClass.primary} h-8`}
              >
                Approve
              </button>
              <button
                type="button"
                data-testid={`decline-${p.channel.slug}`}
                onClick={() => answerRequest(event.event_id, p.channel.username, "rejected")}
                className={`${buttonClass.secondary} h-8`}
              >
                Decline
              </button>
            </div>
          ))}
        </div>
      )}

      {hosting && <InviteForm event={event} />}
    </li>
  );
}

function ReceivedInvite({ event }: { event: KickEvent }) {
  const { respondToInvite } = useEvents();

  return (
    <li className="flex flex-col gap-3 border-b border-outline-decorative px-4 py-4 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-1">
        <Link
          to={`/events/${event.slug}`}
          className="truncate text-sm font-bold text-white betterhover:hover:underline"
        >
          {event.title}
        </Link>
        <span className="text-sm font-normal text-surface-onSurfaceSecondary">
          {event.host_channel.username} invited you. {formatEventWindow(event.start_at, event.end_at)}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          data-testid={`accept-${event.slug}`}
          onClick={() => respondToInvite(event.event_id, "accepted")}
          className={`${buttonClass.primary} h-9`}
        >
          Accept
        </button>
        <button
          type="button"
          data-testid={`reject-${event.slug}`}
          onClick={() => respondToInvite(event.event_id, "rejected")}
          className={`${buttonClass.secondary} h-9`}
        >
          Reject
        </button>
      </div>
    </li>
  );
}

function NotificationRow({ notification }: { notification: EventNotification }) {
  return (
    <li
      data-testid="event-notification"
      className="flex items-center gap-2 border-b border-outline-decorative px-4 py-3 last:border-b-0"
    >
      <Icon name="event" className="size-4 shrink-0 fill-primary-base" />
      <span className="min-w-0 grow text-sm font-normal text-white">{notification.body}</span>
      <Link
        to={`/events/${notification.event_slug}`}
        className="shrink-0 text-sm font-semibold text-surface-onSurfacePrimary betterhover:hover:underline"
      >
        Open
      </Link>
    </li>
  );
}

function EmptyPane({ message }: { message: string }) {
  return (
    <p className="px-4 py-4 text-sm font-normal text-surface-onSurfaceSecondary">{message}</p>
  );
}

export function DashboardEvents() {
  const { events, notifications } = useEvents();
  const mine = events.filter((e) => takesPart(e, currentUser.username)).sort(byStartAt);
  const invites = invitesFor(events, currentUser.username).sort(byStartAt);

  return (
    <div className="flex h-full w-full flex-row">
      <div className="flex flex-col" style={{ width: "60%" }}>
        <Pane style={{ height: "24%" }}>
          <Panel title="Notifications" icon="dash-activity">
            <div className="no-scrollbar h-full min-h-0 w-full overflow-y-auto">
              {notifications.length === 0 ? (
                <EmptyPane message="Nothing new. Your answer to a request shows up here." />
              ) : (
                <ul className="flex flex-col" data-testid="event-notifications">
                  {notifications.map((n) => (
                    <NotificationRow key={n.notification_id} notification={n} />
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </Pane>
        <Pane style={{ height: "76%" }}>
          <Panel title="Your events" icon="event" bigPopout>
            <div className="no-scrollbar h-full min-h-0 w-full overflow-y-auto">
              {mine.length === 0 ? (
                <EmptyPane message="You are in no events yet. Create one, or accept an invite below." />
              ) : (
                <ul className="flex flex-col" data-testid="my-events">
                  {mine.map((event) => (
                    <MyEvent key={event.event_id} event={event} />
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </Pane>
      </div>

      <div className="flex flex-col" style={{ width: "40%" }}>
        <Pane style={{ height: "62%" }}>
          <Panel title="Create an event" icon="plus">
            <CreateEventForm />
          </Panel>
        </Pane>
        <Pane style={{ height: "38%" }}>
          <Panel title="Invites for you" icon="dash-mod-actions">
            <div className="no-scrollbar h-full min-h-0 w-full overflow-y-auto">
              {invites.length === 0 ? (
                <EmptyPane message="No open invites. A host invites you by username." />
              ) : (
                <ul className="flex flex-col" data-testid="my-invites">
                  {invites.map((event) => (
                    <ReceivedInvite key={event.event_id} event={event} />
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </Pane>
      </div>
    </div>
  );
}
