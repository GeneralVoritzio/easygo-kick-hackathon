import type { CommunityEvent } from '@shared/types';

const EVENT_LABEL: Record<CommunityEvent['kind'], string> = {
  convention: 'Convention',
  charity_stream: 'Charity Stream',
  community_week: 'Community Week',
  live_event: 'Live Event',
  quest: 'Quest',
};

function formatWhen(startsAt: string): string {
  const days = Math.round((new Date(startsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return days <= 0 ? 'Starting soon' : `In ${days} day${days === 1 ? '' : 's'}`;
}

interface EventsSectionProps {
  events: CommunityEvent[];
}

/** Upcoming (not-currently-live) community happenings — conventions,
 *  charity streams — separate from the live participation panel, which is
 *  only for what's happening right now. */
export function EventsSection({ events }: EventsSectionProps) {
  if (events.length === 0) return null;

  return (
    <section>
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">🎉 Events &amp; Conventions</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {events.map((event) => (
          <div key={event.id} className="rounded-xl border border-line bg-surface p-3">
            <span className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">
              {EVENT_LABEL[event.kind]}
            </span>
            <h4 className="mt-1 text-sm font-bold text-ink-bright">{event.title}</h4>
            <p className="mt-0.5 font-mono text-xs text-ink-muted">{formatWhen(event.startsAt)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
