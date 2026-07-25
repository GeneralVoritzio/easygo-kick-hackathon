import { useCommunityFeed } from '@shared/hooks/useCommunityFeed';
import { LiveParticipationPanel } from './LiveParticipationPanel';
import { AnnouncementsSection } from './AnnouncementsSection';
import { DiscussionsSection } from './DiscussionsSection';
import { MemesAndArtSection } from './MemesAndArtSection';
import { EventsSection } from './EventsSection';

/** A creator's community, organized into the distinct things the pitch
 *  actually promises — live participation, announcements, discussions,
 *  memes/fan art, and events — rather than one flat list of interchangeable
 *  cards. */
export function CommunityFeed() {
  const { community, events, threads, poll, goal, loading } = useCommunityFeed();

  if (loading || !community) {
    return <p className="text-sm text-ink">Loading community…</p>;
  }

  const liveEvent = events.find((e) => e.isLive) ?? null;
  const upcomingEvents = events.filter((e) => !e.isLive);
  const announcements = threads.filter((t) => t.kind === 'announcement');
  const discussions = threads.filter((t) => t.kind === 'discussion');
  const mediaThreads = threads.filter((t) => t.kind === 'meme' || t.kind === 'fan_art');

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4">
        <span className="text-2xl">{community.iconEmoji}</span>
        <div>
          <h2 className="text-sm font-extrabold text-ink-bright">{community.name}</h2>
          <p className="text-xs text-ink-muted">
            <span className="tabular-score font-bold text-ink">{community.memberCount.toLocaleString()}</span>{' '}
            members
          </p>
        </div>
      </div>

      <LiveParticipationPanel liveEvent={liveEvent} poll={poll} goal={goal} />
      <AnnouncementsSection threads={announcements} />
      <DiscussionsSection threads={discussions} />
      <MemesAndArtSection threads={mediaThreads} />
      <EventsSection events={upcomingEvents} />
    </div>
  );
}
