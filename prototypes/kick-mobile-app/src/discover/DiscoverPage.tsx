import { useState } from 'react';
import { Calendar, Flame, Radio, type LucideIcon } from 'lucide-react';
import { useLiveStreams } from '@shared/hooks/useLiveStreams';
import { useDiscoverFeed } from '@shared/hooks/useDiscoverFeed';
import { TrendingMultiviewCard } from './TrendingMultiviewCard';
import { DiscoverEventCard } from './DiscoverEventCard';

interface DiscoverPageProps {
  /** Whether the Discover tab is actually the one on screen — gates the Top
   *  Watched previews' `<iframe>`s so they don't keep decoding video while
   *  scrolled away to Home or Profile. */
  active: boolean;
  onOpenMultiview: (streamIds: string[]) => void;
}

type DiscoverSection = 'live' | 'upcoming' | 'trending';

const SUB_TABS: { id: DiscoverSection; label: string; icon: LucideIcon }[] = [
  { id: 'live', label: 'Live Events', icon: Radio },
  { id: 'upcoming', label: 'Upcoming', icon: Calendar },
  { id: 'trending', label: 'Top Watched', icon: Flame },
];

/** The Discover tab: what's worth watching across Kick right now, not one
 *  creator's own community. A sub-nav switches between the three sections
 *  rather than stacking them all in one long scroll — Live Events, Upcoming
 *  Events, and Top Watched Multiviews (combos other viewers currently have
 *  pinned together; tapping one pins the same combo into the Home tab's
 *  focus mosaic). */
export function DiscoverPage({ active, onOpenMultiview }: DiscoverPageProps) {
  const [section, setSection] = useState<DiscoverSection>('live');
  const { streams, loading: streamsLoading } = useLiveStreams();
  const { events, trendingMultiviews, loading: feedLoading } = useDiscoverFeed();

  if (streamsLoading || feedLoading) {
    return <p className="text-sm text-ink">Loading what's live…</p>;
  }

  const liveEvents = events.filter((e) => e.isLive);
  const upcomingEvents = events.filter((e) => !e.isLive);

  return (
    <div>
      <div className="mb-4 flex border-b border-line">
        {SUB_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = id === section;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                isActive ? 'border-kick text-kick' : 'border-transparent text-ink-muted'
              }`}
            >
              <Icon size={14} strokeWidth={2.5} />
              {label}
            </button>
          );
        })}
      </div>

      {section === 'live' && (
        <div className="space-y-3">
          {liveEvents.length === 0 && <p className="text-sm text-ink-muted">No live events right now.</p>}
          {liveEvents.map((event) => {
            const streamIds = event.streamIds;
            return (
              <DiscoverEventCard
                key={event.id}
                event={event}
                onOpen={streamIds ? () => onOpenMultiview(streamIds) : undefined}
              />
            );
          })}
        </div>
      )}

      {section === 'upcoming' && (
        <div className="space-y-3">
          {upcomingEvents.length === 0 && <p className="text-sm text-ink-muted">Nothing scheduled right now.</p>}
          {upcomingEvents.map((event) => (
            <DiscoverEventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {section === 'trending' && (
        <div className="space-y-3">
          {trendingMultiviews.length === 0 && <p className="text-sm text-ink-muted">Nothing trending right now.</p>}
          {trendingMultiviews.map((multiview) => (
            <TrendingMultiviewCard
              key={multiview.id}
              multiview={multiview}
              streams={streams}
              active={active}
              onOpen={() => onOpenMultiview(multiview.streamIds)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
