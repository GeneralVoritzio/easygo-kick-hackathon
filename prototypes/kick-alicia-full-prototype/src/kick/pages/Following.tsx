import { PageShell } from "../components/Layout";
import { StreamGrid } from "../components/StreamCard";
import { SectionHeading } from "../components/CardBits";
import { FollowingTabs } from "../components/FollowingTabs";
import { FollowingEmptyState } from "../components/FollowingEmptyState";
import { followedChannels, livestreams } from "../mock/api";

const isFollowed = (slug: string) => followedChannels.some((c) => c.slug === slug);

export function Following() {
  const liveFollowed = livestreams.filter((s) => isFollowed(s.channel.slug));
  const suggested = livestreams.filter((s) => !isFollowed(s.channel.slug));

  return (
    <PageShell>
      <h2 className="text-base font-bold leading-8 text-white lg:text-2xl">Following</h2>
      <div className="flex flex-col gap-y-3 lg:gap-y-6">
        <FollowingTabs />
        <div className="flex flex-col gap-6 lg:gap-8">
          <section className="relative flex flex-col gap-y-3 lg:gap-y-4">
            <SectionHeading white="Live Channels" />
            {liveFollowed.length === 0 ? (
              <FollowingEmptyState
                icon="empty-livestreams"
                message="No followed channels are live now."
              />
            ) : (
              <StreamGrid streams={liveFollowed} />
            )}
          </section>

          <section className="relative flex flex-col gap-y-3 lg:gap-y-4">
            <SectionHeading white="Channels you might like" viewAllHref="/browse" />
            <StreamGrid streams={suggested} oneRow />
          </section>
        </div>
      </div>
    </PageShell>
  );
}
