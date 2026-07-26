import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import {
  formatDuration,
  formatFollowers,
  timeAgo,
  type ChannelVideo,
  type OfflineChannel,
} from "../mock/api";

function VideoCard({ video, channelName, avatar }: { video: ChannelVideo; channelName: string; avatar: string }) {
  return (
    <div className="group/card flex w-full min-w-0 flex-col">
      <div className="relative w-full">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="aspect-video w-full rounded object-cover"
        />
        <span className="absolute left-2 top-2 rounded-sm bg-surfaceOverlay-base px-1 py-0.5 text-xs font-semibold leading-none text-white">
          {formatDuration(video.duration_seconds)}
        </span>
        <span className="absolute bottom-2 left-2 rounded-sm bg-surfaceOverlay-base px-1 py-0.5 text-xs font-semibold leading-none text-white">
          {formatFollowers(video.view_count)} views
        </span>
      </div>
      <div className="flex w-full flex-row gap-2 px-1.5 py-2">
        <img src={avatar} alt={channelName} className="size-11 shrink-0 rounded-full" />
        <div className="flex w-full min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold leading-[1.2] text-subtle">
            {channelName}
          </span>
          <span className="truncate text-sm font-semibold leading-[1.2] text-white">
            {video.title}
          </span>
          <div className="flex min-w-0 flex-row items-center gap-1">
            <Link
              to={`/browse/${video.category.slug}`}
              className="flex h-[22px] shrink-0 items-center rounded-full bg-surface-highest px-2 text-xs font-semibold leading-none text-subtle"
            >
              {video.category.name}
            </Link>
            <span className="truncate text-xs font-semibold leading-none text-subtle">
              {"·"} {timeAgo(video.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  title,
  videos,
  channelName,
  avatar,
}: {
  title: string;
  videos: ChannelVideo[];
  channelName: string;
  avatar: string;
}) {
  if (!videos.length) return null;
  return (
    <section className="flex w-full flex-col gap-3">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-2xl font-bold leading-[1.2] text-white">{title}</h2>
        <button type="button" className="text-sm font-semibold text-subtle betterhover:hover:text-white">
          View all
        </button>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5">
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} channelName={channelName} avatar={avatar} />
        ))}
      </div>
    </section>
  );
}

const tabs = [
  { label: "Home", path: "" },
  { label: "About", path: "/about" },
  { label: "Videos", path: "/videos" },
  { label: "Clips", path: "/clips" },
];

export function ChannelOffline({ data }: { data: OfflineChannel }) {
  const { channel, banner, last_live_at, videos, clips, recent_categories } = data;
  const [following, setFollowing] = useState(false);

  return (
    <div className="flex w-full flex-col">
      <img
        src={banner}
        alt={`${channel.username} banner`}
        className="h-[var(--channel-desktop-banner-height)] w-full shrink-0 object-cover"
      />

      <div className="flex w-full flex-row items-start justify-between gap-4 px-4 pt-4">
        <div className="flex min-w-0 flex-row items-center gap-3">
          <img
            src={channel.avatar}
            alt={channel.username}
            className="size-16 shrink-0 rounded-full"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <h1 className="truncate text-xl font-bold leading-[1.4] text-white">
                {channel.username}
              </h1>
              {channel.verified && (
                <Icon name="verified" className="size-4 shrink-0 text-surface-onSurfacePrimary" />
              )}
            </div>
            <span className="text-sm font-semibold leading-[1.2] text-subtle">
              {formatFollowers(channel.followers)} followers
            </span>
            <span className="text-sm font-bold leading-[1.2] text-white">
              Last live {timeAgo(last_live_at)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex flex-row items-center gap-2">
            <button
              type="button"
              aria-label={following ? "Unfollow" : "Follow"}
              aria-pressed={following}
              onClick={() => setFollowing((v) => !v)}
              className="flex size-10 items-center justify-center rounded state-layer-surface"
            >
              <Icon
                name={following ? "heart-filled" : "heart"}
                className={`size-5 ${following ? "text-primary-base" : "text-white"}`}
              />
            </button>
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded bg-secondary-base px-3 text-base font-semibold text-white transition-all select-none betterhover:active:scale-[0.98]"
            >
              <Icon name="gift" className="size-4" />
              Gift Subs
            </button>
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded bg-primary-base px-3 text-base font-semibold text-primary-onPrimary transition-all select-none betterhover:active:scale-[0.98]"
            >
              Subscribe
            </button>
          </div>
          <button
            type="button"
            aria-label="Share"
            className="flex size-10 items-center justify-center rounded state-layer-surface"
          >
            <Icon name="share" className="size-5 text-white" />
          </button>
        </div>
      </div>

      <div className="flex w-full flex-nowrap overflow-x-auto px-4 shadow-[inset_0px_-2px_0] shadow-outline-decorative md:no-scrollbar">
        {tabs.map((tab, i) => (
          <Link
            key={tab.label}
            to={`/${channel.slug}${tab.path}`}
            className={`state-layer-surface relative flex h-12 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-t-sm px-4 text-base font-semibold ${
              i === 0 ? "text-surface-onSurfacePrimary" : "text-white"
            }`}
          >
            {i === 0 && (
              <div className="absolute inset-x-0 bottom-[-2px] h-0.5 rounded-full bg-surface-onSurfacePrimary" />
            )}
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="flex w-full flex-col gap-8 px-4 py-6">
        <h2 className="text-2xl font-bold leading-[1.2] text-white">
          {channel.username} is offline
        </h2>

        <Row title="Stream Videos" videos={videos} channelName={channel.username} avatar={channel.avatar} />
        <Row title="Popular Clips" videos={clips} channelName={channel.username} avatar={channel.avatar} />

        {recent_categories.length > 0 && (
          <section className="flex w-full flex-col gap-3">
            <h2 className="text-2xl font-bold leading-[1.2] text-white">
              Recently Streamed Categories
            </h2>
            <div className="flex flex-row flex-wrap gap-4">
              {recent_categories.map((c) => (
                <Link key={c.slug} to={`/browse/${c.slug}`} className="flex w-[132px] flex-col gap-2">
                  <img
                    src={c.thumbnail}
                    alt={c.name}
                    className="aspect-[3/4] w-full rounded object-cover"
                  />
                  <span className="truncate text-sm font-semibold leading-[1.2] text-white">
                    {c.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
