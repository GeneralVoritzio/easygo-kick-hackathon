import { useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/Layout";
import { FollowingTabs } from "../components/FollowingTabs";
import { FollowingEmptyState } from "../components/FollowingEmptyState";
import { Icon } from "../Icon";
import { followedChannels, livestreams, categories, type Channel } from "../mock/api";

type FollowedChannel = Channel & { live: boolean };

function categoryForChannel(channel: FollowedChannel, index: number): string {
  const live = livestreams.find((s) => s.channel.slug === channel.slug);
  if (live) return live.category.name;
  return categories[index % categories.length].name;
}

function FollowingChannelRow({
  channel,
  category,
  onUnfollow,
}: {
  channel: FollowedChannel;
  category: string;
  onUnfollow: () => void;
}) {
  const isLive = channel.live;
  return (
    <div className="state-layer-surface flex w-full items-center gap-3 rounded px-2 py-3">
      <Link to={`/${channel.slug}`} className="shrink-0">
        <img
          src={channel.avatar}
          alt={channel.username}
          className={`size-11 rounded-full ${isLive ? "" : "mix-blend-luminosity grayscale"}`}
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link
          to={`/${channel.slug}`}
          className={`flex items-center gap-1 truncate text-sm font-bold leading-[1.2] ${
            isLive ? "text-white" : "text-neutral-700"
          }`}
        >
          {channel.username}
          {channel.verified && (
            <Icon name="verified" className="size-3.5 shrink-0 text-surface-onSurfacePrimary" />
          )}
        </Link>
        <span className="truncate text-sm font-normal leading-[1.2] text-surface-onSurfaceSecondary">
          {category}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {isLive ? (
          <span className="flex items-center gap-1 text-sm font-semibold leading-[1.2] text-white">
            <Icon name="live-dot" className="size-2 text-primary-base" />
            Live
          </span>
        ) : (
          <span className="text-sm font-semibold leading-[1.2] text-neutral-700">Offline</span>
        )}
        <button
          type="button"
          onClick={onUnfollow}
          className="h-8 shrink-0 rounded bg-secondary-base px-3 text-sm font-semibold text-white transition-all select-none betterhover:active:scale-[0.98] betterhover:hover:bg-negative-base"
        >
          Unfollow
        </button>
      </div>
    </div>
  );
}

export function FollowingChannels() {
  const [channels, setChannels] = useState<FollowedChannel[]>(followedChannels);

  return (
    <PageShell>
      <h2 className="text-white text-base font-bold leading-[1.2] lg:text-2xl">Following</h2>
      <div className="flex flex-col gap-y-3 lg:gap-y-6">
        <FollowingTabs />
        {channels.length === 0 ? (
          <FollowingEmptyState icon="empty-livestreams" message="You follow no channels yet." />
        ) : (
          <div className="flex w-full flex-col">
            {channels.map((c, i) => (
              <FollowingChannelRow
                key={c.slug}
                channel={c}
                category={categoryForChannel(c, i)}
                onUnfollow={() => setChannels((cs) => cs.filter((x) => x.slug !== c.slug))}
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
