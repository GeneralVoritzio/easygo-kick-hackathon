import { PageShell } from "../components/Layout";
import { SectionHeading } from "../components/CardBits";
import { FollowingTabs } from "../components/FollowingTabs";
import { FollowingEmptyState } from "../components/FollowingEmptyState";
import { EventGrid } from "../components/EventBits";
import { useEvents } from "../EventsStore";
import { byStartAt, EVENTS_NOW } from "../mock/events";

export function FollowingEvents() {
  const { events, reminders } = useEvents();
  // A reminder for something that has finished says nothing, so the list holds what is still to come.
  const reminded = events
    .filter((e) => reminders.includes(e.event_id) && new Date(e.end_at) > EVENTS_NOW)
    .sort(byStartAt);

  return (
    <PageShell>
      <h2 className="text-base font-bold leading-8 text-white lg:text-2xl">Following</h2>
      <div className="flex flex-col gap-y-3 lg:gap-y-6">
        <FollowingTabs />
        <section className="relative flex flex-col gap-y-3 lg:gap-y-4">
          <SectionHeading white="Events you set a reminder for" />
          {reminded.length === 0 ? (
            <FollowingEmptyState
              icon="empty-livestreams"
              message="No reminders yet. Open an event and press Remind me, and it shows up here."
              actionHref="/browse/events"
              actionLabel="Browse events"
            />
          ) : (
            <div data-testid="reminded-events">
              <EventGrid events={reminded} />
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
