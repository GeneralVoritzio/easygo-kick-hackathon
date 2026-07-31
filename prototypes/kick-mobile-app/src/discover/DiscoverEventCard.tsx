import { useState } from 'react';
import { Bell, BellRing, Clock } from 'lucide-react';
import type { DiscoverEvent } from '@shared/types';

const EVENT_LABEL: Record<DiscoverEvent['kind'], string> = {
  tournament: 'Tournament',
  charity_stream: 'Charity Stream',
  collab: 'Collab',
  irl_meetup: 'IRL Meetup',
  launch: 'Launch',
};

function formatWhen(startsAt: string): string {
  const diffMs = new Date(startsAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Live now';
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days >= 1) return `In ${days} day${days === 1 ? '' : 's'}`;
  const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
  return `In ${hours} hour${hours === 1 ? '' : 's'}`;
}

interface DiscoverEventCardProps {
  event: DiscoverEvent;
  onOpen?: () => void;
}

/** A platform-wide happening — live ones open their broadcast directly when
 *  a `streamId` is set; ones that haven't started have nothing to embed
 *  yet, so they render inert. */
export function DiscoverEventCard({ event, onOpen }: DiscoverEventCardProps) {
  const [notifying, setNotifying] = useState(false);

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-bold uppercase tracking-wider text-ink-muted">
          {EVENT_LABEL[event.kind]} · {event.category}
        </span>
        {event.isLive && (
          <span className="flex shrink-0 items-center gap-1 rounded bg-live px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
            <span className="h-1.5 w-1.5 animate-live-pulse rounded-full bg-white" />
            Live
          </span>
        )}
      </div>
      <h4 className="mt-1.5 text-lg font-semibold text-ink-bright">{event.title}</h4>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        {event.streamers.map((streamer) => (
          <span key={streamer.name} className="flex items-center gap-1.5">
            <img src={streamer.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
            <span className="text-sm text-ink-muted">{streamer.name}</span>
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Clock size={14} strokeWidth={2.25} />
          <span className="tabular">{formatWhen(event.startsAt)}</span>
        </div>
        {!event.isLive && (
          <button
            type="button"
            onClick={() => setNotifying((n) => !n)}
            aria-pressed={notifying}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              notifying ? 'bg-kick/25 text-kick ring-1 ring-kick/50' : 'bg-raised text-ink'
            }`}
          >
            {notifying ? <BellRing size={13} strokeWidth={2.5} /> : <Bell size={13} strokeWidth={2.5} />}
            {notifying ? 'Notified' : 'Notify me'}
          </button>
        )}
      </div>
    </>
  );

  if (event.isLive && onOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="block w-full rounded-lg border border-line bg-surface p-4 text-left transition-colors hover:bg-raised"
      >
        {body}
      </button>
    );
  }

  return <div className="rounded-lg border border-line bg-surface p-4">{body}</div>;
}
