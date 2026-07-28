import { useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/Layout";
import { SectionHeading } from "../components/CardBits";
import { FollowingTabs } from "../components/FollowingTabs";
import { FollowingEmptyState } from "../components/FollowingEmptyState";
import { Icon } from "../Icon";
import { followedChannels } from "../mock/api";

type FollowedChannel = (typeof followedChannels)[number];

const scrim = "linear-gradient(0deg, rgba(49, 49, 49, 0.5), rgba(49, 49, 49, 0.5))";

function FollowedChannelCard({
  channel,
  onUnfollow,
}: {
  channel: FollowedChannel;
  onUnfollow: () => void;
}) {
  return (
    <div className="group relative flex w-full flex-col rounded">
      <Link to={`/${channel.slug}`}>
        <div
          className="relative flex aspect-[1/0.53] min-h-[179px] w-full cursor-pointer flex-col rounded bg-cover bg-center"
          style={{ backgroundImage: `${scrim}, url(${channel.banner})` }}
        >
          <div className="flex grow flex-col items-center justify-center gap-2">
            <div
              className={`relative box-content rounded-full border-4 transition-all betterhover:lg:group-hover:scale-110 ${
                channel.live ? "border-green-500" : "border-transparent"
              }`}
            >
              <img
                src={channel.avatar}
                alt={channel.username}
                className="size-12 rounded-full lg:size-20"
              />
              {channel.live && (
                <div className="absolute -bottom-1.5 right-1/2 flex w-10 translate-x-1/2 rounded-[2px] bg-green-500 px-2 py-1 text-[10px] font-bold uppercase leading-3 text-[#070809]">
                  Live
                </div>
              )}
            </div>
            <span className="text-sm font-bold betterhover:hover:underline">
              {channel.username}
            </span>
          </div>
        </div>
      </Link>
      <button
        type="button"
        aria-label="Unfollow"
        onClick={onUnfollow}
        className="state-layer-surface !absolute bottom-2 left-2 hidden size-8 shrink-0 grow-0 select-none items-center justify-center rounded bg-secondary-base text-sm leading-none text-secondary-onSecondary transition-all active:scale-[0.95] betterhover:group-hover:flex [&_svg]:size-4"
      >
        <Icon name="heart-filled" />
      </button>
    </div>
  );
}

export function FollowingChannels() {
  const [channels, setChannels] = useState<FollowedChannel[]>(followedChannels);

  return (
    <PageShell>
      <h2 className="text-base font-bold leading-8 text-white lg:text-2xl">Following</h2>
      <div className="flex flex-col gap-y-3 lg:gap-y-6">
        <FollowingTabs />
        <div className="flex flex-col gap-6 pb-20 lg:gap-8">
          <section className="relative flex flex-col gap-y-3 lg:gap-y-4">
            <SectionHeading white="Followed Channels" />
            {channels.length === 0 ? (
              <FollowingEmptyState icon="empty-livestreams" message="You follow no channels yet." />
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(335px,1fr))] gap-5">
                {channels.map((c) => (
                  <FollowedChannelCard
                    key={c.slug}
                    channel={c}
                    onUnfollow={() => setChannels((cs) => cs.filter((x) => x.slug !== c.slug))}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}
