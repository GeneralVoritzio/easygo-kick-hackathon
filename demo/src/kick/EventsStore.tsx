import { createContext, useContext, useState } from "react";
import { cat, channelByUsername, currentUser } from "./mock/api";
import { EVENTS_NOW, events as seedEvents, statusIn, type KickEvent } from "./mock/events";

export type EventDraft = {
  title: string;
  description: string;
  category_slug: string;
  start_at: string;
  end_at: string;
};

export type EventNotification = {
  notification_id: string;
  event_id: string;
  event_slug: string;
  kind: "request_approved" | "request_declined";
  body: string;
  created_at: string;
  is_read: boolean;
};

type EventsValue = {
  events: KickEvent[];
  reminders: string[];
  goLiveEventId: string | null;
  notifications: EventNotification[];
  toggleReminder: (event_id: string) => void;
  createEvent: (draft: EventDraft) => KickEvent;
  inviteStreamer: (event_id: string, username: string) => string | null;
  respondToInvite: (event_id: string, status: "accepted" | "rejected") => void;
  requestToJoin: (event_id: string) => string | null;
  answerRequest: (event_id: string, username: string, status: "accepted" | "rejected") => void;
  selectGoLiveEvent: (event_id: string | null) => void;
  markNotificationsRead: () => void;
};

const EventsContext = createContext<EventsValue | null>(null);

export function useEvents() {
  const value = useContext(EventsContext);
  if (!value) throw new Error("useEvents needs an EventsProvider");
  return value;
}

const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const nowIso = EVENTS_NOW.toISOString();

const HOST_ANSWER_DELAY = 4000;

const slotFor = (status: "accepted" | "rejected", slot_title: string) =>
  status === "accepted" && slot_title === "Asked to join"
    ? "Late addition to the running order"
    : slot_title;

export function EventsProvider({ children }: { children: React.ReactNode }) {
  // fake-kick GET /public/v1/events
  const [events, setEvents] = useState<KickEvent[]>(seedEvents);
  const [reminders, setReminders] = useState<string[]>([]);
  const [goLiveEventId, setGoLiveEventId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<EventNotification[]>([]);

  const patch = (event_id: string, change: (event: KickEvent) => KickEvent) =>
    setEvents((all) => all.map((e) => (e.event_id === event_id ? change(e) : e)));

  // fake-kick POST /public/v1/events/{event_id}/reminders
  // fake-kick DELETE /public/v1/events/{event_id}/reminders
  const toggleReminder = (event_id: string) =>
    setReminders((all) =>
      all.includes(event_id) ? all.filter((id) => id !== event_id) : [...all, event_id],
    );

  // fake-kick POST /public/v1/events
  const createEvent = (draft: EventDraft) => {
    const event: KickEvent = {
      event_id: `01k9event${String(events.length + 1).padStart(4, "0")}`,
      slug: slugify(draft.title),
      title: draft.title,
      description: draft.description,
      host_channel: currentUser,
      category: cat(draft.category_slug),
      start_at: draft.start_at,
      end_at: draft.end_at,
      banner: currentUser.banner,
      is_partner_only: true,
      participants: [
        {
          channel: currentUser,
          role: "host",
          invite_status: "accepted",
          invited_at: nowIso,
          responded_at: nowIso,
          slot_title: "Host",
        },
      ],
      chat: {
        moderators: [],
        slow_mode_seconds: 5,
        is_subscribers_only: false,
        is_followers_only: false,
      },
    };
    setEvents((all) => [...all, event]);
    return event;
  };

  // fake-kick POST /public/v1/events/{event_id}/invites
  const inviteStreamer = (event_id: string, username: string) => {
    const channel = channelByUsername(username);
    if (!channel) return `No channel called ${username}.`;
    if (!channel.is_partner) return `${channel.username} is not a partner, so they cannot join.`;
    const event = events.find((e) => e.event_id === event_id);
    if (!event) return "That event no longer exists.";
    if (event.participants.some((p) => p.channel.slug === channel.slug))
      return `${channel.username} is already on the running order.`;

    patch(event_id, (e) => ({
      ...e,
      participants: [
        ...e.participants,
        {
          channel,
          role: "guest",
          invite_status: "pending",
          invited_at: nowIso,
          responded_at: null,
          slot_title: "Guest slot",
        },
      ],
    }));
    return null;
  };

  // fake-kick PATCH /public/v1/events/{event_id}/invites/{user_id}
  const respondToInvite = (event_id: string, status: "accepted" | "rejected") =>
    patch(event_id, (e) => ({
      ...e,
      participants: e.participants.map((p) =>
        p.channel.username === currentUser.username
          ? { ...p, invite_status: status, responded_at: nowIso }
          : p,
      ),
    }));

  // fake-kick POST /public/v1/events/{event_id}/join-requests
  const requestToJoin = (event_id: string) => {
    const event = events.find((e) => e.event_id === event_id);
    if (!event) return "That event no longer exists.";
    if (!currentUser.is_partner) return "Only a partner can join an event.";
    const already = statusIn(event, currentUser.username);
    if (already) return "You are already on this running order.";

    patch(event_id, (e) => ({
      ...e,
      participants: [
        ...e.participants,
        {
          channel: currentUser,
          role: "guest",
          invite_status: "requested",
          invited_at: nowIso,
          responded_at: null,
          slot_title: "Asked to join",
        },
      ],
    }));
    answerLater(event);
    return null;
  };

  // fake-kick PATCH /public/v1/events/{event_id}/join-requests/{user_id}
  const answerRequest = (
    event_id: string,
    username: string,
    status: "accepted" | "rejected",
  ) =>
    patch(event_id, (e) => ({
      ...e,
      participants: e.participants.map((p) =>
        p.channel.username === username
          ? { ...p, invite_status: status, responded_at: nowIso, slot_title: slotFor(status, p.slot_title) }
          : p,
      ),
    }));

  // There is no second user in this demo, so the host answers on a timer. Say so in the pitch.
  function answerLater(event: KickEvent) {
    setTimeout(() => {
      setEvents((all) =>
        all.map((e) =>
          e.event_id === event.event_id
            ? {
                ...e,
                participants: e.participants.map((p) =>
                  p.channel.username === currentUser.username && p.invite_status === "requested"
                    ? {
                        ...p,
                        invite_status: "accepted",
                        responded_at: nowIso,
                        slot_title: "Late addition to the running order",
                      }
                    : p,
                ),
              }
            : e,
        ),
      );
      setNotifications((all) => [
        {
          notification_id: `01k9notif${String(all.length + 1).padStart(4, "0")}`,
          event_id: event.event_id,
          event_slug: event.slug,
          kind: "request_approved",
          body: `${event.host_channel.username} approved your request to join ${event.title}.`,
          created_at: nowIso,
          is_read: false,
        },
        ...all,
      ]);
    }, HOST_ANSWER_DELAY);
  }

  // fake-kick PATCH /public/v1/channels/livestream/event
  const selectGoLiveEvent = (event_id: string | null) => setGoLiveEventId(event_id);

  const markNotificationsRead = () =>
    setNotifications((all) =>
      all.every((n) => n.is_read) ? all : all.map((n) => ({ ...n, is_read: true })),
    );

  return (
    <EventsContext.Provider
      value={{
        events,
        reminders,
        goLiveEventId,
        notifications,
        toggleReminder,
        createEvent,
        inviteStreamer,
        respondToInvite,
        requestToJoin,
        answerRequest,
        selectGoLiveEvent,
        markNotificationsRead,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}
